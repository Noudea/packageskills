import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getPackageVersion, readPackageJson } from "./read-package-json.js";

const runtimePackageName = "@packageskills/runtime";
const workspaceProtocol = "workspace:";

export async function getDefaultRuntimeDependencyVersion(): Promise<string> {
  const cliPackageJson = await readPackageJson(resolveCliPackagePath("package.json"));
  const runtimeDependencyVersion = getRuntimeDependencyVersion(cliPackageJson.dependencies);

  if (typeof runtimeDependencyVersion !== "string" || runtimeDependencyVersion.length === 0) {
    throw new Error(
      `packageskills must declare ${runtimePackageName} in its dependencies to scaffold it.`,
    );
  }

  if (!runtimeDependencyVersion.startsWith(workspaceProtocol)) {
    return runtimeDependencyVersion;
  }

  const runtimePackageJson = await readPackageJson(resolveRuntimePackagePath("package.json"));
  const runtimePackageVersion = getPackageVersion(runtimePackageJson);

  return resolveWorkspaceDependencyVersion(runtimeDependencyVersion, runtimePackageVersion);
}

function getRuntimeDependencyVersion(dependencies: unknown): string | undefined {
  if (!isRecord(dependencies)) {
    return undefined;
  }

  const runtimeDependencyVersion = dependencies[runtimePackageName];

  return typeof runtimeDependencyVersion === "string" ? runtimeDependencyVersion : undefined;
}

function resolveRuntimePackagePath(...relativePathSegments: string[]): string {
  return resolveCliPackagePath("..", "runtime", ...relativePathSegments);
}

function resolveWorkspaceDependencyVersion(
  dependencySpecifier: string,
  packageVersion: string,
): string {
  const workspaceRange = dependencySpecifier.slice(workspaceProtocol.length);

  if (workspaceRange === "*" || workspaceRange.length === 0) {
    return packageVersion;
  }

  if (workspaceRange === "^" || workspaceRange === "~") {
    return `${workspaceRange}${packageVersion}`;
  }

  return workspaceRange;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveCliPackagePath(...relativePathSegments: string[]): string {
  const currentFilePath = fileURLToPath(import.meta.url);

  return resolve(dirname(currentFilePath), "..", "..", ...relativePathSegments);
}
