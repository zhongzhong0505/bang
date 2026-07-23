import { create } from 'zustand';
import { createGatewaySlice, type GatewaySlice } from './gateway';
import { createChartSlice, type ChartSlice } from './chart';
import { createWatchlistSlice, type WatchlistSlice } from './watchlist';
import { createTradingSlice, type TradingSlice } from './trading';
import { createUISlice, type UISlice } from './ui';
import { createSettingsSlice, type SettingsSlice } from './settings';
import { createQuantSlice, type QuantSlice } from './quant';
import { createScreenerSlice, type ScreenerSlice } from './screener';
import { createAlertsSlice, type AlertsSlice } from './alerts';
import { createPanelsSlice, type PanelsSlice } from './panels';

export type { ChartType } from './chart';

export type AppState = GatewaySlice & ChartSlice & WatchlistSlice & TradingSlice
  & UISlice & SettingsSlice & QuantSlice & ScreenerSlice & AlertsSlice & PanelsSlice;

export const useStore = create<AppState>()((...a) => ({
  ...createGatewaySlice(...a),
  ...createChartSlice(...a),
  ...createWatchlistSlice(...a),
  ...createTradingSlice(...a),
  ...createUISlice(...a),
  ...createSettingsSlice(...a),
  ...createQuantSlice(...a),
  ...createScreenerSlice(...a),
  ...createAlertsSlice(...a),
  ...createPanelsSlice(...a),
}));
