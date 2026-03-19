import { relative, resolve, sep } from "node:path";
import { listDirectories } from "../fs.js";
import type { SourceSkill } from "../skill-discovery.js";
import type { AgentAdapter, AgentAdapterContext, InstallTarget, OwnedPath } from "./types.js";

export function getDefaultInstallTargets(
  adapter: AgentAdapter,
  context: AgentAdapterContext & { sourceSkills: SourceSkill[] },
): InstallTarget[] {
  const installRootPath = getInstallRootPath(adapter, context);

  return context.sourceSkills.map((sourceSkill) => {
    const targetDirectoryPath = resolve(installRootPath, sourceSkill.installedSkillName);

    return {
      displayPath: toDisplayPath(context.targetProjectPath, targetDirectoryPath),
      installedSkillName: sourceSkill.installedSkillName,
      skillFilePath: resolve(targetDirectoryPath, "SKILL.md"),
      sourceDirectoryPath: sourceSkill.sourceDirectoryPath,
      targetDirectoryPath,
    };
  });
}

export async function getDefaultOwnedPaths(
  adapter: AgentAdapter,
  context: AgentAdapterContext,
): Promise<OwnedPath[]> {
  const installRootPath = getInstallRootPath(adapter, context);
  const installedDirectoryNames = await listDirectories(installRootPath);
  const packagePrefix = `${context.packageSlug}-`;

  return installedDirectoryNames
    .filter((installedDirectoryName) => installedDirectoryName.startsWith(packagePrefix))
    .map((installedDirectoryName) => {
      const installedPath = resolve(installRootPath, installedDirectoryName);

      return {
        displayPath: toDisplayPath(context.targetProjectPath, installedPath),
        path: installedPath,
      };
    });
}

export function getPackageContainerPath(
  adapter: AgentAdapter,
  context: AgentAdapterContext,
): string | undefined {
  if (adapter.packageContainerMode !== "package-slug") {
    return undefined;
  }

  return resolve(getSkillsRootPath(adapter, context.targetProjectPath), context.packageSlug);
}

function getInstallRootPath(adapter: AgentAdapter, context: AgentAdapterContext): string {
  const packageContainerPath = getPackageContainerPath(adapter, context);

  return packageContainerPath ?? getSkillsRootPath(adapter, context.targetProjectPath);
}

function getSkillsRootPath(adapter: AgentAdapter, targetProjectPath: string): string {
  return resolve(targetProjectPath, adapter.configFolderName, ...adapter.skillsPathSegments);
}

function toDisplayPath(targetProjectPath: string, targetPath: string): string {
  return relative(targetProjectPath, targetPath).split(sep).join("/");
}
