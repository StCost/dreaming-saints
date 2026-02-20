/**
 * Shared logic for extracting metadata from post content (markdown/HTML).
 * Used by: build script (generate-pages.js) for list/preview, and usePosts for consistency.
 * Edit here to change how we detect images and excerpt text.
 */

/**
 * Extract first image URL from post content.
 * Supports: markdown ![alt](url), HTML <img ... src="url" ...>
 * @param {string} content - Raw post body
 * @returns {string|null} First image URL or null
 */
export function extractFirstImageUrl(content) {
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1].trim();
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1].trim();
  return null;
}

/**
 * True if the line is only an image (markdown or HTML img).
 * Used to skip image lines when picking the first text paragraph for excerpt.
 * @param {string} line - Single line of content
 * @returns {boolean}
 */
export function isImageLine(line) {
  const t = line.trim();
  return /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(t) || /<img[^>]+src=/.test(t);
}
