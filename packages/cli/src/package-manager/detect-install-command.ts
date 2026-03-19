import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { readPackageJson } from "../package-json/read-package-json.js";

type SupportedPackageManager = "bun" | "npm" | "pnpm" | "yarn";

export async function detectInstallCommand(cwd: string): Promise<string> {
  const packageManager = await detectPackageManagerFromPackageJson(cwd);

  if (packageManager !== undefined) {
    return `${packageManager} install`;
  }

  if (await fileExists(resolve(cwd, "pnpm-lock.yaml"))) {
    return "pnpm install";
  }

  if (
    (await fileExists(resolve(cwd, "package-lock.json"))) ||
    (await fileExists(resolve(cwd, "npm-shrinkwrap.json")))
  ) {
    return "npm install";
  }

  if (await fileExists(resolve(cwd, "yarn.lock"))) {
    return "yarn install";
  }

  if (
    (await fileExists(resolve(cwd, "bun.lock"))) ||
    (await fileExists(resolve(cwd, "bun.lockb")))
  ) {
    return "bun install";
  }

  return "npm install";
}

async function detectPackageManagerFromPackageJson(
  cwd: string,
): Promise<SupportedPackageManager | undefined> {
  const packageJson = await readPackageJson(resolve(cwd, "package.json"));

  if (typeof packageJson.packageManager !== "string") {
    return undefined;
  }

  const packageManagerName = packageJson.packageManager.split("@")[0];

  return isSupportedPackageManager(packageManagerName) ? packageManagerName : undefined;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isSupportedPackageManager(
  packageManagerName: string,
): packageManagerName is SupportedPackageManager {
  return ["bun", "npm", "pnpm", "yarn"].includes(packageManagerName);
}
