import React from 'react';
import './settings.css';
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
  return (
    <div className="settings-card">
      <h2 className="settings-card-title">Futu OpenD 连接设置</h2>
      <p className="settings-card-desc">
        配置 Futu OpenD 网关连接参数。OpenD 是 Futu API 的网关程序，运行于本地或云端服务器，
        负责中转协议请求到富途后台并返回数据。请先安装并启动 OpenD。
      </p>
      <div className="settings-form-grid">
        <div className="settings-field">
          <label className="settings-label">监听地址</label>
          <input className="settings-input" value={form.host} onChange={(e) => onUpdate('host', e.target.value)} placeholder="127.0.0.1" />
          <span className="settings-hint">OpenD API 监听地址，本地填 127.0.0.1</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">TCP 端口</label>
          <input className="settings-input" type="number" value={form.port} onChange={(e) => onUpdate('port', parseInt(e.target.value) || 33333)} placeholder="33333" />
          <span className="settings-hint">OpenD API 协议监听端口，默认 33333</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">WebSocket 端口</label>
          <input className="settings-input" type="number" value={form.wsPort} onChange={(e) => onUpdate('wsPort', parseInt(e.target.value) || 33333)} placeholder="33333" />
          <span className="settings-hint">WebSocket 服务端口，通常与 TCP 端口相同</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">WebSocket 鉴权密钥</label>
          <input className="settings-input" type="password" value={form.wsAuthKey} onChange={(e) => onUpdate('wsAuthKey', e.target.value)} placeholder="32位 MD5 密文" />
          <span className="settings-hint">JavaScript 连接时的鉴权密文（32位 MD5 加密 16 进制）</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">RSA 私钥路径</label>
          <input className="settings-input" value={form.rsaPrivateKey || ''} onChange={(e) => onUpdate('rsaPrivateKey', e.target.value)} placeholder="/path/to/private_key.pem" />
          <span className="settings-hint">API 协议 RSA 加密私钥（PKCS#1）文件绝对路径</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">SSL 证书路径</label>
          <input className="settings-input" value={form.sslCert || ''} onChange={(e) => onUpdate('sslCert', e.target.value)} placeholder="/path/to/cert.pem" />
          <span className="settings-hint">WebSocket SSL 证书文件路径，非本地连接时需要配置</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">SSL 私钥路径</label>
          <input className="settings-input" value={form.sslKey || ''} onChange={(e) => onUpdate('sslKey', e.target.value)} placeholder="/path/to/key.pem" />
          <span className="settings-hint">WebSocket SSL 私钥路径，需与证书同时配置，私钥不可设密码</span>
        </div>
      </div>
    </div>
  );
};

export default FutuSettings;
