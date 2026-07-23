import type { StateCreator } from 'zustand';
import type { KlineData, SubType, ChartStyle, ComparisonItem } from '../../shared/types';
import { DEFAULT_CHART_STYLE } from '../../shared/types';
import type { AppState } from './index';

export type ChartType = 'candle' | 'line' | 'area' | 'bar' | 'hollow' | 'heikin';

export interface ChartSlice {
  currentCode: string;
  currentName: string;
  setCurrentStock: (code: string, name: string) => void;

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

  comparisonSymbols: ComparisonItem[];
  addComparison: (code: string, name: string) => void;
  removeComparison: (code: string) => void;

  replayMode: boolean;
  replayIndex: number;
  toggleReplayMode: () => void;
  setReplayIndex: (i: number) => void;
}

export const createChartSlice: StateCreator<AppState, [], [], ChartSlice> = (set) => ({
  currentCode: 'HK.00700',
  currentName: '腾讯控股',
  setCurrentStock: (code, name) => set({ currentCode: code, currentName: name }),

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

  comparisonSymbols: [],
  addComparison: (code, name) => set((s) => {
    const colors = ['#f59e0b', '#29b6f6', '#ab47bc', '#ff9800', '#06b6d4'];
    const idx = s.comparisonSymbols.length % colors.length;
    if (s.comparisonSymbols.find((c) => c.code === code)) return s;
    return { comparisonSymbols: [...s.comparisonSymbols, { code, name, color: colors[idx] }] };
  }),
  removeComparison: (code) => set((s) => ({ comparisonSymbols: s.comparisonSymbols.filter((c) => c.code !== code) })),

  replayMode: false,
  replayIndex: 0,
  toggleReplayMode: () => set((s) => ({ replayMode: !s.replayMode })),
  setReplayIndex: (i) => set({ replayIndex: i }),
});
