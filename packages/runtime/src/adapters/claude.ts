import type { AgentAdapter } from "./types.js";

export const claudeAdapter: AgentAdapter = {
  configFolderName: ".claude",
  id: "claude",
  packageContainerMode: "none",
  skillsPathSegments: ["skills"],
};
