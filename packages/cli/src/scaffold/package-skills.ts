import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDefaultRuntimeDependencyVersion } from "../package-json/cli-package-metadata.js";
import {
  getGeneratedCommandName,
  getPackageName,
  readPackageJsonDocument,
} from "../package-json/read-package-json.js";
import { updatePackageJsonForInit } from "../package-json/update-package-json.js";
import {
  detectPackageType,
  getSkillsDirectoryState,
  type PackageType,
  scaffoldTemplateFiles,
} from "./template-files.js";

interface ScaffoldPackageSkillsOptions {
  cwd: string;
}

interface SkippedScaffoldResult {
  status: "skipped";
}

interface CreatedScaffoldResult {
  filePaths: string[];
  generatedCommandName: string;
  packageType: PackageType;
  requiresInstall: boolean;
  status: "created";
}

export type ScaffoldPackageSkillsResult = CreatedScaffoldResult | SkippedScaffoldResult;

export async function scaffoldPackageSkills({
  cwd,
}: ScaffoldPackageSkillsOptions): Promise<ScaffoldPackageSkillsResult> {
  const skillsDirectoryPath = resolve(cwd, "packageskills");
  const existingSkillsDirectory = await getSkillsDirectoryState(skillsDirectoryPath);

  if (existingSkillsDirectory === "directory") {
    return {
      status: "skipped",
    };
  }

  if (existingSkillsDirectory === "file") {
    throw new Error("`packageskills` already exists and is not a directory.");
  }

  const packageJsonPath = resolve(cwd, "package.json");
  const packageJsonDocument = await readPackageJsonDocument(packageJsonPath);
  const packageJson = packageJsonDocument.packageJson;
  const packageName = getPackageName(packageJson);
  const packageType = await detectPackageType(cwd);
  const generatedCommandName = getGeneratedCommandName(packageJson, packageName);
  const runtimeDependencyVersion = await getDefaultRuntimeDependencyVersion();
  const packageJsonUpdate = updatePackageJsonForInit({
    generatedCommandName,
    packageJsonDocument,
    packageType,
    runtimeDependencyVersion,
  });
  const templateData = {
    generatedCommandName,
    packageName,
  };
  const filePaths = await scaffoldTemplateFiles({
    cwd,
    packageType,
    templateData,
  });
  const changedFilePaths = [...filePaths];

  if (packageJsonUpdate.changed) {
    await writeFile(packageJsonPath, packageJsonUpdate.source, "utf8");
    changedFilePaths.push("package.json");
    changedFilePaths.sort();
  }

  return {
    filePaths: changedFilePaths,
    generatedCommandName,
    packageType,
    requiresInstall: packageJsonUpdate.dependencyChanged,
    status: "created",
  };
}
