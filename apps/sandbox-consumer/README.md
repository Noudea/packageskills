# Sandbox Consumer

Consumer app for testing the generated `sandbox-skills` command from `apps/sandbox-maintainer`.

Full flow:

1. Go to `apps/sandbox-maintainer`
2. `pnpm exec packageskills init`
3. Go back to the repo root and run `pnpm install`
4. Return to `apps/sandbox-consumer`
5. `pnpm exec sandbox-skills install`
6. Inspect `.claude/skills`, `.opencode/skills`, and `.codex/skills`
7. `pnpm exec sandbox-skills remove`
