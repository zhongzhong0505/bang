import React, { useState, Suspense, lazy } from 'react';
import './settings.css';
import { useStore } from '../../store';
import type { GatewayConfig, GatewayStatus, FutuGatewayConfig, TigerGatewayConfig, GatewayProvider } from '../../../shared/types';
import { DEFAULT_FUTU_CONFIG, DEFAULT_TIGER_CONFIG } from '../../../shared/types';
import {
  Settings,
  BarChart3,
  Network,
  ArrowLeftRight,
  Brain,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';

const GeneralSettings = lazy(() => import('./GeneralSettings'));
const ChartSettings = lazy(() => import('./ChartSettings'));
const TradeSettings = lazy(() => import('./TradeSettings'));
const FutuSettings = lazy(() => import('./FutuSettings'));
const TigerSettings = lazy(() => import('./TigerSettings'));
const AISettings = lazy(() => import('./AISettings'));

const Loading = () => (
  <div className="settings-loading">
    <div className="settings-spinner" />
    <span>加载中...</span>
  </div>
);

type SettingsCategory = 'general' | 'chart' | 'gateway' | 'trade' | 'ai';

const NAV_ITEMS: { id: SettingsCategory; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { id: 'general', icon: Settings, label: '基础设置' },
  { id: 'chart', icon: BarChart3, label: '图表设置' },
  { id: 'gateway', icon: Network, label: '行情网关' },
  { id: 'trade', icon: ArrowLeftRight, label: '交易设置' },
  { id: 'ai', icon: Brain, label: 'AI 分析' },
];

const SettingsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

  // Gateway state
  const gatewayConfig = useStore((s) => s.gatewayConfig);
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const setGatewayConfig = useStore((s) => s.setGatewayConfig);
  const setGatewayStatus = useStore((s) => s.setGatewayStatus);
  const setActivePanel = useStore((s) => s.setActivePanel);

  const [activeProvider, setActiveProvider] = useState<GatewayProvider>(gatewayConfig.provider);
  const [futuForm, setFutuForm] = useState<FutuGatewayConfig>({
    ...DEFAULT_FUTU_CONFIG,
    ...(gatewayConfig.provider === 'futu' ? gatewayConfig : {}),
  });
  const [tigerForm, setTigerForm] = useState<TigerGatewayConfig>({
    ...DEFAULT_TIGER_CONFIG,
    ...(gatewayConfig.provider === 'tiger' ? gatewayConfig : {}),
  });
  const [connecting, setConnecting] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateFutuField = (key: keyof FutuGatewayConfig, value: string | number) => {
    setFutuForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTigerField = (key: keyof TigerGatewayConfig, value: string | number) => {
    setTigerForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const config: GatewayConfig = activeProvider === 'futu' ? futuForm : tigerForm;
    setGatewayConfig(config);
    const api = window.bangAPI;
    if (api) {
      api.setConfig(config);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConnect = async () => {
    const api = window.bangAPI;
    if (!api) return;
    setConnecting(true);
    const config: GatewayConfig = activeProvider === 'futu' ? futuForm : tigerForm;
    await api.setConfig(config);
    await api.connectGateway(config);
    setTimeout(async () => {
      const status = await api.getGatewayStatus();
      if (status) setGatewayStatus(status);
      setConnecting(false);
    }, 2000);
  };

  const handleDisconnect = async () => {
    const api = window.bangAPI;
    if (!api) return;
    await api.disconnectGateway();
    setGatewayStatus({ connected: false, loggedIn: false, provider: activeProvider, host: '', port: 0 });
  };

  const renderCategory = () => {
    switch (activeCategory) {
      case 'general':
        return <GeneralSettings />;
      case 'chart':
        return <ChartSettings />;
      case 'gateway':
        return (
          <>
            <div className="settings-provider-tabs">
              <button
                className={`settings-provider-tab${activeProvider === 'futu' ? ' settings-provider-tab-active' : ''}`}
                onClick={() => setActiveProvider('futu')}
              >
                <span className="settings-provider-icon">F</span>
                富途 OpenD
              </button>
              <button
                className={`settings-provider-tab${activeProvider === 'tiger' ? ' settings-provider-tab-active' : ''}`}
                onClick={() => setActiveProvider('tiger')}
              >
                <span className="settings-provider-icon">T</span>
                老虎 OpenAPI
              </button>
            </div>

            <div className="settings-status-row">
              <span className={`settings-status-dot ${gatewayStatus.connected ? 'up' : 'down'}`} />
              <span className="settings-status-text">
                {gatewayStatus.connected
                  ? gatewayStatus.provider === 'tiger'
                    ? `已连接 ${gatewayStatus.host ?? ''}`
                    : `已连接 ${gatewayStatus.host}:${gatewayStatus.port}`
                  : '未连接'}
              </span>
              {gatewayStatus.loggedIn && (
                <span className="settings-status-text up">&middot; 已登录</span>
              )}
              {gatewayStatus.error && (
                <span className="settings-status-text down">&middot; {gatewayStatus.error}</span>
              )}
              <span className="settings-status-text settings-status-text-meta">
                {gatewayStatus.provider === 'futu' ? '富途 OpenD' : '老虎 OpenAPI'}
              </span>
            </div>

            <Suspense fallback={<Loading />}>
              {activeProvider === 'futu' ? (
                <FutuSettings
                  form={futuForm}
                  status={gatewayStatus}
                  onUpdate={updateFutuField}
                  onSave={handleSave}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  connecting={connecting}
                  saved={saved}
                />
              ) : (
                <TigerSettings form={tigerForm} onUpdate={updateTigerField} />
              )}
            </Suspense>

            <div className="settings-actions">
              <button className="settings-save-btn" onClick={handleSave}>
                {saved ? '✓ 已保存' : '保存配置'}
              </button>
              {!gatewayStatus.connected ? (
                <button className="settings-connect-btn" onClick={handleConnect} disabled={connecting}>
                  {connecting ? '连接中...' : '连接网关'}
                </button>
              ) : (
                <button className="settings-disconnect-btn" onClick={handleDisconnect}>
                  断开连接
                </button>
              )}
            </div>

            <div className="settings-card">
              <h2 className="settings-card-title">使用说明</h2>
              <div className="settings-instructions">
                {activeProvider === 'futu' ? (
                  [
                    { title: '下载安装 OpenD', desc: '从富途官网下载 OpenD 网关程序，支持 Windows / macOS / CentOS / Ubuntu' },
                    { title: '启动并配置 OpenD', desc: '启动 OpenD，配置监听地址、端口等参数。若使用 WebSocket 连接，需配置 WebSocket 端口' },
                    { title: '登录 OpenD', desc: '使用牛牛号（平台账号）和密码登录 OpenD。首次登录需完成问卷评估与协议确认' },
                    { title: '连接并交易', desc: '在此页面填入 OpenD 的连接参数，点击"连接网关"即可开始获取行情和交易' },
                  ].map((s, i) => (
                    <div key={i} className="settings-step">
                      <span className="settings-step-num">{i + 1}</span>
                      <div>
                        <div className="settings-step-title">{s.title}</div>
                        <div className="settings-step-desc">{s.desc}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { title: '注册开放平台', desc: '前往老虎证券开放平台 (open.itigerup.com) 注册开发者账号，创建应用获取 TigerID 和私钥' },
                    { title: '获取 API 权限', desc: '在开放平台申请行情和交易权限，下载生成的 RSA 私钥文件（PKCS#1 格式）' },
                    { title: '沙盒测试', desc: '先使用沙盒环境进行接口调试和功能验证，确保签名和请求格式正确' },
                    { title: '切换生产环境', desc: '调试完成后将环境切换为 prod，填入真实交易账号，即可获取实时行情和下单交易' },
                  ].map((s, i) => (
                    <div key={i} className="settings-step">
                      <span className="settings-step-num">{i + 1}</span>
                      <div>
                        <div className="settings-step-title">{s.title}</div>
                        <div className="settings-step-desc">{s.desc}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );
      case 'ai':
        return <AISettings />;
      case 'trade':
        return <TradeSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        <div className="settings-logo-row">
          <span className="settings-logo-icon"><TrendingUp size={18} /></span>
          <span className="settings-logo-text">Bang</span>
          <span className="settings-logo-version">v1.0</span>
        </div>
        <nav className="settings-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`settings-nav-item${activeCategory === item.id ? ' settings-nav-item-active' : ''}`}
                onClick={() => setActiveCategory(item.id)}
              >
                <span className="settings-nav-icon"><Icon size={15} /></span>
                {item.label}
              </div>
            );
          })}
        </nav>
        <div className="settings-sidebar-footer">
          <div className="settings-nav-item" onClick={() => setActivePanel('chart')}>
            <span className="settings-nav-icon"><ChevronLeft size={15} /></span>
            返回行情交易
          </div>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title">
            {NAV_ITEMS.find((n) => n.id === activeCategory)?.label ?? '设置'}
          </h1>
          <span className="settings-subtitle">
            {activeCategory === 'general' && '外观、语言、日期格式等基础设置'}
            {activeCategory === 'chart' && 'K 线图配色、周期、指标等图表相关设置'}
            {activeCategory === 'gateway' && '配置富途 OpenD 或老虎 OpenAPI 行情数据网关'}
            {activeCategory === 'trade' && '下单参数、风控设置等交易相关设置'}
            {activeCategory === 'ai' && '配置 AI 大模型 API，实现下单前智能评估和行情分析'}
          </span>
        </div>

        <Suspense fallback={<Loading />}>
          {renderCategory()}
        </Suspense>
      </div>
    </div>
  );
};

export default SettingsPage;
