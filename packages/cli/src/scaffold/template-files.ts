import { access, chmod, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTemplate, type TemplateData } from "./render-template.js";

export type PackageType = "javascript" | "typescript";

export async function detectPackageType(cwd: string): Promise<PackageType> {
  if (await pathExists(resolve(cwd, "tsconfig.json"))) {
    return "typescript";
  }

  return "javascript";
}

export async function getSkillsDirectoryState(
  skillsDirectoryPath: string,
): Promise<"directory" | "file" | "missing"> {
  try {
    const stats = await stat(skillsDirectoryPath);

    return stats.isDirectory() ? "directory" : "file";
  } catch (error) {
    if (isMissingPathError(error)) {
      return "missing";
    }

    throw error;
  }
}

export async function scaffoldTemplateFiles({
  cwd,
  hasExistingSkillsDirectory,
  packageType,
  templateData,
}: {
  cwd: string;
  hasExistingSkillsDirectory: boolean;
  packageType: PackageType;
  templateData: TemplateData;
}): Promise<string[]> {
  const templateDirectories = [
    resolveTemplatesDirectory("shared"),
    resolveTemplatesDirectory(packageType),
  ];
  const scaffoldFiles: Array<{
    outputRelativePath: string;
    renderedTemplate: string;
    shouldWrite: boolean;
  }> = [];
  const filePaths: string[] = [];

  for (const templateDirectory of templateDirectories) {
    const templateFilePaths = await listTemplateFilePaths(templateDirectory);

    for (const templateFilePath of templateFilePaths) {
      const outputRelativePath = getOutputRelativePath(templateDirectory, templateFilePath);

      if (hasExistingSkillsDirectory && isSourceSkillOutput(outputRelativePath)) {
        continue;
      }

      const templateSource = await readFile(templateFilePath, "utf8");
      const renderedTemplate = renderTemplate(templateSource, templateData);

      scaffoldFiles.push(
        await prepareScaffoldFile({
          cwd,
          outputRelativePath,
          renderedTemplate,
        }),
      );
    }
  }

  for (const scaffoldFile of scaffoldFiles) {
    if (!scaffoldFile.shouldWrite) {
      continue;
    }

    const didWrite = await writeScaffoldFile({
      cwd,
      outputRelativePath: scaffoldFile.outputRelativePath,
      renderedTemplate: scaffoldFile.renderedTemplate,
    });

    if (didWrite) {
      filePaths.push(scaffoldFile.outputRelativePath);
    }
  }

  filePaths.sort();

  return filePaths;
}

async function prepareScaffoldFile({
  cwd,
  outputRelativePath,
  renderedTemplate,
}: {
  cwd: string;
  outputRelativePath: string;
  renderedTemplate: string;
}): Promise<{
  outputRelativePath: string;
  renderedTemplate: string;
  shouldWrite: boolean;
}> {
  const outputFilePath = resolve(cwd, outputRelativePath);

  try {
    const existingFileSource = await readFile(outputFilePath, "utf8");

    if (!isGeneratedByPackageskills(existingFileSource)) {
      throw new Error(`Could not scaffold \`${outputRelativePath}\` because it already exists.`);
    }

    return {
      outputRelativePath,
      renderedTemplate,
      shouldWrite: existingFileSource !== renderedTemplate,
    };
  } catch (error) {
    if (isMissingPathError(error)) {
      return {
        outputRelativePath,
        renderedTemplate,
        shouldWrite: true,
      };
    }

    throw error;
  }
}

function getOutputRelativePath(templateDirectory: string, templateFilePath: string): string {
  return relative(templateDirectory, templateFilePath).replace(/\.hbs$/, "");
}

function isGeneratedByPackageskills(fileContents: string): boolean {
  return fileContents.includes("// Generate by packageskills");
}

function isExecutableFile(outputRelativePath: string): boolean {
  const pathSegments = outputRelativePath.split(sep);

  return pathSegments[0] === "bin" && outputRelativePath.endsWith(".js");
}

function isSourceSkillOutput(outputRelativePath: string): boolean {
  const pathSegments = outputRelativePath.split(sep);

  return pathSegments[0] === "packageskills";
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function listTemplateFilePaths(templateDirectory: string): Promise<string[]> {
  const entries = await readdir(templateDirectory, {
    withFileTypes: true,
  });
  const filePaths: string[] = [];

  for (const entry of entries) {
    const entryPath = join(templateDirectory, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...(await listTemplateFilePaths(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      filePaths.push(entryPath);
    }
  }

  filePaths.sort();

  return filePaths;
}

async function pathExists(filePath: string): Promise<boolean> {
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

function resolveTemplatesDirectory(templateSetName: string): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const packageRootPath = resolve(dirname(currentFilePath), "..", "..");

  return resolve(packageRootPath, "src", "templates", "init", templateSetName);
}

async function writeScaffoldFile({
  cwd,
  outputRelativePath,
  renderedTemplate,
}: {
  cwd: string;
  outputRelativePath: string;
  renderedTemplate: string;
}): Promise<boolean> {
  const outputFilePath = resolve(cwd, outputRelativePath);

  await mkdir(dirname(outputFilePath), { recursive: true });

  await writeFile(outputFilePath, renderedTemplate, "utf8");

  if (isExecutableFile(outputRelativePath)) {
    await chmod(outputFilePath, 0o755);
  }

  return true;
}
