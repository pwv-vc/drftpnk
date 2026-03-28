import { IdeaDocument, ValidationResult } from "../idea/types.js";
import { Persona } from "../personas/types.js";
import { LLMResponse } from "../llm/types.js";
import { ContentMeta, ContentTypePlugin, PromptPair } from "./types.js";
import { resolveSystemPrompt } from "./defaults.js";

export const blogPostPlugin: ContentTypePlugin = {
  id: "blog-post",
  name: "Blog Post",
  description: "Long-form blog post with YAML frontmatter (~900 words)",
  structure: {
    sections: ["Hook", "Context", "Core Argument", "Evidence / Examples", "Conclusion"],
    wordCountTarget: 900,
  },
  defaultAspectRatio: "landscape_16_9",

  validate(idea: IdeaDocument): ValidationResult {
    const errors: string[] = [];
    if (!idea.topic) errors.push("Missing topic");
    if (!idea.theme) errors.push("Missing theme");
    if (idea.goals.length === 0) errors.push("Missing goals");
    if (idea.keyIdeas.length === 0) errors.push("Missing key ideas");
    return { valid: errors.length === 0, errors };
  },

  defaultOutlinePrompt(idea: IdeaDocument, persona: Persona): PromptPair {
    return {
      system: resolveSystemPrompt(persona),

      user: `Given the topic, theme, and bullet points below, produce:
1. 5 title options
2. 3 subtitle options
3. a 5-section outline
4. the central thesis in one sentence
5. the best metaphorical frame for the piece

Topic: ${idea.topic}
Theme / Metaphor: ${idea.theme}
Goals:
${idea.goals.map((g) => `- ${g}`).join("\n")}
Bullet points:
${idea.keyIdeas.map((k) => `- ${k}`).join("\n")}

Return ONLY valid JSON: {"title": "<best title>", "subtitle": "<one-line thesis>", "body": "<full structured outline in markdown with all 5 titles, 3 subtitles, 5-section outline, thesis, and metaphorical frame>"}`,
    };
  },

  defaultContentPrompt(idea: IdeaDocument, persona: Persona, outline?: string): PromptPair {
    return {
      system: resolveSystemPrompt(persona),

      user: `Write a blog post as ${persona.name}.

STYLE TO MATCH
- Reflective, confident, warm, and clear
- Intellectually playful but not cute
- Polished without sounding corporate
- Use short declarative sentences for emphasis
- Use contrast, triplets, and occasional aphoristic lines
- Prefer memorable phrasing over exhaustive explanation

CORE WRITING PATTERN
1. Start with a strong hook that reframes the topic.
2. Use one central metaphor, analogy, or cultural frame and carry it through the piece.
3. Connect that frame to a concrete point about startups, AI, investing, founder behavior, product judgment, or market timing.
4. Include a few grounded specifics from the input, but do not overload the piece with detail.
5. End by returning to the original metaphor and landing on a clear insight.

NEVER USE — AI CLICHÉS AND BANNED PATTERNS
- No em dashes (—). Use commas, colons, or restructure the sentence.
- No AI writing clichés: "delve", "unpack", "nuanced", "landscape", "ecosystem", "unleash", "harness", "transformative", "groundbreaking", "cutting-edge", "robust", "seamless", "leverage" (as a verb), "at the end of the day", "it's worth noting", "in today's world", "the future is now"
- No throat-clearing: "In conclusion", "To summarize", "It goes without saying", "Needless to say"
- No hedging non-phrases: "sort of", "kind of", "in a way", "to some extent"

FORMAT RULES
- Keep length around ${idea.wordCountTarget ?? 900} words.
- Use markdown headings.
- Use bullets only when they sharpen the point.
- No emojis. No hashtags. No fake citations.

Topic: ${idea.topic}
Theme / framing metaphor: ${idea.theme}
${idea.audience ? `Audience: ${idea.audience}` : ""}
Key bullet points:
${idea.keyIdeas.map((k) => `- ${k}`).join("\n")}
${idea.references?.length ? `\nReferences / facts to weave in:\n${idea.references.map((r) => `- ${r}`).join("\n")}` : ""}

Outline to follow:
${outline ?? ""}

QUALITY CHECK BEFORE FINALIZING
- Does the opening hook immediately create curiosity?
- Is there one clear metaphor or frame carried through the piece?
- Does the piece sound like a human with taste, not an AI summarizer?
- Is there at least one sharp line worth quoting?
- Does the ending close the loop instead of just fading out?

Return ONLY valid JSON: {"title": "<post title>", "subtitle": "<one-line subtitle>", "body": "<full post in markdown, no frontmatter>"}`,
    };
  },

  formatOutline(response: LLMResponse): string {
    const parts: string[] = [];
    if (response.title) parts.push(`# ${response.title}`);
    if (response.subtitle) parts.push(`\n*${response.subtitle}*`);
    if (response.body) parts.push(`\n${response.body}`);
    return parts.join("\n");
  },

  formatContent(response: LLMResponse, meta: ContentMeta): string {
    const frontmatter = [
      "---",
      `title: ${response.title || meta.theme}`,
      `author: ${meta.author}`,
      `date: ${meta.date}`,
      `theme: ${meta.theme}`,
      "---",
    ].join("\n");

    const body = response.body ?? "";
    const titleLine = response.title ? `# ${response.title}` : "";
    const subtitleLine = response.subtitle ? `\n${response.subtitle}` : "";

    return `${frontmatter}\n\n${titleLine}${subtitleLine}\n\n${body}`;
  },
};
