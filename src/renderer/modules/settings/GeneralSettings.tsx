import React from 'react';
import './settings.css';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { ThemeMode, DateFormat, TimeFormat, Language } from '../../../shared/types';

// Mini chart SVG preview for theme cards
const ThemePreview: React.FC<{ mode: ThemeMode }> = ({ mode }) => {
  const isDark = mode === 'dark';
  const isLight = mode === 'light';
  // For system mode: left half dark, right half light
  const darkHalf = mode === 'system';
  const lightHalf = mode === 'system';

  const bgDark = '#131722';
  const bgLight = '#ffffff';
  const bg = isDark ? bgDark : isLight ? bgLight : bgDark;
  const panelDark = '#1e222d';
  const panelLight = '#f0f3fa';
  const panel = isDark ? panelDark : isLight ? panelLight : panelDark;
  const gridDark = '#2a2e39';
  const gridLight = '#e0e3eb';
  const grid = isDark ? gridDark : isLight ? gridLight : gridDark;
  const textDark = '#787b86';
  const textLight = '#9598a1';
  const text = isDark ? textDark : isLight ? textLight : textDark;
  const green = '#26a69a';
  const red = '#ef5350';
  const accent = '#2962ff';

  const candleW = 5;
  const candles = [
    { x: 8, o: 38, c: 34, h: 32, l: 40, up: true },
    { x: 16, o: 34, c: 30, h: 28, l: 36, up: true },
    { x: 24, o: 30, c: 33, h: 29, l: 35, up: false },
    { x: 32, o: 33, c: 28, h: 26, l: 35, up: true },
    { x: 40, o: 28, c: 24, h: 22, l: 30, up: true },
    { x: 48, o: 24, c: 27, h: 23, l: 29, up: false },
    { x: 56, o: 27, c: 22, h: 20, l: 29, up: true },
    { x: 64, o: 22, c: 25, h: 21, l: 27, up: false },
    { x: 72, o: 25, c: 20, h: 18, l: 27, up: true },
    { x: 80, o: 20, c: 17, h: 15, l: 22, up: true },
    { x: 88, o: 17, c: 14, h: 12, l: 19, up: true },
    { x: 96, o: 14, c: 16, h: 13, l: 18, up: false },
    { x: 104, o: 16, c: 12, h: 10, l: 18, up: true },
    { x: 112, o: 12, c: 15, h: 11, l: 17, up: false },
  ];

  // MA line points
  const maPoints = candles.map((c) => `${c.x + 2.5},${(c.o + c.c) / 2}`).join(' ');

  return (
    <svg viewBox="0 0 128 72" className="settings-theme-svg" preserveAspectRatio="none">
      {/* Background */}
      <rect x="0" y="0" width="128" height="72" fill={bg} />
      {mode === 'system' && (
        <>
          <rect x="64" y="0" width="64" height="72" fill={bgLight} />
          <defs>
            <clipPath id="sysClipDark"><rect x="0" y="0" width="64" height="72" /></clipPath>
            <clipPath id="sysClipLight"><rect x="64" y="0" width="64" height="72" /></clipPath>
          </defs>
        </>
      )}

      {/* Grid lines */}
      <g stroke={isLight ? gridLight : gridDark} strokeWidth="0.5" opacity="0.6">
        <line x1="0" y1="18" x2="128" y2="18" />
        <line x1="0" y1="36" x2="128" y2="36" />
        <line x1="0" y1="54" x2="128" y2="54" />
      </g>
      {mode === 'system' && (
        <g stroke={gridLight} strokeWidth="0.5" opacity="0.6" clipPath="url(#sysClipLight)">
          <line x1="64" y1="18" x2="128" y2="18" />
          <line x1="64" y1="36" x2="128" y2="36" />
          <line x1="64" y1="54" x2="128" y2="54" />
        </g>
      )}

      {/* Candles */}
      {candles.map((cd, i) => {
        const color = cd.up ? green : red;
        const bodyY = Math.min(cd.o, cd.c);
        const bodyH = Math.abs(cd.o - cd.c);
        return (
          <g key={i}>
            <line x1={cd.x + 2.5} y1={cd.h} x2={cd.x + 2.5} y2={cd.l} stroke={color} strokeWidth="0.6" />
            <rect x={cd.x} y={bodyY} width={candleW} height={Math.max(bodyH, 1)} fill={color} rx="0.5" />
          </g>
        );
      })}

      {/* MA line */}
      <polyline points={maPoints} fill="none" stroke={accent} strokeWidth="1" opacity="0.8" strokeLinejoin="round" />

      {/* Volume bars at bottom */}
      {candles.map((cd, i) => {
        const volH = 3 + (i % 3) * 2;
        const color = cd.up ? green : red;
        return (
          <rect key={`v${i}`} x={cd.x} y={72 - volH} width={candleW} height={volH} fill={color} opacity="0.3" rx="0.5" />
        );
      })}

      {/* System divider line */}
      {mode === 'system' && (
        <line x1="64" y1="0" x2="64" y2="72" stroke="#434651" strokeWidth="0.5" strokeDasharray="2,1.5" />
      )}
    </svg>
  );
};

const THEME_OPTIONS: { value: ThemeMode; label: string; desc: string }[] = [
];

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD', example: '2026-07-22' },
  { value: 'MM/dd', label: 'MM/DD', example: '07/22' },
  { value: 'dd/MM', label: 'DD/MM', example: '22/07' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD', example: '2026/07/22' },
  { value: 'MMM dd', label: '月 日', example: '7月 22' },
  { value: 'dd MMM', label: '日 月', example: '22 7月' },
];

const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string; example: string }[] = [
  { value: 'HH:mm', label: 'HH:mm', example: '09:30' },
  { value: 'HH:mm:ss', label: 'HH:mm:ss', example: '09:30:15' },
  { value: 'hh:mm A', label: 'hh:mm AM/PM', example: '09:30 AM' },
  { value: 'hh:mm:ss A', label: 'hh:mm:ss AM/PM', example: '09:30:15 AM' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en-US', label: 'English' },
];

const GeneralSettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const setAppSettings = useStore((s) => s.setAppSettings);
  const setTheme = useStore((s) => s.setTheme);
  const setFontSize = useStore((s) => s.setFontSize);
  const resolvedTheme = useStore((s) => s.resolvedTheme);
  const L = useTBatch([
    'settings.appearance', 'settings.appearanceDesc',
    'settings.themeDark', 'settings.themeDarkDesc',
    'settings.themeLight', 'settings.themeLightDesc',
    'settings.themeSystem', 'settings.themeSystemDesc',
    'settings.systemTheme', 'settings.resolvedDark', 'settings.resolvedLight',
    'settings.fontSize', 'settings.fontSizeSmall', 'settings.fontSizeNormal',
    'settings.fontSizeLarge', 'settings.fontSizeXLarge', 'settings.fontSizeHint',
    'settings.language', 'settings.languageDesc', 'settings.interfaceLanguage',
    'settings.dateFormat', 'settings.dateFormatDesc',
    'settings.dateFormatLabel', 'settings.dateFormatHint',
    'settings.timeFormatLabel', 'settings.timeFormatHint',
    'settings.crosshairSeconds', 'settings.crosshairSecondsHint',
    'settings.dateFormatMonthDay', 'settings.dateFormatDayMonth',
    'settings.system', 'settings.systemDesc',
    'settings.closeWindow', 'settings.minimizeToTray', 'settings.directExit',
    'settings.closeWindowHint', 'settings.autoStart', 'settings.autoStartHint',
    'settings.soundAlerts', 'settings.soundAlertsHint',
    'settings.on', 'settings.off',
  ] as any);

  return (
    <div className="settings-section">
      {/* Appearance */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.appearance']}</h2>
        <p className="settings-card-desc">{L['settings.appearanceDesc']}</p>

        <div className="settings-theme-grid">
          {([
            { value: 'dark' as ThemeMode, label: L['settings.themeDark'], desc: L['settings.themeDarkDesc'] },
            { value: 'light' as ThemeMode, label: L['settings.themeLight'], desc: L['settings.themeLightDesc'] },
            { value: 'system' as ThemeMode, label: L['settings.themeSystem'], desc: L['settings.themeSystemDesc'] },
          ]).map((opt) => (
            <button
              key={opt.value}
              className={`settings-theme-card${appSettings.theme === opt.value ? ' settings-theme-card-active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              <div className={`settings-theme-preview ${opt.value}`}>
                <ThemePreview mode={opt.value} />
              </div>
              <div className="settings-theme-label">{opt.label}</div>
              <div className="settings-theme-desc">{opt.desc}</div>
            </button>
          ))}
        </div>
        {appSettings.theme === 'system' && (
          <div className="settings-hint-row">
            {L['settings.systemTheme']}: <span className="settings-hint-value">{resolvedTheme === 'dark' ? L['settings.resolvedDark'] : L['settings.resolvedLight']}</span>
          </div>
        )}

        <div className="settings-form-grid" style={{ marginTop: 12, gridTemplateColumns: '1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.fontSize']}</label>
            <div className="settings-font-size-options">
              {([
                { value: 'small' as const, label: L['settings.fontSizeSmall'] },
                { value: 'normal' as const, label: L['settings.fontSizeNormal'] },
                { value: 'large' as const, label: L['settings.fontSizeLarge'] },
                { value: 'xlarge' as const, label: L['settings.fontSizeXLarge'] },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  className={`settings-font-size-btn${(appSettings.fontSize ?? 'normal') === opt.value ? ' settings-font-size-btn-active' : ''}`}
                  onClick={() => setFontSize(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
            <span className="settings-hint">{L['settings.fontSizeHint']}</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.language']}</h2>
        <p className="settings-card-desc">{L['settings.languageDesc']}</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.interfaceLanguage']}</label>
            <select
              className="settings-select"
              value={appSettings.language}
              onChange={(e) => setAppSettings({ language: e.target.value as Language })}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date & Time Format */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.dateFormat']}</h2>
        <p className="settings-card-desc">{L['settings.dateFormatDesc']}</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">{L['settings.dateFormatLabel']}</label>
            <select
              className="settings-select"
              value={appSettings.dateFormat}
              onChange={(e) => setAppSettings({ dateFormat: e.target.value as DateFormat })}
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.example})</option>
              ))}
            </select>
            <span className="settings-hint">{L['settings.dateFormatHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.timeFormatLabel']}</label>
            <select
              className="settings-select"
              value={appSettings.timeFormat}
              onChange={(e) => setAppSettings({ timeFormat: e.target.value as TimeFormat })}
            >
              {TIME_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.example})</option>
              ))}
            </select>
            <span className="settings-hint">{L['settings.timeFormatHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.crosshairSeconds']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.showSecondsInCrosshair ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ showSecondsInCrosshair: !appSettings.showSecondsInCrosshair })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.showSecondsInCrosshair ? L['settings.on'] : L['settings.off']}
              </span>
            </div>
            <span className="settings-hint">{L['settings.crosshairSecondsHint']}</span>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.system']}</h2>
        <p className="settings-card-desc">{L['settings.systemDesc']}</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.closeWindow']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.minimizeToTray ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ minimizeToTray: !appSettings.minimizeToTray })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.minimizeToTray ? L['settings.minimizeToTray'] : L['settings.directExit']}
              </span>
            </div>
            <span className="settings-hint">{L['settings.closeWindowHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.autoStart']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.autoStart ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ autoStart: !appSettings.autoStart })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.autoStart ? L['settings.on'] : L['settings.off']}
              </span>
            </div>
            <span className="settings-hint">{L['settings.autoStartHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.soundAlerts']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.enableSoundAlerts ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ enableSoundAlerts: !appSettings.enableSoundAlerts })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.enableSoundAlerts ? L['settings.on'] : L['settings.off']}
              </span>
            </div>
            <span className="settings-hint">{L['settings.soundAlertsHint']}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
