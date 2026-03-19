import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { config as loadDotenv } from "dotenv";

const execFile = promisify(execFileCallback);
const testsPackageRootPath = fileURLToPath(new URL("../../", import.meta.url));
const workspaceRootPath = fileURLToPath(new URL("../../../../", import.meta.url));
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
