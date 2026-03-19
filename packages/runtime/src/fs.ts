import { access, cp, mkdir, readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function copyDirectory(sourcePath: string, targetPath: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { force: true, recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (isMissingPathError(error)) {
      return false;
    }

    throw error;
  }
}

export async function listDirectories(directoryPath: string): Promise<string[]> {
  try {
    const directoryEntries = await readdir(directoryPath, { withFileTypes: true });

    return directoryEntries
      .filter((directoryEntry) => directoryEntry.isDirectory())
      .map((directoryEntry) => directoryEntry.name)
      .sort();
  } catch (error) {
    if (isMissingPathError(error)) {
      return [];
    }

    throw error;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function removePath(pathToRemove: string): Promise<void> {
  await rm(pathToRemove, { force: true, recursive: true });
}

export async function removePathIfEmpty(pathToRemove: string): Promise<void> {
  try {
    await rmdir(pathToRemove);
  } catch (error) {
    if (
      isMissingPathError(error) ||
      (error instanceof Error && "code" in error && error.code === "ENOTEMPTY")
    ) {
      return;
    }

    throw error;
  }
}

export async function writeTextFile(filePath: string, fileContents: string): Promise<void> {
  await writeFile(filePath, fileContents, "utf8");
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
