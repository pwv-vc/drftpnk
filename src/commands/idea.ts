import { Command } from "commander";
import { execSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from "fs";
import pc from "picocolors";
import { loadConfig } from "../config/loader.js";
import { slugify, titleFromSlug, getIdeaPath } from "../idea/index.js";
import { wrapCommandAction } from "../utils/error-handler.js";

function openInEditor(filePath: string, config: ReturnType<typeof loadConfig>): void {
  const editor = config.editor || process.env.EDITOR || process.env.VISUAL || "nano";
  try {
    execSync(`${editor} "${filePath}"`, { stdio: "inherit" });
  } catch {
    console.log(pc.dim(`Note: Could not open editor. Edit manually: ${filePath}`));
  }
}

export function registerIdeaCommand(program: Command): void {
  program
    .command("idea [title]")
    .description("Create, edit, or delete an idea file")
    .option("-c, --create", "create a new idea file (default)")
    .option("-e, --edit", "edit an existing idea file")
    .option("-d, --delete", "delete an idea file")
    .option("-o, --open", "open an existing idea file (alias for --edit)")
    .action(
      wrapCommandAction(async (title: string | undefined, opts) => {
        const config = loadConfig();
        const ideasDir = config.ideas_dir;

        // Determine action
        const isEdit = opts.edit || opts.open;
        const isDelete = opts.delete;
        const isCreate = opts.create || (!isEdit && !isDelete);

        if (!title) {
          console.error(pc.red("Error: title is required"));
          process.exit(1);
        }

        const slug = slugify(title);
        const ideaPath = getIdeaPath(slug, ideasDir);

        if (isCreate) {
          if (existsSync(ideaPath)) {
            console.error(pc.red(`Error: idea file already exists at ${ideaPath}`));
            process.exit(1);
          }

          // Ensure ideas directory exists
          if (!existsSync(ideasDir)) {
            mkdirSync(ideasDir, { recursive: true });
          }

          const titleCase = titleFromSlug(slug);
          const content = `# ${titleCase}\n\n## Theme / Metaphor\n\n## Goals\n\n## Key Ideas / Bullets\n\n`;

          writeFileSync(ideaPath, content);
          console.log(pc.green(`Created: ${ideaPath}`));

          openInEditor(ideaPath, config);
        } else if (isEdit) {
          if (!existsSync(ideaPath)) {
            console.error(pc.red(`Error: idea file not found at ${ideaPath}`));
            process.exit(1);
          }

          openInEditor(ideaPath, config);
        } else if (isDelete) {
          if (!existsSync(ideaPath)) {
            console.error(pc.red(`Error: idea file not found at ${ideaPath}`));
            process.exit(1);
          }

          unlinkSync(ideaPath);
          console.log(pc.green(`Deleted: ${ideaPath}`));
        }
      }),
    );
}
