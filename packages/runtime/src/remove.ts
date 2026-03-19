import { getDefaultOwnedPaths, getPackageContainerPath } from "./adapters/default-layout.js";
import { agentAdapters } from "./adapters/registry.js";
import type { AgentAdapter, OwnedPath } from "./adapters/types.js";
import { removePath, removePathIfEmpty } from "./fs.js";
import type { RuntimeContext } from "./runtime-context.js";

export async function removePackageSkills(runtimeContext: RuntimeContext): Promise<string[]> {
  const removedPaths: string[] = [];

  for (const adapter of agentAdapters) {
    const adapterContext = {
      packageSlug: runtimeContext.packageSlug,
      targetProjectPath: runtimeContext.targetProjectPath,
    };
    const ownedPaths = await listOwnedPaths(adapter, adapterContext);

    for (const ownedPath of ownedPaths) {
      await removePath(ownedPath.path);
      removedPaths.push(ownedPath.displayPath);
    }

    const packageContainerPath = getPackageContainerPath(adapter, adapterContext);

    if (packageContainerPath !== undefined) {
      await removePathIfEmpty(packageContainerPath);
    }
  }

  return removedPaths.sort();
}

function listOwnedPaths(
  adapter: AgentAdapter,
  context: Parameters<typeof getDefaultOwnedPaths>[1],
): Promise<OwnedPath[]> {
  return Promise.resolve(
    adapter.listOwnedPaths?.(context) ?? getDefaultOwnedPaths(adapter, context),
  );
}
