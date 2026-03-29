import { statSync } from "fs";
import { Command } from "commander";
import { statSync } from "fs";
import ora from "ora";
import pc from "picocolors";
import { parseIdeaFile } from "../idea/parser.js";
import { loadConfig } from "../config/loader.js";
import { loadPersona } from "../personas/index.js";
import { pluginRegistry } from "../plugins/index.js";
import {
  generate,
  buildContentPrompt,
  resolveModelConfig,
  resolveContentPromptSources,
} from "../generator.js";
import { formatOutput } from "../output/formatter.js";
import { autoDetectOutlinePath, getOutputPath, writeOutput } from "../output/writer.js";
import { promptAndPreview } from "../output/preview.js";
import { printSummary } from "../output/summary.js";
import { createDebugger } from "../debug.js";
import { wrapCommandAction } from "../utils/error-handler.js";
import { validateAndExit } from "../utils/validation.js";
import { loadFileIfExists } from "../utils/file-utils.js";

export function registerPostCommand(program: Command): void {
  program
    .command("post <idea-file>")
    .description("Generate full content from an idea file")
    .option("-t, --type <type>", "content type (blog-post, tweet, linkedin)")
    .option("-p, --persona <id>", "persona to use")
    .option("-o, --outline <file>", "explicit outline file path")
    .option("--output <file>", "explicit output file path")
    .option("--force", "overwrite existing output file")
    .option("--stdout", "print to stdout only, do not save")
    .option("--debug", "show debug info during generation")
    .action(
      wrapCommandAction(async (ideaFile: string, opts) => {
        const debug = createDebugger(!!opts.debug);

        const config = loadConfig();
        const contentType = opts.type ?? config.default_content_type;
        const personaId = opts.persona ?? config.default_persona;

        debug("idea file:", ideaFile);

        const idea = parseIdeaFile(ideaFile);
        debug(
          "parsed:",
          `"${idea.topic}" · ${idea.goals.length} goals · ${idea.keyIdeas.length} key ideas`,
        );

        const persona = loadPersona(personaId);
        debug("persona:", `${persona.id} (${persona.name})`);

        const plugin = pluginRegistry.get(contentType);
        debug("plugin:", `${plugin.id} (${plugin.name})`);

        const validation = plugin.validate(idea);
        validateAndExit(validation);
        debug("validation:", "passed");

        const resolvedLlm = resolveModelConfig(config, persona, plugin);

        let outlineText: string | undefined;
        const outlineFile = opts.outline ?? autoDetectOutlinePath(ideaFile, plugin.id);
        outlineText = loadFileIfExists(outlineFile, {
          debug: !opts.stdout ? debug : undefined,
          label: "outline",
        });
        if (outlineText && !opts.stdout && !opts.debug) {
          console.log(pc.dim(`Using outline: ${outlineFile}`));
        } else if (!outlineText) {
          debug("outline:", "none found, generating from idea directly");
        }

        debug(
          "model:",
          `${resolvedLlm.model} · temp ${resolvedLlm.temperature} · max ${resolvedLlm.maxTokens} tokens`,
        );

        if (opts.debug) {
          const { system, user } = buildContentPrompt(idea, persona, plugin, outlineText);
          debug("system prompt:", `${system.length.toLocaleString("en-US")} chars`);
          debug("user prompt:", `${user.length.toLocaleString("en-US")} chars`);
        }

        if (!opts.stdout) {
          const sources = resolveContentPromptSources(persona, plugin);
          const src = (s: string) => (s.endsWith(".md") ? pc.white(s) : pc.dim(s));
          console.log(pc.dim("  model   ") + pc.white(resolvedLlm.model));
          console.log(pc.dim("  system  ") + src(sources.system));
          console.log(pc.dim("  user    ") + src(sources.user));
        }

        const spinner = ora({
          text: pc.dim(`Generating ${plugin.name} as ${persona.name}...`),
          color: "white",
        });

        if (!opts.stdout) spinner.start();

        debug("generating...");

        const response = await generate(
          idea,
          persona,
          plugin,
          config,
          "content",
          outlineText,
          (chunk) => {
            if (opts.stdout) process.stdout.write(chunk);
          },
        );

        if (!opts.stdout) spinner.stop();

        const meta = {
          author: persona.name,
          date: new Date().toISOString().split("T")[0],
          theme: idea.theme,
          persona,
        };

        const formatted = formatOutput(plugin, response, meta, "content");

        if (opts.stdout) {
          process.stdout.write("\n");
          return;
        }

        const outputPath = opts.output ?? getOutputPath(ideaFile, plugin.id, "content");
        debug("writing:", outputPath);

        const saved = writeOutput(outputPath, formatted, { force: opts.force });

        if (saved) {
          const sizeBytes = statSync(outputPath).size;
          printSummary({ files: [{ path: outputPath, sizeBytes }], usage: response.usage });
          await promptAndPreview(outputPath, formatted);
        }
      }),
    );
}
