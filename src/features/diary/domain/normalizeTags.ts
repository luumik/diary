export function normalizeTags(tags: readonly string[]): string[] {
  const normalizedTags: string[] = [];
  const seenTags = new Set<string>();

  for (const tag of tags) {
    const trimmedTag = tag.trim();
    const normalizedTag = trimmedTag.toLowerCase();

    if (trimmedTag.length === 0 || seenTags.has(normalizedTag)) {
      continue;
    }

    seenTags.add(normalizedTag);
    normalizedTags.push(trimmedTag);
  }

  return normalizedTags;
}
