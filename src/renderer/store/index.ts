import { create } from 'zustand';
import type { GatewayConfig, GatewayStatus, KlineData, WatchlistItem, Position, OrderRecord, SubType, StockSnapshot, Strategy, BacktestResult, SignalRecord, StrategyRuntime, Alert, ChartStyle, ComparisonItem } from '../../shared/types';
import type { TradeRecord, AccountSummary, OverallWinRate } from '../../shared/types';
import type { ScreenerFilter, ScreenerResult, Fundamentals, CalendarEvent, PanelLayout, ChartLayout, ChartSlot } from '../../shared/types';
import { DEFAULT_FUTU_CONFIG, DEFAULT_STRATEGY, DEFAULT_CHART_STYLE } from '../../shared/types';
import type { AppSettings, ThemeMode, ThemeColors } from '../../shared/types';
import { DEFAULT_APP_SETTINGS, DARK_COLORS, LIGHT_COLORS } from '../../shared/types';
import { DEFAULT_SCREENER_FILTER, DEFAULT_PANEL_LAYOUT } from '../../shared/types';

export type ChartType = 'candle' | 'line' | 'area' | 'bar' | 'hollow' | 'heikin';

export interface AppState {
  // Gateway
  gatewayConfig: GatewayConfig;
  gatewayStatus: GatewayStatus;
  setGatewayConfig: (c: GatewayConfig) => void;
  setGatewayStatus: (s: GatewayStatus) => void;

  // Provider
  selectedProvider: 'futu' | 'tiger';
  setSelectedProvider: (p: 'futu' | 'tiger') => void;

  // Current stock
  currentCode: string;
  currentName: string;
  setCurrentStock: (code: string, name: string) => void;

  // Chart
  subType: SubType;
  chartType: ChartType;
  chartStyle: ChartStyle;
  indicators: string[];
  klineData: KlineData[];
  showChipDistribution: boolean;
  showVolumeProfile: boolean;
  setSubType: (t: SubType) => void;
  setChartType: (t: ChartType) => void;
  setChartStyle: (s: Partial<ChartStyle>) => void;
  toggleIndicator: (i: string) => void;
  setKlineData: (d: KlineData[]) => void;
  toggleChipDistribution: () => void;
  toggleVolumeProfile: () => void;

  // Comparison overlay
  comparisonSymbols: ComparisonItem[];
  addComparison: (code: string, name: string) => void;
  removeComparison: (code: string) => void;

  // Watchlist
  watchlist: WatchlistItem[];
  snapshots: Record<string, StockSnapshot>;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  setSnapshots: (s: Record<string, StockSnapshot>) => void;
  updateSnapshot: (code: string, s: StockSnapshot) => void;

  // Trading
  positions: Position[];
  orders: OrderRecord[];
  setPositions: (p: Position[]) => void;
  setOrders: (o: OrderRecord[]) => void;
  tradeRecords: TradeRecord[];
  addTradeRecord: (t: TradeRecord) => void;
  clearTradeRecords: () => void;
  accountSummary: AccountSummary | null;
  setAccountSummary: (s: AccountSummary | null) => void;

  // UI panels
  activePanel: 'chart' | 'settings';
  showTradeList: boolean;
  showAccountPanel: boolean;
  toggleTradeList: () => void;
  toggleAccountPanel: () => void;
  showOrderPanel: boolean;
  showWatchlist: boolean;
  showQuantPanel: boolean;
  showSymbolSearch: boolean;
  showAlertPanel: boolean;
  showDOM: boolean;
  activeQuantTab: 'strategies' | 'backtest' | 'signals' | 'monitor';
  setActivePanel: (p: 'chart' | 'settings') => void;
  toggleOrderPanel: () => void;
  toggleWatchlist: () => void;
  toggleQuantPanel: () => void;
  toggleSymbolSearch: () => void;
  toggleAlertPanel: () => void;
  toggleDOM: () => void;
  setActiveQuantTab: (t: 'strategies' | 'backtest' | 'signals' | 'monitor') => void;

  // Replay mode
  replayMode: boolean;
  replayIndex: number;
  toggleReplayMode: () => void;
  setReplayIndex: (i: number) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (a: Alert) => void;
  removeAlert: (id: string) => void;
  checkAlerts: (price: number, code: string) => void;

  // App settings
  appSettings: AppSettings;
  setAppSettings: (s: Partial<AppSettings>) => void;
  setFontSize: (size: 'small' | 'normal' | 'large' | 'xlarge') => void;
  resolvedTheme: 'dark' | 'light';
  themeColors: ThemeColors;
  setTheme: (t: ThemeMode) => void;

  // Quantitative trading
  strategies: Strategy[];
  backtestResults: Record<string, BacktestResult>;
  signals: SignalRecord[];
  strategyRuntimes: Record<string, StrategyRuntime>;
  addStrategy: (s: Strategy) => void;
  updateStrategy: (id: string, partial: Partial<Strategy>) => void;
  removeStrategy: (id: string) => void;
  setBacktestResult: (id: string, result: BacktestResult) => void;
  addSignal: (signal: SignalRecord) => void;
  clearSignals: () => void;
  setStrategyRuntime: (id: string, rt: StrategyRuntime) => void;
  removeStrategyRuntime: (id: string) => void;

  // Screener
  screenerFilter: ScreenerFilter;
  setScreenerFilter: (f: Partial<ScreenerFilter>) => void;
  screenerResults: ScreenerResult[];
  setScreenerResults: (r: ScreenerResult[]) => void;
  showScreener: boolean;
  toggleScreener: () => void;

  // Fundamentals
  showFundamentals: boolean;
  toggleFundamentals: () => void;
  fundamentalsData: Fundamentals | null;
  setFundamentalsData: (f: Fundamentals | null) => void;

  // Calendar
  showCalendar: boolean;
  toggleCalendar: () => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (e: CalendarEvent[]) => void;

  // AI Chat
  showAIChat: boolean;
  toggleAIChat: () => void;
  showWinRate: boolean;
  winRateData: OverallWinRate | null;
  toggleWinRate: () => void;
  setWinRateData: (d: OverallWinRate | null) => void;

  // Multi-chart layout
  chartLayout: ChartLayout;
  setChartLayout: (l: ChartLayout) => void;
  chartSlots: ChartSlot[];
  setChartSlot: (id: number, code: string, name: string) => void;
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;

  // Layout persistence
  panelLayout: PanelLayout;
  setPanelLayout: (p: Partial<PanelLayout>) => void;

  // Shortcuts overlay
  showShortcuts: boolean;
  toggleShortcuts: () => void;

  // Fullscreen
  isFullscreen: boolean;
  setFullscreen: (f: boolean) => void;

  // Trade from chart
  tradeFromChartPrice: number | null;
  setTradeFromChartPrice: (p: number | null) => void;
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { code: 'HK.00700', name: '腾讯控股', market: 'HK' },
  { code: 'HK.09988', name: '阿里巴巴-W', market: 'HK' },
  { code: 'HK.03690', name: '美团-W', market: 'HK' },
  { code: 'US.AAPL', name: 'Apple Inc', market: 'US' },
  { code: 'US.TSLA', name: 'Tesla Inc', market: 'US' },
  { code: 'US.NVDA', name: 'NVIDIA Corp', market: 'US' },
  { code: 'SH.600519', name: '贵州茅台', market: 'SH' },
  { code: 'SZ.000858', name: '五粮液', market: 'SZ' },
];

export const useStore = create<AppState>((set, get) => ({
  // Gateway
  gatewayConfig: { ...DEFAULT_FUTU_CONFIG } as GatewayConfig,
  gatewayStatus: { connected: false, loggedIn: false, provider: 'futu', host: '', port: 0 },
  setGatewayConfig: (c) => set({ gatewayConfig: c }),
  setGatewayStatus: (s) => set({ gatewayStatus: s }),

  // Provider
  selectedProvider: 'futu',
  setSelectedProvider: (p) => set({ selectedProvider: p }),

  // Current stock
  currentCode: 'HK.00700',
  currentName: '腾讯控股',
  setCurrentStock: (code, name) => set({ currentCode: code, currentName: name }),

  // Chart
  subType: '1',
  chartType: 'candle',
  chartStyle: { ...DEFAULT_CHART_STYLE },
  indicators: ['MA5', 'MA20'],
  klineData: [],
  showChipDistribution: true,
  showVolumeProfile: false,
  setSubType: (t) => set({ subType: t }),
  setChartType: (t) => set({ chartType: t }),
  setChartStyle: (s) => set((state) => ({ chartStyle: { ...state.chartStyle, ...s } })),
  toggleIndicator: (i) =>
    set((s) => ({
      indicators: s.indicators.includes(i)
        ? s.indicators.filter((x) => x !== i)
        : [...s.indicators, i],
    })),
  setKlineData: (d) => set({ klineData: d }),
  toggleChipDistribution: () => set((s) => ({ showChipDistribution: !s.showChipDistribution })),
  toggleVolumeProfile: () => set((s) => ({ showVolumeProfile: !s.showVolumeProfile })),

  // Comparison overlay
  comparisonSymbols: [],
  addComparison: (code, name) => set((s) => {
    const colors = ['#f59e0b', '#29b6f6', '#ab47bc', '#ff9800', '#06b6d4'];
    const idx = s.comparisonSymbols.length % colors.length;
    if (s.comparisonSymbols.find((c) => c.code === code)) return s;
    return { comparisonSymbols: [...s.comparisonSymbols, { code, name, color: colors[idx] }] };
  }),
  removeComparison: (code) => set((s) => ({ comparisonSymbols: s.comparisonSymbols.filter((c) => c.code !== code) })),

  // Watchlist
  watchlist: DEFAULT_WATCHLIST,
  snapshots: {},
  addToWatchlist: (item) => set((s) => ({ watchlist: [...s.watchlist, item] })),
  removeFromWatchlist: (code) => set((s) => ({ watchlist: s.watchlist.filter((w) => w.code !== code) })),
  setSnapshots: (s) => set({ snapshots: s }),
  updateSnapshot: (code, s) => set((state) => ({ snapshots: { ...state.snapshots, [code]: s } })),

  // Trading
  positions: [],
  orders: [],
  setPositions: (p) => set({ positions: p }),
  setOrders: (o) => set({ orders: o }),
  tradeRecords: [],
  addTradeRecord: (t) => set((s) => ({ tradeRecords: [t, ...s.tradeRecords] })),
  clearTradeRecords: () => set({ tradeRecords: [] }),
  activePanel: 'chart',
  showTradeList: false,
  toggleTradeList: () => set((s) => ({ showTradeList: !s.showTradeList })),
  showAccountPanel: false,
  toggleAccountPanel: () => set((s) => ({ showAccountPanel: !s.showAccountPanel })),
  accountSummary: null,
  setAccountSummary: (s) => set({ accountSummary: s }),
  showOrderPanel: true,
  showWatchlist: true,
  showQuantPanel: false,
  showSymbolSearch: false,
  showAlertPanel: false,
  showDOM: false,
  activeQuantTab: 'strategies',
  setActivePanel: (p) => set({ activePanel: p }),
  toggleOrderPanel: () => set((s) => ({ showOrderPanel: !s.showOrderPanel })),
  toggleWatchlist: () => set((s) => ({ showWatchlist: !s.showWatchlist })),
  toggleQuantPanel: () => set((s) => ({ showQuantPanel: !s.showQuantPanel })),
  toggleSymbolSearch: () => set((s) => ({ showSymbolSearch: !s.showSymbolSearch })),
  toggleAlertPanel: () => set((s) => ({ showAlertPanel: !s.showAlertPanel })),
  toggleDOM: () => set((s) => ({ showDOM: !s.showDOM })),
  setActiveQuantTab: (t) => set({ activeQuantTab: t }),

  // Replay
  replayMode: false,
  replayIndex: 0,
  toggleReplayMode: () => set((s) => ({ replayMode: !s.replayMode })),
  setReplayIndex: (i) => set({ replayIndex: i }),

  // Alerts
  alerts: [],
  addAlert: (a) => set((s) => ({ alerts: [...s.alerts, a] })),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  checkAlerts: (price, code) => {
    const state = get();
    state.alerts.forEach((alert) => {
      if (alert.code !== code || alert.triggered) return;
      if (alert.condition === 'above' && price >= alert.price) {
        new Notification(`价格预警: ${alert.name}`, { body: `${alert.name} 已上穿 ${alert.price}` });
        set((s) => ({ alerts: s.alerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a) }));
      }
      if (alert.condition === 'below' && price <= alert.price) {
        new Notification(`价格预警: ${alert.name}`, { body: `${alert.name} 已下穿 ${alert.price}` });
        set((s) => ({ alerts: s.alerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a) }));
     }
   });
 },

  // App settings
 appSettings: { ...DEFAULT_APP_SETTINGS },
  setAppSettings: (partial) => {
    set((s) => ({ appSettings: { ...s.appSettings, ...partial } }));
    // If theme changed, apply it to CSS variables
    if (partial.theme !== undefined) {
      get().setTheme(partial.theme);
    }
  },
  resolvedTheme: 'dark',
  themeColors: { ...DARK_COLORS },
  setTheme: (t) => {
    const resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    const colors = resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    set((s) => ({
      appSettings: { ...s.appSettings, theme: t },
      resolvedTheme: resolved as 'dark' | 'light',
      themeColors: colors,
    }));
    const root = document.documentElement;
    const cssVarMap: Record<string, string> = {
      bgPrimary: '--bg-primary', bgSecondary: '--bg-secondary', bgTertiary: '--bg-tertiary',
      bgHover: '--bg-hover', bgActive: '--bg-active', border: '--border', borderLight: '--border-light',
      textPrimary: '--text-primary', textSecondary: '--text-secondary', textMuted: '--text-muted',
      accent: '--accent', green: '--green', red: '--red', gridColor: '--grid-color',
      chartBg: '--chart-bg', crosshairColor: '--crosshair-color',
    };
    Object.entries(colors).forEach(([key, val]) => {
      const cssKey = cssVarMap[key];
      if (cssKey) root.style.setProperty(cssKey, val);
    });
  },

  setFontSize: (size) => {
    const scale: Record<string, number> = { small: 0.9, normal: 1.0, large: 1.12, xlarge: 1.25 };
    const zoom = scale[size] ?? 1.0;
    document.documentElement.style.setProperty('--app-zoom', String(zoom));
    set((s) => ({ appSettings: { ...s.appSettings, fontSize: size } }));
  },

  // Quantitative trading
  strategies: [DEFAULT_STRATEGY],
  backtestResults: {},
  signals: [],
  strategyRuntimes: {},
  addStrategy: (s) => set((state) => ({ strategies: [...state.strategies, s] })),
  updateStrategy: (id, partial) => set((state) => ({
    strategies: state.strategies.map((s) => s.id === id ? { ...s, ...partial } : s),
  })),
  removeStrategy: (id) => set((state) => ({
    strategies: state.strategies.filter((s) => s.id !== id),
  })),
  setBacktestResult: (id, result) => set((state) => ({
    backtestResults: { ...state.backtestResults, [id]: result },
  })),
  addSignal: (signal) => set((state) => ({
    signals: [signal, ...state.signals].slice(0, 200),
  })),
  clearSignals: () => set({ signals: [] }),
  setStrategyRuntime: (id, rt) => set((state) => ({
    strategyRuntimes: { ...state.strategyRuntimes, [id]: rt },
  })),
  removeStrategyRuntime: (id) => set((state) => {
    const next = { ...state.strategyRuntimes };
    delete next[id];
    return { strategyRuntimes: next };
  }),

  // Screener
  screenerFilter: { ...DEFAULT_SCREENER_FILTER },
  setScreenerFilter: (f) => set((s) => ({ screenerFilter: { ...s.screenerFilter, ...f } })),
  screenerResults: [],
  setScreenerResults: (r) => set({ screenerResults: r }),
  showScreener: false,
  toggleScreener: () => set((s) => ({ showScreener: !s.showScreener })),

  // Fundamentals
  showFundamentals: false,
  toggleFundamentals: () => set((s) => ({ showFundamentals: !s.showFundamentals })),
  fundamentalsData: null,
  setFundamentalsData: (f) => set({ fundamentalsData: f }),

  // Calendar
  showCalendar: false,
  toggleCalendar: () => set((s) => ({ showCalendar: !s.showCalendar })),
  calendarEvents: [],
  setCalendarEvents: (e) => set({ calendarEvents: e }),

  // AI Chat
  showAIChat: false,
  toggleAIChat: () => set((s) => ({ showAIChat: !s.showAIChat })),
  showWinRate: false,
  winRateData: null,
  toggleWinRate: () => set((s) => ({ showWinRate: !s.showWinRate })),
  setWinRateData: (d) => set({ winRateData: d }),

  // Multi-chart layout
  chartLayout: 'single',
  setChartLayout: (l) => set({ chartLayout: l }),
  chartSlots: [
    { id: 0, code: 'HK.00700', name: '腾讯控股' },
    { id: 1, code: 'US.AAPL', name: 'Apple Inc' },
    { id: 2, code: 'HK.09988', name: '阿里巴巴-W' },
    { id: 3, code: 'US.TSLA', name: 'Tesla Inc' },
  ],
  setChartSlot: (id, code, name) => set((s) => ({
    chartSlots: s.chartSlots.map((slot) => slot.id === id ? { ...slot, code, name } : slot),
  })),
  activeSlotId: 0,
  setActiveSlotId: (id) => set({ activeSlotId: id }),

  // Layout persistence
  panelLayout: { ...DEFAULT_PANEL_LAYOUT },
  setPanelLayout: (p) => set((s) => ({ panelLayout: { ...s.panelLayout, ...p } })),

  // Shortcuts overlay
  showShortcuts: false,
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),

  // Fullscreen
  isFullscreen: false,
  setFullscreen: (f) => set({ isFullscreen: f }),

  // Trade from chart
  tradeFromChartPrice: null,
  setTradeFromChartPrice: (p) => set({ tradeFromChartPrice: p }),
}));
