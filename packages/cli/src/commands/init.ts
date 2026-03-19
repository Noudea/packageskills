import { detectInstallCommand } from "../package-manager/detect-install-command.js";
import { scaffoldPackageSkills } from "../scaffold/package-skills.js";

export async function runInit(): Promise<void> {
  const result = await scaffoldPackageSkills({
    cwd: process.cwd(),
  });

  if (result.status === "skipped") {
    process.stdout.write("`packageskills/` already exists. Skipping init.\n");
    return;
  }

  process.stdout.write(`Scaffolded packageskills files for a ${result.packageType} package.\n`);
  process.stdout.write(`Generated command: ${result.generatedCommandName}\n`);

  for (const filePath of result.filePaths) {
    process.stdout.write(`- ${filePath}\n`);
  }

  if (!result.requiresInstall) {
    return;
  }

  const installCommand = await detectInstallCommand(process.cwd());

  process.stdout.write(
    `Next step: run \`${installCommand}\` to install \`@packageskills/runtime\`.\n`,
  );
}
