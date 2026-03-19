import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { createFixtureCopy, runPackageskillsCli } from "../support/test-project.js";

const javascriptInitTestName = "init scaffolds files for a JavaScript package";

test(javascriptInitTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/javascript-basic", {
    testName: javascriptInitTestName,
  });

  try {
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Scaffolded packageskills files for a javascript package\./);
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);

    const binFilePath = resolve(projectPath, "bin", "packageskills.js");
    const skillFilePath = resolve(projectPath, "packageskills", "getting-started", "SKILL.md");
    const binSource = await readFile(binFilePath, "utf8");
    const skillSource = await readFile(skillFilePath, "utf8");
    const binStats = await stat(binFilePath);

    expect(binSource).toMatch(/\/\/ Generate by packageskills/);
    expect(binSource).toMatch(/commandName: "demo-cli-skills"/);
    expect(binSource).toMatch(/packageName: "@acme\/demo-cli"/);
    expect(skillSource).toMatch(/Help users get started with @acme\/demo-cli\./);
    expect(binStats.mode & 0o111).not.toBe(0);
  } finally {
    await cleanup();
  }
});

const typescriptInitTestName = "init scaffolds files for a TypeScript package";

test(typescriptInitTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/typescript-basic", {
    testName: typescriptInitTestName,
  });

  try {
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Scaffolded packageskills files for a typescript package\./);
    expect(stdout).toMatch(/Generated command: toolkit-skills/);

    const wrapperFilePath = resolve(projectPath, "bin", "packageskills.js");
    const sourceFilePath = resolve(projectPath, "src", "bin", "packageskills.ts");
    const wrapperSource = await readFile(wrapperFilePath, "utf8");
    const sourceFile = await readFile(sourceFilePath, "utf8");

    expect(wrapperSource).toMatch(/void import\("\.\.\/dist\/bin\/packageskills\.js"\)/);
    expect(sourceFile).toMatch(/commandName: "toolkit-skills"/);
    expect(sourceFile).toMatch(/packageName: "@acme\/toolkit"/);
  } finally {
    await cleanup();
  }
});

const existingPackageskillsTestName = "init does nothing when packageskills already exists";

test(existingPackageskillsTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/existing-packageskills", {
    testName: existingPackageskillsTestName,
  });

  try {
    const existingSkillFilePath = resolve(projectPath, "packageskills", "custom", "SKILL.md");
    const beforeSource = await readFile(existingSkillFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const afterSource = await readFile(existingSkillFilePath, "utf8");

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe("`packageskills/` already exists. Skipping init.\n");
    expect(afterSource).toBe(beforeSource);
    await expect(access(resolve(projectPath, "bin", "packageskills.js"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await cleanup();
  }
});

const existingBinDirectoryTestName = "init scaffolds into an existing bin directory";

test(existingBinDirectoryTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/existing-bin-folder", {
    testName: existingBinDirectoryTestName,
  });

  try {
    const existingBinFilePath = resolve(projectPath, "bin", "custom.js");
    const existingBinSource = await readFile(existingBinFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const generatedBinSource = await readFile(
      resolve(projectPath, "bin", "packageskills.js"),
      "utf8",
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);
    expect(await readFile(existingBinFilePath, "utf8")).toBe(existingBinSource);
    expect(generatedBinSource).toMatch(/commandName: "demo-cli-skills"/);
  } finally {
    await cleanup();
  }
});

const existingGeneratedBinTestName = "init fails when bin/packageskills.js already exists";

test(existingGeneratedBinTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/existing-generated-bin", {
    testName: existingGeneratedBinTestName,
  });

  try {
    const existingBinFilePath = resolve(projectPath, "bin", "packageskills.js");
    const beforeSource = await readFile(existingBinFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe("Could not scaffold `bin/packageskills.js` because it already exists.\n");
    expect(await readFile(existingBinFilePath, "utf8")).toBe(beforeSource);
  } finally {
    await cleanup();
  }
});

const existingPackageskillsAndBinTestName =
  "init skips when packageskills already exists even if bin already has files";

test(existingPackageskillsAndBinTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/existing-packageskills-and-bin", {
    testName: existingPackageskillsAndBinTestName,
  });

  try {
    const existingBinFilePath = resolve(projectPath, "bin", "custom.js");
    const existingSkillFilePath = resolve(projectPath, "packageskills", "custom", "SKILL.md");
    const beforeBinSource = await readFile(existingBinFilePath, "utf8");
    const beforeSkillSource = await readFile(existingSkillFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe("`packageskills/` already exists. Skipping init.\n");
    expect(await readFile(existingBinFilePath, "utf8")).toBe(beforeBinSource);
    expect(await readFile(existingSkillFilePath, "utf8")).toBe(beforeSkillSource);
    await expect(access(resolve(projectPath, "bin", "packageskills.js"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await cleanup();
  }
});
