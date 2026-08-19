import { useState, useEffect, useRef, useCallback } from 'react';
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

const CAMERA = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ---- security config -------------------------------------------------
const MAX_NAME_LEN = 50;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_SAVE_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000; // 30s client-side cooldown after repeated failures

const FILE_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

function readFileHeader(file, length = 12) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, length));
  });
}

async function isGenuineImage(file) {
  try {
    const header = await readFileHeader(file);
    return FILE_SIGNATURES.some(({ bytes }) => bytes.every((b, i) => header[i] === b));
  } catch {
    return false;
  }
}

const AVATAR_OUTPUT_SIZE = 320;
const CROP_PREVIEW_SIZE = 260;
const CROP_MIN_ZOOM = 1;
const CROP_MAX_ZOOM = 3;

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

function exportCroppedDataURL({ img, baseScale, scale, offset, mime, outputSize = AVATAR_OUTPUT_SIZE }) {
  const totalScale = baseScale * scale;
  let sSize = CROP_PREVIEW_SIZE / totalScale;
  let sx = -offset.x / totalScale;
  let sy = -offset.y / totalScale;

  sSize = Math.min(sSize, img.naturalWidth, img.naturalHeight);
  sx = Math.min(Math.max(sx, 0), img.naturalWidth - sSize);
  sy = Math.min(Math.max(sy, 0), img.naturalHeight - sSize);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
  return canvas.toDataURL(mime, 0.9);
}

function clampCropOffset(offset, natural, totalScale) {
  const dispW = natural.w * totalScale;
  const dispH = natural.h * totalScale;
  const minX = Math.min(0, CROP_PREVIEW_SIZE - dispW);
  const minY = Math.min(0, CROP_PREVIEW_SIZE - dispH);
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeText(value) {
  return value.replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '');
}

function passwordStrength(pw) {
  if (pw.length < 8) return { ok: false, reason: 'Password must be at least 8 characters!' };
  if (!/[a-z]/.test(pw)) return { ok: false, reason: 'Include at least one lowercase letter!' };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: 'Include at least one uppercase letter!' };
  if (!/[0-9]/.test(pw)) return { ok: false, reason: 'Include at least one number!' };
  return { ok: true };
}

export default function ProfilePage() {
  const { user, getAvatar, setAvatar, updateProfile, verifyPassword, logout } = useAuthContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fullname, setFullname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwCur, setShowPwCur] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const attemptsRef = useRef(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  // ---- interactive crop modal state ----
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropMime, setCropMime] = useState('image/jpeg');
  const [cropImg, setCropImg] = useState(null);
  const [cropBaseScale, setCropBaseScale] = useState(1);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropSaving, setCropSaving] = useState(false);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFullname(user.fullname);
    setAvatarSrc(getAvatar(user.email));
  }, [user, navigate, getAvatar]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file!', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Image must be smaller than 2 MB!', 'error');
      return;
    }
    const genuine = await isGenuineImage(file);
    if (!genuine) {
      showToast('This file does not look like a valid image!', 'error');
      return;
    }

    if (file.type === 'image/gif') {
      try {
        const dataUrl = await readFileAsDataURL(file);
        setAvatarSrc(dataUrl);
        setAvatar(user.email, dataUrl);
        showToast('Profile photo updated!', 'success');
      } catch {
        showToast('Could not process that image, please try another.', 'error');
      }
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = await loadImageElement(objectUrl);
      const baseScale = CROP_PREVIEW_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      const centered = {
        x: (CROP_PREVIEW_SIZE - img.naturalWidth * baseScale) / 2,
        y: (CROP_PREVIEW_SIZE - img.naturalHeight * baseScale) / 2,
      };
      setCropImg(img);
      setCropSrc(objectUrl);
      setCropMime(file.type === 'image/png' ? 'image/png' : 'image/jpeg');
      setCropBaseScale(baseScale);
      setCropZoom(1);
      setCropOffset(centered);
      setCropOpen(true);
    } catch {
      showToast('Could not open that image for cropping.', 'error');
    }
  }

  function closeCropModal() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropOpen(false);
    setCropSrc(null);
    setCropImg(null);
  }

  function handleCropPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startOffset: cropOffset };
  }

  function handleCropPointerMove(e) {
    if (!dragRef.current.dragging || !cropImg) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const totalScale = cropBaseScale * cropZoom;
    const natural = { w: cropImg.naturalWidth, h: cropImg.naturalHeight };
    const next = {
      x: dragRef.current.startOffset.x + dx,
      y: dragRef.current.startOffset.y + dy,
    };
    setCropOffset(clampCropOffset(next, natural, totalScale));
  }

  function handleCropPointerUp(e) {
    dragRef.current.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function handleCropZoomChange(e) {
    const zoom = Number(e.target.value);
    setCropZoom(zoom);
    if (cropImg) {
      const natural = { w: cropImg.naturalWidth, h: cropImg.naturalHeight };
      setCropOffset((prev) => clampCropOffset(prev, natural, cropBaseScale * zoom));
    }
  }

  function handleCropApply() {
    if (!cropImg) return;
    setCropSaving(true);
    try {
      const dataUrl = exportCroppedDataURL({
        img: cropImg,
        baseScale: cropBaseScale,
        scale: cropZoom,
        offset: cropOffset,
        mime: cropMime,
      });
      setAvatarSrc(dataUrl);
      setAvatar(user.email, dataUrl);
      showToast('Profile photo updated!', 'success');
      closeCropModal();
    } catch {
      showToast('Could not crop that image, please try again.', 'error');
    } finally {
      setCropSaving(false);
    }
  }

  function isLockedOut() {
    if (Date.now() < lockedUntil) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      showToast(`Too many attempts. Try again in ${secs}s.`, 'error');
      return true;
    }
    return false;
  }

  function registerFailedAttempt() {
    attemptsRef.current += 1;
    if (attemptsRef.current >= MAX_SAVE_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
      attemptsRef.current = 0;
    }
  }

  async function handleSave() {
    if (isLockedOut()) return;

    const cleanName = sanitizeText(fullname.trim()).slice(0, MAX_NAME_LEN);
    if (!cleanName) {
      showToast('Full name cannot be empty!', 'error');
      registerFailedAttempt();
      return;
    }

    const wantsPasswordChange = password.length > 0 || confirm.length > 0;

    if (wantsPasswordChange) {
      if (!currentPassword) {
        showToast('Enter your current password to change it!', 'error');
        registerFailedAttempt();
        return;
      }
      const strength = passwordStrength(password);
      if (!strength.ok) {
        showToast(strength.reason, 'error');
        registerFailedAttempt();
        return;
      }
      if (password !== confirm) {
        showToast('Passwords do not match!', 'error');
        registerFailedAttempt();
        return;
      }
      if (password === currentPassword) {
        showToast('New password must be different from the current one!', 'error');
        registerFailedAttempt();
        return;
      }
      if (typeof verifyPassword === 'function') {
        const isCurrentValid = await verifyPassword(user.email, currentPassword);
        if (!isCurrentValid) {
          showToast('Current password is incorrect!', 'error');
          registerFailedAttempt();
          return;
        }
      }
    }

    attemptsRef.current = 0;
    setSaving(true);
    setTimeout(async () => {
      try {
        await updateProfile(cleanName, wantsPasswordChange ? password : undefined);
        setFullname(cleanName);
        setCurrentPassword('');
        setPassword('');
        setConfirm('');
        showToast('Profile updated successfully!', 'success');
      } catch {
        showToast('Could not save changes, please try again.', 'error');
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  function handleLogout() {
    if (typeof logout === 'function') {
      logout();
    }
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <video autoPlay muted loop playsInline className="profile-bg-video">
        <source src={fishVideo} type="video/mp4" />
      </video>

      {/* Toast */}
      <div className={`profile-toast ${toast.message ? `show ${toast.type}` : ''}`}>
        {toast.message}
      </div>

      <button
        className="back-btn"
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 20,
        }}
      >
        ← Back
      </button>

      <button
        className="logout-btn"
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 20,
        }}
      >
        Log out
      </button>

      <div className="profile-shell">
        {/* Header / Avatar block */}
        <header className="profile-header">
          <div className="avatar-block">
            <button
              type="button"
              className="avatar-trigger"
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
            >
              <div className="avatar-ring">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Your avatar" className="avatar-img" />
                ) : (
                  <span className="avatar-fallback">{fullname.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="avatar-overlay">
                {CAMERA}
                <span>Change photo</span>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />

            <div className="profile-identity">
              <h1 className="profile-name">{fullname || 'Your name'}</h1>
              <p className="profile-email-display">{user.email}</p>
              <span className="plan-badge">Free plan</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="profile-main">
          {/* Account info (read-only) */}
          <section className="profile-card">
            <div className="card-header">
              <h2>Account</h2>
              <p className="card-subtitle">Your login email cannot be changed here.</p>
            </div>
            <div className="field">
              <label htmlFor="profile-email">Email address</label>
              <input
                type="email"
                id="profile-email"
                value={user.email}
                disabled
                readOnly
                autoComplete="username"
                className="input-disabled"
              />
            </div>
          </section>

          {/* Edit profile */}
          <section className="profile-card">
            <div className="card-header">
              <h2>Edit profile</h2>
              <p className="card-subtitle">Update your display name and password.</p>
            </div>

            <div className="field">
              <label htmlFor="profile-fullname">Full name</label>
              <input
                type="text"
                id="profile-fullname"
                placeholder="Your full name"
                value={fullname}
                maxLength={MAX_NAME_LEN}
                onChange={(e) => setFullname(sanitizeText(e.target.value))}
                autoComplete="name"
              />
            </div>

            <div className="field-group">
              <div className="field">
                <label>
                  Current password
                  <span className="field-hint">Required only when changing password</span>
                </label>
                <div className="password-field">
                  <input
                    type={showPwCur ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={showPwCur ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPwCur((s) => !s)}
                  >
                    {showPwCur ? EYE_SLASH : EYE}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>
                  New password
                  <span className="field-hint">Leave blank to keep current</span>
                </label>
                <div className="password-field">
                  <input
                    type={showPw1 ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={showPw1 ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw1((s) => !s)}
                  >
                    {showPw1 ? EYE_SLASH : EYE}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Confirm new password</label>
                <div className="password-field">
                  <input
                    type={showPw2 ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={showPw2 ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw2((s) => !s)}
                  >
                    {showPw2 ? EYE_SLASH : EYE}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={saving || Date.now() < lockedUntil}
                onClick={handleSave}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-backdrop" onClick={closeCropModal}>
          <div className="crop-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="crop-modal-header">
              <h3>Adjust your photo</h3>
              <p>Drag to reposition · Zoom until your face fills the circle</p>
            </div>

            <div
              className="crop-stage"
              style={{ width: CROP_PREVIEW_SIZE, height: CROP_PREVIEW_SIZE }}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerLeave={handleCropPointerUp}
            >
              {cropSrc && (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: cropOffset.x,
                    top: cropOffset.y,
                    width: cropImg ? cropImg.naturalWidth * cropBaseScale * cropZoom : 0,
                    height: cropImg ? cropImg.naturalHeight * cropBaseScale * cropZoom : 0,
                    maxWidth: 'none',
                    userSelect: 'none',
                    cursor: 'grab',
                  }}
                />
              )}
              <div className="crop-ring" />
            </div>

            <div className="crop-zoom">
              <span className="zoom-label">Zoom</span>
              <input
                type="range"
                min={CROP_MIN_ZOOM}
                max={CROP_MAX_ZOOM}
                step="0.01"
                value={cropZoom}
                onChange={handleCropZoomChange}
                className="zoom-slider"
                aria-label="Zoom level"
              />
              <span className="zoom-value">{Math.round((cropZoom / CROP_MAX_ZOOM) * 100)}%</span>
            </div>

            <div className="crop-actions">
              <button type="button" className="btn-secondary" onClick={closeCropModal} disabled={cropSaving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleCropApply} disabled={cropSaving}>
                {cropSaving ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}