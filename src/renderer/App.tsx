import React, { useEffect, lazy, Suspense, Component, type ReactNode } from 'react';
import { useStore } from './store';
import Watchlist from './modules/watchlist/Watchlist';
import Toolbar from './modules/toolbar/Toolbar';
import StatusBar from './modules/statusbar/StatusBar';
import Sidebar from './modules/sidebar/Sidebar';
import { loadLocale } from './i18n';

const ChartView = lazy(() => import('./modules/chart/ChartView'));
const SettingsPage = lazy(() => import('./modules/settings/SettingsPage'));
const ShortcutsOverlay = lazy(() => import('./modules/shortcuts/ShortcutsOverlay'));
const OrderPanel = lazy(() => import('./modules/trading/OrderPanel'));
const DepthOfMarket = lazy(() => import('./modules/trading/DepthOfMarket'));
const QuantPanel = lazy(() => import('./modules/quant/QuantPanel'));
const SymbolSearch = lazy(() => import('./modules/search/SymbolSearch'));
const AlertPanel = lazy(() => import('./modules/alerts/AlertPanel'));
const TradeList = lazy(() => import('./modules/trading/TradeList'));
const AccountPanel = lazy(() => import('./modules/account/AccountPanel'));
const ScreenerPanel = lazy(() => import('./modules/screener/ScreenerPanel'));
const AIChatPanel = lazy(() => import('./modules/ai/AIChatPanel'));
const FundamentalsPanel = lazy(() => import('./modules/fundamentals/FundamentalsPanel'));
const CalendarPanel = lazy(() => import('./modules/calendar/CalendarPanel'));
const WinRatePanel = lazy(() => import('./modules/analytics/WinRatePanel'));

interface EBState { hasError: boolean; error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <div className="app-error-title">渲染错误</div>
          <div className="app-error-msg">{this.state.error?.message}</div>
          <button className="app-error-btn" onClick={() => this.setState({ hasError: false, error: null })}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Fallback = () => <div className="app-fallback">加载中...</div>;

declare global {
  interface Window {
    bangAPI?: {
      getConfig: () => Promise<any>;
      setConfig: (c: any) => Promise<any>;
      connectGateway: (c: any) => Promise<any>;
      disconnectGateway: () => Promise<any>;
      getGatewayStatus: () => Promise<any>;
      requestKline: (code: string, subType: string, count?: number) => Promise<any>;
      requestSnapshot: (codes: string[]) => Promise<any>;
      subscribe: (code: string, subTypes: string[]) => Promise<any>;
      placeOrder: (req: any) => Promise<any>;
      cancelOrder: (id: string) => Promise<any>;
      modifyOrder: (req: any) => Promise<any>;
      getOrders: () => Promise<any>;
      getPositions: () => Promise<any>;
      getAccountSummary: () => Promise<any>;
      evaluateOrder: (ctx: any) => Promise<any>;
      aiChat: (messages: any[]) => Promise<any>;
      getAIConfig: () => Promise<any>;
      setAIConfig: (settings: any) => Promise<any>;
      getAppSettings: () => Promise<any>;
      setAppSettings: (settings: any) => Promise<any>;
     screenerSearch: (filter: any) => Promise<any>;
      searchStock: (keyword: string) => Promise<any>;
     getFundamentals: (code: string) => Promise<any>;
      getCalendar: (date?: string) => Promise<any>;
      exportData: (req: any) => Promise<any>;
      getPanelLayout: () => Promise<any>;
      setPanelLayout: (layout: any) => Promise<any>;
      toggleFullscreen: () => Promise<boolean>;
      onGatewayStatus: (cb: (s: any) => void) => () => void;
      onKlineData: (cb: (d: any) => void) => () => void;
      onSnapshotData: (cb: (d: any) => void) => () => void;
      onSubscribeData: (cb: (d: any) => void) => () => void;
      onAccountSummary: (cb: (d: any) => void) => () => void;
      onAIStreamChunk: (cb: (d: any) => void) => () => void;
      onFullscreenChange: (cb: (f: boolean) => void) => () => void;
      analyzeWinRate?: (startTime?: string, endTime?: string) => Promise<any>;
    };
  }
}

const App: React.FC = () => {
  const activePanel = useStore((s) => s.activePanel);
  const showWatchlist = useStore((s) => s.showWatchlist);
  const showOrderPanel = useStore((s) => s.showOrderPanel);
  const showQuantPanel = useStore((s) => s.showQuantPanel);
  const showDOM = useStore((s) => s.showDOM);
  const showSymbolSearch = useStore((s) => s.showSymbolSearch);
  const showAlertPanel = useStore((s) => s.showAlertPanel);
  const setGatewayStatus = useStore((s) => s.setGatewayStatus);
  const setGatewayConfig = useStore((s) => s.setGatewayConfig);
  const setAppSettings = useStore((s) => s.setAppSettings);
  const appSettings = useStore((s) => s.appSettings);
  const setTheme = useStore((s) => s.setTheme);
  const showTradeList = useStore((s) => s.showTradeList);
  const showAccountPanel = useStore((s) => s.showAccountPanel);
  const showScreener = useStore((s) => s.showScreener);
  const showAIChat = useStore((s) => s.showAIChat);
  const showFundamentals = useStore((s) => s.showFundamentals);
  const showCalendar = useStore((s) => s.showCalendar);
  const showWinRate = useStore((s) => s.showWinRate);
  const showShortcuts = useStore((s) => s.showShortcuts);
  const setFullscreen = useStore((s) => s.setFullscreen);
  const isFullscreen = useStore((s) => s.isFullscreen);

  // Load i18n locale on demand when language changes
  useEffect(() => {
    const locale = (appSettings.language ?? 'zh-CN').startsWith('zh') ? 'zh' as const : 'en' as const;
    loadLocale(locale);
  }, [appSettings.language]);

  useEffect(() => {
    setTheme(appSettings.theme);
    useStore.getState().setFontSize(appSettings.fontSize ?? 'normal');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const api = window.bangAPI;
    if (api?.setAppSettings) api.setAppSettings(appSettings);
  }, [appSettings]);

  useEffect(() => {
    const api = window.bangAPI;
    if (!api) return;

    api.getConfig().then((cfg) => {
      if (cfg) {
        setGatewayConfig(cfg);
        // Auto-connect if credentials are present
        const hasCredentials = cfg.provider === 'tiger'
          ? cfg.tigerId && cfg.account && cfg.privateKey
          : cfg.host;
        if (hasCredentials) {
          api.connectGateway(cfg).then(() => {
            api.getGatewayStatus().then((status) => { if (status) setGatewayStatus(status); });
          });
        }
      }
    });
    if (api.getAppSettings) api.getAppSettings().then((saved) => {
      if (saved) {
        setAppSettings(saved);
        // Apply persisted theme immediately
        useStore.getState().setTheme(saved.theme ?? 'dark');
      }
    });

    const unsub = api.onGatewayStatus((status) => setGatewayStatus(status));

    // Subscribe to real-time snapshot push (updates watchlist prices)
    if (api.onSubscribeData) {
      api.onSubscribeData((data: any) => {
        if (data?.code) {
          if (data.curPrice !== undefined) {
            // Direct snapshot object (tiger push quote)
            useStore.getState().updateSnapshot(data.code, data);
          } else if (data.snapshot) {
            // Wrapped format
            useStore.getState().updateSnapshot(data.code, data.snapshot);
          }
        }
      });
    }

    // Listen for fullscreen changes
    if (api.onFullscreenChange) {
      api.onFullscreenChange((fs) => setFullscreen(fs));
    }

    return () => { unsub(); };
  }, [setGatewayConfig, setGatewayStatus, setFullscreen]);

  // Listen for OS theme changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (useStore.getState().appSettings.theme === 'system') {
        useStore.getState().setTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        useStore.getState().toggleShortcuts();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        const api = window.bangAPI;
        if (api?.toggleFullscreen) api.toggleFullscreen().then((fs) => setFullscreen(fs));
      }
      if (e.key === 'Escape') {
        const s = useStore.getState();
        if (s.showSymbolSearch) s.toggleSymbolSearch();
        else if (s.showShortcuts) s.toggleShortcuts();
        else if (s.showScreener) s.toggleScreener();
        else if (s.showFundamentals) s.toggleFundamentals();
        else if (s.showCalendar) s.toggleCalendar();
        else if (s.showWinRate) s.toggleWinRate();
        else if (isFullscreen) {
          const api = window.bangAPI;
          if (api?.toggleFullscreen) api.toggleFullscreen().then(() => setFullscreen(false));
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setFullscreen, isFullscreen]);

 if (activePanel === 'settings') {
    return <ErrorBoundary><Suspense fallback={<Fallback />}><SettingsPage /></Suspense></ErrorBoundary>;
 }

  return (
    <div className="app-root" data-panel="chart">
      <Sidebar />
      <div className="app-column">
        <Toolbar />
        <div className="app-main">
        {showWatchlist && <Watchlist />}
        <ErrorBoundary><Suspense fallback={<Fallback />}><ChartView /></Suspense></ErrorBoundary>
        {showOrderPanel && <ErrorBoundary><Suspense fallback={<Fallback />}><OrderPanel /></Suspense></ErrorBoundary>}
        {showDOM && <ErrorBoundary><Suspense fallback={<Fallback />}><DepthOfMarket /></Suspense></ErrorBoundary>}
        {showQuantPanel && <ErrorBoundary><Suspense fallback={<Fallback />}><QuantPanel /></Suspense></ErrorBoundary>}
      </div>
        <StatusBar />
        {showSymbolSearch && <ErrorBoundary><Suspense fallback={<Fallback />}><SymbolSearch /></Suspense></ErrorBoundary>}
      {showAlertPanel && <ErrorBoundary><Suspense fallback={<Fallback />}><AlertPanel /></Suspense></ErrorBoundary>}
      {showTradeList && <ErrorBoundary><Suspense fallback={<Fallback />}><TradeList /></Suspense></ErrorBoundary>}
      {showAccountPanel && <ErrorBoundary><Suspense fallback={<Fallback />}><AccountPanel /></Suspense></ErrorBoundary>}
      {showScreener && <ErrorBoundary><Suspense fallback={<Fallback />}><ScreenerPanel /></Suspense></ErrorBoundary>}
      {showFundamentals && <ErrorBoundary><Suspense fallback={<Fallback />}><FundamentalsPanel /></Suspense></ErrorBoundary>}
      {showCalendar && <ErrorBoundary><Suspense fallback={<Fallback />}><CalendarPanel /></Suspense></ErrorBoundary>}
      {showWinRate && <ErrorBoundary><Suspense fallback={<Fallback />}><WinRatePanel /></Suspense></ErrorBoundary>}
      {showAIChat && <ErrorBoundary><Suspense fallback={<Fallback />}><AIChatPanel /></Suspense></ErrorBoundary>}
      {showShortcuts && <ErrorBoundary><Suspense fallback={<Fallback />}><ShortcutsOverlay /></Suspense></ErrorBoundary>}
      </div>
    </div>
  );
};

export default App;
