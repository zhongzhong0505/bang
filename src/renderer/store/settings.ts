import type { StateCreator } from 'zustand';
import type { AppSettings, ThemeMode, ThemeColors } from '../../shared/types';
import { DEFAULT_APP_SETTINGS, DARK_COLORS, LIGHT_COLORS } from '../../shared/types';
import type { AppState } from './index';

export interface SettingsSlice {
  appSettings: AppSettings;
  setAppSettings: (s: Partial<AppSettings>) => void;
  setFontSize: (size: 'small' | 'normal' | 'large' | 'xlarge') => void;
  resolvedTheme: 'dark' | 'light';
  themeColors: ThemeColors;
  setTheme: (t: ThemeMode) => void;
}

const cssVarMap: Record<string, string> = {
  bgPrimary: '--bg-primary', bgSecondary: '--bg-secondary', bgTertiary: '--bg-tertiary',
  bgHover: '--bg-hover', bgActive: '--bg-active', border: '--border', borderLight: '--border-light',
  textPrimary: '--text-primary', textSecondary: '--text-secondary', textMuted: '--text-muted',
  accent: '--accent', green: '--green', red: '--red', gridColor: '--grid-color',
  chartBg: '--chart-bg', crosshairColor: '--crosshair-color',
};

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
  appSettings: { ...DEFAULT_APP_SETTINGS },
  setAppSettings: (partial) => {
    set((s) => ({ appSettings: { ...s.appSettings, ...partial } }));
    if (partial.theme !== undefined) {
      get().setTheme(partial.theme);
    }
  },
  resolvedTheme: 'dark',
  themeColors: { ...DARK_COLORS },
  setTheme: (t) => {
    const resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    const colors = resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    set((s) => ({
      appSettings: { ...s.appSettings, theme: t },
      resolvedTheme: resolved as 'dark' | 'light',
      themeColors: colors,
    }));
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, val]) => {
      const cssKey = cssVarMap[key];
      if (cssKey) root.style.setProperty(cssKey, val);
    });
  },
  setFontSize: (size) => {
    const scale: Record<string, number> = { small: 0.9, normal: 1.0, large: 1.12, xlarge: 1.25 };
    const zoom = scale[size] ?? 1.0;
    document.documentElement.style.setProperty('--app-zoom', String(zoom));
    set((s) => ({ appSettings: { ...s.appSettings, fontSize: size } }));
  },
});
