import { scaffoldPackageSkills } from "../scaffold/package-skills.js";

export async function runInit(): Promise<void> {
  const result = await scaffoldPackageSkills({
    cwd: process.cwd(),
  });

  if (result.status === "skipped") {
    process.stdout.write("`packageskills/` already exists. Skipping init.\n");
    return;
  }

  process.stdout.write(
    `Scaffolded packageskills files for a ${result.packageType} package.\n`,
  );
  process.stdout.write(`Generated command: ${result.generatedCommandName}\n`);

  for (const filePath of result.filePaths) {
    process.stdout.write(`- ${filePath}\n`);
  }
}
