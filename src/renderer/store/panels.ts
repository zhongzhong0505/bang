import type { StateCreator } from 'zustand';
import type { Fundamentals, FinancialStatements, CalendarEvent, OverallWinRate, StatementPeriod } from '../../shared/types';
import type { AppState } from './index';

export interface PanelsSlice {
  showFundamentals: boolean;
  toggleFundamentals: () => void;
  fundamentalsData: Fundamentals | null;
  setFundamentalsData: (f: Fundamentals | null) => void;

  financialStatements: FinancialStatements | null;
  setFinancialStatements: (s: FinancialStatements | null) => void;

  fundPeriod: StatementPeriod;
  setFundPeriod: (p: StatementPeriod) => void;

  showCalendar: boolean;
  toggleCalendar: () => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (e: CalendarEvent[]) => void;

  showAIChat: boolean;
  toggleAIChat: () => void;

  showWinRate: boolean;
  winRateData: OverallWinRate | null;
  toggleWinRate: () => void;
  setWinRateData: (d: OverallWinRate | null) => void;
}

export const createPanelsSlice: StateCreator<AppState, [], [], PanelsSlice> = (set) => ({
  showFundamentals: false,
  toggleFundamentals: () => set((s) => ({ showFundamentals: !s.showFundamentals })),
  fundamentalsData: null,
  setFundamentalsData: (f) => set({ fundamentalsData: f }),

  financialStatements: null,
  setFinancialStatements: (s) => set({ financialStatements: s }),

  fundPeriod: 'quarter' as StatementPeriod,
  setFundPeriod: (p) => set({ fundPeriod: p }),

  showCalendar: false,
  toggleCalendar: () => set((s) => ({ showCalendar: !s.showCalendar })),
  calendarEvents: [],
  setCalendarEvents: (e) => set({ calendarEvents: e }),

  showAIChat: false,
  toggleAIChat: () => set((s) => ({ showAIChat: !s.showAIChat })),

  showWinRate: false,
  winRateData: null,
  toggleWinRate: () => set((s) => ({ showWinRate: !s.showWinRate })),
  setWinRateData: (d) => set({ winRateData: d }),
});
