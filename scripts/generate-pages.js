/**
 * Build-time script: scans src/posts/*.md, extracts metadata,
 * and writes public/pages/meta.json + public/pages/1.json, 2.json, ...
 * Run on build and on dev server start (and when posts change).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "src", "posts");
const outDir = path.join(root, "public", "pages");

function titleFromFilename(filename) {
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

function extractFirstImageUrl(content) {
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1].trim();
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1].trim();
  return null;
}

function isImageLine(line) {
  const t = line.trim();
  return /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(t) || /<img[^>]+src=/.test(t);
}

function readBlogConfig() {
  const configPath = path.join(root, "src", "config.ts");
  const content = fs.readFileSync(configPath, "utf-8");
  const postsPerPage = parseInt(
    (content.match(/postsPerPage:\s*(\d+)/) || [null, "10"])[1],
    10,
  );
  const excerptLength = parseInt(
    (content.match(/excerptLength:\s*(\d+)/) || [null, "100"])[1],
    10,
  );
  return { postsPerPage: postsPerPage || 10, excerptLength: excerptLength || 100 };
}

const YOUTUBE_WATCH = /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/;
const YOUTUBE_SHORT = /^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})$/;

function extractFirstYouTubeId(line) {
  const t = line.trim();
  const watch = t.match(YOUTUBE_WATCH);
  const short = t.match(YOUTUBE_SHORT);
  return watch ? watch[1] : short ? short[1] : null;
}

function extractMeta(content, excerptLength, filename) {
  const lines = content.split("\n");
  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine
    ? titleLine.replace("# ", "").trim()
    : titleFromFilename(filename || "");
  const afterTitle = lines.findIndex((line) => line.startsWith("# ")) + 1;
  const contentLines = lines.slice(afterTitle);
  const firstParagraph = contentLines.find(
    (line) =>
      line.trim() && !line.startsWith("#") && !isImageLine(line),
  );
  const previewYouTubeId = firstParagraph ? extractFirstYouTubeId(firstParagraph) : null;
  const excerpt =
    !previewYouTubeId && firstParagraph
      ? firstParagraph.trim().substring(0, excerptLength).replace(/\*\*/g, "") + "..."
      : undefined;
  const previewImage = extractFirstImageUrl(content);
  return {
    title,
    ...(excerpt && { excerpt }),
    ...(previewImage && { previewImage }),
    ...(previewYouTubeId && { previewYouTubeId }),
  };
}

export function generatePages() {
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "meta.json"),
      JSON.stringify({ totalPages: 0, postsPerPage: 10 }),
    );
    return;
  }

  const { postsPerPage, excerptLength } = readBlogConfig();
  const files = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => b.localeCompare(a)); // same order as frontend: newer first

  const allPosts = files.map((filename) => {
    const content = fs.readFileSync(
      path.join(postsDir, filename),
      "utf-8",
    );
    const { title, excerpt, previewImage, previewYouTubeId } = extractMeta(content, excerptLength, filename);
    return {
      filename,
      title,
      ...(excerpt && { excerpt }),
      ...(previewImage && { previewImage }),
      ...(previewYouTubeId && { previewYouTubeId }),
    };
  });

  const totalPages = Math.max(
    1,
    Math.ceil(allPosts.length / postsPerPage) || 1,
  );

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "meta.json"),
    JSON.stringify({ totalPages, postsPerPage }),
  );

  for (let p = 1; p <= totalPages; p++) {
    const start = (p - 1) * postsPerPage;
    const posts = allPosts.slice(start, start + postsPerPage);
    fs.writeFileSync(
      path.join(outDir, `${p}.json`),
      JSON.stringify({ page: p, posts }),
    );
  }
}

// Run when executed as script (e.g. node scripts/generate-pages.js)
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) generatePages();
