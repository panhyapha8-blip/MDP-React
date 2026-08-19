import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import fishVideo from '../assets/video/fish1.mp4';

const EYE = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_SLASH = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginPage() {
  const [nameEmail, setNameEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  }

  async function handleSignIn() {
    if (!nameEmail.trim()) {
      showToast('Enter your name or email', 'error');
      return;
    }
    if (!password) {
      showToast('Enter your password', 'error');
      return;
    }

    setSubmitting(true);
    const result = await signIn(nameEmail.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    showToast('Login successful! Welcome ' + result.user.fullname, 'success');
    setTimeout(() => navigate('/'), 1500);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Enter') handleSignIn();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  return (
    <>
      <video autoPlay muted loop playsInline id="bg-video">
        <source src={fishVideo} type="video/mp4" />
      </video>

      <div className="form-container">
        <div id="toast" className={`toast${toast.message ? ' show ' + toast.type : ''}`} role="alert">
          {toast.message}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <h2>Log In/Sign In</h2>

          <label htmlFor="name-email">Name/Email</label>
          <input
            type="text"
            id="name-email"
            placeholder="Your name or email"
            value={nameEmail}
            onChange={(e) => setNameEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              id="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" aria-label="Show password" onClick={() => setShowPw((s) => !s)}>
              {showPw ? EYE_SLASH : EYE}
            </button>
          </div>

          <hr style={{ margin: 10, border: 0 }} />

          <button type="button" disabled={submitting} onClick={handleSignIn}>
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <nav className="nav">
          <hr />
          <Link to="/signup">Sign Up</Link>
          <hr />
        </nav>
      </div>
    </>
  );
}