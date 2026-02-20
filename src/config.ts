import { Config } from "./types";

/**
 * NOTE: also visit index.html to configure meta tags
 */

export const config: Config = {
  site: {
    title: "🎊 COLLAPSE MACHINE 🚘",
    tagline:
      "✨ Dreaming Saints 👼 studio, developing my co-op FPS open world dream-game",
  },

  ui: {
    loadingPosts: "Loading blessed posts...",
    loadingPost: "Loading post...",
    postNotFound: "Post not found",
    noPosts: "No posts found. Add some .md files to public/posts/ directory!",
    backToPosts: "← Back to posts",
    defaultTitle: "Untitled Post",
  },

  blog: {
    postsDirectory: "../posts",
    excerptLength: 100,
    postsPerPage: 10, // 0 or omit to show all
  },
};

export default config;
