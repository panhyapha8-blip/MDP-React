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
        <p className="settings-loading">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-shell">
        {/* Header */}
        <div className="settings-header">
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="settings-title-block">
            <h1>Settings</h1>
            <p className="settings-subtitle">
              Changes are saved to Supabase and apply to every page
            </p>
          </div>
        </div>

        {/* Status banner */}
        {(saving || error) && (
          <div
            className={`settings-status ${saving ? 'saving' : ''} ${error ? 'error' : ''}`}
          >
            {saving
              ? 'Saving changes…'
              : error
              ? error
              : null}
          </div>
        )}

        <div className="settings-content">
          {/* Appearance */}
          <div className="settings-section">
            <h2 className="section-header">Appearance</h2>
            <div className="setting-row">
              <div className="setting-meta">
                <label>Theme</label>
                <div className="setting-hint">System, light or dark mode</div>
              </div>
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
              <div className="setting-meta">
                <label>Density</label>
                <div className="setting-hint">Compact / Comfortable / Spacious</div>
              </div>
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
              <div className="setting-meta">
                <label>Reduce motion</label>
                <div className="setting-hint">Minimize animations and transitions</div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                  disabled={saving}
                />
                <div className="toggle-track"></div>
              </div>
            </div>
          </div>

          {/* Notifications & Focus */}
          <div className="settings-section">
            <h2 className="section-header">Notifications & Focus</h2>
            <div className="setting-row toggle">
              <div className="setting-meta">
                <label>Enable notifications</label>
                <div className="setting-hint">Receive push and in-app notifications</div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                  disabled={saving}
                />
                <div className="toggle-track"></div>
              </div>
            </div>

            <div className="setting-row toggle">
              <div className="setting-meta">
                <label>Focus mode</label>
                <div className="setting-hint">Reduce distractions and stay focused</div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.focusMode}
                  onChange={(e) => updateSetting('focusMode', e.target.checked)}
                  disabled={saving}
                />
                <div className="toggle-track"></div>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-meta">
                <label>Quiet hours</label>
                <div className="setting-hint">Set a time range for reduced notifications</div>
              </div>
              <div className="quiet-hours">
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => updateQuietHours('start', e.target.value)}
                  disabled={saving}
                />
                <span className="quiet-sep">to</span>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-section">
            <h2 className="section-header">Privacy & Data</h2>
            <div className="setting-row">
              <div className="setting-meta">
                <label>Profile visibility</label>
                <div className="setting-hint">Control who can see your profile</div>
              </div>
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
          </div>

          {/* Accessibility */}
          <div className="settings-section">
            <h2 className="section-header">Accessibility</h2>
            <div className="setting-row toggle">
              <div className="setting-meta">
                <label>High contrast</label>
                <div className="setting-hint">Increase contrast for better readability</div>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting('highContrast', e.target.checked)}
                  disabled={saving}
                />
                <div className="toggle-track"></div>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-meta">
                <label>Font scale</label>
                <div className="setting-hint">
                  {settings.fontScale.toFixed(1)}×
                </div>
              </div>
              <input
                type="range"
                min="0.9"
                max="1.3"
                step="0.1"
                value={settings.fontScale}
                onChange={(e) => updateSetting('fontScale', parseFloat(e.target.value))}
                disabled={saving}
                className="range-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button
              className="btn secondary"
              onClick={resetSettings}
              disabled={saving}
            >
              Reset to defaults
            </button>
            <button
              className="btn primary"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
