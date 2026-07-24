import React from 'react';
import './settings.css';
import { useTBatch } from '../../i18n';

/**
 * Settings card for the Local Mock gateway provider.
 * There are no connection parameters — the mock is always ready.
 */
const LocalSettings: React.FC = () => {
  const L = useTBatch([
    'settings.localConfigTitle', 'settings.localConfigDesc',
    'settings.localFeatureKline', 'settings.localFeatureSnapshot',
    'settings.localFeaturePositions', 'settings.localFeatureOrders',
    'settings.localFeatureAccount', 'settings.localFeatureSearch',
    'settings.localNoConfig',
  ] as any);

  const features = [
    L['settings.localFeatureKline'],
    L['settings.localFeatureSnapshot'],
    L['settings.localFeaturePositions'],
    L['settings.localFeatureOrders'],
    L['settings.localFeatureAccount'],
    L['settings.localFeatureSearch'],
  ];

  return (
    <div className="settings-card">
      <h2 className="settings-card-title">{L['settings.localConfigTitle']}</h2>
      <p className="settings-card-desc">{L['settings.localConfigDesc']}</p>
      <ul className="settings-instructions">
        {features.map((f, i) => (
          <li key={i} className="settings-step">
            <span className="settings-step-num">{i + 1}</span>
            <div className="settings-step-desc">{f}</div>
          </li>
        ))}
      </ul>
      <p className="settings-hint">{L['settings.localNoConfig']}</p>
    </div>
  );
};

export default LocalSettings;
