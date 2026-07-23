import React from 'react';
import './settings.css';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';

const TradeSettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);
  const setAppSettings = useStore((s) => s.setAppSettings);
  const L = useTBatch([
    'settings.orderDefaults', 'settings.orderDefaultsDesc',
    'settings.defaultQtyLabel', 'settings.defaultQtyFieldHint',
    'settings.orderConfirmLabel', 'settings.orderConfirmOn', 'settings.orderConfirmOff',
    'settings.orderConfirmFieldHint',
    'settings.riskControl', 'settings.riskControlDesc',
    'settings.perOrderLimitLabel', 'settings.perOrderLimitFieldHint',
    'settings.dailyLossLimitLabel', 'settings.dailyLossLimitFieldHint',
    'settings.unlimited',
    'settings.tradeConnection', 'settings.tradeConnectionDesc',
    'settings.tradeNotConfigured', 'settings.tradeNotConfiguredHint',
  ] as any);

  return (
    <div className="settings-section">
      {/* Order defaults */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.orderDefaults']}</h2>
        <p className="settings-card-desc">{L['settings.orderDefaultsDesc']}</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.defaultQtyLabel']}</label>
            <input
              className="settings-input"
              type="number"
              min="1"
              value={appSettings.defaultOrderQty}
              onChange={(e) => setAppSettings({ defaultOrderQty: Math.max(1, parseInt(e.target.value) || 100) })}
            />
            <span className="settings-hint">{L['settings.defaultQtyFieldHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.orderConfirmLabel']}</label>
            <div className="settings-toggle-row">
              <button
                className={`settings-toggle${appSettings.confirmBeforeOrder ? ' settings-toggle-on' : ''}`}
                onClick={() => setAppSettings({ confirmBeforeOrder: !appSettings.confirmBeforeOrder })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-text">
                {appSettings.confirmBeforeOrder ? L['settings.orderConfirmOn'] : L['settings.orderConfirmOff']}
              </span>
            </div>
            <span className="settings-hint">{L['settings.orderConfirmFieldHint']}</span>
          </div>
        </div>
      </div>

      {/* Risk management */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.riskControl']}</h2>
        <p className="settings-card-desc">{L['settings.riskControlDesc']}</p>
        <div className="settings-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="settings-field">
            <label className="settings-label">{L['settings.perOrderLimitLabel']}</label>
            <input
              className="settings-input"
              type="number"
              min="0"
              step="10000"
              value={appSettings.maxSingleOrderAmount || ''}
              placeholder={L['settings.unlimited']}
              onChange={(e) => setAppSettings({ maxSingleOrderAmount: parseFloat(e.target.value) || 0 })}
            />
            <span className="settings-hint">{L['settings.perOrderLimitFieldHint']}</span>
          </div>
          <div className="settings-field">
            <label className="settings-label">{L['settings.dailyLossLimitLabel']}</label>
            <input
              className="settings-input"
              type="number"
              min="0"
              step="1000"
              value={appSettings.dailyLossLimit || ''}
              placeholder={L['settings.unlimited']}
              onChange={(e) => setAppSettings({ dailyLossLimit: parseFloat(e.target.value) || 0 })}
            />
            <span className="settings-hint">{L['settings.dailyLossLimitFieldHint']}</span>
          </div>
        </div>
      </div>

      {/* Connection */}
      <div className="settings-card">
        <h2 className="settings-card-title">{L['settings.tradeConnection']}</h2>
        <p className="settings-card-desc">{L['settings.tradeConnectionDesc']}</p>
        <div className="settings-status-row">
          <span className={`settings-status-dot ${false ? 'up' : 'down'}`} />
          <span className="settings-status-text">{L['settings.tradeNotConfigured']}</span>
          <span className="settings-status-text settings-status-text-meta">
            {L['settings.tradeNotConfiguredHint']}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradeSettings;
