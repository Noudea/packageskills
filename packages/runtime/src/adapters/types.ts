import type { SourceSkill } from "../skill-discovery.js";

export interface OwnedPath {
  displayPath: string;
  path: string;
}

export interface InstallTarget {
  displayPath: string;
  installedSkillName: string;
  skillFilePath: string;
  sourceDirectoryPath: string;
  targetDirectoryPath: string;
}

export interface AgentAdapterContext {
  packageSlug: string;
  sourceSkills?: SourceSkill[];
  targetProjectPath: string;
}

export interface AgentAdapter {
  configFolderName: string;
  id: string;
  listInstallTargets?: (context: AgentAdapterContext) => InstallTarget[];
  listOwnedPaths?: (context: AgentAdapterContext) => Promise<OwnedPath[]>;
  packageContainerMode: "none" | "package-slug";
  skillsPathSegments: string[];
}
