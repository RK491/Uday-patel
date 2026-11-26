export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'chickenland_theme_v1';

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidThemeMode(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setStoredTheme(theme: ThemeMode): void {
  if (!isValidThemeMode(theme)) return;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }
  applyThemeToDocument(theme);
}

export const WEATHER_EFFECTS_STORAGE_KEY = 'chickenland_weather_effects_v1';

export function getStoredWeatherEffectsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = window.localStorage.getItem(WEATHER_EFFECTS_STORAGE_KEY);
    if (saved === 'false' || saved === '0') return false;
    if (saved === 'true' || saved === '1') return true;
  } catch {
    // Ignore storage errors
  }
  return true;
}

export function setStoredWeatherEffectsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WEATHER_EFFECTS_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}
