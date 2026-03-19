import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import {
  createFixtureCopy,
  getExpectedRuntimeDependencyVersion,
  runPackageskillsCli,
} from "../support/test-project.js";

const javascriptInitTestName = "init scaffolds files for a JavaScript package";

test(javascriptInitTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/javascript-basic", {
    testName: javascriptInitTestName,
  });

  try {
    const expectedRuntimeDependencyVersion = await getExpectedRuntimeDependencyVersion();
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Scaffolded packageskills files for a javascript package\./);
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);
    expect(stdout).toMatch(/Next step: run `npm install` to install `@packageskills\/runtime`\./);

    const binFilePath = resolve(projectPath, "bin", "packageskills.js");
    const skillFilePath = resolve(projectPath, "packageskills", "getting-started", "SKILL.md");
    const packageJson = await readProjectPackageJson(projectPath);
    const binSource = await readFile(binFilePath, "utf8");
    const skillSource = await readFile(skillFilePath, "utf8");
    const binStats = await stat(binFilePath);

    expect(packageJson.bin).toEqual({
      "demo-cli-skills": "./bin/packageskills.js",
    });
    expect(packageJson.dependencies).toEqual({
      "@packageskills/runtime": expectedRuntimeDependencyVersion,
    });
    expect(packageJson.files).toEqual(["bin", "packageskills"]);
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
    const expectedRuntimeDependencyVersion = await getExpectedRuntimeDependencyVersion();
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Scaffolded packageskills files for a typescript package\./);
    expect(stdout).toMatch(/Generated command: toolkit-skills/);
    expect(stdout).toMatch(/Next step: run `pnpm install` to install `@packageskills\/runtime`\./);

    const wrapperFilePath = resolve(projectPath, "bin", "packageskills.js");
    const sourceFilePath = resolve(projectPath, "src", "bin", "packageskills.ts");
    const packageJson = await readProjectPackageJson(projectPath);
    const wrapperSource = await readFile(wrapperFilePath, "utf8");
    const sourceFile = await readFile(sourceFilePath, "utf8");

    expect(packageJson.bin).toEqual({
      toolkit: "./bin/toolkit.js",
      "toolkit-skills": "./bin/packageskills.js",
    });
    expect(packageJson.dependencies).toEqual({
      "@packageskills/runtime": expectedRuntimeDependencyVersion,
    });
    expect(packageJson.files).toEqual(["dist", "bin", "packageskills"]);
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
    const beforePackageJsonSource = await readFile(resolve(projectPath, "package.json"), "utf8");
    const beforeSource = await readFile(existingSkillFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const afterSource = await readFile(existingSkillFilePath, "utf8");

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe("`packageskills/` already exists. Skipping init.\n");
    expect(await readFile(resolve(projectPath, "package.json"), "utf8")).toBe(
      beforePackageJsonSource,
    );
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
    const expectedRuntimeDependencyVersion = await getExpectedRuntimeDependencyVersion();
    const existingBinFilePath = resolve(projectPath, "bin", "custom.js");
    const existingBinSource = await readFile(existingBinFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const packageJson = await readProjectPackageJson(projectPath);
    const generatedBinSource = await readFile(
      resolve(projectPath, "bin", "packageskills.js"),
      "utf8",
    );

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);
    expect(packageJson.bin).toEqual({
      "demo-cli-skills": "./bin/packageskills.js",
    });
    expect(packageJson.dependencies).toEqual({
      "@packageskills/runtime": expectedRuntimeDependencyVersion,
    });
    expect(packageJson.files).toEqual(["bin", "packageskills"]);
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
    const beforePackageJsonSource = await readFile(resolve(projectPath, "package.json"), "utf8");
    const beforeSource = await readFile(existingBinFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe("Could not scaffold `bin/packageskills.js` because it already exists.\n");
    expect(await readFile(resolve(projectPath, "package.json"), "utf8")).toBe(
      beforePackageJsonSource,
    );
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
    const beforePackageJsonSource = await readFile(resolve(projectPath, "package.json"), "utf8");
    const beforeBinSource = await readFile(existingBinFilePath, "utf8");
    const beforeSkillSource = await readFile(existingSkillFilePath, "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toBe("`packageskills/` already exists. Skipping init.\n");
    expect(await readFile(resolve(projectPath, "package.json"), "utf8")).toBe(
      beforePackageJsonSource,
    );
    expect(await readFile(existingBinFilePath, "utf8")).toBe(beforeBinSource);
    expect(await readFile(existingSkillFilePath, "utf8")).toBe(beforeSkillSource);
    await expect(access(resolve(projectPath, "bin", "packageskills.js"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await cleanup();
  }
});

const stringBinAndRuntimeTestName =
  "init preserves a string bin, existing runtime dependency, and existing files entries";

test(stringBinAndRuntimeTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/string-bin-with-runtime", {
    testName: stringBinAndRuntimeTestName,
  });

  try {
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const packageJson = await readProjectPackageJson(projectPath);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);
    expect(stdout).not.toMatch(/Next step: run `/);
    expect(packageJson.bin).toEqual({
      "demo-cli": "./bin/demo.js",
      "demo-cli-skills": "./bin/packageskills.js",
    });
    expect(packageJson.dependencies).toEqual({
      "@packageskills/runtime": "^9.9.9",
      chalk: "^5.4.0",
    });
    expect(packageJson.files).toEqual(["README.md", "bin", "packageskills"]);
  } finally {
    await cleanup();
  }
});

const runtimeDevDependencyTestName =
  "init promotes a runtime devDependency into dependencies when needed";

test(runtimeDevDependencyTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/runtime-devdependency", {
    testName: runtimeDevDependencyTestName,
  });

  try {
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });
    const packageJson = await readProjectPackageJson(projectPath);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toMatch(/Generated command: demo-cli-skills/);
    expect(stdout).toMatch(/Next step: run `npm install` to install `@packageskills\/runtime`\./);
    expect(packageJson.dependencies).toEqual({
      "@packageskills/runtime": "^1.2.3",
    });
    expect(packageJson.devDependencies).toEqual({
      "@packageskills/runtime": "^1.2.3",
    });
    expect(packageJson.files).toEqual(["bin", "packageskills"]);
  } finally {
    await cleanup();
  }
});

const conflictingGeneratedBinEntryTestName =
  "init fails when package.json already declares a conflicting generated companion bin";

test(conflictingGeneratedBinEntryTestName, async () => {
  const { cleanup, projectPath } = await createFixtureCopy("init/conflicting-generated-bin-entry", {
    testName: conflictingGeneratedBinEntryTestName,
  });

  try {
    const beforePackageJsonSource = await readFile(resolve(projectPath, "package.json"), "utf8");
    const { exitCode, stderr, stdout } = await runPackageskillsCli({
      args: ["init"],
      cwd: projectPath,
    });

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toBe(
      "Could not add the generated bin because `toolkit-skills` already points to `./bin/custom-skills.js`.\n",
    );
    expect(await readFile(resolve(projectPath, "package.json"), "utf8")).toBe(
      beforePackageJsonSource,
    );
    await expect(access(resolve(projectPath, "packageskills"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  } finally {
    await cleanup();
  }
});

async function readProjectPackageJson(projectPath: string): Promise<{
  bin?: unknown;
  dependencies?: unknown;
  devDependencies?: unknown;
  files?: unknown;
}> {
  const packageJsonSource = await readFile(resolve(projectPath, "package.json"), "utf8");

  return JSON.parse(packageJsonSource) as {
    bin?: unknown;
    dependencies?: unknown;
    devDependencies?: unknown;
    files?: unknown;
  };
}
