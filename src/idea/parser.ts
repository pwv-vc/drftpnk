import { readFileSync } from "fs";
import { IdeaDocument } from "./types.js";

const REQUIRED_SECTIONS = ["Topic", "Theme / Metaphor", "Goals", "Key Ideas / Bullets"];

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 0);
}

function extractSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split("\n");
  let currentSection: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    const h1Match = line.match(/^#\s+(.+)/);

    if (h2Match) {
      if (currentSection !== null) {
        sections.set(currentSection, currentLines.join("\n").trim());
      }
      currentSection = h2Match[1].trim();
      currentLines = [];
    } else if (h1Match && currentSection === null) {
      currentSection = "Topic";
      const headerText = h1Match[1].trim();
      currentLines = headerText.toLowerCase() === "topic" ? [] : [headerText];
    } else if (currentSection !== null) {
      currentLines.push(line);
    }
  }

  if (currentSection !== null) {
    sections.set(currentSection, currentLines.join("\n").trim());
  }

  return sections;
}

export function parseIdeaFile(filePath: string): IdeaDocument {
  const content = readFileSync(filePath, "utf-8");
  return parseIdeaContent(content, filePath);
}

export function parseIdeaContent(content: string, filePath = "idea.md"): IdeaDocument {
  const sections = extractSections(content);

  for (const required of REQUIRED_SECTIONS) {
    if (!sections.has(required) || sections.get(required) === "") {
      throw new Error(`Missing required section "${required}" in ${filePath}`);
    }
  }

  const wordCountRaw = sections.get("Word Count Target");
  let wordCountTarget: number | undefined;
  if (wordCountRaw) {
    const parsed = parseInt(wordCountRaw.replace(/\D/g, ""), 10);
    if (!isNaN(parsed)) wordCountTarget = parsed;
  }

  return {
    topic: sections.get("Topic") ?? "",
    theme: sections.get("Theme / Metaphor") ?? "",
    goals: parseBullets(sections.get("Goals") ?? ""),
    keyIdeas: parseBullets(sections.get("Key Ideas / Bullets") ?? ""),
    possibleTitles: sections.has("Possible Titles")
      ? parseBullets(sections.get("Possible Titles") ?? "")
      : undefined,
    references: sections.has("References / Examples")
      ? parseBullets(sections.get("References / Examples") ?? "")
      : undefined,
    audience: sections.has("Audience") ? sections.get("Audience") : undefined,
    wordCountTarget,
  };
}
