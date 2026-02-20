import { useEffect, useRef, useState } from "react";
import config from "../config";
import { BlogPostListItem } from "../types";
import { titleFromFilename } from "./postMeta";

const postFiles = import.meta.glob("../posts/*.md", { as: "raw" });
// In dev, public is at root; in prod, use base (e.g. /blog/)
const PAGES_BASE =
  import.meta.env.DEV ? "" : (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const pagesUrl = (path: string) => `${PAGES_BASE}/pages/${path}`;

type PagesMeta = { totalPages: number; postsPerPage: number };

export function useBlogListPage(page: number): {
  posts: BlogPostListItem[];
  totalPages: number;
  loading: boolean;
  error: string | null;
} {
  const [meta, setMeta] = useState<PagesMeta | null>(null);
  const [pageData, setPageData] = useState<{
    page: number;
    posts: BlogPostListItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const metaFetched = useRef(false);

  // Fetch meta once
  useEffect(() => {
    if (metaFetched.current) return;
    metaFetched.current = true;
    fetch(pagesUrl("meta.json"))
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load pages meta");
        return r.json();
      })
      .then(setMeta)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setMeta({ totalPages: 0, postsPerPage: 10 });
      });
  }, []);

  // Fetch current page when meta is ready
  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    setError(null);
    const safePage = Math.max(
      1,
      Math.min(page, meta.totalPages || 1),
    );
    if (meta.totalPages === 0) {
      setPageData({ page: 1, posts: [] });
      setLoading(false);
      return;
    }
    fetch(pagesUrl(`${safePage}.json`))
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load page");
        return r.json();
      })
      .then((data) => {
        setPageData({ page: data.page, posts: data.posts || [] });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load page");
        setPageData({ page: safePage, posts: [] });
      })
      .finally(() => setLoading(false));
  }, [meta, page]);

  const totalPages = meta?.totalPages ?? 0;
  const posts = pageData?.page === page ? pageData.posts : [];

  return {
    posts,
    totalPages: totalPages || 1,
    loading,
    error,
  };
}

const usePostByFilename = (filename: string | undefined) => {
  const [content, setContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const postPath = Object.keys(postFiles).find((path) =>
          path.includes(`${filename}.md`),
        );

        if (!postPath) {
          throw new Error(config.ui.postNotFound);
        }

        const content = await postFiles[postPath]();
        setContent(content);

        // Extract title from first # heading, or from filename (e.g. 013-new-post.md → "13 New post")
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : titleFromFilename(`${filename}.md`);
        setPostTitle(title);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (filename) {
      loadPost();
    }
  }, [filename]);

  return { content, title: postTitle, loading, error };
};

export { usePostByFilename };
