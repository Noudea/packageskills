import type { AgentAdapter } from "./types.js";

export const opencodeAdapter: AgentAdapter = {
  configFolderName: ".opencode",
  id: "opencode",
  packageContainerMode: "package-slug",
  skillsPathSegments: ["skills"],
};
