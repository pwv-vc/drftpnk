import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getIdeaPath(slug: string, ideasDir: string): string {
  return join(ideasDir, `idea.${slug}.md`);
}

export function getIdeaFilename(slug: string): string {
  return `idea.${slug}.md`;
}

export function isIdeaFile(filename: string, outlineNamingConvention: string): boolean {
  // Match idea.md or idea.{slug}.md
  if (!filename.match(/^idea(\.[\w-]+)?\.md$/)) return false;

  // Extract the pattern from naming convention (e.g., "idea.{type}.outline.md" -> ".{type}.outline.md")
  // Any file matching this pattern is a generated outline, not an idea
  const outlinePattern = outlineNamingConvention.replace("idea", "").replace("{type}", "[\\w-]+");

  // Also exclude other generated files: .blog-post.md, .tweet.md, .linkedin.md, .image files
  const excludePatterns = [
    new RegExp(`^idea${outlinePattern}$`),
    /\.blog-post\.md$/,
    /\.tweet\.md$/,
    /\.linkedin\.md$/,
    /\.image/,
  ];

  return !excludePatterns.some((pattern) => pattern.test(filename));
}

export function extractTitleFromFile(filename: string): string {
  // Handle "idea.md" (no slug)
  if (filename === "idea.md") {
    return "Idea";
  }

  // Extract slug from filename like "idea.build-in-public.md"
  const match = filename.match(/^idea\.(.+)\.md$/);
  if (!match) return "";

  return titleFromSlug(match[1]);
}

function extractHeadingFromMarkdown(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

export interface IdeaFileInfo {
  filename: string;
  title: string;
  heading?: string;
  size: number;
  modified: string;
}

export function listIdeaFiles(ideasDir: string, outlineNamingConvention: string): IdeaFileInfo[] {
  if (!existsSync(ideasDir)) {
    return [];
  }

  const files = readdirSync(ideasDir);

  return files
    .filter((f) => isIdeaFile(f, outlineNamingConvention))
    .sort()
    .map((filename) => {
      const filepath = join(ideasDir, filename);
      const stats = statSync(filepath);
      const title = extractTitleFromFile(filename);
      const size = stats.size;
      const modified = stats.mtime.toLocaleDateString();

      let heading: string | undefined;
      try {
        const content = readFileSync(filepath, "utf-8");
        heading = extractHeadingFromMarkdown(content);
      } catch {
        // If we can't read the file, just skip the heading
      }

      return { filename, title, heading, size, modified };
    });
}
