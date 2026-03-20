# Sandbox Maintainer

Manual maintainer-side test package for `packageskills` and `@packageskills/runtime`.

This app intentionally starts without generated skill files so you can try the maintainer flow from `packageskills init`.

Full flow:

1. `pnpm exec packageskills init`
2. Go back to the repo root and run `pnpm install`
3. Move to `apps/sandbox-consumer`
4. `pnpm exec sandbox-skills install`
5. Inspect `.claude/skills`, `.opencode/skills`, and `.codex/skills`
6. `pnpm exec sandbox-skills remove`
