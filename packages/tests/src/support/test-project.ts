import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { config as loadDotenv } from "dotenv";

const execFile = promisify(execFileCallback);
const testsPackageRootPath = fileURLToPath(new URL("../../", import.meta.url));
const workspaceRootPath = fileURLToPath(new URL("../../../../", import.meta.url));
const workspaceProtocol = "workspace:";
loadDotenv({
  path: resolvePackagePath(".env"),
  quiet: true,
});

export async function createFixtureCopy(
  fixtureRelativePath: string,
  options: {
    testName?: string;
  } = {},
): Promise<{
  cleanup: () => Promise<void>;
  projectPath: string;
}> {
  const fixturePath = resolveWorkspacePath("packages", "fixtures", fixtureRelativePath);
  const tempRootPath = await mkdtemp(join(tmpdir(), "packageskills-tests-"));
  const projectPath = resolve(tempRootPath, "project");

  await cp(fixturePath, projectPath, {
    recursive: true,
  });

  if (shouldKeepTestProjects()) {
    const label = options.testName ? ` for "${options.testName}"` : "";

    process.stdout.write(`Keeping test project${label} at ${projectPath}\n`);
  }

  return {
    cleanup: async () => {
      if (shouldKeepTestProjects()) {
        return;
      }

      await rm(tempRootPath, { force: true, recursive: true });
    },
    projectPath,
  };
}

export async function runPackageskillsCli({ args, cwd }: { args: string[]; cwd: string }): Promise<{
  exitCode: number;
  stderr: string;
  stdout: string;
}> {
  try {
    const result = await execFile(process.execPath, [getCliEntryFilePath(), ...args], {
      cwd,
    });

    return {
      exitCode: 0,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } catch (error) {
    if (isFailedCommand(error)) {
      return {
        exitCode: error.code,
        stderr: error.stderr,
        stdout: error.stdout,
      };
    }

    throw error;
  }
}

export async function getExpectedRuntimeDependencyVersion(): Promise<string> {
  const cliPackageJsonSource = await readFile(
    resolveWorkspacePath("packages", "cli", "package.json"),
    "utf8",
  );
  const runtimePackageJsonSource = await readFile(
    resolveWorkspacePath("packages", "runtime", "package.json"),
    "utf8",
  );
  const cliPackageJson = JSON.parse(cliPackageJsonSource) as {
    dependencies?: unknown;
  };
  const runtimePackageJson = JSON.parse(runtimePackageJsonSource) as {
    version?: unknown;
  };
  const runtimeDependencyVersion = getRuntimeDependencyVersion(cliPackageJson.dependencies);

  if (typeof runtimeDependencyVersion !== "string" || runtimeDependencyVersion.length === 0) {
    throw new Error("Could not determine the runtime dependency version for test expectations.");
  }

  if (!runtimeDependencyVersion.startsWith(workspaceProtocol)) {
    return runtimeDependencyVersion;
  }

  if (typeof runtimePackageJson.version !== "string" || runtimePackageJson.version.length === 0) {
    throw new Error("Could not determine the runtime package version for test expectations.");
  }

  return resolveWorkspaceDependencyVersion(runtimeDependencyVersion, runtimePackageJson.version);
}

interface FailedCommandError extends Error {
  code: number;
  stderr: string;
  stdout: string;
}

function isFailedCommand(error: unknown): error is FailedCommandError {
  return (
    error instanceof Error &&
    typeof (error as FailedCommandError).code === "number" &&
    typeof (error as FailedCommandError).stderr === "string" &&
    typeof (error as FailedCommandError).stdout === "string"
  );
}

function getRuntimeDependencyVersion(dependencies: unknown): string | undefined {
  if (!isRecord(dependencies)) {
    return undefined;
  }

  const runtimeDependencyVersion = dependencies["@packageskills/runtime"];

  return typeof runtimeDependencyVersion === "string" ? runtimeDependencyVersion : undefined;
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

function getCliEntryFilePath(): string {
  return resolveWorkspacePath("packages", "cli", "dist", "cli.js");
}

function resolveWorkspacePath(...relativePathSegments: string[]): string {
  return resolve(workspaceRootPath, ...relativePathSegments);
}

function resolvePackagePath(...relativePathSegments: string[]): string {
  return resolve(testsPackageRootPath, ...relativePathSegments);
}

function shouldKeepTestProjects(): boolean {
  return process.env.KEEP_TEST_PROJECTS?.trim().toLowerCase() === "true";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
