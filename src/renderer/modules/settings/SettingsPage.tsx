import React, { useState, Suspense, lazy } from 'react';
import './settings.css';
import { useStore } from '../../store';
import { useTBatch, useT } from '../../i18n';
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

const Loading = () => {
  const text = useT('settings.loading');
  return (
    <div className="settings-loading">
      <div className="settings-spinner" />
      <span>{text}</span>
    </div>
  );
};

type SettingsCategory = 'general' | 'chart' | 'gateway' | 'trade' | 'ai';

const NAV_ITEMS: { id: SettingsCategory; icon: React.ComponentType<{ size?: number }>; labelKey: string }[] = [
  { id: 'general', icon: Settings, labelKey: 'settings.basic' },
  { id: 'chart', icon: BarChart3, labelKey: 'settings.chart' },
  { id: 'gateway', icon: Network, labelKey: 'settings.gatewayNav' },
  { id: 'trade', icon: ArrowLeftRight, labelKey: 'settings.tradeNav' },
  { id: 'ai', icon: Brain, labelKey: 'settings.ai' },
];

const SettingsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const L = useTBatch([
    'settings.basic', 'settings.chart', 'settings.gatewayNav', 'settings.tradeNav', 'settings.ai',
    'settings.loading', 'settings.notConnected', 'settings.connectedHost', 'settings.loggedIn',
    'settings.futuOpenD', 'settings.tigerOpenAPI', 'settings.saved', 'settings.saveConfig',
    'settings.connecting', 'settings.connectGateway', 'settings.disconnectGateway',
    'settings.instructions', 'settings.backToChart', 'settings.title',
    'settings.generalSub', 'settings.chartSub', 'settings.gatewaySub', 'settings.tradeSub', 'settings.aiSub',
    'settings.futuStep1Title', 'settings.futuStep1Desc', 'settings.futuStep2Title', 'settings.futuStep2Desc',
    'settings.futuStep3Title', 'settings.futuStep3Desc', 'settings.futuStep4Title', 'settings.futuStep4Desc',
    'settings.tigerStep1Title', 'settings.tigerStep1Desc', 'settings.tigerStep2Title', 'settings.tigerStep2Desc',
    'settings.tigerStep3Title', 'settings.tigerStep3Desc', 'settings.tigerStep4Title', 'settings.tigerStep4Desc',
  ] as any);

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
                {L['settings.futuOpenD']}
              </button>
              <button
                className={`settings-provider-tab${activeProvider === 'tiger' ? ' settings-provider-tab-active' : ''}`}
                onClick={() => setActiveProvider('tiger')}
              >
                <span className="settings-provider-icon">T</span>
                {L['settings.tigerOpenAPI']}
              </button>
            </div>

            <div className="settings-status-row">
              <span className={`settings-status-dot ${gatewayStatus.connected ? 'up' : 'down'}`} />
              <span className="settings-status-text">
                {gatewayStatus.connected
                  ? gatewayStatus.provider === 'tiger'
                    ? `${L['settings.connectedHost']} ${gatewayStatus.host ?? ''}`
                    : `${L['settings.connectedHost']} ${gatewayStatus.host}:${gatewayStatus.port}`
                  : L['settings.notConnected']}
              </span>
              {gatewayStatus.loggedIn && (
                <span className="settings-status-text up">&middot; {L['settings.loggedIn']}</span>
              )}
              {gatewayStatus.error && (
                <span className="settings-status-text down">&middot; {gatewayStatus.error}</span>
              )}
              <span className="settings-status-text settings-status-text-meta">
                {gatewayStatus.provider === 'futu' ? L['settings.futuOpenD'] : L['settings.tigerOpenAPI']}
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
                {saved ? L['settings.saved'] : L['settings.saveConfig']}
              </button>
              {!gatewayStatus.connected ? (
                <button className="settings-connect-btn" onClick={handleConnect} disabled={connecting}>
                  {connecting ? L['settings.connecting'] : L['settings.connectGateway']}
                </button>
              ) : (
                <button className="settings-disconnect-btn" onClick={handleDisconnect}>
                  {L['settings.disconnectGateway']}
                </button>
              )}
            </div>

            <div className="settings-card">
              <h2 className="settings-card-title">{L['settings.instructions']}</h2>
              <div className="settings-instructions">
                {activeProvider === 'futu' ? (
                  [
                    { title: L['settings.futuStep1Title'], desc: L['settings.futuStep1Desc'] },
                    { title: L['settings.futuStep2Title'], desc: L['settings.futuStep2Desc'] },
                    { title: L['settings.futuStep3Title'], desc: L['settings.futuStep3Desc'] },
                    { title: L['settings.futuStep4Title'], desc: L['settings.futuStep4Desc'] },
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
                    { title: L['settings.tigerStep1Title'], desc: L['settings.tigerStep1Desc'] },
                    { title: L['settings.tigerStep2Title'], desc: L['settings.tigerStep2Desc'] },
                    { title: L['settings.tigerStep3Title'], desc: L['settings.tigerStep3Desc'] },
                    { title: L['settings.tigerStep4Title'], desc: L['settings.tigerStep4Desc'] },
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
                {L[item.labelKey as any]}
              </div>
            );
          })}
        </nav>
        <div className="settings-sidebar-footer">
          <div className="settings-nav-item" onClick={() => setActivePanel('chart')}>
            <span className="settings-nav-icon"><ChevronLeft size={15} /></span>
            {L['settings.backToChart']}
          </div>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title">
            {L[NAV_ITEMS.find((n) => n.id === activeCategory)?.labelKey as any] ?? L['settings.title']}
          </h1>
          <span className="settings-subtitle">
            {activeCategory === 'general' && L['settings.generalSub']}
            {activeCategory === 'chart' && L['settings.chartSub']}
            {activeCategory === 'gateway' && L['settings.gatewaySub']}
            {activeCategory === 'trade' && L['settings.tradeSub']}
            {activeCategory === 'ai' && L['settings.aiSub']}
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
