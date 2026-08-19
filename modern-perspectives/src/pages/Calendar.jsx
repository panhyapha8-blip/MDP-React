// src/pages/Calendar.jsx
//
// Month-view calendar. Shows a dot on days when a Post was created,
// and lets logged-in users add/view/delete their own personal events.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import "./Calendar.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11

  const [postsByDay, setPostsByDay] = useState({});   // { "2026-07-20": [post, post...] }
  const [eventsByDay, setEventsByDay] = useState({});  // { "2026-07-20": [event, ...] }

  const [selectedDate, setSelectedDate] = useState(null); // "2026-07-20" | null
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");

  // សម្អាត error និងទម្រង់ រាល់ពេលប្តូរទៅថ្ងៃផ្សេង (ឬបិទ modal)
  useEffect(() => {
    setError("");
    setNewTitle("");
    setNewNote("");
  }, [selectedDate]);

  // --- ទាញយក Post ទាំងអស់ ដើម្បីដាក់ dot លើថ្ងៃដែលបានបង្កើត ---
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`);
      const data = await res.json();
      const grouped = {};
      myPosts.forEach((p) => {
        const d = new Date(p.created_at);
        const key = toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      });
      setPostsByDay(grouped);
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  }, [user]);

  // --- ទាញយកព្រឹត្តិការណ៍ផ្ទាល់ខ្លួនរបស់ខែនេះ ---
  const fetchEvents = useCallback(async () => {
    if (!user?.email) {
      setEventsByDay({});
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/events?owner_email=${encodeURIComponent(user.email)}&month=${viewMonth + 1}&year=${viewYear}`
      );
      const data = await res.json();
      const grouped = {};
      data.forEach((ev) => {
        const key = ev.event_date.slice(0, 10);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(ev);
      });
      setEventsByDay(grouped);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  }, [user, viewMonth, viewYear]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const [jumpDate, setJumpDate] = useState("");

  const goToDate = () => {
    if (!jumpDate) return;
    const [y, m, d] = jumpDate.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setSelectedDate(toDateKey(y, m - 1, d));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError("");

    if (!user?.email) {
      setError("Please Log in to Add Event!");
      return;
    }
    if (!newTitle.trim()) {
      setError("Please Title Event!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_email: user.email,
          event_date: selectedDate,
          title: newTitle,
          note: newNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setNewTitle("");
      setNewNote("");
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (ev) => {
    if (!window.confirm("Do you certainly delete event?")) return;
    try {
      await fetch(`${API_BASE}/api/events/${ev.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_email: user.email }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // --- បង្កើត grid ថ្ងៃខែសម្រាប់ខែបច្ចុប្បន្ន ---
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedPosts = selectedDate ? postsByDay[selectedDate] || [] : [];
  const selectedEvents = selectedDate ? eventsByDay[selectedDate] || [] : [];

  return (
    <div className="calendar-page">
      <button className="calendar-back-btn" onClick={() => navigate("/")}>
        ← Home
      </button>

      <div className="calendar-header">
        <button onClick={goPrevMonth}>‹</button>
        <h2>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <button onClick={goNextMonth}>›</button>
        <button className="calendar-today-btn" onClick={goToday}>Today</button>
      </div>

      <div className="calendar-jumpto">
        <input
          type="date"
          value={jumpDate}
          onChange={(e) => setJumpDate(e.target.value)}
        />
        <button onClick={goToDate}>Return to Date</button>
      </div>

      <div className="calendar-grid calendar-grid-labels">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} className="calendar-cell empty" />;
          const key = toDateKey(viewYear, viewMonth, d);
          const hasPosts = !!postsByDay[key];
          const hasEvents = !!eventsByDay[key];
          const isToday =
            viewYear === today.getFullYear() &&
            viewMonth === today.getMonth() &&
            d === today.getDate();

          return (
            <div
              key={idx}
              className={`calendar-cell${isToday ? " today" : ""}`}
              onClick={() => setSelectedDate(key)}
            >
              <span className="calendar-day-number">{d}</span>
              <div className="calendar-dots">
                {hasPosts && <span className="dot dot-post" title="Succeeded Posting" />}
                {hasEvents && <span className="dot dot-event" title="Your Event" />}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="calendar-overlay" onClick={() => setSelectedDate(null)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <button className="calendar-modal-close" onClick={() => setSelectedDate(null)}>
              &times;
            </button>
            <h3>{selectedDate}</h3>

            {selectedPosts.length > 0 && (
              <div className="calendar-section">
                <h4>Succeeded Creating Event</h4>
                {selectedPosts.map((p) => (
                  <div key={p.id} className="calendar-post-item">
                    <strong>{p.author_name}</strong> — "{p.slogan}"
                  </div>
                ))}
              </div>
            )}

            <div className="calendar-section">
              <h4>Your Event</h4>
              {selectedEvents.length === 0 && (
                <p className="calendar-empty-text">No Event</p>
              )}
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="calendar-event-item">
                  <div>
                    <strong>{ev.title}</strong>
                    {ev.note && <p>{ev.note}</p>}
                  </div>
                  <button onClick={() => handleDeleteEvent(ev)}>Delete</button>
                </div>
              ))}
            </div>

            {user?.email ? (
              <form onSubmit={handleAddEvent} className="calendar-add-form">
                {error && <p className="calendar-error">{error}</p>}
                <input
                  type="text"
                  placeholder="Title of Event"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  placeholder="Note (not required)"
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button type="submit">+ Add Event</button>
              </form>
            ) : (
              <p className="calendar-empty-text">Please Log in to Add Event</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
