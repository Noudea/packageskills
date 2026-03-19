import { getDefaultInstallTargets, getDefaultOwnedPaths } from "./adapters/default-layout.js";
import { agentAdapters } from "./adapters/registry.js";
import type { AgentAdapter, InstallTarget, OwnedPath } from "./adapters/types.js";
import { copyDirectory, readTextFile, removePath, writeTextFile } from "./fs.js";
import type { RuntimeContext } from "./runtime-context.js";
import { rewriteInstalledSkillName } from "./skill-frontmatter.js";
import { discoverSourceSkills } from "./skill-discovery.js";

export async function installPackageSkills(runtimeContext: RuntimeContext): Promise<string[]> {
  const sourceSkills = await discoverSourceSkills(
    runtimeContext.sourceSkillsRootPath,
    runtimeContext.packageSlug,
  );
  const installedPaths: string[] = [];

  for (const adapter of agentAdapters) {
    const ownedPaths = await listOwnedPaths(adapter, {
      packageSlug: runtimeContext.packageSlug,
      targetProjectPath: runtimeContext.targetProjectPath,
    });

    for (const ownedPath of ownedPaths) {
      await removePath(ownedPath.path);
    }

    const installTargets = listInstallTargets(adapter, {
      packageSlug: runtimeContext.packageSlug,
      sourceSkills,
      targetProjectPath: runtimeContext.targetProjectPath,
    });

    for (const installTarget of installTargets) {
      await installSkillTarget(installTarget);
      installedPaths.push(installTarget.displayPath);
    }
  }

  return installedPaths.sort();
}

async function installSkillTarget(installTarget: InstallTarget): Promise<void> {
  await copyDirectory(installTarget.sourceDirectoryPath, installTarget.targetDirectoryPath);

  const installedSkillSource = await readTextFile(installTarget.skillFilePath);
  const rewrittenSkillSource = rewriteInstalledSkillName(
    installedSkillSource,
    installTarget.installedSkillName,
  );

  await writeTextFile(installTarget.skillFilePath, rewrittenSkillSource);
}

function listInstallTargets(
  adapter: AgentAdapter,
  context: Parameters<typeof getDefaultInstallTargets>[1],
): InstallTarget[] {
  return adapter.listInstallTargets?.(context) ?? getDefaultInstallTargets(adapter, context);
}

function listOwnedPaths(
  adapter: AgentAdapter,
  context: Parameters<typeof getDefaultOwnedPaths>[1],
): Promise<OwnedPath[]> {
  return Promise.resolve(
    adapter.listOwnedPaths?.(context) ?? getDefaultOwnedPaths(adapter, context),
  );
}
