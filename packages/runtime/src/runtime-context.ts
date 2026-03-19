import { realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { RunPackageSkillsCliOptions } from "./index.js";
import { normalizePackageSlug } from "./package-name.js";

type RuntimeCommand = "install" | "remove";

export interface RuntimeContext {
  commandName: string;
  packageName: string;
  packageSlug: string;
  sourceSkillsRootPath?: string;
  targetProjectPath: string;
}

export async function createRuntimeContext(
  options: RunPackageSkillsCliOptions,
  command: RuntimeCommand,
): Promise<RuntimeContext> {
  return {
    commandName: options.commandName,
    packageName: options.packageName,
    packageSlug: normalizePackageSlug(options.packageName),
    sourceSkillsRootPath: await resolveSourceSkillsRootPath(options.scriptFilePath, command),
    targetProjectPath: resolve(options.cwd),
  };
}

async function resolveSourceSkillsRootPath(
  scriptFilePath: string | undefined,
  command: RuntimeCommand,
): Promise<string | undefined> {
  if (command === "remove") {
    return scriptFilePath === undefined ? undefined : getSourceSkillsRootPath(scriptFilePath);
  }

  if (scriptFilePath === undefined) {
    throw new Error("Could not determine the installed package root for `install`.");
  }

  return getSourceSkillsRootPath(scriptFilePath);
}

async function getSourceSkillsRootPath(scriptFilePath: string): Promise<string> {
  const resolvedScriptFilePath = await realpath(resolve(scriptFilePath));

  return resolve(dirname(resolvedScriptFilePath), "..", "packageskills");
}
