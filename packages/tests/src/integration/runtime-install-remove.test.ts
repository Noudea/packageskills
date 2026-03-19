import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { createFixtureCopy, runPackageskillsRuntime } from "../support/test-project.js";

const installRuntimeSkillsTestName =
  "runtime install copies skill bundles into all supported agent layouts";

test(installRuntimeSkillsTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("runtime-install-remove/basic", {
    testName: installRuntimeSkillsTestName,
  });
  const packagePath = resolve(projectPath, "package");
  const targetPath = resolve(projectPath, "target");

  try {
    const { exitCode, stderr, stdout } = await runPackageskillsRuntime({
      args: ["install"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("Installed package-owned skills for @acme/demo-cli.");
    expect(stdout).toContain(".claude/skills/acme-demo-cli-review");
    expect(stdout).toContain(".opencode/skills/acme-demo-cli/acme-demo-cli-audit");
    expect(stdout).toContain(".codex/skills/acme-demo-cli/acme-demo-cli-review");

    expect(
      await readFile(resolve(targetPath, ".claude/skills/acme-demo-cli-review/SKILL.md"), "utf8"),
    ).toContain("name: acme-demo-cli-review");
    expect(
      await readFile(
        resolve(targetPath, ".claude/skills/acme-demo-cli-review/checklist.txt"),
        "utf8",
      ),
    ).toBe("Follow the review checklist.\n");
    expect(
      await readFile(
        resolve(targetPath, ".opencode/skills/acme-demo-cli/acme-demo-cli-audit/SKILL.md"),
        "utf8",
      ),
    ).toContain("name: acme-demo-cli-audit");
    expect(
      await readFile(
        resolve(targetPath, ".codex/skills/acme-demo-cli/acme-demo-cli-audit/docs/guide.md"),
        "utf8",
      ),
    ).toBe("# Audit Guide\n");

    await expect(
      access(resolve(targetPath, ".claude/skills/acme-demo-cli-stale")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(resolve(targetPath, ".opencode/skills/acme-demo-cli/acme-demo-cli-stale")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(resolve(targetPath, ".codex/skills/acme-demo-cli/acme-demo-cli-stale")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });

    expect(
      await readFile(resolve(targetPath, ".claude/skills/foreign-skill/SKILL.md"), "utf8"),
    ).toContain("name: foreign-skill");
    expect(
      await readFile(resolve(targetPath, ".opencode/skills/acme-demo-cli/keep.txt"), "utf8"),
    ).toBe("keep me\n");
    expect(
      await readFile(
        resolve(targetPath, ".codex/skills/foreign-package/foreign-skill/SKILL.md"),
        "utf8",
      ),
    ).toContain("name: foreign-skill");
  } finally {
    await cleanup();
  }
});

const removeRuntimeSkillsTestName =
  "runtime remove deletes only owned installs and stays idempotent";

test(removeRuntimeSkillsTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("runtime-install-remove/basic", {
    testName: removeRuntimeSkillsTestName,
  });
  const packagePath = resolve(projectPath, "package");
  const targetPath = resolve(projectPath, "target");

  try {
    await runPackageskillsRuntime({
      args: ["install"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    const firstRemove = await runPackageskillsRuntime({
      args: ["remove"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(firstRemove.exitCode).toBe(0);
    expect(firstRemove.stderr).toBe("");
    expect(firstRemove.stdout).toContain("Removed package-owned skills for @acme/demo-cli.");

    await expect(
      access(resolve(targetPath, ".claude/skills/acme-demo-cli-review")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(resolve(targetPath, ".claude/skills/acme-demo-cli-audit")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(resolve(targetPath, ".opencode/skills/acme-demo-cli/acme-demo-cli-review")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(resolve(targetPath, ".codex/skills/acme-demo-cli/acme-demo-cli-audit")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });

    expect(
      await readFile(resolve(targetPath, ".claude/skills/foreign-skill/SKILL.md"), "utf8"),
    ).toContain("name: foreign-skill");
    expect(
      await readFile(resolve(targetPath, ".opencode/skills/acme-demo-cli/keep.txt"), "utf8"),
    ).toBe("keep me\n");
    expect(
      await readFile(
        resolve(targetPath, ".codex/skills/foreign-package/foreign-skill/SKILL.md"),
        "utf8",
      ),
    ).toContain("name: foreign-skill");

    const secondRemove = await runPackageskillsRuntime({
      args: ["remove"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(secondRemove.exitCode).toBe(0);
    expect(secondRemove.stderr).toBe("");
    expect(secondRemove.stdout).toBe(
      "No installed package-owned skills found for @acme/demo-cli.\n",
    );
  } finally {
    await cleanup();
  }
});

const missingSourceSkillsTestName =
  "runtime install fails when the installed package has no packageskills source folder";

test(missingSourceSkillsTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy(
    "runtime-install-remove/missing-source",
    {
      testName: missingSourceSkillsTestName,
    },
  );
  const packagePath = resolve(projectPath, "package");
  const targetPath = resolve(projectPath, "target");

  try {
    const installResult = await runPackageskillsRuntime({
      args: ["install"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(installResult.exitCode).toBe(1);
    expect(installResult.stdout).toBe("");
    expect(installResult.stderr).toBe(
      "Could not find `packageskills/` in the installed package.\n",
    );

    const removeResult = await runPackageskillsRuntime({
      args: ["remove"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(removeResult.exitCode).toBe(0);
    expect(removeResult.stderr).toBe("");
    expect(removeResult.stdout).toBe(
      "No installed package-owned skills found for @acme/demo-cli.\n",
    );
  } finally {
    await cleanup();
  }
});

const collidingSkillNamesTestName =
  "runtime install fails before writing when source skill names collide after normalization";

test(collidingSkillNamesTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("runtime-install-remove/collision", {
    testName: collidingSkillNamesTestName,
  });
  const packagePath = resolve(projectPath, "package");
  const targetPath = resolve(projectPath, "target");

  try {
    const installResult = await runPackageskillsRuntime({
      args: ["install"],
      cwd: targetPath,
      packageName: "@acme/demo-cli",
      scriptFilePath: resolve(packagePath, "bin", "packageskills.js"),
    });

    expect(installResult.exitCode).toBe(1);
    expect(installResult.stdout).toBe("");
    expect(installResult.stderr).toBe(
      "Could not install skills because multiple source skill folders normalize to `acme-demo-cli-review-tool`.\n",
    );
    await expect(access(resolve(targetPath, ".claude"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(resolve(targetPath, ".opencode"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(access(resolve(targetPath, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await cleanup();
  }
});
