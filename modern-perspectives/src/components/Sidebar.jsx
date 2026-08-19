import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import logo from '../assets/images/MP_Logo.png';

export default function Sidebar({ onInfoClick }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { user, getAvatar } = useAuthContext();
  const navigate = useNavigate();

  const toggleSidebar = () => setOpen((o) => !o);

  const navGroups = [
    {
      label: 'Main',
      items: [
        { text: 'Home', active: true },
        { text: 'Dashboard', onClick: () => navigate('/dashboard') },
        { text: 'Create Perspective', onClick: () => navigate('/create-perspective') },
      ],
    },
    {
      label: 'Management',
      items: [
        { text: 'Messages', onClick: () => navigate('/messages') },
        { text: 'Calendar', onClick: () => navigate('/calendar') },
      ],
    },
    {
      label: 'General',
      items: [
        { text: 'Settings', onClick: () => navigate('/setting') },
        { text: 'Info', onClick: onInfoClick },
      ],
    },
  ];

  const query = search.trim().toLowerCase();

  const avatarSrc = user ? getAvatar(user.email) : null;

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        style={{
          position: 'fixed',
          left: 5,
          top: 5,
          zIndex: 10,
          width: 40,
          height: 40,
          backgroundColor: 'rgba(0, 0, 0, 0.33)',
          color: 'white',
          borderRadius: 10,
        }}
      >
        ☰
      </button>

      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={toggleSidebar} />

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo" style={{ transform: 'scale(1.05)', transition: 'transform 0.3s ease' }}>
            <div className="logo-icon">
              <img src={logo} alt="MP Logo" style={{ width: 40, height: 40 }} />
            </div>
            <span className="logo-text">Modern Perspectives</span>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-box">
            <span className="fa fa-search"></span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => {
            const visibleItems = !query
              ? group.items
              : group.items.filter((item) => item.text.toLowerCase().includes(query));
            if (query && visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <div
                  className="nav-label"
                  style={{ textDecoration: 'underline', transform: 'scale(1.05)', transition: 'transform 0s ease' }}
                >
                  {group.label}
                </div>
                {visibleItems.map((item) => (
                  <a
                    key={item.text}
                    className={`nav-item${item.active ? ' active' : ''}`}
                    onClick={item.onClick}
                    style={{ cursor: item.onClick ? 'pointer' : 'default' }}
                  >
                    <span className="nav-text">{item.text}</span>
                  </a>
                ))}
              </div>
            );
          })}
        </nav>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 'auto',
            paddingTop: 5,
            fontFamily: "'Georgia', sans-serif",
          }}
        >
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 6px',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'white',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user ? (
                user.fullname.charAt(0).toUpperCase()
              ) : (
                '?'
              )}
            </div>
            <div style={{ lineHeight: 1.3, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user ? user.fullname : 'Guest'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Free plan</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}