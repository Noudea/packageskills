#!/usr/bin/env node
// Generate by packageskills

async function main() {
  const { runPackageSkillsCli } = await import("@packageskills/runtime");

  await runPackageSkillsCli({
    commandName: "outdated-skills",
    packageName: "outdated-package",
    cwd: process.cwd(),
    argv: process.argv.slice(2),
    scriptFilePath: process.argv[1],
  });
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
