import { useState, useEffect, useCallback } from 'react';

const CURRENT_USER_KEY = 'mp_current_user';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  // localStorage ឥឡូវរក្សាទុកតែ "session" បច្ចុប្បន្ន (user object ដែល login ស្រាប់)
  // មិនមែនជាកន្លែងផ្ទុកគណនីទាំងអស់ទៀតទេ — គណនីទាំងអស់នៅ Database
  useEffect(() => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [user]);

  const signIn = useCallback(async (nameEmail, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.error };
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      console.error(err);
      return { ok: false, message: 'Failed Connecting Server!' };
    }
  }, []);

  const signUp = useCallback(async (fullname, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.error };
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      console.error(err);
      return { ok: false, message: 'Failed Connecting Server!' };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fullname, password) => {
    if (!user) return { ok: false, message: 'Not logged in' };
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, fullname, password: password || undefined }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, message: data.error };
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      console.error(err);
      return { ok: false, message: 'Failed Connecting Server!' };
    }
  }, [user]);

  // avatar ឥឡូវផ្ទុកនៅក្នុង user object ខ្លួនឯង (ជួរឈរ avatar ក្នុង Database)
  const getAvatar = useCallback(
    (email) => {
      if (user && user.email === email) return user.avatar || null;
      return null;
    },
    [user]
  );

  const setAvatar = useCallback(async (email, base64) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, avatar: base64 }),
      });
      if (res.ok) {
        setUser((prev) => (prev && prev.email === email ? { ...prev, avatar: base64 } : prev));
      }
    } catch (err) {
      console.error('Failed to update avatar', err);
    }
  }, []);

  return { user, signIn, signUp, signOut, updateProfile, getAvatar, setAvatar };
}

