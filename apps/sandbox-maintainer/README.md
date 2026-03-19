# Sandbox Maintainer

Manual maintainer-side test package for `packageskills` and `@packageskills/runtime`.

Quick flow:

1. `pnpm exec packageskills init`
2. In this monorepo sandbox, keep `@packageskills/runtime` on `workspace:^`
3. `pnpm install`
4. `pnpm exec sandbox-skills install`
5. Inspect `.claude/skills`, `.opencode/skills`, and `.codex/skills`
6. `pnpm exec sandbox-skills remove`
