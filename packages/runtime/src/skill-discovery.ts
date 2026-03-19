import { resolve } from "node:path";
import { fileExists, listDirectories } from "./fs.js";
import { normalizeSkillSlug } from "./package-name.js";

export interface SourceSkill {
  installedSkillName: string;
  sourceDirectoryPath: string;
  sourceSkillFilePath: string;
}

export async function discoverSourceSkills(
  sourceSkillsRootPath: string | undefined,
  packageSlug: string,
): Promise<SourceSkill[]> {
  if (sourceSkillsRootPath === undefined) {
    throw new Error("Could not determine the installed package root for `install`.");
  }

  if (!(await fileExists(sourceSkillsRootPath))) {
    throw new Error("Could not find `packageskills/` in the installed package.");
  }

  const skillDirectoryNames = await listDirectories(sourceSkillsRootPath);

  if (skillDirectoryNames.length === 0) {
    throw new Error("Could not find any skill bundles in `packageskills/`.");
  }

  const sourceSkills = await Promise.all(
    skillDirectoryNames.map(async (skillDirectoryName) => {
      const sourceDirectoryPath = resolve(sourceSkillsRootPath, skillDirectoryName);
      const sourceSkillFilePath = resolve(sourceDirectoryPath, "SKILL.md");

      if (!(await fileExists(sourceSkillFilePath))) {
        throw new Error(`Could not find \`SKILL.md\` in \`packageskills/${skillDirectoryName}\`.`);
      }

      return {
        installedSkillName: `${packageSlug}-${normalizeSkillSlug(skillDirectoryName)}`,
        sourceDirectoryPath,
        sourceSkillFilePath,
      } satisfies SourceSkill;
    }),
  );

  assertNoNameCollisions(sourceSkills);

  return sourceSkills.sort((leftSkill, rightSkill) => {
    return leftSkill.installedSkillName.localeCompare(rightSkill.installedSkillName);
  });
}

function assertNoNameCollisions(sourceSkills: SourceSkill[]): void {
  const seenSkillNames = new Set<string>();

  for (const sourceSkill of sourceSkills) {
    if (seenSkillNames.has(sourceSkill.installedSkillName)) {
      throw new Error(
        `Could not install skills because multiple source skill folders normalize to \`${sourceSkill.installedSkillName}\`.`,
      );
    }

    seenSkillNames.add(sourceSkill.installedSkillName);
  }
}
