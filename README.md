# packageskills

`packageskills` helps package maintainers ship agent skills alongside their npm package.

It has two parts:

- `packageskills`: maintainer CLI that scaffolds package-owned skill files and updates `package.json`
- `@packageskills/runtime`: tiny runtime used by the generated companion command in the published package

## What it does

`packageskills init` adds a `packageskills/` source folder to a package, generates a companion command like `<primary-command>-skills`, and patches the package so the runtime is available to end users.

End users then run the generated command from their project:

```bash
<primary-command>-skills install
<primary-command>-skills remove
```

The runtime currently installs package-owned skills into:

- `.claude/skills/<package-skill>/...`
- `.opencode/skills/<package>/<package-skill>/...`
- `.codex/skills/<package>/<package-skill>/...`

## Maintainer flow

Typical flow for a package maintainer:

```bash
pnpm add -D packageskills
pnpm exec packageskills init
pnpm install
```

Then maintain skills in:

```text
packageskills/<skill-name>/SKILL.md
```

`init` is rerunnable. It preserves maintainer-owned source skills, reconciles `package.json`, and refreshes package-owned generated files when safe.

## Current v1 behavior

- generates a companion command named `<primary-command>-skills`
- adds `@packageskills/runtime` to `dependencies`
- keeps an existing main CLI and adds a companion bin instead of replacing it
- copies full skill bundle folders, not just `SKILL.md`
- rewrites copied `SKILL.md` frontmatter `name:` to the installed folder name
- overwrites package-owned installed skills on rerun
- removes only package-owned installed skills
- uses `process.cwd()` directly; no monorepo-aware target discovery in v1
- no `postinstall` behavior

## Repo layout

```text
packages/packageskills maintainer CLI package
packages/runtime       runtime used by generated package commands
packages/tests         Vitest integration coverage
packages/fixtures      fixture projects for CLI/runtime tests
apps/sandbox-maintainer
apps/sandbox-consumer
```

## Local development

Use pnpm 10:

```bash
pnpm install
pnpm lint
pnpm test
```

## Community

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `LICENSE`

## Sandbox demo

This repo includes two local demo apps:

- `apps/sandbox-maintainer`: maintainer-side package scaffolded with `packageskills`
- `apps/sandbox-consumer`: consumer-side project that runs the generated `sandbox-skills` command

Try the full flow:

```bash
pnpm install
cd apps/sandbox-consumer
pnpm exec sandbox-skills install
pnpm exec sandbox-skills remove
```

That will create and remove package-owned skills in `.claude/`, `.opencode/`, and `.codex/` inside `apps/sandbox-consumer`.
