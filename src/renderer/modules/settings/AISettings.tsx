import React, { useState, useEffect } from 'react';
import './settings.css';
import { useStore } from '../../store';
import { AI_PROVIDER_PRESETS, type AIProvider, type AISettings as AISettingsType } from '../../../shared/types';

const AISettings: React.FC = () => {
  const appSettings = useStore((s) => s.appSettings);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-5');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tencentSecretId, setTencentSecretId] = useState('');
  const [tencentSecretKey, setTencentSecretKey] = useState('');
  const [tencentRegion, setTencentRegion] = useState('ap-guangzhou');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const api = window.bangAPI;
    if (!api?.getAIConfig) return;
    api.getAIConfig().then((cfg: Partial<AISettingsType>) => {
      if (cfg) {
        setEnabled(cfg.enabled ?? false);
        setProvider(cfg.provider ?? 'openai');
        setApiKey(cfg.apiKey ?? '');
        setModel(cfg.model ?? 'gpt-5');
        setBaseUrl(cfg.baseUrl ?? 'https://api.openai.com/v1');
        setSystemPrompt(cfg.systemPrompt ?? '');
        setTencentSecretId(cfg.tencentTokenPlan?.secretId ?? '');
        setTencentSecretKey(cfg.tencentTokenPlan?.secretKey ?? '');
        setTencentRegion(cfg.tencentTokenPlan?.region ?? 'ap-guangzhou');
      }
    });
  }, []);

  const currentPreset = AI_PROVIDER_PRESETS.find((p) => p.provider === provider) ?? AI_PROVIDER_PRESETS[0];
  const isTencent = provider === 'tencent';

  const handleProviderSwitch = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const preset = AI_PROVIDER_PRESETS.find((p) => p.provider === newProvider);
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModel(preset.models[0]?.value ?? '');
    }
  };

  const buildConfig = (): Partial<AISettingsType> => ({
    enabled,
    provider,
    apiKey,
    model,
    baseUrl,
    systemPrompt,
    tencentTokenPlan: { secretId: tencentSecretId, secretKey: tencentSecretKey, region: tencentRegion },
  });

  const handleSave = async () => {
    const api = window.bangAPI;
    if (!api?.setAIConfig) return;
    await api.setAIConfig(buildConfig());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    const api = window.bangAPI;
    if (!api?.evaluateOrder) {
      setTestResult('API 不可用');
      return;
    }
    if (!isTencent && !apiKey) {
      setTestResult('请先填写 API Key');
      return;
    }
    if (isTencent && (!tencentSecretId || !tencentSecretKey)) {
      setTestResult('请先填写腾讯云 SecretId 和 SecretKey');
      return;
    }
    // Save first so the test uses the new config
    await api.setAIConfig(buildConfig());
    setTesting(true);
    setTestResult('');
    try {
      const result = await api.evaluateOrder({
        symbol: 'HK.00700',
        name: '腾讯控股',
        side: 'BUY',
        orderType: 'LIMIT',
        price: 380,
        quantity: 100,
        amount: 38000,
        totalFee: 50,
        netAmount: 38050,
        market: 'HK',
        currency: 'HKD',
        currentPrice: 380,
        changeRate: 1.5,
        accountTotalAssets: 100000,
        accountCash: 50000,
        accountBuyingPower: 50000,
        accountUnrealizedPnl: 5000,
        existingPositionQty: 200,
        existingPositionAvgPrice: 355,
        existingPositionPnl: 5000,
        existingPositionPnlRatio: 7.04,
        klineClose: [375, 376, 378, 379, 380, 378, 377, 379, 381, 380, 382, 381, 380, 379, 378, 377, 376, 378, 379, 380],
        klineVolume: [100000, 120000, 150000, 90000, 110000, 130000, 100000, 90000, 110000, 120000, 100000, 90000, 80000, 100000, 120000, 150000, 110000, 100000, 90000, 110000],
        maxSingleOrderAmount: appSettings.maxSingleOrderAmount,
        dailyLossLimit: appSettings.dailyLossLimit,
      });
      if (result && result.riskScore !== undefined) {
        setTestResult(`测试成功！风险评分: ${result.riskScore}/100，等级: ${result.riskLevel}`);
      } else {
        setTestResult('测试完成，但返回结果异常');
      }
    } catch (err: any) {
      setTestResult(`测试失败: ${err.message}`);
    }
    setTesting(false);
    // Restore original enabled state
    await api.setAIConfig(buildConfig());
  };

  return (
    <div className="settings-section">
      {/* AI Enable */}
      <div className="settings-card">
        <h2 className="settings-card-title">AI 分析</h2>
        <p className="settings-card-desc">
          配置 AI 大模型 API，实现下单前智能风险评估和实时行情分析。
          支持 OpenAI、智谱 GLM、Kimi、DeepSeek、Claude、腾讯混元等多家模型。
          密钥存储在本地，不会上传到服务器。
        </p>
        <div className="settings-field">
          <label className="settings-label">启用 AI 分析</label>
          <div className="settings-toggle-row">
            <button
              className={`settings-toggle${enabled ? ' settings-toggle-on' : ''}`}
              onClick={() => setEnabled(!enabled)}
            >
              <span className="settings-toggle-knob" />
            </button>
            <span className="settings-toggle-text">
              {enabled ? '已开启' : '已关闭'}
            </span>
          </div>
          <span className="settings-hint">开启后，下单面板将出现"AI 评估"按钮</span>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="settings-card">
        <h2 className="settings-card-title">AI 模型提供商</h2>
        <p className="settings-card-desc">选择你要使用的 AI 大模型服务提供商</p>
        <div className="settings-ai-provider-grid">
          {AI_PROVIDER_PRESETS.map((p) => (
            <button
              key={p.provider}
              className={`settings-ai-provider-card${provider === p.provider ? ' settings-ai-provider-card-active' : ''}`}
              onClick={() => handleProviderSwitch(p.provider)}
            >
              <span className={`settings-ai-provider-badge settings-ai-provider-${p.provider}`}>
                {p.label.slice(0, 2)}
              </span>
              <span className="settings-ai-provider-name">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Configuration */}
      <div className="settings-card">
        <h2 className="settings-card-title">API 配置</h2>
        <p className="settings-card-desc">
          {currentPreset.name}
          {currentPreset.authType === 'bearer' && '（使用 Bearer Token 认证）'}
          {currentPreset.authType === 'x-api-key' && '（使用 x-api-key 认证）'}
          {currentPreset.authType === 'tc3-hmac-sha256' && '（使用腾讯云 TC3-HMAC-SHA256 签名认证）'}
        </p>
        <div className="settings-form-grid">
          {!isTencent && (
            <div className="settings-field">
              <label className="settings-label">API Key</label>
              <div className="settings-input-with-action">
                <input
                  className="settings-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{ flex: 1 }}
                />
                <button
                  className="settings-action-btn"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
              <span className="settings-hint">
                {currentPreset.authType === 'x-api-key'
                  ? '在 Anthropic 控制台获取 API Key'
                  : '在对应平台获取 API Key'}
              </span>
            </div>
          )}
          {isTencent && (
            <>
              <div className="settings-field">
                <label className="settings-label">SecretId</label>
                <input
                  className="settings-input"
                  type={showKey ? 'text' : 'password'}
                  value={tencentSecretId}
                  onChange={(e) => setTencentSecretId(e.target.value)}
                  placeholder="AKID..."
                />
                <span className="settings-hint">腾讯云 API 密钥 &gt; SecretId</span>
              </div>
              <div className="settings-field">
                <label className="settings-label">SecretKey</label>
                <div className="settings-input-with-action">
                  <input
                    className="settings-input"
                    type={showKey ? 'text' : 'password'}
                    value={tencentSecretKey}
                    onChange={(e) => setTencentSecretKey(e.target.value)}
                    placeholder="..."
                    style={{ flex: 1 }}
                  />
                  <button
                    className="settings-action-btn"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <span className="settings-hint">腾讯云 API 密钥 &gt; SecretKey</span>
              </div>
              <div className="settings-field">
                <label className="settings-label">地域 (Region)</label>
                <input
                  className="settings-input"
                  type="text"
                  value={tencentRegion}
                  onChange={(e) => setTencentRegion(e.target.value)}
                  placeholder="ap-guangzhou"
                />
                <span className="settings-hint">混元 API 地域，默认 ap-guangzhou</span>
              </div>
            </>
          )}
          <div className="settings-field">
            <label className="settings-label">API Base URL</label>
            <input
              className="settings-input"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={currentPreset.baseUrl}
            />
            <span className="settings-hint">
              {isTencent
                ? '混元 API 地址，通常无需修改'
                : '可替换为兼容服务地址'}
            </span>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="settings-card">
        <h2 className="settings-card-title">模型选择</h2>
        <p className="settings-card-desc">{currentPreset.name} 可用模型</p>
        <div className="settings-model-grid">
          {currentPreset.models.map((m) => (
            <button
              key={m.value}
              className={`settings-model-card${model === m.value ? ' settings-model-card-active' : ''}`}
              onClick={() => setModel(m.value)}
            >
              <div className="settings-model-name">{m.label}</div>
              <div className="settings-model-desc">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div className="settings-card">
        <h2 className="settings-card-title">系统提示词</h2>
        <p className="settings-card-desc">自定义 AI 分析的角色设定和行为指令（留空则使用默认）</p>
        <textarea
          className="settings-textarea"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a professional trading analyst..."
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="settings-card">
        <div className="settings-actions-row">
          <button className="settings-save-btn" onClick={handleSave}>
            {saved ? '已保存' : '保存配置'}
          </button>
          <button
            className="settings-connect-btn"
            onClick={handleTest}
            disabled={testing || (!isTencent ? !apiKey : !tencentSecretId || !tencentSecretKey)}
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
        </div>
        {testResult && (
          <div className={`settings-test-result ${testResult.includes('失败') ? 'settings-test-fail' : 'settings-test-ok'}`}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISettings;
