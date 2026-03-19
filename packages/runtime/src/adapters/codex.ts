import type { AgentAdapter } from "./types.js";

export const codexAdapter: AgentAdapter = {
  configFolderName: ".codex",
  id: "codex",
  packageContainerMode: "package-slug",
  skillsPathSegments: ["skills"],
};
