// src/pages/SearchPage.jsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import LikeButton from '../components/LikeButton';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import { scientists } from '../data/scientists';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For modals
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'post' | 'scientist', data: ... }

  // ===== SEARCH BAR STATE =====
  // When query exists (URL has ?q=...), show full search bar immediately.
  // When query is empty, hide it and show only the Search button.
  const [showSearchBar, setShowSearchBar] = useState(!!query);

  // Track scroll position
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setShowSearchBar(false); // Hide search bar when no query in URL
      return;
    }

    setShowSearchBar(true); // Show search bar when there is a query in URL

    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) throw new Error('Failed to load posts');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query]);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const name = (p.author_name || '').toLowerCase();
    const slogan = (p.slogan || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return name.includes(query) || slogan.includes(query) || desc.includes(query);
  });

  // Filter scientists
  const filteredScientists = scientists.filter((s) => {
    const name = (s.name || '').toLowerCase();
    const quote = (s.quote || '').toLowerCase();
    const bio = (s.bio || '').toLowerCase();
    const years = (s.years || '').toLowerCase();
    return (
      name.includes(query) ||
      quote.includes(query) ||
      bio.includes(query) ||
      years.includes(query)
    );
  });

  const totalResults = filteredPosts.length + filteredScientists.length;

  const openComments = (type, data) => {
    setSelectedItem({ type, data });
    setCommentsOpen(true);
  };

  const openShare = (type, data) => {
    setSelectedItem({ type, data });
    setShareOpen(true);
  };

  // ===== SCROLL BEHAVIOR (HIDE SEARCH BAR WHEN SCROLLING) =====
  useEffect(() => {
    if (!showSearchBar) return; // Only attach listener when search bar is visible

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSearchBar]);

  return (
    <>
      <Header />

      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        {/* ===== HEADER SEARCH (FULL BAR OR BUTTON) ===== */}
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#ffe88a', fontSize: 28, marginBottom: 8 }}>
            Search Results
          </h1>

          {/* Full search bar (visible when showSearchBar === true) */}
          {showSearchBar && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = document.querySelector('#search-input');
                const newQuery = input?.value.trim();
                if (newQuery) {
                  navigate(`/search?q=${encodeURIComponent(newQuery)}`, { replace: true });
                }
              }}
              style={{ position: 'relative', marginTop: 12 }}
            >
              <input
                id="search-input"
                type="text"
                defaultValue={query}
                placeholder="Search scientists, quotes, posts..."
                style={{
                  width: '100%',
                  padding: '14px 20px 14px 52px',
                  background: 'rgba(6, 18, 31, 0.7)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: 999,
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#d4af37',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                🔍
              </button>
            </form>
          )}

          {/* Search button (visible when showSearchBar === false) */}
          {!showSearchBar && (
            <button
              onClick={() => setShowSearchBar(true)}
              style={{
                marginTop: 12,
                padding: '14px 28px',
                background: 'linear-gradient(90deg, #d4af37, #ffe88a)',
                color: '#06121f',
                fontWeight: 700,
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🔍 Search scientists & posts
            </button>
          )}

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 16 }}>
            {query ? (
              <>
                Results for: <strong style={{ color: '#d4af37' }}>"{query}"</strong>
                {!loading && (
                  <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.5)' }}>
                    ({totalResults} found)
                  </span>
                )}
              </>
            ) : (
              'Enter a search term above to find scientists or user perspectives'
            )}
          </p>
        </div>

        {loading && <p style={{ color: '#d4af37', textAlign: 'center' }}>Searching...</p>}
        {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

        {/* No results */}
        {!loading && !error && query && totalResults === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              border: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
              No results found for "{query}"
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 20,
                padding: '10px 24px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(90deg, #d4af37, #ffe88a)',
                color: '#06121f',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* ===== User Posts ===== */}
        {!loading && filteredPosts.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: '#d4af37', fontSize: 20, marginBottom: 16 }}>
              User Perspectives ({filteredPosts.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredPosts.map((post) => {
                const imageUrl = post.image_url?.startsWith('http')
                  ? post.image_url
                  : `${API_BASE}${post.image_url}`;
                return (
                  <div
                    key={`post-${post.id}`}
                    style={{
                      display: 'flex',
                      gap: 18,
                      padding: '18px 22px',
                      background: 'rgba(6, 18, 31, 0.65)',
                      borderRadius: 14,
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                    }}
                  >
                    {post.image_url && (
                      <img
                        src={imageUrl}
                        alt={post.author_name}
                        style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#ffe88a', margin: '0 0 4px 0', fontSize: 17 }}>
                        {post.author_name}
                      </h3>
                      {post.slogan && (
                        <p style={{ color: '#d4af37', margin: '0 0 6px 0', fontStyle: 'italic', fontSize: 14 }}>
                          "{post.slogan}"
                        </p>
                      )}
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 12px 0', fontSize: 14 }}>
                        {post.description}
                      </p>
                      {/* Like + Comment + Share */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <LikeButton targetType="post" targetId={post.id} />
                        <button
                          onClick={() => openComments('post', post)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#d4af37',
                            cursor: 'pointer',
                            fontSize: 13,
                            textDecoration: 'underline',
                          }}
                        >
                          💬 Comment
                        </button>
                        <button
                          onClick={() => openShare('post', post)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#d4af37',
                            cursor: 'pointer',
                            fontSize: 13,
                            textDecoration: 'underline',
                          }}
                        >
                          🔗 Share
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Scientists ===== */}
        {!loading && filteredScientists.length > 0 && (
          <section>
            <h2 style={{ color: '#d4af37', fontSize: 20, marginBottom: 16 }}>
              Scientists ({filteredScientists.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredScientists.map((s) => (
                <div
                  key={`sci-${s.id}`}
                  style={{
                    display: 'flex',
                    gap: 18,
                    padding: '18px 22px',
                    background: 'rgba(6, 18, 31, 0.65)',
                    borderRadius: 14,
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                  }}
                >
                  {s.img && (
                    <img
                      src={s.img}
                      alt={s.name}
                      style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#ffe88a', margin: '0 0 4px 0', fontSize: 17 }}>
                      {s.name}{' '}
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                        ({s.years})
                      </span>
                    </h3>
                    {s.quote && (
                      <p style={{ color: '#d4af37', margin: '0 0 6px 0', fontStyle: 'italic', fontSize: 14 }}>
                        "{s.quote}"
                      </p>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 12px 0', fontSize: 14 }}>
                      {s.bio?.slice(0, 180)}
                      {s.bio?.length > 180 ? '...' : ''}
                    </p>
                    {/* Like + Comment + Share */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <LikeButton targetType="scientist" targetId={s.id} />
                      <button
                        onClick={() => openComments('scientist', s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d4af37',
                          cursor: 'pointer',
                          fontSize: 13,
                          textDecoration: 'underline',
                        }}
                      >
                        💬 Comment
                      </button>
                      <button
                        onClick={() => openShare('scientist', s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d4af37',
                          cursor: 'pointer',
                          fontSize: 13,
                          textDecoration: 'underline',
                        }}
                      >
                        🔗 Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back button */}
        <div style={{ marginTop: 50, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              border: '1px solid rgba(212,175,55,0.5)',
              background: 'transparent',
              color: '#d4af37',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* ===== Modals ===== */}
      {selectedItem && (
        <>
          <CommentsModal
            targetType={selectedItem.type}
            targetId={selectedItem.data.id}
            title={
              selectedItem.type === 'post'
                ? selectedItem.data.author_name
                : selectedItem.data.name
            }
            isOwner={false}
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
          />
          <ShareModal
            post={
              selectedItem.type === 'post'
                ? selectedItem.data
                : {
                    id: selectedItem.data.id,
                    author_name: selectedItem.data.name,
                  }
            }
            open={shareOpen}
            onClose={() => setShareOpen(false)}
          />
        </>
      )}
    </>
  );
}
