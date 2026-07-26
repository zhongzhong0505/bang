import React from 'react';
import './settings.css';
import { useTBatch } from '../../i18n';
import type { FutuGatewayConfig, GatewayStatus } from '../../../shared/types';

interface Props {
  form: FutuGatewayConfig;
  status: GatewayStatus;
  onUpdate: (key: keyof FutuGatewayConfig, value: string | number) => void;
  onSave: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  saved: boolean;
}

const FutuSettings: React.FC<Props> = ({ form, status, onUpdate, onSave, onConnect, onDisconnect, connecting, saved }) => {
  const L = useTBatch([
    'settings.futuConfigTitle', 'settings.futuConfigDesc',
    'settings.futuListenAddr', 'settings.futuListenAddrHint',
    'settings.futuTcpPort', 'settings.futuTcpPortHint',
    'settings.futuWsPortLabel', 'settings.futuWsPortHint',
    'settings.futuWsAuthKey', 'settings.futuWsAuthKeyHint',
    'settings.futuRsaKeyLabel', 'settings.futuRsaKeyHint',
    'settings.futuSslCertLabel', 'settings.futuSslCertHint',
    'settings.futuSslKey', 'settings.futuSslKeyHint',
  ] as any);
  return (
    <div className="settings-card">
      <h2 className="settings-card-title">{L['settings.futuConfigTitle']}</h2>
      <p className="settings-card-desc">
        {L['settings.futuConfigDesc']}
      </p>
      <div className="settings-form-grid">
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuListenAddr']}</label>
          <input className="settings-input" value={form.host} onChange={(e) => onUpdate('host', e.target.value)} placeholder="127.0.0.1" />
          <span className="settings-hint">{L['settings.futuListenAddrHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuTcpPort']}</label>
          <input className="settings-input" type="number" value={form.port} onChange={(e) => onUpdate('port', parseInt(e.target.value) || 33333)} placeholder="33333" />
          <span className="settings-hint">{L['settings.futuTcpPortHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuWsPortLabel']}</label>
          <input className="settings-input" type="number" value={form.wsPort} onChange={(e) => onUpdate('wsPort', parseInt(e.target.value) || 33333)} placeholder="33333" />
          <span className="settings-hint">{L['settings.futuWsPortHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuWsAuthKey']}</label>
          <input className="settings-input" type="password" value={form.wsAuthKey} onChange={(e) => onUpdate('wsAuthKey', e.target.value)} placeholder="32位 MD5 密文" />
          <span className="settings-hint">{L['settings.futuWsAuthKeyHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuRsaKeyLabel']}</label>
          <input className="settings-input" value={form.rsaPrivateKey || ''} onChange={(e) => onUpdate('rsaPrivateKey', e.target.value)} placeholder="/path/to/private_key.pem" />
          <span className="settings-hint">{L['settings.futuRsaKeyHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuSslCertLabel']}</label>
          <input className="settings-input" value={form.sslCert || ''} onChange={(e) => onUpdate('sslCert', e.target.value)} placeholder="/path/to/cert.pem" />
          <span className="settings-hint">{L['settings.futuSslCertHint']}</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">{L['settings.futuSslKey']}</label>
          <input className="settings-input" value={form.sslKey || ''} onChange={(e) => onUpdate('sslKey', e.target.value)} placeholder="/path/to/key.pem" />
          <span className="settings-hint">{L['settings.futuSslKeyHint']}</span>
        </div>
      </div>
    </div>
  );
};

export default FutuSettings;
