import React from 'react';
import './settings.css';
import { useStore } from '../../store';
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
  { value: 'dark', label: '暗色', desc: '深色背景，适合长时间使用' },
  { value: 'light', label: '亮色', desc: '浅色背景，适合明亮环境' },
  { value: 'system', label: '跟随系统', desc: '自动跟随操作系统外观设置' },
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
  const resolvedTheme = useStore((s) => s.resolvedTheme);

  return (
    <div className="settings-section">
      {/* Appearance */}
      <div className="settings-card">
        <h2 className="settings-card-title">外观</h2>
        <p className="settings-card-desc">选择应用的主题模式，更改后立即生效</p>

        <div className="settings-theme-grid">
          {THEME_OPTIONS.map((opt) => (
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
            当前系统主题: <span className="settings-hint-value">{resolvedTheme === 'dark' ? '暗色' : '亮色'}</span>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="settings-card">
        <h2 className="settings-card-title">语言</h2>
        <p className="settings-card-desc">选择界面显示语言</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-field">
            <label className="settings-label">界面语言</label>
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
        <h2 className="settings-card-title">日期与时间格式</h2>
        <p className="settings-card-desc">自定义 K 线图时间轴和十字准线的日期时间显示格式</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">日期格式</label>
            <select
              className="settings-select"
              value={appSettings.dateFormat}
              onChange={(e) => setAppSettings({ dateFormat: e.target.value as DateFormat })}
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.example})</option>
              ))}
            </select>
            <span className="settings-hint">K 线图时间轴日期刻度的显示格式</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">时间格式</label>
            <select
              className="settings-select"
              value={appSettings.timeFormat}
              onChange={(e) => setAppSettings({ timeFormat: e.target.value as TimeFormat })}
            >
              {TIME_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.example})</option>
              ))}
            </select>
            <span className="settings-hint">分钟线时间刻度的显示格式</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">十字准线显示秒</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.showSecondsInCrosshair ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ showSecondsInCrosshair: !appSettings.showSecondsInCrosshair })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.showSecondsInCrosshair ? '已开启' : '已关闭'}
              </span>
            </div>
            <span className="settings-hint">在十字准线悬浮时间中显示秒数</span>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="settings-card">
        <h2 className="settings-card-title">系统</h2>
        <p className="settings-card-desc">应用的系统行为设置</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="settings-field">
            <label className="settings-label">关闭窗口时</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.minimizeToTray ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ minimizeToTray: !appSettings.minimizeToTray })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.minimizeToTray ? '最小化到托盘' : '直接退出'}
              </span>
            </div>
            <span className="settings-hint">关闭窗口时是否最小化到系统托盘继续运行</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">开机自启动</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.autoStart ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ autoStart: !appSettings.autoStart })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.autoStart ? '已开启' : '已关闭'}
              </span>
            </div>
            <span className="settings-hint">系统启动时自动运行本应用</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">价格预警提示音</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.enableSoundAlerts ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ enableSoundAlerts: !appSettings.enableSoundAlerts })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.enableSoundAlerts ? '已开启' : '已关闭'}
              </span>
            </div>
            <span className="settings-hint">触发价格预警时播放提示音</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
