const frontmatterPattern = /^---\n([\s\S]*?)\n---(\n|$)/;

export function rewriteInstalledSkillName(skillSource: string, installedSkillName: string): string {
  const frontmatterMatch = skillSource.match(frontmatterPattern);

  if (frontmatterMatch === null) {
    return `---\nname: ${installedSkillName}\n---\n\n${skillSource}`;
  }

  const frontmatterLines = frontmatterMatch[1]
    .split("\n")
    .filter((line) => !line.startsWith("name:"));
  const frontmatterSuffix = frontmatterMatch[2].length > 0 ? frontmatterMatch[2] : "\n";
  const updatedFrontmatter = [`name: ${installedSkillName}`, ...frontmatterLines].join("\n");
  const skillBody = skillSource.slice(frontmatterMatch[0].length);

  return `---\n${updatedFrontmatter}\n---${frontmatterSuffix}${skillBody}`;
}
