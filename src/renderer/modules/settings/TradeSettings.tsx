import React from 'react';
import './settings.css';
import { useStore } from '../../store';

const TradeSettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const setAppSettings = useStore((s) => s.setAppSettings);

  return (
    <div className="settings-section">
      {/* Order defaults */}
      <div className="settings-card">
        <h2 className="settings-card-title">下单默认值</h2>
        <p className="settings-card-desc">设置下单时的默认参数</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">默认下单数量</label>
            <input
              className="settings-input"
              type="number"
              min="1"
              value={appSettings.defaultOrderQty}
              onChange={(e) => setAppSettings({ defaultOrderQty: Math.max(1, parseInt(e.target.value) || 100) })}
            />
            <span className="settings-hint">每次下单时的默认数量（股/手）</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">下单前确认</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.confirmBeforeOrder ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ confirmBeforeOrder: !appSettings.confirmBeforeOrder })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.confirmBeforeOrder ? '需要确认' : '直接下单'}
              </span>
            </div>
            <span className="settings-hint">开启后下单前会弹出确认对话框</span>
          </div>
        </div>
      </div>

      {/* Risk management */}
      <div className="settings-card">
        <h2 className="settings-card-title">风控设置</h2>
        <p className="settings-card-desc">全局风控参数，应用于所有量化策略</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">单笔最大金额 (元)</label>
            <input
              className="settings-input"
              type="number"
              min="0"
              step="10000"
              value={appSettings.maxSingleOrderAmount || ''}
              placeholder="不限"
              onChange={(e) => setAppSettings({ maxSingleOrderAmount: parseFloat(e.target.value) || 0 })}
            />
            <span className="settings-hint">单笔订单最大金额限制，0 表示不限</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">日最大亏损 (元)</label>
            <input
              className="settings-input"
              type="number"
              min="0"
              step="1000"
              value={appSettings.dailyLossLimit || ''}
              placeholder="不限"
              onChange={(e) => setAppSettings({ dailyLossLimit: parseFloat(e.target.value) || 0 })}
            />
            <span className="settings-hint">当日累计亏损达到此值后停止交易，0 表示不限</span>
          </div>
        </div>
      </div>

      {/* Connection */}
      <div className="settings-card">
        <h2 className="settings-card-title">交易连接</h2>
        <p className="settings-card-desc">交易网关的连接和认证状态，请前往"行情网关"页面配置连接参数</p>
        <div className="settings-status-row">
          <span className={`settings-status-dot ${false ? 'up' : 'down'}`} />
          <span className="settings-status-text">交易连接未配置</span>
          <span className="settings-status-text settings-status-text-meta">
            请先在行情网关页面连接 OpenD / OpenAPI
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradeSettings;
