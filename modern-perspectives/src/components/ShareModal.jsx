import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuthContext } from "../context/AuthContext";
import Border from "./Border";           // ← add
import LikeButton from "./LikeButton";   // ← add
import CommentsModal from "./CommentsModal"; // ← add

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ShareModal({ post, open, onClose }) {
  const { user } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);


  if (!open) return null;

  const shareLink = `${window.location.origin}/perspective/${post.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleShareViaMessage = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!user?.email) {
      setStatus("Please Log in to Share!");
      return;
    }
    if (!recipient.trim()) {
      setStatus("Whose Email");
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: user.email,
          receiver_email: recipient.trim(),
          message_text: `Perspective of ${post.author_name}: ${shareLink}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed Sharing");

      setStatus("Succeeded Sharing!");
      setRecipient("");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSending(false);
    }
  };

  // ★★★ ប្រើ Portal ដើម្បីលោតចេញពីកាត ★★★
  return createPortal(
    <div
      className="info-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="info-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2>{post.author_name}</h2>

        <div style={{ margin: "16px 0" }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Link
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              type="text"
              readOnly
              value={shareLink}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontSize: 13,
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(90deg, #efbe2c, #FDE9A9)",
                color: "#06121f",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            margin: "20px 0",
          }}
        />

        <form
          onSubmit={handleShareViaMessage}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Share to Message
          </label>
          <input
            type="email"
            placeholder="Who Email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: 14,
            }}
          />
          {status && (
            <p
              style={{
                fontSize: 13,
                color: status.includes("Succeeded") ? "#025cf8" : "#ff8080",
              }}
            >
              {status}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            style={{
              padding: 11,
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(90deg, #efbe2c, #FDE9A9)",
              color: "#06121f",
              fontWeight: 700,
              cursor: sending ? "not-allowed" : "pointer",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? "Sharing..." : "Share to Message"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}