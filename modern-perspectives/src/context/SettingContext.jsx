import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============ YOUR SUPABASE CLIENT ============
// If you already have a supabase client file, import it instead:
// import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ==============================================

const SettingsContext = createContext(null);

const defaultSettings = {
  theme: 'system',
  density: 'comfortable',
  reducedMotion: false,
  notificationsEnabled: true,
  focusMode: false,
  quietHours: { start: '22:00', end: '07:00' },
  profileVisibility: 'friends',
  shareUsageData: false,
  personalizedRecommendations: true,
  defaultPerspectiveView: 'timeline',
  contentLanguage: 'en',
  autoSaveDrafts: true,
  highContrast: false,
  fontScale: 1,
  screenReaderHints: true,
};

// Convert DB snake_case → JS camelCase
function fromDB(row) {
  if (!row) return defaultSettings;
  return {
    theme: row.theme ?? 'system',
    density: row.density ?? 'comfortable',
    reducedMotion: row.reduced_motion ?? false,
    notificationsEnabled: row.notifications_enabled ?? true,
    focusMode: row.focus_mode ?? false,
    quietHours: row.quiet_hours ?? { start: '22:00', end: '07:00' },
    profileVisibility: row.profile_visibility ?? 'friends',
    shareUsageData: row.share_usage_data ?? false,
    personalizedRecommendations: row.personalized_recommendations ?? true,
    defaultPerspectiveView: row.default_perspective_view ?? 'timeline',
    contentLanguage: row.content_language ?? 'en',
    autoSaveDrafts: row.auto_save_drafts ?? true,
    highContrast: row.high_contrast ?? false,
    fontScale: Number(row.font_scale) || 1,
    screenReaderHints: row.screen_reader_hints ?? true,
  };
}

// Convert JS camelCase → DB snake_case
function toDB(settings) {
  return {
    theme: settings.theme,
    density: settings.density,
    reduced_motion: settings.reducedMotion,
    notifications_enabled: settings.notificationsEnabled,
    focus_mode: settings.focusMode,
    quiet_hours: settings.quietHours,
    profile_visibility: settings.profileVisibility,
    share_usage_data: settings.shareUsageData,
    personalized_recommendations: settings.personalizedRecommendations,
    default_perspective_view: settings.defaultPerspectiveView,
    content_language: settings.contentLanguage,
    auto_save_drafts: settings.autoSaveDrafts,
    high_contrast: settings.highContrast,
    font_scale: settings.fontScale,
    screen_reader_hints: settings.screenReaderHints,
  };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Apply visual effects to the whole app
  const applySettingsToDOM = useCallback((s) => {
    const root = document.documentElement;

    let theme = s.theme;
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    root.setAttribute('data-density', s.density);
    root.setAttribute('data-reduced-motion', s.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-high-contrast', s.highContrast ? 'true' : 'false');
    root.style.setProperty('--font-scale', s.fontScale);
    root.setAttribute('data-focus-mode', s.focusMode ? 'true' : 'false');
  }, []);

  // Load settings from Supabase
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in → use defaults + localStorage
          const saved = localStorage.getItem('app-settings');
          if (saved && !cancelled) {
            const parsed = { ...defaultSettings, ...JSON.parse(saved) };
            setSettings(parsed);
            applySettingsToDOM(parsed);
          } else {
            applySettingsToDOM(defaultSettings);
          }
          return;
        }

        // Try to get existing settings
        let { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // If no row exists yet, create one
        if (!data) {
          const { data: created, error: insertError } = await supabase
            .from('user_settings')
            .insert({ user_id: user.id, ...toDB(defaultSettings) })
            .select()
            .single();

          if (insertError) throw insertError;
          data = created;
        }

        if (!cancelled) {
          const merged = fromDB(data);
          setSettings(merged);
          applySettingsToDOM(merged);
          localStorage.setItem('app-settings', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Supabase load failed, using localStorage', err);

        try {
          const saved = localStorage.getItem('app-settings');
          if (saved && !cancelled) {
            const parsed = { ...defaultSettings, ...JSON.parse(saved) };
            setSettings(parsed);
            applySettingsToDOM(parsed);
          } else {
            applySettingsToDOM(defaultSettings);
          }
        } catch {
          applySettingsToDOM(defaultSettings);
        }

        if (!cancelled) {
          setError('Could not load settings from Supabase. Using local data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [applySettingsToDOM]);

  // System theme listener
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applySettingsToDOM(settings);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings, applySettingsToDOM]);

  // Save helper
  const persist = async (next) => {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Not logged in → only localStorage
        localStorage.setItem('app-settings', JSON.stringify(next));
        return;
      }

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            ...toDB(next),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) throw upsertError;

      localStorage.setItem('app-settings', JSON.stringify(next));
    } catch (err) {
      console.error(err);
      setError('Failed to save settings to Supabase');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettingsToDOM(next);
    await persist(next);
  };

  const updateQuietHours = async (field, value) => {
    const next = {
      ...settings,
      quietHours: { ...settings.quietHours, [field]: value },
    };
    setSettings(next);
    applySettingsToDOM(next);
    await persist(next);
  };

  const saveSettings = async () => {
    await persist(settings);
    return !error;
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    applySettingsToDOM(defaultSettings);
    await persist(defaultSettings);
  };

  const value = {
    settings,
    loading,
    saving,
    error,
    updateSetting,
    updateQuietHours,
    saveSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}