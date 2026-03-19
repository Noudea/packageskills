import { resolve } from "node:path";
import {
  getGeneratedCommandName,
  getPackageName,
  readPackageJson,
} from "../package-json/read-package-json.js";
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

  const packageJson = await readPackageJson(resolve(cwd, "package.json"));
  const packageName = getPackageName(packageJson);
  const packageType = await detectPackageType(cwd);
  const generatedCommandName = getGeneratedCommandName(packageJson, packageName);
  const templateData = {
    generatedCommandName,
    packageName,
  };
  const filePaths = await scaffoldTemplateFiles({
    cwd,
    packageType,
    templateData,
  });

  return {
    filePaths,
    generatedCommandName,
    packageType,
    status: "created",
  };
}
