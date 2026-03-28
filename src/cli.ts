import "dotenv/config";
import { Command, Option } from "commander";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import pc from "picocolors";
import gradient from "gradient-string";
import {
  registerOutlineCommand,
  registerPostCommand,
  registerConfigCommand,
  registerContentTypesCommand,
  registerPersonasCommand,
  registerImageCommand,
} from "./commands/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require(join(__dirname, "../package.json"));

// Gradient: teal → green → soft-yellow
const drftpnkGradient = gradient(["#00d2c8", "#00d22e", "#ffef9e"]);

const BANNER_WIDE = [
  "██████╗ ██████╗ ███████╗████████╗██████╗ ███╗   ██╗██╗  ██╗",
  "██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██║ ██╔╝",
  "██║  ██║██████╔╝█████╗     ██║   ██████╔╝██╔██╗ ██║█████╔╝ ",
  "██║  ██║██╔══██╗██╔══╝     ██║   ██╔═══╝ ██║╚██╗██║██╔═██╗ ",
  "██████╔╝██║  ██║██║        ██║   ██║     ██║ ╚████║██║  ██╗",
  "╚═════╝ ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝     ╚═╝  ╚═══╝╚═╝  ╚═╝",
].join("\n");

const BANNER_COMPACT = [
  "██████╗ ██████╗ ███████╗████████╗██████╗ ███╗  ██╗██╗  ██╗",
  "██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗████╗ ██║██║ ██╔╝",
  "██║  ██║██████╔╝█████╗     ██║   ██████╔╝██╔██╗██║█████╔╝ ",
  "╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═════╝ ╚═╝╚════╝╚═╝  ╚═╝",
].join("\n");

function showBanner(): void {
  const width = process.stdout.columns ?? 80;
  const art = width >= 70 ? BANNER_WIDE : BANNER_COMPACT;
  process.stdout.write("\n" + drftpnkGradient(art) + "\n");
  console.log(pc.dim("  Persona-driven AI content generator\n"));
}

const program = new Command();

program
  .name("drftpnk")
  .description("Persona-driven AI content generator")
  .version(pkg.version, "-v, --version", "output the version number")
  .helpOption("-h, --help", "display help for command")
  .addOption(new Option("--local").hideHelp())
  .hook("preAction", (thisCommand) => {
    if (thisCommand.args[0] !== "--version" && thisCommand.args[0] !== "-v") {
      showBanner();
    }
  });

registerOutlineCommand(program);
registerPostCommand(program);
registerImageCommand(program);
registerConfigCommand(program);
registerContentTypesCommand(program);
registerPersonasCommand(program);

program.addHelpText(
  "after",
  `
Examples:
  $ drftpnk outline idea.md
  $ drftpnk post idea.md
  $ drftpnk image idea.md
  $ drftpnk outline idea.md --type tweet
  $ drftpnk post idea.md --type linkedin
  $ drftpnk image idea.md --type tweet --slug card
  $ drftpnk config init
  $ drftpnk personas list
  $ drftpnk personas create
  $ drftpnk content-types list
`,
);

program.parse();
