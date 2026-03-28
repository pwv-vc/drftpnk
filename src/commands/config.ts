import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, saveUserConfig, USER_CONFIG_PATH } from "../config/loader.js";
import { DrftpnkConfig } from "../config/types.js";

function maskApiKey(key: string | undefined): string {
  if (!key) return pc.dim("(not set)");
  return key.slice(0, 7) + "..." + key.slice(-4);
}

function printConfig(config: DrftpnkConfig): void {
  const display = {
    ...config,
    llm: {
      ...config.llm,
      apiKey: maskApiKey(config.llm.apiKey),
    },
  };
  console.log(JSON.stringify(display, null, 2));
}

export function registerConfigCommand(program: Command): void {
  const configCmd = program.command("config").description("Manage drftpnk configuration");

  configCmd
    .command("init")
    .description("Initialize user configuration")
    .action(async () => {
      console.log(pc.bold("\ndrftpnk config init\n"));

      const apiKey = await p.text({
        message: "OpenAI API key (leave blank to use OPENAI_API_KEY env var):",
        placeholder: "sk-...",
        validate: (val) => {
          if (val && !val.startsWith("sk-")) return "API key should start with sk-";
        },
      });

      if (p.isCancel(apiKey)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      const defaultPersona = await p.text({
        message: "Default persona ID:",
        placeholder: "david-thyresson",
        initialValue: "david-thyresson",
      });

      if (p.isCancel(defaultPersona)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      const config: Partial<DrftpnkConfig> = {
        default_persona: String(defaultPersona) || "david-thyresson",
        default_content_type: "blog-post",
        output_dir: ".",
        outline: {
          auto_save: true,
          naming_convention: "idea.{type}.outline.md",
          require_outline_for_post: false,
        },
        llm: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.7,
          maxTokens: 4000,
          ...(apiKey ? { apiKey: String(apiKey) } : {}),
        },
      };

      saveUserConfig(config);
      console.log(pc.green(`\nConfig saved to: ${USER_CONFIG_PATH}`));
    });

  configCmd
    .command("show")
    .description("Show current configuration")
    .action(() => {
      const config = loadConfig();
      console.log(pc.bold("\nCurrent configuration:\n"));
      printConfig(config);
      console.log(pc.dim(`\nConfig file: ${USER_CONFIG_PATH}`));
    });
}
