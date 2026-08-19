import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function LikeButton({ targetType, targetId }) {
  const storageKey = `liked_${targetType}_${targetId}`;
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === 'true');

    const fetchLikes = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/engagement/${targetType}/${targetId}`);
        const data = await res.json();
        if (res.ok) setLikes(data.likes);
      } catch (err) {
        console.error('Failed to load likes', err);
      }
    };
    fetchLikes();
  }, [targetType, targetId, storageKey]);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (busy) return;

    const action = liked ? 'unlike' : 'like';

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/engagement/${targetType}/${targetId}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes);
        const newLiked = !liked;
        setLiked(newLiked);
        if (newLiked) {
          localStorage.setItem(storageKey, 'true');
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.error('Like/Unlike failed', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      style={{
        background: 'none',
        border: 'none',
        cursor: busy ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        color: 'inherit',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 15 }}>{liked ? '❤️' : '🤍'}</span> {likes}
    </button>
  );
}