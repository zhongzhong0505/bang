import type { StateCreator } from 'zustand';
import type { Strategy, BacktestResult, SignalRecord, StrategyRuntime } from '../../shared/types';
import { DEFAULT_STRATEGY } from '../../shared/types';
import type { AppState } from './index';

export interface QuantSlice {
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
}

export const createQuantSlice: StateCreator<AppState, [], [], QuantSlice> = (set) => ({
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
});
