import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getPackageVersion, readPackageJson } from "./read-package-json.js";

export async function getDefaultRuntimeDependencyVersion(): Promise<string> {
  const packageJson = await readPackageJson(resolveCliPackagePath("package.json"));
  const packageVersion = getPackageVersion(packageJson);

  return `^${packageVersion}`;
}

function resolveCliPackagePath(...relativePathSegments: string[]): string {
  const currentFilePath = fileURLToPath(import.meta.url);

  return resolve(dirname(currentFilePath), "..", "..", ...relativePathSegments);
}
