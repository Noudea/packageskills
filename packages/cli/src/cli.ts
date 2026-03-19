#!/usr/bin/env node

import { cac } from "cac";
import { runInit } from "./commands/init.js";

const cli = cac("packageskills");

function reportCliError(error: unknown): void {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}

cli
  .command("init", "Scaffold packageskills into the current package")
  .action(() => {
    void runInit().catch(reportCliError);
  });

cli.help();

const rawArgs = process.argv.slice(2);

cli.parse();

if (rawArgs.length === 0) {
  cli.outputHelp();
}
