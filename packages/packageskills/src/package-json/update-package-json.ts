import { applyEdits, modify } from "jsonc-parser";
import type { PackageType } from "../scaffold/template-files.js";
import {
  getPackageName,
  getPrimaryCommandName,
  type PackageJson,
  type PackageJsonDocument,
} from "./read-package-json.js";

const generatedBinPath = "./bin/packageskills.js";
const runtimePackageName = "@packageskills/runtime";

interface UpdatePackageJsonForInitOptions {
  generatedCommandName: string;
  packageJsonDocument: PackageJsonDocument;
  packageType: PackageType;
  runtimeDependencyVersion: string;
}

interface PackageJsonUpdateResult {
  changed: boolean;
  dependencyChanged: boolean;
  source: string;
}

export function updatePackageJsonForInit({
  generatedCommandName,
  packageJsonDocument,
  packageType,
  runtimeDependencyVersion,
}: UpdatePackageJsonForInitOptions): PackageJsonUpdateResult {
  const packageJson = packageJsonDocument.packageJson;

  assertPackageJsonCanBeUpdated(packageJson, generatedCommandName);

  let nextSource = packageJsonDocument.source;

  nextSource = updateBinField(nextSource, packageJson, generatedCommandName);
  nextSource = updateFilesField(nextSource, packageJson, packageType);
  const dependencyUpdate = updateDependenciesField(
    nextSource,
    packageJson,
    runtimeDependencyVersion,
  );
  nextSource = dependencyUpdate.source;

  return {
    changed: nextSource !== packageJsonDocument.source,
    dependencyChanged: dependencyUpdate.dependencyChanged,
    source: nextSource,
  };
}

function assertPackageJsonCanBeUpdated(
  packageJson: PackageJson,
  generatedCommandName: string,
): void {
  assertBinFieldIsSupported(packageJson, generatedCommandName);
  assertDevDependenciesFieldIsSupported(packageJson);
  assertFilesFieldIsSupported(packageJson);
  assertDependenciesFieldIsSupported(packageJson);
}

function assertBinFieldIsSupported(packageJson: PackageJson, generatedCommandName: string): void {
  if (packageJson.bin === undefined) {
    return;
  }

  if (typeof packageJson.bin === "string") {
    const packageName = getPackageName(packageJson);
    const primaryCommandName = getPrimaryCommandName(packageJson, packageName);

    if (generatedCommandName === primaryCommandName && packageJson.bin !== generatedBinPath) {
      throw new Error(
        `Could not add the generated bin because \`${generatedCommandName}\` already points to \`${packageJson.bin}\`.`,
      );
    }

    return;
  }

  if (!isRecord(packageJson.bin)) {
    throw new Error("`package.json` has an unsupported `bin` field. Expected a string or object.");
  }

  const existingGeneratedBin = packageJson.bin[generatedCommandName];

  if (existingGeneratedBin === undefined || existingGeneratedBin === generatedBinPath) {
    return;
  }

  if (typeof existingGeneratedBin === "string") {
    throw new Error(
      `Could not add the generated bin because \`${generatedCommandName}\` already points to \`${existingGeneratedBin}\`.`,
    );
  }

  throw new Error(
    `Could not add the generated bin because \`${generatedCommandName}\` already exists with an unsupported value.`,
  );
}

function assertDependenciesFieldIsSupported(packageJson: PackageJson): void {
  if (packageJson.dependencies === undefined || isRecord(packageJson.dependencies)) {
    return;
  }

  throw new Error("`package.json` has an unsupported `dependencies` field. Expected an object.");
}

function assertDevDependenciesFieldIsSupported(packageJson: PackageJson): void {
  if (packageJson.devDependencies === undefined || isRecord(packageJson.devDependencies)) {
    return;
  }

  throw new Error("`package.json` has an unsupported `devDependencies` field. Expected an object.");
}

function assertFilesFieldIsSupported(packageJson: PackageJson): void {
  if (packageJson.files === undefined || Array.isArray(packageJson.files)) {
    return;
  }

  throw new Error("`package.json` has an unsupported `files` field. Expected an array.");
}

function updateBinField(
  packageJsonSource: string,
  packageJson: PackageJson,
  generatedCommandName: string,
): string {
  if (typeof packageJson.bin === "string") {
    const packageName = getPackageName(packageJson);
    const primaryCommandName = getPrimaryCommandName(packageJson, packageName);

    if (generatedCommandName === primaryCommandName) {
      return packageJsonSource;
    }

    return applyModify(packageJsonSource, ["bin"], {
      [primaryCommandName]: packageJson.bin,
      [generatedCommandName]: generatedBinPath,
    });
  }

  if (isRecord(packageJson.bin)) {
    if (packageJson.bin[generatedCommandName] === generatedBinPath) {
      return packageJsonSource;
    }

    return applyModify(packageJsonSource, ["bin", generatedCommandName], generatedBinPath);
  }

  return applyModify(packageJsonSource, ["bin"], {
    [generatedCommandName]: generatedBinPath,
  });
}

function updateDependenciesField(
  packageJsonSource: string,
  packageJson: PackageJson,
  runtimeDependencyVersion: string,
): PackageJsonUpdateResult {
  const currentDependencyVersion = getCurrentRuntimeDependencyVersion(packageJson.dependencies);
  const currentDevDependencyVersion = getCurrentRuntimeDependencyVersion(
    packageJson.devDependencies,
  );
  let nextSource = packageJsonSource;
  let changed = false;

  if (isRecord(packageJson.dependencies)) {
    if (currentDependencyVersion !== runtimeDependencyVersion) {
      nextSource = applyModify(
        nextSource,
        ["dependencies", runtimePackageName],
        runtimeDependencyVersion,
      );
      changed = true;
    }
  } else {
    nextSource = applyModify(nextSource, ["dependencies"], {
      [runtimePackageName]: runtimeDependencyVersion,
    });
    changed = true;
  }

  if (currentDevDependencyVersion !== undefined) {
    nextSource = removeRuntimeDevDependency(nextSource, packageJson.devDependencies);
    changed = true;
  }

  return {
    changed,
    dependencyChanged:
      changed &&
      (currentDependencyVersion !== runtimeDependencyVersion ||
        currentDevDependencyVersion !== undefined),
    source: nextSource,
  };
}

function updateFilesField(
  packageJsonSource: string,
  packageJson: PackageJson,
  packageType: PackageType,
): string {
  const requiredFiles = getRequiredFiles(packageType);

  if (!Array.isArray(packageJson.files)) {
    return applyModify(packageJsonSource, ["files"], requiredFiles);
  }

  let nextSource = packageJsonSource;

  for (const requiredFile of requiredFiles) {
    if (packageJson.files.includes(requiredFile)) {
      continue;
    }

    nextSource = applyModify(nextSource, ["files", -1], requiredFile, {
      isArrayInsertion: true,
    });
  }

  return nextSource;
}

function getRequiredFiles(packageType: PackageType): string[] {
  const requiredFiles = ["bin", "packageskills"];

  if (packageType === "typescript") {
    requiredFiles.unshift("dist");
  }

  return requiredFiles;
}

function removeRuntimeDevDependency(
  packageJsonSource: string,
  devDependencies: PackageJson["devDependencies"],
): string {
  if (!isRecord(devDependencies)) {
    return packageJsonSource;
  }

  const devDependencyKeys = Object.keys(devDependencies);

  if (devDependencyKeys.length === 1 && devDependencyKeys[0] === runtimePackageName) {
    return applyModify(packageJsonSource, ["devDependencies"], undefined);
  }

  return applyModify(packageJsonSource, ["devDependencies", runtimePackageName], undefined);
}

function getCurrentRuntimeDependencyVersion(
  dependencies: PackageJson["dependencies"] | PackageJson["devDependencies"],
): string | undefined {
  if (!isRecord(dependencies)) {
    return undefined;
  }

  const runtimeDependencyVersion = dependencies[runtimePackageName];

  return typeof runtimeDependencyVersion === "string" ? runtimeDependencyVersion : undefined;
}

function applyModify(
  packageJsonSource: string,
  path: Array<number | string>,
  value: unknown,
  options: {
    isArrayInsertion?: boolean;
  } = {},
): string {
  const edits = modify(packageJsonSource, path, value, {
    formattingOptions: {
      eol: "\n",
      insertSpaces: true,
      tabSize: 2,
    },
    isArrayInsertion: options.isArrayInsertion,
  });

  return applyEdits(packageJsonSource, edits);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
