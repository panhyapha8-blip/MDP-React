import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import greekBg from '../assets/images/greek.jpg';

export default function Header() {
  const { user, signOut, getAvatar } = useAuthContext();
  const avatarSrc = user ? getAvatar(user.email) : null;

  return (
    <header style={{ backgroundImage: `url(${greekBg})`  }}>      <div>
        <nav className="nav">
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'transparent',
                borderRadius: 8,
                padding: '6px 12px',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: 16,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.fullname.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{user.fullname}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Free plan</div>
              </div>
              <Link
                to="/login"
                onClick={signOut}
                style={{ marginLeft: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none' }}
              >
                ✕
              </Link>
            </div>
          ) : (
            <Link to="/login" className="a">
              Log In/Sign Up
            </Link>
          )}
        </nav>
        <p style={{ marginTop: -30 }}></p>
        <h1 style={{ position: 'relative', top: -10 }}>Welcome to Modern Perspectives!</h1>
        <hr style={{ width: '25%', border: '1.5px solid #ccc', position: 'relative', top: -10 }} />
        <p style={{ marginTop: -5 }}></p>
        <h3 style={{ position: 'relative', top: -10 }}>Find Your Strengths with us.</h3>
      </div>
    </header>
  );
}
