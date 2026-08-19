import { useState } from 'react';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const { signUp } = useAuthContext();
  const navigate = useNavigate();

  function showToast(message, isError = false) {
    setToast({ message, type: isError ? 'error' : '' });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  }

  async function handleSignUp() {
    if (!fullname.trim() || !email.trim() || !password || !confirm) {
      showToast('Please fill in all fields!', true);
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      showToast('Your email format is invalid!', true);
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long!', true);
      return;
    }
    if (password !== confirm) {
      showToast('Passwords do not match!', true);
      return;
    }

    setSubmitting(true);
    const result = await signUp(fullname.trim(), email.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.message, true);
      return;
    }
    showToast('Account created successfully!', false);
    setTimeout(() => navigate('/'), 1500);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSignUp();
  }

  return (
    <>
      <video autoPlay muted loop playsInline id="bg-video">
        <source src={fishVideo} type="video/mp4" />
      </video>

      <div className="form-container">
        <div id="toast" className={`toast${toast.message ? ' show' + (toast.type === 'error' ? ' error' : '') : ''}`} role="alert">
          {toast.message}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <h2>Sign Up</h2>

          <label htmlFor="fullname">Full Name</label>
          <input
            type="text"
            id="fullname"
            placeholder="Your full name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              type={showPw1 ? 'text' : 'password'}
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" aria-label="Show password" onClick={() => setShowPw1((s) => !s)}>
              {showPw1 ? EYE_SLASH : EYE}
            </button>
          </div>

          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="input-wrap">
            <input
              type={showPw2 ? 'text' : 'password'}
              id="confirm-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" aria-label="Show password" onClick={() => setShowPw2((s) => !s)}>
              {showPw2 ? EYE_SLASH : EYE}
            </button>
          </div>

          <hr style={{ margin: '10px 0', border: 0 }} />
          <button type="button" disabled={submitting} onClick={handleSignUp}>
            {submitting ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <nav className="nav">
          <hr />
          <Link to="/login">Log In</Link>
          <hr />
        </nav>
      </div>
    </>
  );
}