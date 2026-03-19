import { installPackageSkills } from "./install.js";
import { removePackageSkills } from "./remove.js";
import { createRuntimeContext } from "./runtime-context.js";

type RuntimeCommand = "install" | "remove";

export interface RunPackageSkillsCliOptions {
  argv: string[];
  commandName: string;
  cwd: string;
  packageName: string;
  scriptFilePath?: string;
}

export async function runPackageSkillsCli(options: RunPackageSkillsCliOptions): Promise<void> {
  const command = parseRuntimeCommand(options.argv, options.commandName);
  const runtimeContext = await createRuntimeContext(options, command);

  if (command === "install") {
    const installedPaths = await installPackageSkills(runtimeContext);

    process.stdout.write(`Installed package-owned skills for ${runtimeContext.packageName}.\n`);

    for (const installedPath of installedPaths) {
      process.stdout.write(`- ${installedPath}\n`);
    }

    return;
  }

  const removedPaths = await removePackageSkills(runtimeContext);

  if (removedPaths.length === 0) {
    process.stdout.write(
      `No installed package-owned skills found for ${runtimeContext.packageName}.\n`,
    );
    return;
  }

  process.stdout.write(`Removed package-owned skills for ${runtimeContext.packageName}.\n`);

  for (const removedPath of removedPaths) {
    process.stdout.write(`- ${removedPath}\n`);
  }
}

function formatUsage(commandName: string): string {
  return `Usage: ${commandName} <install|remove>`;
}

function parseRuntimeCommand(argv: string[], commandName: string): RuntimeCommand {
  if (argv.length !== 1) {
    throw new Error(formatUsage(commandName));
  }

  const runtimeCommand = argv[0];

  if (runtimeCommand === "install" || runtimeCommand === "remove") {
    return runtimeCommand;
  }

  throw new Error(`Unknown command \`${runtimeCommand}\`. ${formatUsage(commandName)}`);
}
