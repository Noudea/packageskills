export interface RunPackageSkillsCliOptions {
  argv: string[];
  commandName: string;
  cwd: string;
  packageName: string;
  scriptFilePath?: string;
}

export async function runPackageSkillsCli(options: RunPackageSkillsCliOptions): Promise<void> {
  void options;

  throw new Error("`@packageskills/runtime` is scaffolded but not implemented yet.");
}
