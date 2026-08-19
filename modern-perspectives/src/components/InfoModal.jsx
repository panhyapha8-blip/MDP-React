import { useEffect } from 'react';

const PURPOSE = [
  { label: 'Educational', text: 'Explore scientist bios through flip cards' },
  { label: 'Community', text: 'Create, search, and share your own perspective posts' },
  { label: 'Full-stack practice', text: 'React frontend, Express/MySQL backend, REST APIs' },
  { label: 'Productivity tools', text: 'Calendar, Messages, and a data-driven Dashboard' },
  { label: 'Visual design', text: 'CSS flip animations, light/dark theme, video backgrounds' },
];

const FAQ = [
  {
    q: 'Do I need an account?',
    a: 'Yes. Sign up or log in — accounts are stored on our MySQL backend, so your posts and settings follow you across devices.',
  },
  {
    q: 'How do flip cards work?',
    a: 'CSS 3D transform rotateY(180deg) on hover/tap reveals bio and contributions on the back face — for both scientist cards and user-created posts.',
  },
  {
    q: 'Which scientists are featured?',
    a: 'Einstein, Turing, Tesla, da Vinci, Curie, Becquerel, Newton, Oppenheimer.',
  },
  {
    q: 'How do I create my own perspective?',
    a: 'Go to "Create Perspective" in the sidebar — fill in your name, a slogan, an optional photo, and a short bio. Your posts show up in the gallery and can be searched, edited, or deleted from the same page.',
  },
  {
    q: 'What else can I do here?',
    a: 'Check the Calendar for events, send Messages, view usage stats on the Dashboard, and switch between light/dark theme and other display options in Settings.',
  },
  {
    q: 'What tech was used?',
    a: 'React + Vite (frontend), Node/Express + MySQL (backend), Supabase (dashboard analytics), CSS3, GitHub Actions.',
  },
];

export default function InfoModal({ open, onClose }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="info-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="info-modal">
        <button className="info-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="info-seal" aria-hidden="true">
          <span>EST.</span>
          <strong>2026</strong>
        </div>

        <p className="info-eyebrow">Field Guide — Exhibit 01</p>
        <h2>Modern Perspectives</h2>
        <div className="info-rule" />

        <p className="info-lede">
          A full-stack React + Node/Express + MySQL web app — a showcase gallery for eight of history's most
          influential scientists, from Albert Einstein to Marie Curie, plus a space where members create and share
          their own "perspective" cards.
        </p>
        <p className="info-lede info-lede-sub">
          Built to practice full-stack development end to end. Part of the Five Footsteps creative group's
          portfolio.
        </p>

        <h3 className="info-section-title">
          <span className="info-index">I</span> Purpose
        </h3>
        <dl className="info-purpose">
          {PURPOSE.map((item, i) => (
            <div className="info-purpose-item" key={item.label}>
              <dt>
                <span className="info-num">{String(i + 1).padStart(2, '0')}</span> {item.label}
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>

        <h3 className="info-section-title">
          <span className="info-index">II</span> Field Notes
        </h3>
        <div className="info-faq">
          {FAQ.map((item) => (
            <details className="info-faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <a
          className="info-source"
          href="https://github.com/brave1012"
          target="_blank"
          rel="noreferrer"
        >
          View source on GitHub →
        </a>
      </div>
    </div>
  );
}