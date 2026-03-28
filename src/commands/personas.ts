import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { load as cheerioLoad } from "cheerio";
import { listPersonas, loadPersona, savePersona, updatePersona } from "../personas/index.js";
import { Persona } from "../personas/types.js";
import { loadConfig, saveUserConfig, resolveApiKey } from "../config/loader.js";
import { createLLMProvider } from "../llm/factory.js";
import { LLMConfig } from "../llm/types.js";

async function scrapeText(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerioLoad(html);
  $("script, style, nav, header, footer, aside").remove();
  const text = $("article, main, .post, .content, p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 50)
    .join("\n\n");
  return text.slice(0, 8000);
}

async function analyzeStyleWithLLM(
  name: string,
  description: string,
  samples: string,
  llmConfig: LLMConfig,
): Promise<Partial<Persona>> {
  const provider = createLLMProvider(llmConfig);
  const prompt = `Analyze the following writing samples from ${name} (${description}) and generate a persona style profile.

Writing samples:
${samples}

Return ONLY valid JSON with this exact structure:
{
  "style": {
    "voice": ["<3-5 adjectives describing voice>"],
    "domains": ["<3-5 topic domains>"],
    "signature_devices": ["<3-5 rhetorical devices used>"],
    "tone_rules": ["<3-5 tone guidelines>"]
  },
  "system_prompt": "<2-3 sentences describing how to write as this person: their voice, audience, and approach>",
  "do_not": ["<3-5 specific things to avoid in their writing style>"]
}`;

  const response = await provider.generate(prompt);
  try {
    const parsed = JSON.parse(response.body || "{}");
    return parsed;
  } catch {
    return {};
  }
}

function defaultPromptTemplates(): Persona["prompts"] {
  return {
    "blog-post": {
      outline: `You are writing as {{persona_name}}.

{{system_prompt}}

Topic: {{topic}}
Theme / Metaphor: {{theme}}
Goals:
- {{goals}}
Key Ideas:
- {{keyIdeas}}
Voice: {{voice}}
Signature devices: {{signature_devices}}
Tone rules: {{tone_rules}}

Generate a detailed blog post outline with 5 sections. Include 3-5 possible titles, a thesis statement, and the metaphorical frame.

Return ONLY valid JSON in this exact format:
{"title": "<best title>", "subtitle": "<one-line thesis>", "body": "<full outline in markdown>"}`,
      content: `You are writing as {{persona_name}}.

{{system_prompt}}

Do NOT:
- {{do_not}}

Topic: {{topic}}
Theme: {{theme}}
Target word count: {{wordCountTarget}} words

Outline to follow:
{{outline}}

Write the full blog post following the outline. Use short paragraphs. Open strong. End with a clear, resonant conclusion.

Return ONLY valid JSON in this exact format:
{"title": "<post title>", "subtitle": "<one-line subtitle>", "body": "<full post in markdown, no frontmatter>"}`,
    },
    tweet: {
      outline: `You are writing as {{persona_name}}.

{{system_prompt}}

Topic: {{topic}}
Theme: {{theme}}
Key Ideas:
- {{keyIdeas}}

Generate 3 tweet options on this topic. Each must be under 280 characters. Make them punchy and distinct.

Return ONLY valid JSON:
{"title": "Tweet Options", "subtitle": "", "body": "<3 numbered tweet options, one per line>"}`,
      content: `You are writing as {{persona_name}}.

{{system_prompt}}

Do NOT:
- {{do_not}}

Topic: {{topic}}
Outline / options:
{{outline}}

Write the single best tweet (max 280 characters). No hashtags unless essential.

Return ONLY valid JSON:
{"title": "", "subtitle": "", "body": "<tweet text only>"}`,
    },
    linkedin: {
      outline: `You are writing as {{persona_name}}.

{{system_prompt}}

Topic: {{topic}}
Theme: {{theme}}
Key Ideas:
- {{keyIdeas}}
Goals:
- {{goals}}

Generate a LinkedIn post outline. Include a hook, 3 main points, and a closing question or call to action.

Return ONLY valid JSON:
{"title": "<post hook/title>", "subtitle": "", "body": "<outline in markdown>"}`,
      content: `You are writing as {{persona_name}}.

{{system_prompt}}

Do NOT:
- {{do_not}}

Topic: {{topic}}
Theme: {{theme}}
Outline:
{{outline}}

Write a LinkedIn post (300-500 words). Use short paragraphs and line breaks. Open with a strong hook. End with a question or insight.

Return ONLY valid JSON:
{"title": "<hook line>", "subtitle": "", "body": "<post text, no markdown headers>"}`,
    },
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function registerPersonasCommand(program: Command): void {
  const personasCmd = program.command("personas").description("Manage personas");

  personasCmd
    .command("list")
    .description("List all available personas")
    .action(() => {
      const personas = listPersonas();
      if (personas.length === 0) {
        console.log(pc.dim("\nNo personas found.\n"));
        return;
      }
      console.log(pc.bold("\nAvailable personas:\n"));
      for (const persona of personas) {
        console.log(
          `  ${pc.white(persona.id.padEnd(24))} ${pc.dim(persona.name.padEnd(24))} ${persona.description}`,
        );
      }
      console.log();
    });

  personasCmd
    .command("show <id>")
    .description("Show persona details")
    .action((id: string) => {
      try {
        const persona = loadPersona(id);
        console.log(pc.bold(`\n${persona.name}`));
        console.log(pc.dim(`${persona.id} — ${persona.description}\n`));

        console.log(pc.white("Voice:") + "  " + persona.style.voice.join(", "));
        console.log(pc.white("Domains:") + "  " + persona.style.domains.join(", "));
        console.log(
          pc.white("Signature devices:") + "  " + persona.style.signature_devices.join(", "),
        );

        console.log(pc.white("\nTone rules:"));
        for (const rule of persona.style.tone_rules) {
          console.log(`  - ${rule}`);
        }

        if (persona.do_not?.length) {
          console.log(pc.white("\nDo not:"));
          for (const rule of persona.do_not) {
            console.log(`  - ${rule}`);
          }
        }

        if (persona.system_prompt) {
          console.log(pc.white("\nSystem prompt:"));
          console.log(pc.dim(persona.system_prompt));
        }

        if (persona.prompts && Object.keys(persona.prompts).length > 0) {
          console.log(pc.white("\nPrompts:"));
          for (const [type, promptSet] of Object.entries(persona.prompts)) {
            if (promptSet.outline) {
              console.log(pc.dim(`\n  ── ${type} / outline ──`));
              console.log(promptSet.outline);
            }
            if (promptSet.content) {
              console.log(pc.dim(`\n  ── ${type} / content ──`));
              console.log(promptSet.content);
            }
          }
        }

        if (persona.source_urls?.length) {
          console.log(pc.white("\nSource URLs:"));
          for (const url of persona.source_urls) {
            console.log(`  ${url}`);
          }
        }

        console.log();
      } catch (err) {
        console.error(pc.red(String(err instanceof Error ? err.message : err)));
        process.exit(1);
      }
    });

  personasCmd
    .command("set-default <id>")
    .description("Set the default persona")
    .action((id: string) => {
      try {
        loadPersona(id);
        saveUserConfig({ default_persona: id });
        console.log(pc.green(`\nDefault persona set to: ${id}\n`));
      } catch (err) {
        console.error(pc.red(String(err instanceof Error ? err.message : err)));
        process.exit(1);
      }
    });

  personasCmd
    .command("update <id>")
    .description("Update a persona with new writing samples from a URL")
    .option("-u, --url <url>", "URL to scrape for writing samples")
    .action(async (id: string, opts) => {
      try {
        const config = loadConfig();
        const apiKey = resolveApiKey(config);
        const llmConfig: LLMConfig = { ...config.llm, apiKey };

        const persona = loadPersona(id);

        let url = opts.url;
        if (!url) {
          const input = await p.text({
            message: "URL to scrape for writing samples:",
            placeholder: "https://example.com/post",
          });
          if (p.isCancel(input)) {
            p.cancel("Cancelled.");
            process.exit(0);
          }
          url = String(input);
        }

        const spinner = pc.dim("Scraping and analyzing...");
        process.stdout.write(spinner + "\n");

        const text = await scrapeText(url);
        const updates = await analyzeStyleWithLLM(
          persona.name,
          persona.description,
          text,
          llmConfig,
        );

        const sourceUrls = [...(persona.source_urls ?? []), url];
        const updated = updatePersona(id, { ...updates, source_urls: sourceUrls });

        console.log(pc.green(`\nPersona "${id}" updated with samples from: ${url}`));
        console.log(pc.dim("Updated style profile:"));
        console.log(JSON.stringify(updated.style, null, 2));
      } catch (err) {
        console.error(pc.red(String(err instanceof Error ? err.message : err)));
        process.exit(1);
      }
    });

  personasCmd
    .command("create")
    .description("Create a new persona with a guided wizard")
    .action(async () => {
      console.log(pc.bold("\ndrftpnk persona wizard\n"));

      const name = await p.text({
        message: "Full name:",
        placeholder: "Jane Smith",
        validate: (v) => (!v ? "Name is required" : undefined),
      });
      if (p.isCancel(name)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      const description = await p.text({
        message: "Short description:",
        placeholder: "Tech writer and startup founder",
        validate: (v) => (!v ? "Description is required" : undefined),
      });
      if (p.isCancel(description)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      const urlsInput = await p.text({
        message: "Source URLs (comma-separated blog posts or writing samples):",
        placeholder: "https://example.com/post1, https://example.com/post2",
      });
      if (p.isCancel(urlsInput)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      const urls = String(urlsInput)
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const id = slugify(String(name));
      const config = loadConfig();

      let styleProfile: Partial<Persona> = {};

      if (urls.length > 0) {
        const apiKey = resolveApiKey(config);
        const llmConfig: LLMConfig = { ...config.llm, apiKey };

        process.stdout.write(pc.dim("\nScraping writing samples...\n"));
        const samples: string[] = [];
        for (const url of urls) {
          try {
            const text = await scrapeText(url);
            samples.push(`--- ${url} ---\n${text}`);
          } catch {
            console.warn(pc.yellow(`  Could not scrape: ${url}`));
          }
        }

        if (samples.length > 0) {
          process.stdout.write(pc.dim("Analyzing writing style...\n"));
          styleProfile = await analyzeStyleWithLLM(
            String(name),
            String(description),
            samples.join("\n\n"),
            llmConfig,
          );
        }
      }

      const persona: Persona = {
        id,
        name: String(name),
        description: String(description),
        style: styleProfile.style ?? {
          voice: [],
          domains: [],
          signature_devices: [],
          tone_rules: [],
        },
        system_prompt: styleProfile.system_prompt ?? `You are writing as ${String(name)}.`,
        do_not: styleProfile.do_not ?? [],
        prompts: defaultPromptTemplates(),
        source_urls: urls,
      };

      const setDefault = await p.confirm({
        message: `Set "${id}" as your default persona?`,
        initialValue: false,
      });
      if (p.isCancel(setDefault)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      savePersona(persona, true);

      if (setDefault) {
        saveUserConfig({ default_persona: id });
        console.log(pc.green(`\nDefault persona set to: ${id}`));
      }

      console.log(pc.green(`\nPersona "${id}" created successfully!`));
      console.log(pc.dim(`Saved to: ~/.drftpnk/personas/${id}.json`));
      console.log("\n" + JSON.stringify(persona, null, 2));
    });
}
