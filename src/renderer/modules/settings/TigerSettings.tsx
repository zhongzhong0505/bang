import React from 'react';
import './settings.css';
import type { TigerGatewayConfig } from '../../../shared/types';

interface Props {
  form: TigerGatewayConfig;
  onUpdate: (key: keyof TigerGatewayConfig, value: string | number) => void;
}

const LICENSE_OPTIONS = [
  { value: 'TBUS', label: 'TBUS — 美股', market: 'US' },
  { value: 'TBHK', label: 'TBHK — 港股', market: 'HK' },
  { value: 'TBSG', label: 'TBSG — 新加坡', market: 'SG' },
  { value: 'TBNZ', label: 'TBNZ — 新西兰', market: 'NZ' },
  { value: 'TBAU', label: 'TBAU — 澳洲', market: 'AU' },
];

const TigerSettings: React.FC<Props> = ({ form, onUpdate }) => {
  const toggleLicense = (lic: string) => {
    const current = form.licenses ?? [];
    const next = current.includes(lic)
      ? current.filter((l) => l !== lic)
      : [...current, lic];
    onUpdate('licenses', next as any);
  };

  return (
    <div className="settings-card">
      <h2 className="settings-card-title">老虎证券 OpenAPI 连接设置</h2>
      <p className="settings-card-desc">
        配置老虎证券 OpenAPI 连接参数。使用官方 TypeScript SDK，通过 Protobuf 协议通信，
        SDK 自动处理 RSA 签名、域名解析和实时推送。每个牌照对应独立的行情服务器，
        可同时勾选多个牌照以获取不同市场的行情数据。
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
          <span className="settings-hint">在老虎开放平台创建应用时生成的 RSA 私钥（PKCS#1 与 PKCS#8 均兼容）</span>
        </div>
        <div className="settings-field settings-form-grid-full">
          <label className="settings-label">行情牌照（可多选）</label>
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
          <span className="settings-hint">每个牌照对应独立的行情服务器。勾选多个可同时获取多市场行情（如美股+港股）。交易和推送使用首个牌照。</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">Token (可选)</label>
          <input className="settings-input" value={form.token || ''} onChange={(e) => onUpdate('token', e.target.value)} placeholder="TBHK 牌照需要" />
          <span className="settings-hint">仅 TBHK（港股）牌照需要填写</span>
        </div>
        <div className="settings-field">
          <label className="settings-label">服务器地址 (可选)</label>
          <input className="settings-input" value={form.serverUrl || ''} onChange={(e) => onUpdate('serverUrl', e.target.value)} placeholder="留空由 SDK 自动解析" />
          <span className="settings-hint">高级选项，留空使用 SDK 动态域名解析</span>
        </div>
      </div>
    </div>
  );
};

export default TigerSettings;
