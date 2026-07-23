import type { StateCreator } from 'zustand';
import type { PanelLayout, ChartLayout, ChartSlot } from '../../shared/types';
import { DEFAULT_PANEL_LAYOUT } from '../../shared/types';
import type { AppState } from './index';

export interface UISlice {
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

  showShortcuts: boolean;
  toggleShortcuts: () => void;

  isFullscreen: boolean;
  setFullscreen: (f: boolean) => void;

  chartLayout: ChartLayout;
  setChartLayout: (l: ChartLayout) => void;
  chartSlots: ChartSlot[];
  setChartSlot: (id: number, code: string, name: string) => void;
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;

  panelLayout: PanelLayout;
  setPanelLayout: (p: Partial<PanelLayout>) => void;

  tradeFromChartPrice: number | null;
  setTradeFromChartPrice: (p: number | null) => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  activePanel: 'chart',
  showTradeList: false,
  toggleTradeList: () => set((s) => ({ showTradeList: !s.showTradeList })),
  showAccountPanel: false,
  toggleAccountPanel: () => set((s) => ({ showAccountPanel: !s.showAccountPanel })),
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

  showShortcuts: false,
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),

  isFullscreen: false,
  setFullscreen: (f) => set({ isFullscreen: f }),

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

  panelLayout: { ...DEFAULT_PANEL_LAYOUT },
  setPanelLayout: (p) => set((s) => ({ panelLayout: { ...s.panelLayout, ...p } })),

  tradeFromChartPrice: null,
  setTradeFromChartPrice: (p) => set({ tradeFromChartPrice: p }),
});
