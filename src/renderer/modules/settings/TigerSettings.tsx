import React from 'react';
import './settings.css';
import { useTBatch } from '../../i18n';
import type { TigerGatewayConfig } from '../../../shared/types';

interface Props {
  form: TigerGatewayConfig;
  onUpdate: (key: keyof TigerGatewayConfig, value: string | number) => void;
}


const TigerSettings: React.FC<Props> = ({ form, onUpdate }) => {
  const L = useTBatch([
    'settings.tigerConfigTitle', 'settings.tigerConfigDesc',
    'settings.tigerId', 'settings.tigerIdPlaceholder', 'settings.tigerIdHint',
    'settings.tigerAccountLabel', 'settings.tigerAccountPlaceholder', 'settings.tigerAccountHint',
    'settings.tigerPrivateKeyLabel', 'settings.tigerPrivateKeyHint',
    'settings.tigerLicensesLabel', 'settings.tigerLicensesHint',
    'settings.tigerLicenseUS', 'settings.tigerLicenseHK', 'settings.tigerLicenseSG',
    'settings.tigerLicenseNZ', 'settings.tigerLicenseAU',
    'settings.tigerTokenLabel', 'settings.tigerTokenPlaceholder', 'settings.tigerTokenHint',
    'settings.tigerServerUrlLabel', 'settings.tigerServerUrlPlaceholder', 'settings.tigerServerUrlHint',
  ] as any);

  const toggleLicense = (lic: string) => {
    const current = form.licenses ?? [];
    const next = current.includes(lic)
      ? current.filter((l) => l !== lic)
      : [...current, lic];
    onUpdate('licenses', next as any);
  };

  const LICENSE_OPTIONS = [
    { value: 'TBUS', label: `TBUS — ${L['settings.tigerLicenseUS']}`, market: 'US' },
    { value: 'TBHK', label: `TBHK — ${L['settings.tigerLicenseHK']}`, market: 'HK' },
    { value: 'TBSG', label: `TBSG — ${L['settings.tigerLicenseSG']}`, market: 'SG' },
    { value: 'TBNZ', label: `TBNZ — ${L['settings.tigerLicenseNZ']}`, market: 'NZ' },
    { value: 'TBAU', label: `TBAU — ${L['settings.tigerLicenseAU']}`, market: 'AU' },
  ];

  return (
    <div className="settings-card">
      <h2 className="settings-card-title">{L['settings.tigerConfigTitle']}</h2>
      <p className="settings-card-desc">
        {L['settings.tigerConfigDesc']}
      </p>
      <div className="settings-form-grid">
        <div className="settings-field">
          <label className="settings-label">{L['settings.tigerId']}</label>
          <input className="settings-input" value={form.tigerId} onChange={(e) => onUpdate('tigerId', e.target.value)} placeholder={L['settings.tigerIdPlaceholder']} />
          <span className="settings-hint">{L['settings.tigerIdHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.tigerAccountLabel']}</label>
          <input className="settings-input" value={form.account} onChange={(e) => onUpdate('account', e.target.value)} placeholder={L['settings.tigerAccountPlaceholder']} />
          <span className="settings-hint">{L['settings.tigerAccountHint']}</span>
        </div>
        <div className="settings-field settings-form-grid-full">
          <label className="settings-label">{L['settings.tigerPrivateKeyLabel']}</label>
          <textarea
            className="settings-textarea"
            value={form.privateKey}
            onChange={(e) => onUpdate('privateKey', e.target.value)}
            placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
          />
          <span className="settings-hint">{L['settings.tigerPrivateKeyHint']}</span>
        </div>
        <div className="settings-field settings-form-grid-full">
          <label className="settings-label">{L['settings.tigerLicensesLabel']}</label>
          <div className="settings-checkbox-group">
            {LICENSE_OPTIONS.map((opt) => (
              <label key={opt.value} className="settings-checkbox-item">
                <input
                  type="checkbox"
                  checked={(form.licenses ?? []).includes(opt.value)}
                  onChange={() => toggleLicense(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <span className="settings-hint">{L['settings.tigerLicensesHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.tigerTokenLabel']}</label>
          <input className="settings-input" value={form.token || ''} onChange={(e) => onUpdate('token', e.target.value)} placeholder={L['settings.tigerTokenPlaceholder']} />
          <span className="settings-hint">{L['settings.tigerTokenHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.tigerServerUrlLabel']}</label>
          <input className="settings-input" value={form.serverUrl || ''} onChange={(e) => onUpdate('serverUrl', e.target.value)} placeholder={L['settings.tigerServerUrlPlaceholder']} />
          <span className="settings-hint">{L['settings.tigerServerUrlHint']}</span>
        </div>
      </div>
    </div>
  );
};

export default TigerSettings;
