import { Command } from "commander";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { listIdeaFiles } from "../idea/index.js";
import { wrapCommandAction } from "../utils/error-handler.js";

export function registerIdeasCommand(program: Command): void {
  program
    .command("ideas")
    .description("List all idea files")
    .action(
      wrapCommandAction(() => {
        const config = loadConfig();
        const ideaFiles = listIdeaFiles(config.ideas_dir, config.outline.naming_convention);

        if (ideaFiles.length === 0) {
          console.log(pc.dim("No idea files found"));
          return;
        }

        console.log(pc.bold("\nIdea Files:\n"));

        ideaFiles.forEach((idea) => {
          const heading = idea.heading ? ` — ${idea.heading}` : "";
          console.log(`${pc.cyan(idea.title)}${heading} ${pc.dim(`(${idea.filename})`)}`);
          console.log(pc.dim(`  ${idea.size} bytes • ${idea.modified}\n`));
        });

        console.log(
          pc.dim(`Total: ${ideaFiles.length} idea file${ideaFiles.length === 1 ? "" : "s"}`),
        );
      }),
    );
}
