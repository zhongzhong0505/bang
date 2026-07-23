import type { StateCreator } from 'zustand';
import type { GatewayConfig, GatewayStatus } from '../../shared/types';
import { DEFAULT_FUTU_CONFIG } from '../../shared/types';
import type { AppState } from './index';

export interface GatewaySlice {
  gatewayConfig: GatewayConfig;
  gatewayStatus: GatewayStatus;
  setGatewayConfig: (c: GatewayConfig) => void;
  setGatewayStatus: (s: GatewayStatus) => void;
  selectedProvider: 'futu' | 'tiger';
  setSelectedProvider: (p: 'futu' | 'tiger') => void;
}

export const createGatewaySlice: StateCreator<AppState, [], [], GatewaySlice> = (set) => ({
  gatewayConfig: { ...DEFAULT_FUTU_CONFIG } as GatewayConfig,
  gatewayStatus: { connected: false, loggedIn: false, provider: 'futu', host: '', port: 0 },
  setGatewayConfig: (c) => set({ gatewayConfig: c }),
  setGatewayStatus: (s) => set({ gatewayStatus: s }),
  selectedProvider: 'futu',
  setSelectedProvider: (p) => set({ selectedProvider: p }),
});
