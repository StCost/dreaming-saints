export interface BlogPost {
  filename: string;
  title: string;
  excerpt: string;
  content: string;
  date?: string;
  author?: string;
}

export interface BlogPostMeta {
  title: string;
  excerpt: string;
}

/** Post list item (no content); from generated pages/N.json */
export interface BlogPostListItem {
  filename: string;
  title: string;
  excerpt: string;
}

export interface SiteConfig {
  title: string;
  tagline: string;
}

export interface UIConfig {
  loadingPosts: string;
  loadingPost: string;
  postNotFound: string;
  noPosts: string;
  backToPosts: string;
  defaultTitle: string;
  defaultExcerpt: string;
}

export interface BlogConfig {
  postsDirectory: string;
  excerptLength: number;
  /** Max posts per page; 0 or undefined = show all (no pagination) */
  postsPerPage?: number;
}

export interface Config {
  site: SiteConfig;
  ui: UIConfig;
  blog: BlogConfig;
}

export interface PostParams extends Record<string, string | undefined> {
  filename?: string;
}
