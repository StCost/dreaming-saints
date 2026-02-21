import { Link, useSearchParams } from "react-router-dom";
import config from "../config";
import NewPostButton from "../components/NewPostButton";
import { useBlogListPage } from "../helpers/usePosts";

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const { posts, totalPages, loading, error } = useBlogListPage(page);

  const effectivePage = Math.min(page, totalPages || 1);
  const hasPagination = totalPages > 1;

  const setPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setSearchParams(next === 1 ? {} : { page: String(next) });
  };

  return (
    <>
      <header className="header">
        <h1>{config.site.title}</h1>
        {config.site.tagline && <p>{config.site.tagline}</p>}
      </header>

      <main>
        {error && <div className="loading">{error}</div>}
        {!error && loading && (
          <div className="loading">{config.ui.loadingPosts}</div>
        )}
        {!error && !loading && posts.length === 0 && (
          <div className="loading">{config.ui.noPosts}</div>
        )}
        {!error && !loading && posts.length > 0 && (
          <>
            <ul className="post-list">
              {posts.map((post) => (
                <Link
                  key={post.filename}
                  to={`/${post.filename.replace(".md", "")}`}
                  className="post-link"
                >
                  <li className="post-item">
                    <small className="post-filename">{post.filename}</small>
                    <h2 className="post-title">{post.title}</h2>
                    {post.previewImage && (
                      <div className="post-preview-image-wrap">
                        <img
                          src={post.previewImage}
                          alt=""
                          className="post-preview-image"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {post.previewYouTubeId && (
                      <div className="youtube-embed">
                        <iframe
                          src={`https://www.youtube.com/embed/${post.previewYouTubeId}`}
                          title="YouTube video"
                          width="560"
                          height="315"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {post.excerpt && (
                      <p className="post-excerpt">{post.excerpt}</p>
                    )}
                  </li>
                </Link>
              ))}
            </ul>

            {hasPagination && (
              <nav className="pagination" aria-label="Posts pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Previous page"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {effectivePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}

        <div className="new-post-section">
          <NewPostButton />
        </div>
      </main>
    </>
  );
};

export default BlogList;
