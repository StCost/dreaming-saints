import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import GitHubEditButton from "../components/GitHubEditButton";
import ShareButton from "../components/ShareButton";
import config from "../config";
import { usePostByFilename } from "../helpers/usePosts";
import { PostParams } from "../types";

// replace <img> tags with ![]()
// why: GitHub .md editor allows to CTRL+V paste images, they uploaded to GitHub and returned as <img> tags. replaced to basic markdown syntax to display on our site
const replaceImageTags = (content: string) =>
  content.replace(
    /<img[^>]*src="([^"]+)"[^>]*>/gi,
    (_, src) => `![${src}](${src})`,
  );

// match standalone YouTube URLs (whole line) and replace with embed HTML
const YOUTUBE_WATCH = /^(https:\/\/(?:www\.)?youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})$/m;
const YOUTUBE_SHORT = /^(https:\/\/youtu\.be\/)([A-Za-z0-9_-]{11})$/m;

const embedYouTube = (line: string): string => {
  let videoId: string | null = null;
  const watchMatch = line.match(YOUTUBE_WATCH);
  const shortMatch = line.match(YOUTUBE_SHORT);
  if (watchMatch) videoId = watchMatch[2];
  else if (shortMatch) videoId = shortMatch[2];
  if (!videoId) return line;
  return `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
};

const replaceYouTubeUrls = (content: string) =>
  content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      return trimmed && (YOUTUBE_WATCH.test(trimmed) || YOUTUBE_SHORT.test(trimmed))
        ? embedYouTube(trimmed)
        : line;
    })
    .join("\n");

const BlogPost = () => {
  const { filename } = useParams<PostParams>();
  const {
    content,
    title: postTitle,
    loading,
    error,
  } = usePostByFilename(filename);

  if (loading) {
    return (
      <>
        <Link to="/" className="back-link">
          {config.ui.backToPosts}
        </Link>
        <article className="post-content">
          <div className="loading">{config.ui.loadingPost}</div>
        </article>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Link to="/" className="back-link">
          {config.ui.backToPosts}
        </Link>
        <div className="error">Error: {error}</div>
      </>
    );
  }

  return (
    <>
      <Link to="/" className="back-link">
        {config.ui.backToPosts}
      </Link>
      <article className="post-content">
        <small className="post-filename">
          <GitHubEditButton filename={`${filename}.md`} />
        </small>
        <ReactMarkdown rehypePlugins={[rehypeRaw as never]}>
          {replaceYouTubeUrls(replaceImageTags(content))}
        </ReactMarkdown>
        <div className="post-actions">
          <ShareButton title={postTitle} url={window.location.href} />
        </div>
      </article>
    </>
  );
};

export default BlogPost;
