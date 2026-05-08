/**
 * Mention parser utility — FR-06
 * Extracts @username mentions from comment text.
 * Username pattern: alphanumeric + dots + underscores + hyphens, 1-50 chars.
 */

const MENTION_REGEX = /@([a-zA-Z0-9._-]{1,50})\b/g;

/**
 * Extract unique mentioned names from text
 */
export function extractMentions(text: string): string[] {
  const matches = text.matchAll(MENTION_REGEX);
  const names = new Set<string>();
  for (const match of matches) {
    names.add(match[1]);
  }
  return Array.from(names);
}
