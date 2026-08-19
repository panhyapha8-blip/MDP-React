// src/components/PostGallery.jsx
//
// Displays user-created posts as flip cards on the dedicated
// "Create Perspective" management page. Includes edit/delete
// controls plus like and comment features (generic engagement API).

import { useEffect, useState, useCallback } from "react";
import LikeButton from "./LikeButton";
import CommentsModal from "./CommentsModal";
import { useAuthContext } from "../context/AuthContext";
import "./PostGallery.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PAGE_SIZE = 8;

export default function PostGallery({ refreshTrigger, onEditPost }) {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search by 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    if (!user?.email) {
      setPosts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        owner_email: user.email,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);

      const res = await fetch(`${API_BASE}/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      const total = parseInt(res.headers.get("X-Total-Count") || String(data.length), 10);
      setPosts(data);
      setTotalPages(Math.max(Math.ceil(total / PAGE_SIZE), 1));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email, search, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  const handleDelete = async (post) => {
    const confirmed = window.confirm(`Delete "${post.author_name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  return (
    <div className="post-gallery-wrap">
      <div className="post-gallery-search">
        <span className="post-gallery-search-icon" aria-hidden="true">
          
        </span>
        <input
          type="text"
          placeholder="Search posts..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search posts"
        />
        {searchInput && (
          <button
            type="button"
            className="post-gallery-search-clear"
            onClick={() => setSearchInput("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <p className="gallery-status">
          <span className="gallery-status-icon">◌</span>
          Loading posts...
        </p>
      )}

      {!loading && error && (
        <p className="gallery-status gallery-error">
          <span className="gallery-status-icon">⚠</span>
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="gallery-status">
          <span className="gallery-status-icon">{search ? "⌕" : "◎"}</span>
          {search
            ? `No posts matching "${search}"`
            : "No posts yet. Create your first perspective!"}
        </p>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="post-gallery-grid">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={onEditPost}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="post-gallery-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostCard({ post, onEdit, onDelete }) {
  const { user } = useAuthContext();
  const [flipped, setFlipped] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const imageUrl = post.image_url?.startsWith("http")
    ? post.image_url
    : `${API_BASE}${post.image_url}`;

  const isOwner = !!(
    user?.email &&
    post.owner_email &&
    user.email === post.owner_email
  );

  return (
    <div
      className={`post-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Post by ${post.author_name}. Click to flip.`}
    >
      <div className="post-card-inner">
        <div className="post-card-front">
          <img src={imageUrl} alt={post.author_name} loading="lazy" />
          <span className="post-card-hint">Tap to flip</span>
          <div className="post-card-overlay">
            <h3>{post.author_name}</h3>
            <p className="post-slogan">"{post.slogan}"</p>
          </div>
        </div>

        <div className="post-card-back">
          <h3>{post.author_name}</h3>
          <p>{post.description}</p>

          <div className="post-card-actions">
            <LikeButton targetType="post" targetId={post.id} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCommentsOpen(true);
              }}
            >
              💬 Comment
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}
            >
              Edit
            </button>
            <button
              className="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(post);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <CommentsModal
        targetType="post"
        targetId={post.id}
        title={post.author_name}
        isOwner={isOwner}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}