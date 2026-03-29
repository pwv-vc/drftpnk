import { existsSync, readFileSync } from "fs";
import { dirname, basename, join } from "path";
import { Debugger } from "../debug.js";

export interface FileLoadOptions {
  debug?: Debugger;
  label?: string;
}

export function loadFileIfExists(filePath: string, opts: FileLoadOptions = {}): string | undefined {
  if (!existsSync(filePath)) return undefined;
  const content = readFileSync(filePath, "utf-8");
  if (opts.debug && opts.label) {
    opts.debug(opts.label, filePath);
  }
  return content;
}

export function autoDetectContextFile(
  ideaFile: string,
  pluginId: string,
  fileTypes: ("post" | "outline")[] = ["post", "outline"],
): string | undefined {
  const dir = dirname(ideaFile);
  const base = basename(ideaFile, ".md");

  for (const type of fileTypes) {
    const suffix = type === "post" ? pluginId : `${pluginId}.outline`;
    const path = join(dir, `${base}.${suffix}.md`);
    if (existsSync(path)) return path;
  }
  return undefined;
}
