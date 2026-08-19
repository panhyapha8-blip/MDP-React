// src/components/PostGallery.jsx
//
// Displays user-created posts as flip cards on the dedicated
// "Create Perspective" management page. Includes edit/delete
// controls plus like and comment features (generic engagement API).

import { useEffect, useState, useCallback } from "react";
import LikeButton from "../components/LikeButton";
import CommentsModal from "../components/CommentsModal";
import { useAuthContext } from "../context/AuthContext";
import "../components/PostGallery.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PAGE_SIZE = 8;

export default function PostGallery({ search = "", refreshTrigger, onEditPost }) {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ត្រឡប់ទៅទំព័រ ១ រាល់ពេល search ប្តូរ
  useEffect(() => {
    setPage(1);
  }, [search]);

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
      if (!res.ok) throw new Error("Failed Posting");
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
    const confirmed = window.confirm(`Do you certainly delete ${post.author_name}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed Deleting");
    }
  };

  return (
    <div className="post-gallery-wrap">
      {loading && (
        <div className="alert alert-secondary" role="status">
          Storing...
        </div>
      )}
      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="alert alert-info" role="status">
          {search ? `គ្មាន Post ដែលត្រូវនឹង "${search}" ទេ` : "No Post!"}
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="post-gallery-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onEdit={onEditPost} onDelete={handleDelete} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="post-gallery-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← មុន
              </button>
              <span>
                ទំព័រ {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                បន្ទាប់ →
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

  const isOwner = !!(user?.email && post.owner_email && user.email === post.owner_email);

  return (
    <div
      className={`post-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="post-card-inner">
        <div className="post-card-front">
          <img src={imageUrl} alt={post.author_name} />
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
              Update
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