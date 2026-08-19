import { useEffect, useState, useCallback } from 'react';
import { scientists } from '../data/scientists';
import ScientistCard from './ScientistCard';
import UserPostCard from './UserPostCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CardGallery({ refreshTrigger }) {
  const [posts, setPosts] = useState([]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load user posts', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  return (
    <section className="card-container">
      {posts.map((p) => (
        <UserPostCard key={`post-${p.id}`} post={p} />
      ))}
      {scientists.map((s) => (
        <ScientistCard key={s.id} scientist={s} />
      ))}
    </section>
  );
}
