import React, { useState } from 'react';
import { useStore } from '../../store';
import '../toolbar/toolbar.css';
import { useT, useTBatch } from '../../i18n';

const genId = () => 'alert-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const AlertPanel: React.FC = () => {
  const alerts = useStore((s) => s.alerts);
  const addAlert = useStore((s) => s.addAlert);
  const removeAlert = useStore((s) => s.removeAlert);
  const toggleAlertPanel = useStore((s) => s.toggleAlertPanel);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const klineData = useStore((s) => s.klineData);

  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const tr = useTBatch([
    'alert.title', 'alert.current', 'alert.lastPrice',
    'alert.condition', 'alert.above', 'alert.below',
    'alert.targetPrice', 'alert.noteOptional', 'alert.notePlaceholder',
    'alert.create', 'alert.existing', 'alert.empty', 'alert.triggered',
  ]);

  const lastPrice = klineData.length > 0 ? klineData[klineData.length - 1].close : 0;

  const handleCreate = () => {
    if (!price) return;
    addAlert({
      id: genId(),
      code: currentCode,
      name: currentName,
      condition,
      price: +price,
      message: message || `${condition === 'above' ? tr['alert.above'] : tr['alert.below']} ${price}`,
      createdAt: Date.now(),
      triggered: false,
    });
    setPrice('');
    setMessage('');
  };

  return (
    <div className="indicator-settings-overlay" onClick={toggleAlertPanel}>
      <div className="indicator-settings-dialog indicator-settings-dialog-wide" onClick={(e) => e.stopPropagation()}>
        <div className="indicator-settings-header">
          <span>{tr['alert.title']}</span>
          <button className="quant-close" onClick={toggleAlertPanel}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
        <div className="indicator-settings-body">
          <div className="alert-current-info">
            {tr['alert.current']}: {currentName} ({currentCode}) {tr['alert.lastPrice']} {lastPrice.toFixed(2)}
          </div>
          <div className="alert-form">
            <div className="alert-form-row">
              <span className="indicator-settings-label">{tr['alert.condition']}</span>
              <div className="alert-condition-buttons">
                <button
                  className={`toolbar-btn${condition === 'above' ? ' toolbar-btn-active' : ''}`}
                  onClick={() => setCondition('above')}
                >
                  {tr['alert.above']}
                </button>
                <button
                  className={`toolbar-btn${condition === 'below' ? ' toolbar-btn-active' : ''}`}
                  onClick={() => setCondition('below')}
                >
                  {tr['alert.below']}
                </button>
              </div>
            </div>
            <div className="alert-form-row">
              <span className="indicator-settings-label">{tr['alert.targetPrice']}</span>
              <input
                className="indicator-settings-input"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={lastPrice.toFixed(2)}
              />
            </div>
            <div className="alert-form-row">
              <span className="indicator-settings-label">{tr['alert.noteOptional']}</span>
              <input
                className="indicator-settings-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={tr['alert.notePlaceholder']}
              />
            </div>
            <button className="quant-primary-btn" onClick={handleCreate}>{tr['alert.create']}</button>
          </div>
          <div className="quant-section-label">{tr['alert.existing']}</div>
          <div className="alert-list">
            {alerts.length === 0 && (
              <div className="quant-empty-hint">{tr['alert.empty']}</div>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item${alert.triggered ? ' alert-item-triggered' : ''}`}>
                <div className="alert-item-left">
                  <span className="alert-item-symbol">{alert.name}</span>
                  <span className="alert-item-condition">
                    {alert.condition === 'above' ? tr['alert.above'] : tr['alert.below']} ¥{alert.price.toFixed(2)}
                    {alert.triggered ? ' ✓ ' + tr['alert.triggered'] : ''}
                  </span>
                </div>
                <span className="alert-item-price">{alert.message}</span>
                <button className="quant-mini-btn quant-mini-btn-red" onClick={() => removeAlert(alert.id)}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
