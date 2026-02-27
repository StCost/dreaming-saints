import { Config } from "./types";

/**
 * NOTE: also visit index.html to configure meta tags
 */

export const config: Config = {
  site: {
    title: "👼 Dreaming Saints 👼",
    tagline:
      "Developing 🚕 COLLAPSE MACHINE 💥, a co-op FPS open world dream-game",
  },

  ui: {
    loadingPosts: "Loading blessed posts...",
    loadingPost: "Loading post...",
    postNotFound: "Post not found",
    noPosts: "No posts found",
    backToPosts: "← Back to posts",
  },

  blog: {
    postsDirectory: "../posts",
    excerptLength: 100,
    postsPerPage: 10, // 0 or omit to show all
  },
};

export default config;
