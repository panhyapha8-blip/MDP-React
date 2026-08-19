// src/pages/Messages.jsx
//
// Direct Messages page: conversation list on the left, chat thread
// on the right. Supports sending text and/or an image, viewing images
// full-size, and seeing message timestamps (auto every 10min gap,
// or tap any message to toggle its exact time).

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import "./Messages.css";
import EmojiPicker from "../components/EmojiPicker";
import templeImg from '../assets/images/Temple.jpg';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TIME_GAP_MS = 10 * 60 * 1000; // ១០ នាទី
const DRAW_COLORS = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de", "#ffffff", "#000000"];


function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessageText(text) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          rel="noopener noreferrer"
          style={{ color: "#54d011", textDecoration: "underline" }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ImageEditor({ src, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const historyRef = useRef([]);
  const drawingRef = useRef(false);
  const cropStartRef = useRef(null);
  const [tool, setTool] = useState("draw");
  const [color, setColor] = useState("#ff3b30");
  const [brushSize, setBrushSize] = useState(4);
  const [cropRect, setCropRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxW = Math.min(window.innerWidth - 48, 720);
      const maxH = Math.min(window.innerHeight - 220, 520);
      let w = img.width;
      let h = img.height;
      const scale = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      historyRef.current = [ctx.getImageData(0, 0, w, h)];
      setDisplaySize({ w, h });
      setReady(true);
    };
    img.src = src;
  }, [src]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
  };

  const undo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = prev.width;
    canvas.height = prev.height;
    ctx.putImageData(prev, 0, 0);
    setDisplaySize({ w: prev.width, h: prev.height });
    setCropRect(null);
    cropStartRef.current = null;
  };

  const clearCanvas = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const maxW = Math.min(window.innerWidth - 48, 720);
    const maxH = Math.min(window.innerHeight - 220, 520);
    let w = img.width;
    let h = img.height;
    const scale = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    historyRef.current = [ctx.getImageData(0, 0, w, h)];
    setDisplaySize({ w, h });
    setCropRect(null);
    cropStartRef.current = null;
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === "draw") {
      pushHistory();
      drawingRef.current = true;
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (tool === "crop") {
      cropStartRef.current = pos;
      setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const moveDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === "draw" && drawingRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "crop" && cropStartRef.current) {
      const start = cropStartRef.current;
      setCropRect({
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (tool === "draw") {
      drawingRef.current = false;
    } else if (tool === "crop") {
      cropStartRef.current = null;
    }
  };

  const applyCrop = () => {
    if (!cropRect || cropRect.w < 8 || cropRect.h < 8) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    pushHistory();
    const imageData = ctx.getImageData(
      Math.round(cropRect.x),
      Math.round(cropRect.y),
      Math.round(cropRect.w),
      Math.round(cropRect.h)
    );
    canvas.width = Math.round(cropRect.w);
    canvas.height = Math.round(cropRect.h);
    ctx.putImageData(imageData, 0, 0);
    setDisplaySize({ w: canvas.width, h: canvas.height });
    setCropRect(null);
    cropStartRef.current = null;
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "edited-image.png", { type: "image/png" });
        const url = URL.createObjectURL(blob);
        onDone(file, url);
      },
      "image/png",
      0.92
    );
  };

  const cropStyle = (() => {
    if (!cropRect || !canvasRef.current || displaySize.w === 0) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    return {
      left: `calc(50% - ${rect.width / 2}px + ${cropRect.x * scaleX}px)`,
      top: `calc(50% - ${rect.height / 2}px + ${cropRect.y * scaleY}px)`,
      width: cropRect.w * scaleX,
      height: cropRect.h * scaleY,
    };
  })();

  return (
    <div className="messages-editor-overlay">
      <div className="messages-editor">
        <div className="messages-editor-header">
          <span>Edit Image</span>
          <button type="button" className="messages-editor-close" onClick={onCancel}>
            &times;
          </button>
        </div>

        <div className="messages-editor-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="messages-editor-canvas"
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
            style={{ cursor: "crosshair" }}
          />
          {tool === "crop" && cropStyle && cropRect.w > 2 && (
            <div className="messages-crop-rect" style={cropStyle} />
          )}
        </div>

        <div className="messages-editor-toolbar">
          <div className="messages-editor-tools">
            <button
              type="button"
              className={`messages-tool-btn${tool === "draw" ? " active" : ""}`}
              onClick={() => {
                setTool("draw");
                setCropRect(null);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.99997 11.2224L12.7778 15.0002M7.97485 20.975C6.60801 22.3419 4 22.0002 2 22.0002C3.0251 20.0002 1.65827 17.3921 3.0251 16.0253C4.39194 14.6585 6.60801 14.6585 7.97485 16.0253C9.34168 17.3921 9.34168 19.6082 7.97485 20.975ZM11.9216 15.9248L21.0587 6.05671C21.8635 5.18755 21.8375 3.83776 20.9999 3.00017C20.1624 2.16258 18.8126 2.13663 17.9434 2.94141L8.07534 12.0785C7.5654 12.5507 7.31043 12.7868 7.16173 13.0385C6.80514 13.6423 6.79079 14.3887 7.12391 15.0057C7.26283 15.2631 7.50853 15.5088 7.99995 16.0002C8.49136 16.4916 8.73707 16.7373 8.99438 16.8762C9.6114 17.2093 10.3578 17.195 10.9616 16.8384C11.2134 16.6897 11.4494 16.4347 11.9216 15.9248Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Draw
            </button>
            <button
              type="button"
              className={`messages-tool-btn${tool === "crop" ? " active" : ""}`}
             onClick={() => {
                setTool("crop");
                setCropRect(null);
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10L21 3M21 3H15M21 3V9M10 14L3 21M3 21H9M3 21L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Crop
            </button>
            {tool === "crop" && (
              <button type="button" className="messages-tool-btn accent" onClick={applyCrop}>
                Apply Crop
              </button>
            )}
            <button type="button" 
            className="messages-tool-btn" 
            onClick={undo}>
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7H14C17.3137 7 20 9.68629 20 13C20 16.3137 17.3137 19 14 19H4M4 7L8 3M4 7L8 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Undo
            </button>
            <button type="button" 
            className="messages-tool-btn" 
            onClick={clearCanvas}>
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Reset
            </button>
          </div>

          {tool === "draw" && (
            <div className="messages-editor-draw-options">
              <div className="messages-color-row">
                {DRAW_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`messages-color-swatch${color === c ? " active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <label className="messages-brush-label">
                Size
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </label>
            </div>
          )}
        </div>

        <div className="messages-editor-actions">
          <button type="button" className="messages-editor-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="messages-editor-done" onClick={handleDone} disabled={!ready}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [editorSrc, setEditorSrc] = useState(null); // opens editor when set

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [openImage, setOpenImage] = useState(null); // URL ដែលកំពុងបើកមើលពេញ
  const [revealedTimes, setRevealedTimes] = useState({}); // { messageId: true }
  const fileInputRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  }, [user]);

  const fetchThread = useCallback(async (partner) => {
    if (!user?.email || !partner) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/messages/thread?me=${encodeURIComponent(user.email)}&other=${encodeURIComponent(partner)}`
      );
      const data = await res.json();
      setThread(data);
    } catch (err) {
      console.error("Failed to load thread", err);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activePartner) {
      fetchThread(activePartner);
      setRevealedTimes({});
    }
  }, [activePartner, fetchThread]);

  const openConversation = (partner) => {
    setActivePartner(partner);
    setError("");
  };

  const handleStartNew = (e) => {
    e.preventDefault();
    setError("");
    if (!newRecipient.trim()) {
      setError("Who Email");
      return;
    }
    if (newRecipient.trim() === user?.email) {
      setError("Cannot self-message!");
      return;
    }
    setActivePartner(newRecipient.trim());
    setNewRecipient("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditorSrc(url);                    // open editor instead of attaching directly
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditorDone = (file, url) => {
    setImageFile(file);
    setImagePreview(url);
    setEditorSrc(null);
  };

  const handleEditorCancel = () => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if (!newMessage.trim() && !imageFile) return;
    if (!activePartner) return;

    const formData = new FormData();
    formData.append("sender_email", user.email);
    formData.append("receiver_email", activePartner);
    formData.append("message_text", newMessage);
    if (imageFile) formData.append("image", imageFile);

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed Messaging!");

      setThread((prev) => [...prev, data]);
      setNewMessage("");
      clearImage();
      fetchConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleTime = (messageId) => {
    setRevealedTimes((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/messages/${messageId}?email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      setThread((prev) => prev.filter((m) => m.id !== messageId));
      fetchConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user?.email) {
    return (
      <div className="messages-page" style={{ '--temple-bg': `url(${templeImg})` }}>
        <button className="messages-back-btn" onClick={() => navigate("/")}>
          ← Home
        </button>
        <div className="alert alert-warning" role="alert">
          Please Log in to Message
        </div>
      </div>
    );
  }

  // --- គណនាថាតើសារណាមួយត្រូវបង្ហាញ header ម៉ោងស្វ័យប្រវត្តិ (គម្លាត > ១០នាទី) ---
  let lastShownTime = null;
  
  return (
    <div className="messages-page" style={{ '--temple-bg': `url(${templeImg})` }}>
      <button className="messages-back-btn" onClick={() => navigate("/")}>
        ← Home
      </button>

      <div className="messages-layout">
        {/* --- ជួរឈរខាងឆ្វេង: បញ្ជីសន្ទនា --- */}
        <div className="messages-sidebar">
          <form onSubmit={handleStartNew} className="messages-new-form">
            <input
              type="email"
              placeholder="Who Email..."
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
            />
            <button type="submit">+ New Talk</button>
          </form>

          <div className="messages-conv-list">
            {conversations.length === 0 && (
              <div className="alert alert-secondary" role="status">
                No Talk
              </div>
            )}
            {conversations.map((c) => (
              <div
                key={c.partner}
                className={`messages-conv-item${activePartner === c.partner ? " active" : ""}`}
                onClick={() => openConversation(c.partner)}
              >
                <div className="messages-conv-top">
                  <strong>{c.partner}</strong>
                  {c.unread_count > 0 && <span className="messages-badge">{c.unread_count}</span>}
                </div>
                <p className="messages-conv-preview">{c.last_message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- ជួរឈរខាងស្តាំ: ការសន្ទនា --- */}
        <div className="messages-thread">
          {!activePartner ? (
            <div className="alert alert-secondary messages-center" role="status">
              Choose Talk or Start Talk
            </div>
          ) : (
            <>
              <div className="messages-thread-header">{activePartner}</div>

              <div className="messages-thread-body">
                {thread.map((m) => {
                  const msgTime = new Date(m.created_at).getTime();
                  const showAutoTime = !lastShownTime || msgTime - lastShownTime > TIME_GAP_MS;
                  if (showAutoTime) lastShownTime = msgTime;
                  const isMine = m.sender_email === user.email;

                  return (
                    <div key={m.id}>
                      {showAutoTime && (
                        <div className="messages-time-divider">{formatTime(m.created_at)}</div>
                      )}
                      <div
                        className={`messages-bubble${isMine ? " mine" : ""}`}
                        onClick={() => toggleTime(m.id)}
                      >
                        {m.image_url && (
                          <img
                            src={`${API_BASE}${m.image_url}`}
                            alt="attachment"
                            className="messages-bubble-image"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenImage(`${API_BASE}${m.image_url}`);
                            }}
                          />
                        )}
                        {m.message_text && <span>{renderMessageText(m.message_text)}</span>}
                        {isMine && (
                          <button
                            type="button"
                            className="messages-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(m.id);
                            }}
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                      {revealedTimes[m.id] && !showAutoTime && (
                        <div className={`messages-inline-time${isMine ? " mine" : ""}`}>
                          {formatTime(m.created_at)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {imagePreview && (
                <div className="messages-image-preview">
                  <img
                    src={imagePreview}
                    alt="preview"
                    onClick={() => setEditorSrc(imagePreview)}
                    title="Tap to edit"
                    style={{ cursor: "pointer" }}
                  />
                  <button
                    type="button"
                    className="messages-image-remove"
                    onClick={clearImage}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              )}

          <form onSubmit={handleSend} className="messages-send-form">
              <EmojiPicker onSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
              <label className="messages-attach-btn" title="Image">
                📎
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
              <input
                type="text"
                placeholder="Talking..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
            </>
          )}
          
        </div>
        {editorSrc && (
            <ImageEditor
              src={editorSrc}
              onDone={handleEditorDone}
              onCancel={handleEditorCancel}
            />
        )}
      </div>

      {/* --- Lightbox មើលរូបភាពពេញ --- */}
      {openImage && (
        <div className="messages-lightbox" onClick={() => setOpenImage(null)}>
          <img src={openImage} alt="full view" onClick={(e) => e.stopPropagation()} />
          <button className="messages-lightbox-close" onClick={() => setOpenImage(null)}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
}