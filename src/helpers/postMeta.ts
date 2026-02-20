/**
 * Shared logic for extracting metadata from post content (markdown/HTML).
 * Used by: build script (generate-pages.js) for list/preview, and usePosts for consistency.
 * Edit here to change how we detect images and excerpt text.
 */

/**
 * Derive a display title from post filename (e.g. "013-new-post.md" → "13 New post").
 */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.md$/i, "").trim();
  const match = base.match(/^(\d+)-(.*)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const slug = match[2].replace(/-/g, " ").trim();
    const text = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "";
    return text ? `${num} ${text}` : String(num);
  }
  const fallback = base.replace(/-/g, " ").trim();
  return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : base;
}

/**
 * Extract first image URL from post content.
 * Supports: markdown ![alt](url), HTML <img ... src="url" ...>
 */
export function extractFirstImageUrl(content: string): string | null {
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1].trim();
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1].trim();
  return null;
}

/**
 * True if the line is only an image (markdown or HTML img).
 * Used to skip image lines when picking the first text paragraph for excerpt.
 */
export function isImageLine(line: string): boolean {
  const t = line.trim();
  return /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(t) || /<img[^>]+src=/.test(t);
}
