import type { StateCreator } from 'zustand';
import type { Position, OrderRecord } from '../../shared/types';
import type { TradeRecord, AccountSummary } from '../../shared/types';
import type { AppState } from './index';

export interface TradingSlice {
  positions: Position[];
  orders: OrderRecord[];
  setPositions: (p: Position[]) => void;
  setOrders: (o: OrderRecord[]) => void;
  tradeRecords: TradeRecord[];
  addTradeRecord: (t: TradeRecord) => void;
  clearTradeRecords: () => void;
  accountSummary: AccountSummary | null;
  setAccountSummary: (s: AccountSummary | null) => void;
}

export const createTradingSlice: StateCreator<AppState, [], [], TradingSlice> = (set) => ({
  positions: [],
  orders: [],
  setPositions: (p) => set({ positions: p }),
  setOrders: (o) => set({ orders: o }),
  tradeRecords: [],
  addTradeRecord: (t) => set((s) => ({ tradeRecords: [t, ...s.tradeRecords] })),
  clearTradeRecords: () => set({ tradeRecords: [] }),
  accountSummary: null,
  setAccountSummary: (s) => set({ accountSummary: s }),
});
