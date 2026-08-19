import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingContext';
import './setting.css';

export default function Settings() {
  const navigate = useNavigate();
  const {
    settings,
    loading,
    saving,
    error,
    updateSetting,
    updateQuietHours,
    saveSettings,
    resetSettings,
  } = useSettings();

  if (loading) {
    return (
      <div className="settings-page">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Settings</h1>
        <p className="subtitle">
          Changes are saved to Supabase and apply to every page
        </p>
        {saving && (
          <div className="alert alert-secondary" role="status">
            Saving...
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </header>

      <div className="settings-content">
        {/* Appearance */}
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-row">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              disabled={saving}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="setting-row">
            <label>Density</label>
            <select
              value={settings.density}
              onChange={(e) => updateSetting('density', e.target.value)}
              disabled={saving}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div className="setting-row toggle">
            <label>Reduce motion</label>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              disabled={saving}
            />
          </div>
        </section>

        {/* Notifications & Focus */}
        <section className="settings-section">
          <h2>Notifications & Focus</h2>
          <div className="setting-row toggle">
            <label>Enable notifications</label>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
              disabled={saving}
            />
          </div>

          <div className="setting-row toggle">
            <label>Focus mode</label>
            <input
              type="checkbox"
              checked={settings.focusMode}
              onChange={(e) => updateSetting('focusMode', e.target.checked)}
              disabled={saving}
            />
          </div>

          <div className="setting-row">
            <label>Quiet hours</label>
            <div className="quiet-hours">
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => updateQuietHours('start', e.target.value)}
                disabled={saving}
              />
              <span>to</span>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => updateQuietHours('end', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="settings-section">
          <h2>Privacy & Data</h2>
          <div className="setting-row">
            <label>Profile visibility</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => updateSetting('profileVisibility', e.target.value)}
              disabled={saving}
            >
              <option value="public">Public</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>
        </section>

        {/* Accessibility */}
        <section className="settings-section">
          <h2>Accessibility</h2>
          <div className="setting-row toggle">
            <label>High contrast</label>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
              disabled={saving}
            />
          </div>

          <div className="setting-row">
            <label>Font scale ({settings.fontScale.toFixed(1)}×)</label>
            <input
              type="range"
              min="0.9"
              max="1.3"
              step="0.1"
              value={settings.fontScale}
              onChange={(e) => updateSetting('fontScale', parseFloat(e.target.value))}
              disabled={saving}
            />
          </div>
        </section>

        <div className="settings-actions">
          <button className="btn secondary" onClick={resetSettings} disabled={saving}>
            Reset to defaults
          </button>
          <button className="btn primary" onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}