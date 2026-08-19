import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CardGallery from '../components/CardGallery';
import InfoModal from '../components/InfoModal';

export default function HomePage() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  function handleGlobalSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <Header />

      {/* ===== Motion Bar ===== */}
      <div className="motion-bar">
        <div className="motion-bar-track">
          <span>
            “Know thyself”&nbsp;&nbsp;•&nbsp;&nbsp;Perspective shapes reality&nbsp;&nbsp;•&nbsp;&nbsp;Strength begins within&nbsp;&nbsp;•&nbsp;&nbsp;Learn from the greats&nbsp;&nbsp;•&nbsp;&nbsp;Every mind has a unique light&nbsp;&nbsp;•&nbsp;&nbsp;Grow beyond limits&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span>
            "Fortune favors the bold"&nbsp;&nbsp;•&nbsp;&nbsp;"Silence is a true friend that never betrays"&nbsp;&nbsp;•&nbsp;&nbsp;"Drop by drop is the water pot filled"&nbsp;&nbsp;•&nbsp;&nbsp;"Mastery of self is true power"&nbsp;&nbsp;•&nbsp;&nbsp;"Action expresses priorities"&nbsp;&nbsp;•&nbsp;&nbsp;"Patience is bitter, but its fruit is sweet"&nbsp;&nbsp;•&nbsp;&nbsp;"Simplicity is the ultimate sophistication"&nbsp;&nbsp;•&nbsp;&nbsp;"He who moves a mountain begins by carrying away small stones"&nbsp;&nbsp;•&nbsp;&nbsp;"What you seek is seeking you"&nbsp;&nbsp;•&nbsp;&nbsp;"Doubt kills more dreams than failure ever will"&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span>
            "Turn your wounds into wisdom"&nbsp;&nbsp;•&nbsp;&nbsp;"Small steps lead to big changes"&nbsp;&nbsp;•&nbsp;&nbsp;"The mind is everything; what you think you become"&nbsp;&nbsp;•&nbsp;&nbsp;"Stay hungry, stay foolish"&nbsp;&nbsp;•&nbsp;&nbsp;"Do what you can, with what you have, where you are"&nbsp;&nbsp;•&nbsp;&nbsp;"Light tomorrow with today"&nbsp;&nbsp;•&nbsp;&nbsp;"Everything you can imagine is real"&nbsp;&nbsp;•&nbsp;&nbsp;"The journey of a thousand miles begins with a single step"&nbsp;&nbsp;•&nbsp;&nbsp;"Focus on the step in front of you, not the whole staircase"&nbsp;&nbsp;•&nbsp;&nbsp;"Where there is love there is life"&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span>
            “Know thyself”&nbsp;&nbsp;•&nbsp;&nbsp;Perspective shapes reality&nbsp;&nbsp;•&nbsp;&nbsp;Strength begins within&nbsp;&nbsp;•&nbsp;&nbsp;Learn from the greats&nbsp;&nbsp;•&nbsp;&nbsp;Every mind has a unique light&nbsp;&nbsp;•&nbsp;&nbsp;Grow beyond limits&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span>
            "Fortune favors the bold"&nbsp;&nbsp;•&nbsp;&nbsp;"Silence is a true friend that never betrays"&nbsp;&nbsp;•&nbsp;&nbsp;"Drop by drop is the water pot filled"&nbsp;&nbsp;•&nbsp;&nbsp;"Mastery of self is true power"&nbsp;&nbsp;•&nbsp;&nbsp;"Action expresses priorities"&nbsp;&nbsp;•&nbsp;&nbsp;"Patience is bitter, but its fruit is sweet"&nbsp;&nbsp;•&nbsp;&nbsp;"Simplicity is the ultimate sophistication"&nbsp;&nbsp;•&nbsp;&nbsp;"He who moves a mountain begins by carrying away small stones"&nbsp;&nbsp;•&nbsp;&nbsp;"What you seek is seeking you"&nbsp;&nbsp;•&nbsp;&nbsp;"Doubt kills more dreams than failure ever will"&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <span>
            "Turn your wounds into wisdom"&nbsp;&nbsp;•&nbsp;&nbsp;"Small steps lead to big changes"&nbsp;&nbsp;•&nbsp;&nbsp;"The mind is everything; what you think you become"&nbsp;&nbsp;•&nbsp;&nbsp;"Stay hungry, stay foolish"&nbsp;&nbsp;•&nbsp;&nbsp;"Do what you can, with what you have, where you are"&nbsp;&nbsp;•&nbsp;&nbsp;"Light tomorrow with today"&nbsp;&nbsp;•&nbsp;&nbsp;"Everything you can imagine is real"&nbsp;&nbsp;•&nbsp;&nbsp;"The journey of a thousand miles begins with a single step"&nbsp;&nbsp;•&nbsp;&nbsp;"Focus on the step in front of you, not the whole staircase"&nbsp;&nbsp;•&nbsp;&nbsp;"Where there is love there is life"&nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
        </div>
      </div>

      <style>{`
        .motion-bar {
          width: 100%;
          height: 35px;
          background: linear-gradient(90deg, #fdf6e3 0%, #fff8e7 50%, #fdf6e3 100%);
          overflow: hidden;
          white-space: nowrap;
          display: flex;
          align-items: center;
          position: relative;
          z-index: 10;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 0.80rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;

          /* Gold top & bottom lines */
          border-top: 2px solid #d4af37;
          border-bottom: 2px solid #d4af37;
          box-shadow: 
            inset 0 1px 0 rgba(255, 232, 138, 0.6),
            inset 0 -1px 0 rgba(255, 232, 138, 0.6),
            0 2px 10px rgba(0, 0, 0, 0.06);
        }

        /* Soft side fades */
        .motion-bar::before,
        .motion-bar::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 70px;
          z-index: 2;
          pointer-events: none;
        }

        .motion-bar::before {
          left: 0;
          background: linear-gradient(to right, #fdf6e3, transparent);
        }

        .motion-bar::after {
          right: 0;
          background: linear-gradient(to left, #fdf6e3, transparent);
        }

        .motion-bar-track {
          display: inline-flex;
          animation: scroll-left 150s linear infinite;
        }

        .motion-bar-track span {
          padding-right: 3.5rem;
          background: linear-gradient(90deg, #3a2f1a, #8b6914, #3a2f1a);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        @keyframes scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .motion-bar:hover .motion-bar-track {
          animation-play-state: paused;
        }
      `}
      </style>
      {/* ===== End Motion Bar ===== */}

      {/* ===== Global Search Perspectives ===== */}
      <form className="global-search-bar" onSubmit={handleGlobalSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search perspectives — scientists or posts…"
          aria-label="Global search perspectives"
        />
        <button type="submit">Search</button>
      </form>

      <style>{`
        .global-search-bar {
          display: flex;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 560px;
          margin: 20px auto;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(6, 18, 31, 0.55);
          backdrop-filter: blur(6px);
          position: sticky;
          top: 12px;
          z-index: 400;
        }

        .global-search-bar input {
          flex: 1;
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.4);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 14px;
          outline: none;
        }

        .global-search-bar input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .global-search-bar input:focus {
          border-color: #d4af37;
        }

        .global-search-bar button {
          padding: 10px 22px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(90deg, #d4af37, #ffe88a);
          color: #06121f;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
      `}
      </style>
      {/* ===== End Global Search Perspectives ===== */}

      <Sidebar onInfoClick={() => setInfoOpen(true)} />

      <button
        onClick={() => navigate('/create-perspective')}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 500,
          padding: '14px 22px',
          borderRadius: 999,
          border: 'none',
          background: 'linear-gradient(90deg, #D4AF37, #FFE88A)',
          color: '#06121f',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}
      >
        + Create Perspective
      </button>

      <CardGallery />

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

      <footer>
        <hr style={{ width: '100%', marginTop: '5%' }} />
        <p style={{ textAlign: 'center', fontSize: 15, color: '#ffffff' }}>
          &copy; 2026 Modern Perspectives. All rights reserved.
        </p>
      </footer>
    </>
  );
}