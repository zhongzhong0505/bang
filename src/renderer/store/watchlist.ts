import type { StateCreator } from 'zustand';
import type { WatchlistItem, StockSnapshot } from '../../shared/types';
import type { AppState } from './index';

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

export interface WatchlistSlice {
  watchlist: WatchlistItem[];
  snapshots: Record<string, StockSnapshot>;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (code: string) => void;
  setSnapshots: (s: Record<string, StockSnapshot>) => void;
  updateSnapshot: (code: string, s: StockSnapshot) => void;
}

export const createWatchlistSlice: StateCreator<AppState, [], [], WatchlistSlice> = (set) => ({
  watchlist: DEFAULT_WATCHLIST,
  snapshots: {},
  addToWatchlist: (item) => set((s) => ({ watchlist: [...s.watchlist, item] })),
  removeFromWatchlist: (code) => set((s) => ({ watchlist: s.watchlist.filter((w) => w.code !== code) })),
  setSnapshots: (s) => set({ snapshots: s }),
  updateSnapshot: (code, s) => set((state) => ({ snapshots: { ...state.snapshots, [code]: s } })),
});
