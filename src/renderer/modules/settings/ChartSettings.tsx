import React from 'react';
import './settings.css';
import { useStore } from '../../store';
import type { SubType, ChartStyle } from '../../../shared/types';
import { DEFAULT_CHART_STYLE } from '../../../shared/types';
import type { ChartType } from '../../store';

const SUB_TYPE_OPTIONS: { value: SubType; label: string }[] = [
  { value: '1', label: '1 分钟' },
  { value: '5', label: '5 分钟' },
  { value: '15', label: '15 分钟' },
  { value: '30', label: '30 分钟' },
  { value: '60', label: '60 分钟' },
  { value: 'DAY', label: '日线' },
  { value: 'WEEK', label: '周线' },
  { value: 'MONTH', label: '月线' },
];

const CHART_TYPE_OPTIONS: { value: ChartType; label: string }[] = [
  { value: 'candle', label: 'K 线 (蜡烛图)' },
  { value: 'hollow', label: '空心 K 线' },
  { value: 'heikin', label: '平均 K 线 (Heikin-Ashi)' },
  { value: 'bar', label: '美国线 (OHLC)' },
  { value: 'line', label: '折线图' },
  { value: 'area', label: '面积图' },
];

const ChartSettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const setAppSettings = useStore((s) => s.setAppSettings);
  const chartStyle = useStore((s) => s.chartStyle);
  const setChartStyle = useStore((s) => s.setChartStyle);

  const updateStyle = (key: keyof ChartStyle, value: string | number | boolean) => {
    setChartStyle({ [key]: value });
  };

  return (
    <div className="settings-section">
      {/* Default Chart */}
      <div className="settings-card">
        <h2 className="settings-card-title">默认图表</h2>
        <p className="settings-card-desc">设置打开股票时的默认周期和图表类型</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">默认周期</label>
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
            <label className="settings-label">默认图表类型</label>
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
        <h2 className="settings-card-title">图表配色</h2>
        <p className="settings-card-desc">自定义 K 线图的颜色方案，修改后需要重新加载图表生效</p>
        <div className="settings-form-grid">
          <div className="settings-field">
            <label className="settings-label">阳线颜色 (上涨)</label>
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
            <label className="settings-label">阴线颜色 (下跌)</label>
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
            <label className="settings-label">网格颜色</label>
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
            <label className="settings-label">十字准线颜色</label>
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
        <h2 className="settings-card-title">图表选项</h2>
        <p className="settings-card-desc">调整图表的显示选项</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">显示网格</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${chartStyle.showGrid ? ' settings-toggle-on' : ''}`}
                onClick={() => updateStyle('showGrid', !chartStyle.showGrid)}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {chartStyle.showGrid ? '显示' : '隐藏'}
              </span>
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">价格刻度位置</label>
            <select
              className="settings-select"
              value={chartStyle.priceScalePosition}
              onChange={(e) => updateStyle('priceScalePosition', e.target.value)}
            >
              <option value="right">右侧</option>
              <option value="left">左侧</option>
            </select>
          </div>
          <div className="settings-field">
            <label className="settings-label">线条宽度</label>
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
            <label className="settings-label">子图高度占比 (%)</label>
            <input
              className="settings-input"
              type="number"
              min="10"
              max="40"
              value={Math.round(chartStyle.scaleMarginsBottom * 100)}
              onChange={(e) => updateStyle('scaleMarginsBottom', parseInt(e.target.value) / 100)}
            />
            <span className="settings-hint">MACD/RSI 等子图的底部预留空间</span>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="settings-card">
        <h2 className="settings-card-title">恢复默认</h2>
        <p className="settings-card-desc">将图表配色和选项恢复到默认值</p>
        <button
          className="settings-save-btn"
          onClick={() => setChartStyle({ ...DEFAULT_CHART_STYLE })}
        >
          恢复默认配色
        </button>
      </div>
    </div>
  );
};

export default ChartSettings;
