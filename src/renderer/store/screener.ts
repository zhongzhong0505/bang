import type { StateCreator } from 'zustand';
import type { ScreenerFilter, ScreenerResult } from '../../shared/types';
import { DEFAULT_SCREENER_FILTER } from '../../shared/types';
import type { AppState } from './index';

export interface ScreenerSlice {
  screenerFilter: ScreenerFilter;
  setScreenerFilter: (f: Partial<ScreenerFilter>) => void;
  screenerResults: ScreenerResult[];
  setScreenerResults: (r: ScreenerResult[]) => void;
  showScreener: boolean;
  toggleScreener: () => void;
}

export const createScreenerSlice: StateCreator<AppState, [], [], ScreenerSlice> = (set) => ({
  screenerFilter: { ...DEFAULT_SCREENER_FILTER },
  setScreenerFilter: (f) => set((s) => ({ screenerFilter: { ...s.screenerFilter, ...f } })),
  screenerResults: [],
  setScreenerResults: (r) => set({ screenerResults: r }),
  showScreener: false,
  toggleScreener: () => set((s) => ({ showScreener: !s.showScreener })),
});
