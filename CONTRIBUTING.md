# Contributing

Thanks for contributing to `packageskills`.

## Development setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run the main checks:

   ```bash
   pnpm lint
   pnpm test
   ```

3. Use the local demo apps when you want to exercise the full maintainer-to-consumer flow:
   - `apps/sandbox-maintainer`
   - `apps/sandbox-consumer`

## Project layout

- `packages/packageskills`: maintainer CLI
- `packages/runtime`: tiny runtime used by generated companion commands
- `packages/tests`: Vitest integration coverage
- `packages/fixtures`: fixture projects for CLI and runtime tests

## Pull requests

- Keep changes focused and atomic.
- Add or update tests when behavior changes.
- Run `pnpm lint` and `pnpm test` before opening a pull request.
- Update docs when user-facing behavior or repo workflows change.

## Reporting bugs and proposing changes

- For bugs, include reproduction steps, expected behavior, and actual behavior.
- For features, explain the user problem first, then the proposed API or workflow.
- For security issues, follow `SECURITY.md` instead of opening a public issue.
