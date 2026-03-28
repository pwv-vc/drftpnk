import { spawnSync } from "child_process";
import { select, isCancel } from "@clack/prompts";
import pc from "picocolors";

export async function promptAndPreview(filePath: string, content: string): Promise<void> {
  const action = await select({
    message: pc.dim(`Saved to ${pc.white(filePath)}`),
    options: [
      { value: "preview", label: "Preview", hint: "print to terminal" },
      { value: "more", label: "More", hint: "open in pager" },
      { value: "done", label: "Done" },
    ],
  });

  if (isCancel(action) || action === "done") return;

  if (action === "preview") {
    console.log("\n" + content);
    return;
  }

  if (action === "more") {
    const pager = process.env.PAGER ?? "less";
    const result = spawnSync(pager, [filePath], { stdio: "inherit" });
    if (result.error) {
      spawnSync("more", [filePath], { stdio: "inherit" });
    }
  }
}
