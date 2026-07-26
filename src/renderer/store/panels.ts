import type { StateCreator } from 'zustand';
import type { Fundamentals, CalendarEvent, OverallWinRate } from '../../shared/types';
import type { AppState } from './index';

export interface PanelsSlice {
  showFundamentals: boolean;
  toggleFundamentals: () => void;
  fundamentalsData: Fundamentals | null;
  setFundamentalsData: (f: Fundamentals | null) => void;

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
