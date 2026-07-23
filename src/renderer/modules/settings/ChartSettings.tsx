import React from 'react';
import './settings.css';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { SubType, ChartStyle } from '../../../shared/types';
import { DEFAULT_CHART_STYLE } from '../../../shared/types';
import type { ChartType } from '../../store';



const ChartSettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const setAppSettings = useStore((s) => s.setAppSettings);
  const chartStyle = useStore((s) => s.chartStyle);
  const setChartStyle = useStore((s) => s.setChartStyle);
  const L = useTBatch([
    'settings.defaultChart', 'settings.defaultChartDesc', 'settings.defaultPeriod', 'settings.defaultChartType',
    'settings.period1m', 'settings.period5m', 'settings.period15m', 'settings.period30m',
    'settings.period60m', 'settings.periodDay', 'settings.periodWeek', 'settings.periodMonth',
    'settings.chartColors', 'settings.chartColorsDesc',
    'settings.upColor', 'settings.downColor', 'settings.gridColor', 'settings.crosshairColor',
    'settings.chartOptions', 'settings.chartOptionsDesc',
    'settings.showGrid', 'settings.show', 'settings.hide',
    'settings.priceScalePos', 'settings.right', 'settings.left',
    'settings.lineWidth', 'settings.subChartHeight', 'settings.subChartHeightHint',
    'settings.resetDefaults', 'settings.resetDefaultsDesc', 'settings.resetColorsBtn',
    'settings.chartTypeCandle', 'settings.chartTypeHollow', 'settings.chartTypeHeikin',
    'settings.chartTypeBar', 'settings.chartTypeLine', 'settings.chartTypeArea',
  ] as any);

  const updateStyle = (key: keyof ChartStyle, value: string | number | boolean) => {
    setChartStyle({ [key]: value });
  };

  const SUB_TYPE_OPTIONS: { value: SubType; label: string }[] = [
    { value: '1', label: L['settings.period1m'] },
    { value: '5', label: L['settings.period5m'] },
    { value: '15', label: L['settings.period15m'] },
    { value: '30', label: L['settings.period30m'] },
    { value: '60', label: L['settings.period60m'] },
    { value: 'DAY', label: L['settings.periodDay'] },
    { value: 'WEEK', label: L['settings.periodWeek'] },
    { value: 'MONTH', label: L['settings.periodMonth'] },
  ];

  const CHART_TYPE_OPTIONS: { value: ChartType; label: string }[] = [
    { value: 'candle', label: L['settings.chartTypeCandle'] },
    { value: 'hollow', label: L['settings.chartTypeHollow'] },
    { value: 'heikin', label: L['settings.chartTypeHeikin'] },
    { value: 'bar', label: L['settings.chartTypeBar'] },
    { value: 'line', label: L['settings.chartTypeLine'] },
    { value: 'area', label: L['settings.chartTypeArea'] },
  ];

  return (
    <div className="settings-section">
      {/* Default Chart */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.defaultChart']}</h2>
        <p className="settings-card-desc">{L['settings.defaultChartDesc']}</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">{L['settings.defaultPeriod']}</label>
            <select
              className="settings-select"
              value={appSettings.defaultSubType}
              onChange={(e) => setAppSettings({ defaultSubType: e.target.value as SubType })}
            >
              {SUB_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.defaultChartType']}</label>
            <select
              className="settings-select"
              value={appSettings.defaultChartType}
              onChange={(e) => setAppSettings({ defaultChartType: e.target.value as ChartType })}
            >
              {CHART_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Colors */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.chartColors']}</h2>
        <p className="settings-card-desc">{L['settings.chartColorsDesc']}</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">{L['settings.upColor']}</label>
            <div className="settings-color-row">
              <input
                type="color"
                className="settings-color-picker"
                value={chartStyle.upColor}
                onChange={(e) => updateStyle('upColor', e.target.value)}
              />
              <input
                className="settings-input settings-input-small"
                value={chartStyle.upColor}
                onChange={(e) => updateStyle('upColor', e.target.value)}
              />
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.downColor']}</label>
            <div className="settings-color-row">
              <input
                type="color"
                className="settings-color-picker"
                value={chartStyle.downColor}
                onChange={(e) => updateStyle('downColor', e.target.value)}
              />
              <input
                className="settings-input settings-input-small"
                value={chartStyle.downColor}
                onChange={(e) => updateStyle('downColor', e.target.value)}
              />
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.gridColor']}</label>
            <div className="settings-color-row">
              <input
                type="color"
                className="settings-color-picker"
                value={chartStyle.gridColor}
                onChange={(e) => updateStyle('gridColor', e.target.value)}
              />
              <input
                className="settings-input settings-input-small"
                value={chartStyle.gridColor}
                onChange={(e) => updateStyle('gridColor', e.target.value)}
              />
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.crosshairColor']}</label>
            <div className="settings-color-row">
              <input
                type="color"
                className="settings-color-picker"
                value={chartStyle.crosshairColor}
                onChange={(e) => updateStyle('crosshairColor', e.target.value)}
              />
              <input
                className="settings-input settings-input-small"
                value={chartStyle.crosshairColor}
                onChange={(e) => updateStyle('crosshairColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Options */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.chartOptions']}</h2>
        <p className="settings-card-desc">{L['settings.chartOptionsDesc']}</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.showGrid']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${chartStyle.showGrid ? ' settings-toggle-on' : ''}`}
                onClick={() => updateStyle('showGrid', !chartStyle.showGrid)}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {chartStyle.showGrid ? L['settings.show'] : L['settings.hide']}
              </span>
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.priceScalePos']}</label>
            <select
              className="settings-select"
              value={chartStyle.priceScalePosition}
              onChange={(e) => updateStyle('priceScalePosition', e.target.value)}
            >
              <option value="right">{L['settings.right']}</option>
              <option value="left">{L['settings.left']}</option>
            </select>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.lineWidth']}</label>
            <input
              className="settings-input"
              type="number"
              min="1"
              max="5"
              value={chartStyle.lineWidth}
              onChange={(e) => updateStyle('lineWidth', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.subChartHeight']}</label>
            <input
              className="settings-input"
              type="number"
              min="10"
              max="40"
              value={Math.round(chartStyle.scaleMarginsBottom * 100)}
              onChange={(e) => updateStyle('scaleMarginsBottom', parseInt(e.target.value) / 100)}
            />
            <span className="settings-hint">{L['settings.subChartHeightHint']}</span>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.resetDefaults']}</h2>
        <p className="settings-card-desc">{L['settings.resetDefaultsDesc']}</p>
        <button
          className="settings-save-btn"
          onClick={() => setChartStyle({ ...DEFAULT_CHART_STYLE })}
        >
          {L['settings.resetColorsBtn']}
        </button>
      </div>
    </div>
  );
};

export default ChartSettings;
