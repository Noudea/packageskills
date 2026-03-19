import { readFile } from "node:fs/promises";

export interface PackageJson {
  bin?: unknown;
  name?: unknown;
}

export function getGeneratedCommandName(packageJson: PackageJson, packageName: string): string {
  const primaryCommandName = getPrimaryCommandName(packageJson, packageName);

  if (primaryCommandName.endsWith("-skills")) {
    return primaryCommandName;
  }

  return `${primaryCommandName}-skills`;
}

export function getPackageName(packageJson: PackageJson): string {
  if (typeof packageJson.name !== "string" || packageJson.name.length === 0) {
    throw new Error("`package.json` must contain a non-empty `name` field.");
  }

  return packageJson.name;
}

export async function readPackageJson(packageJsonPath: string): Promise<PackageJson> {
  let packageJsonSource: string;

  try {
    packageJsonSource = await readFile(packageJsonPath, "utf8");
  } catch (error) {
    if (isMissingPathError(error)) {
      throw new Error("Could not find `package.json` in the current directory.", {
        cause: error,
      });
    }

    throw error;
  }

  let parsedPackageJson: unknown;

  try {
    parsedPackageJson = JSON.parse(packageJsonSource);
  } catch (error) {
    throw new Error("Could not parse `package.json` in the current directory.", {
      cause: error,
    });
  }

  if (!isRecord(parsedPackageJson)) {
    throw new Error("`package.json` must contain a JSON object.");
  }

  return parsedPackageJson;
}

function getPrimaryCommandName(packageJson: PackageJson, packageName: string): string {
  const unscopedPackageName = getUnscopedPackageName(packageName);

  if (typeof packageJson.bin === "string") {
    return unscopedPackageName;
  }

  if (isRecord(packageJson.bin)) {
    if (typeof packageJson.bin[unscopedPackageName] === "string") {
      return unscopedPackageName;
    }

    const binEntries = Object.entries(packageJson.bin).filter(([, value]) => {
      return typeof value === "string";
    });

    if (binEntries.length === 1) {
      return binEntries[0][0];
    }
  }

  return unscopedPackageName;
}

function getUnscopedPackageName(packageName: string): string {
  return packageName.startsWith("@") ? (packageName.split("/").at(1) ?? packageName) : packageName;
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
