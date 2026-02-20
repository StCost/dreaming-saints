/**
 * Build-time script: scans src/posts/*.md, extracts metadata,
 * and writes public/pages/meta.json + public/pages/1.json, 2.json, ...
 * Run on build and on dev server start (and when posts change).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractFirstImageUrl, isImageLine, titleFromFilename } from "../src/helpers/postMeta";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "src", "posts");
const outDir = path.join(root, "public", "pages");

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
  const excerpt = firstParagraph
    ? firstParagraph.trim().substring(0, excerptLength).replace(/\*\*/g, "") + "..."
    : undefined;
  const previewImage = extractFirstImageUrl(content);
  return { title, ...(excerpt && { excerpt }), ...(previewImage && { previewImage }) };
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
    const { title, excerpt, previewImage } = extractMeta(content, excerptLength, filename);
    return { filename, title, ...(excerpt && { excerpt }), ...(previewImage && { previewImage }) };
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
