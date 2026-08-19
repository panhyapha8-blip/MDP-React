import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Border from "../components/Border";
import LikeButton from "../components/LikeButton";
import CommentsModal from "../components/CommentsModal";
import ShareModal from "../components/ShareModal";
import "./Perspective.css";
import seaVideo from "../assets/video/sea.mp4";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Perspective() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed Finding Post");
        setPost(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchPost();
  }, [id]);

  // Fallback image URL
  const imageUrl = post?.image_url?.startsWith("http")
    ? post?.image_url
    : post
    ? `${API_BASE}${post.image_url}`
    : "/uploads/default.png";

  return (
    <>
      <video autoPlay muted loop playsInline id="bg-video">
        <source src={seaVideo} type="video/mp4" />
      </video>

      <div className="perspective-page">
        <button
          className="perspective-back-btn"
          onClick={() => navigate("/messages")}
        >
          ← Back
        </button>

        {error && (
          <div className="post-not-found">
            {error === "Post is not found!"
              ? "Sorry, this post doesn’t exist. Showing placeholder instead."
              : error}
          </div>
        )}

        {post && (
          <>
            <div
              className="card-scene"
              style={{ margin: "0 auto", maxWidth: 340, cursor: "pointer" }}
              onClick={() => setFlipped((f) => !f)}
              role="button"
              aria-pressed={flipped}
            >
              <div className={`card-inner${flipped ? " flipped" : ""}`}>
                {/* Front */}
                <div className="card-front">
                  <img
                    src={imageUrl}
                    alt={post.author_name}
                    title={post.description}
                    loading="lazy"
                  />
                  <article>
                    <h3 style={{ marginTop: "2%", color: "#000000" }}>
                      {post.author_name}
                    </h3>
                    {post.slogan && (
                      <p className="p">
                        <q>{post.slogan}</q>
                      </p>
                    )}
                  </article>
                </div>

                {/* Back */}
                <div className="card-back">
                  <p
                    className="text-center"
                    style={{
                      WebkitTextStroke: "0px black",
                      textShadow: "0px 0px 0px #000000",
                      marginTop: "20%",
                      padding: "10px",
                    }}
                  >
                    {post.description}
                  </p>

                  <Border />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 20,
                      paddingBottom: 14,
                      color: "#1a1a1a",
                    }}
                  >
                    <LikeButton targetType="scientist" targetId={post.id} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentsOpen(true);
                      }}
                      aria-label="Open comments"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        color: "#1a1a1a",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      💬 Comment
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareOpen(true);
                      }}
                      aria-label="Open share modal"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        color: "#1a1a1a",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      🔗 Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <CommentsModal
              targetType="scientist"
              targetId={post.id}
              title={post.author_name}
              isOwner={false}
              open={commentsOpen}
              onClose={() => setCommentsOpen(false)}
            />

            <ShareModal
              post={{
                id: post.id,
                author_name: post.author_name,
                img: imageUrl,
                quote: post.slogan,
                bio: post.description,
              }}
              open={shareOpen}
              onClose={() => setShareOpen(false)}
            />
          </>
        )}
      </div>
    </>
  );
}
