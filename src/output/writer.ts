import { existsSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import pc from "picocolors";

export function getImageOutputPath(
  ideaFile: string,
  pluginId: string,
  slug: string,
  falFileName?: string,
): string {
  const dir = dirname(ideaFile);
  const base = basename(ideaFile, ".md");
  const namePart = falFileName ? `${slug}.${falFileName}` : slug;
  return join(dir, `${base}.${pluginId}.${namePart}.png`);
}

export function writeImagePromptFile(
  imagePath: string,
  prompt: string,
  negativePrompt?: string,
): void {
  const promptPath = imagePath.replace(/\.png$/, ".prompt.md");
  const lines = [`# Image Prompt`, ``, prompt];
  if (negativePrompt) {
    lines.push(``, `## Negative Prompt`, ``, negativePrompt);
  }
  writeFileSync(promptPath, lines.join("\n") + "\n", "utf-8");
}

export async function writeImageFile(
  outputPath: string,
  imageUrl: string,
  force = false,
): Promise<boolean> {
  if (existsSync(outputPath) && !force) {
    console.error(
      pc.yellow(`\nFile already exists: ${outputPath}`) + pc.dim("\nUse --force to overwrite."),
    );
    return false;
  }
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);
  return true;
}

export function autoDetectOutlinePath(ideaFile: string, pluginId: string): string {
  const dir = dirname(ideaFile);
  const base = basename(ideaFile, ".md");
  return join(dir, `${base}.${pluginId}.outline.md`);
}

export function getOutputPath(
  ideaFile: string,
  pluginId: string,
  mode: "outline" | "content",
): string {
  const dir = dirname(ideaFile);
  const base = basename(ideaFile, ".md");
  const suffix = mode === "outline" ? `${pluginId}.outline` : pluginId;
  return join(dir, `${base}.${suffix}.md`);
}

export interface WriteOptions {
  force?: boolean;
  stdout?: boolean;
}

export function writeOutput(outputPath: string, content: string, opts: WriteOptions = {}): boolean {
  if (opts.stdout) {
    process.stdout.write("\n" + content + "\n");
    return true;
  }

  if (existsSync(outputPath) && !opts.force) {
    console.error(
      pc.yellow(`\nFile already exists: ${outputPath}`) + pc.dim("\nUse --force to overwrite."),
    );
    return false;
  }

  writeFileSync(outputPath, content, "utf-8");
  return true;
}
