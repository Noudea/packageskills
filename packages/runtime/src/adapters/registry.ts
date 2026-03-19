import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";
import { opencodeAdapter } from "./opencode.js";
import type { AgentAdapter } from "./types.js";

export const agentAdapters: AgentAdapter[] = [claudeAdapter, opencodeAdapter, codexAdapter];
