import { statSync } from "fs";
import { Command } from "commander";
import ora from "ora";
import pc from "picocolors";
import { parseIdeaFile } from "../idea/parser.js";
import { loadConfig } from "../config/loader.js";
import { loadPersona } from "../personas/index.js";
import { pluginRegistry } from "../plugins/index.js";
import { getImageOutputPath, writeImageFile, writeImagePromptFile } from "../output/writer.js";
import { printSummary } from "../output/summary.js";
import { createDebugger } from "../debug.js";
import { generateImagePrompt } from "../image/prompt.js";
import { generateImage, resolveImageConfig } from "../image/fal.js";
import { wrapCommandAction } from "../utils/error-handler.js";
import { validateAndExit } from "../utils/validation.js";
import { autoDetectContextFile, loadFileIfExists } from "../utils/file-utils.js";

export function registerImageCommand(program: Command): void {
  program
    .command("image <idea-file>")
    .description("Generate an image for content using fal.ai")
    .option("-t, --type <type>", "content type (blog-post, tweet, linkedin)")
    .option("-p, --persona <id>", "persona to use")
    .option("-s, --slug <slug>", "image filename slug", "image")
    .option("--model <model>", "fal.ai model override")
    .option("--aspect-ratio <ratio>", "aspect ratio override (e.g. square_hd, landscape_16_9)")
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

        const contextFile = autoDetectContextFile(ideaFile, plugin.id, ["post", "outline"]);
        const context = loadFileIfExists(contextFile, { debug, label: "context" });
        if (!context) {
          debug("context:", "none found, using idea only");
        }

        const { model, aspectRatio } = resolveImageConfig(config, plugin, {
          model: opts.model,
          aspectRatio: opts.aspectRatio,
        });

        debug("image model:", model);
        debug("aspect ratio:", aspectRatio);

        console.log(pc.dim("  model   ") + pc.white(model));
        console.log(pc.dim("  ratio   ") + pc.white(aspectRatio));

        const promptSpinner = ora({
          text: pc.dim(`Generating image prompt as ${persona.name}...`),
          color: "white",
        }).start();

        const imagePrompt = await generateImagePrompt(
          idea,
          persona,
          plugin,
          config,
          context,
          debug,
        );

        promptSpinner.stop();

        debug("image prompt:", imagePrompt.prompt);
        if (imagePrompt.negativePrompt) debug("negative prompt:", imagePrompt.negativePrompt);
        debug("alt text:", imagePrompt.altText);

        console.log(pc.dim("\n  prompt  ") + pc.white(imagePrompt.prompt));

        const imageSpinner = ora({
          text: pc.dim(`Generating image with ${model}...`),
          color: "white",
        }).start();

        const imageResult = await generateImage(
          imagePrompt.prompt,
          imagePrompt.negativePrompt,
          model,
          aspectRatio,
          config,
          (status) => {
            imageSpinner.text = pc.dim(`${status}`);
          },
        );

        imageSpinner.stop();

        debug("image url:", imageResult.url);
        debug("image file:", imageResult.fileName);
        debug("content type:", imageResult.contentType);
        debug(
          "dimensions:",
          imageResult.width && imageResult.height
            ? `${imageResult.width}×${imageResult.height}`
            : "not reported by model",
        );
        debug("elapsed:", `${(imageResult.elapsedMs / 1000).toFixed(1)}s`);

        const outputPath = getImageOutputPath(ideaFile, plugin.id, opts.slug, imageResult.fileName);
        debug("output path:", outputPath);

        console.log(pc.dim("  output  ") + pc.white(outputPath));

        const saved = await writeImageFile(outputPath, imageResult.url);

        if (saved) {
          writeImagePromptFile(outputPath, imagePrompt.prompt, imagePrompt.negativePrompt);
          const sizeBytes = statSync(outputPath).size;
          printSummary({
            files: [{ path: outputPath, sizeBytes }],
            usage: imagePrompt.usage,
            imageInfo: {
              model,
              width: imageResult.width,
              height: imageResult.height,
              aspectRatio,
              contentType: imageResult.contentType,
              elapsedMs: imageResult.elapsedMs,
              falFileSize: imageResult.falFileSize,
            },
          });
        }
      }),
    );
}
