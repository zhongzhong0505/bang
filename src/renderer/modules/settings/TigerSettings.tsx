import React from 'react';
import './settings.css';
import type { TigerGatewayConfig } from '../../../shared/types';

interface Props {
  form: TigerGatewayConfig;
  onUpdate: (key: keyof TigerGatewayConfig, value: string | number) => void;
}

const TigerSettings: React.FC<Props> = ({ form, onUpdate }) => {
  return (
    <div className="settings-card">
      <h2 className="settings-card-title">老虎证券 OpenAPI 连接设置</h2>
      <p className="settings-card-desc">
        配置老虎证券 OpenAPI 连接参数。Tiger OpenAPI 使用 REST + WebSocket 架构，
        通过 RSA 签名进行身份认证，支持美股、港股、A股通等市场行情和交易。
        需要在老虎开放平台申请 API 权限并获取 TigerID 和私钥。
      </p>
      <div className="settings-form-grid">
        <div className="settings-field">
          <label className="settings-label">Tiger ID</label>
          <input className="settings-input" value={form.tigerId} onChange={(e) => onUpdate('tigerId', e.target.value)} placeholder="输入 Tiger ID" />
          <span className="settings-hint">老虎开放平台分配的开发者 ID</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">交易账号</label>
          <input className="settings-input" value={form.account} onChange={(e) => onUpdate('account', e.target.value)} placeholder="输入交易账号" />
          <span className="settings-hint">老虎证券交易账户号码</span>
        </div>
        <div className="settings-field settings-form-grid-full">
          <label className="settings-label">RSA 私钥</label>
          <textarea
            className="settings-textarea"
            value={form.privateKey}
            onChange={(e) => onUpdate('privateKey', e.target.value)}
            placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
          />
          <span className="settings-hint">在老虎开放平台创建应用时生成的 RSA 私钥（PKCS#1 格式）</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">环境</label>
          <select className="settings-select" value={form.env} onChange={(e) => onUpdate('env', e.target.value)}>
            <option value="sandbox">沙盒环境</option>
            <option value="us">美股环境</option>
            <option value="prod">生产环境</option>
          </select>
          <span className="settings-hint">建议先在沙盒环境调试，确认无误后切换到生产环境</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">HTTP Base URL (可选)</label>
          <input className="settings-input" value={form.httpBaseUrl || ''} onChange={(e) => onUpdate('httpBaseUrl', e.target.value)} placeholder="https://openapi.itigerup.com" />
          <span className="settings-hint">留空使用默认地址</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">WebSocket URL (可选)</label>
          <input className="settings-input" value={form.wsUrl || ''} onChange={(e) => onUpdate('wsUrl', e.target.value)} placeholder="wss://openapi.itigerup.com/stream" />
          <span className="settings-hint">留空使用默认地址</span>
        </div>
      </div>
    </div>
  );
};

export default TigerSettings;
