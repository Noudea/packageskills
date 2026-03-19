export function normalizePackageSlug(packageName: string): string {
  const packageSegments = packageName.replace(/^@/, "").split("/");

  const normalizedSegments = packageSegments.map((packageSegment) => {
    return normalizeNameSegment(packageSegment, "package name");
  });

  return normalizedSegments.join("-");
}

export function normalizeSkillSlug(skillName: string): string {
  return normalizeNameSegment(skillName, "skill name");
}

function normalizeNameSegment(input: string, label: string): string {
  const normalizedValue = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedValue.length === 0) {
    throw new Error(`Could not normalize ${label} \`${input}\` into a valid installed name.`);
  }

  return normalizedValue;
}
