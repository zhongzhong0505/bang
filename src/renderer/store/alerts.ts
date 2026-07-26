import type { StateCreator } from 'zustand';
import type { Alert } from '../../shared/types';
import type { AppState } from './index';

export interface AlertsSlice {
  alerts: Alert[];
  addAlert: (a: Alert) => void;
  removeAlert: (id: string) => void;
  checkAlerts: (price: number, code: string) => void;
}

export const createAlertsSlice: StateCreator<AppState, [], [], AlertsSlice> = (set, get) => ({
  alerts: [],
  addAlert: (a) => set((s) => ({ alerts: [...s.alerts, a] })),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  checkAlerts: (price, code) => {
    const state = get();
    state.alerts.forEach((alert) => {
      if (alert.code !== code || alert.triggered) return;
      if (alert.condition === 'above' && price >= alert.price) {
        new Notification(`价格预警: ${alert.name}`, { body: `${alert.name} 已上穿 ${alert.price}` });
        set((s) => ({ alerts: s.alerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a) }));
      }
      if (alert.condition === 'below' && price <= alert.price) {
        new Notification(`价格预警: ${alert.name}`, { body: `${alert.name} 已下穿 ${alert.price}` });
        set((s) => ({ alerts: s.alerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a) }));
      }
    });
  },
});
