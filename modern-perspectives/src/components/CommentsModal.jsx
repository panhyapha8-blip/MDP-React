import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { createPortal } from "react-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CommentsModal({ targetType, targetId, title, isOwner, open, onClose }) {
  const { user } = useAuthContext();
  const [comments, setComments] = useState([]);
  const [name, setName] = useState(user?.fullname || '');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/engagement/${targetType}/${targetId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, fetchComments]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !text.trim()) {
      setError('Complete Name and Comment');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/engagement/${targetType}/${targetId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commenter_name: name,
          comment_text: text,
          commenter_email: user?.email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      setComments((prev) => [...prev, data]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    const confirmed = window.confirm('Do you certainly delete this comment?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/engagement/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_email: user?.email || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed Deleting');

      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const canDelete = (comment) =>
    isOwner || (user?.email && comment.commenter_email === user.email);

    return createPortal(
    <div
      className="info-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="info-modal" 
      onClick={(e) => e.stopPropagation()} 
      style={{ 
        maxWidth: 550,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '95vh',
       }}>
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2>{title}</h2>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          marginBottom: 16,
          minHeight: 0,
        }}>

          {comments.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No comment!</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <div>
                <strong style={{ color: 'rgb(247, 221, 90)' }}>{c.commenter_name}</strong>
                <p style={{ margin: '4px 0 0', color: '#e8eaf0' }}>{c.comment_text}</p>
              </div>

              {canDelete(c) && (
                <button
                  onClick={() => handleDeleteComment(c)}
                  title="Delete Comment!"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ff8080',
                    fontSize: 12,
                    textDecoration: 'underline',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p style={{ color: '#ff8080', fontSize: 13 }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!!user?.fullname}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: 14,
            }}
          />
          <textarea
            placeholder="Commenting..."
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 11,
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(90deg, #efbe2c, #FDE9A9)',
              color: '#06121f',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Sendind...' : 'Send Comment'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}