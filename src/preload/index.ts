import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';

const api = {
  // Gateway config
  getConfig: () => ipcRenderer.invoke(IPC.GATEWAY_CONFIG_GET),
  setConfig: (config: any) => ipcRenderer.invoke(IPC.GATEWAY_CONFIG_SET, config),
  connectGateway: (config: any) => ipcRenderer.invoke(IPC.GATEWAY_CONNECT, config),
  disconnectGateway: () => ipcRenderer.invoke(IPC.GATEWAY_DISCONNECT),
  getGatewayStatus: () => ipcRenderer.invoke(IPC.GATEWAY_STATUS),

  // Market data
  requestKline: (code: string, subType: string, count?: number) =>
    ipcRenderer.invoke(IPC.KLINE_REQUEST, code, subType, count),
  requestSnapshot: (codes: string[]) =>
    ipcRenderer.invoke(IPC.SNAPSHOT_REQUEST, codes),
  subscribe: (code: string, subTypes: string[]) =>
    ipcRenderer.invoke(IPC.SUBSCRIBE, code, subTypes),

  // Order placement
  placeOrder: (req: any) =>
    ipcRenderer.invoke(IPC.ORDER_PLACE, req),
  cancelOrder: (id: string) =>
    ipcRenderer.invoke(IPC.ORDER_CANCEL, id),
  getOrders: () =>
    ipcRenderer.invoke(IPC.ORDER_LIST),
  getPositions: () =>
    ipcRenderer.invoke(IPC.POSITIONS),

  getAccountSummary: () =>
    ipcRenderer.invoke(IPC.ACCOUNT_SUMMARY),

  // AI
  evaluateOrder: (ctx: any) =>
    ipcRenderer.invoke(IPC.AI_EVALUATE_ORDER, ctx),
  aiChat: (messages: any[]) =>
    ipcRenderer.invoke(IPC.AI_CHAT, messages),
  getAIConfig: () =>
    ipcRenderer.invoke(IPC.AI_CONFIG_GET),
  setAIConfig: (settings: any) =>
    ipcRenderer.invoke(IPC.AI_CONFIG_SET, settings),

  // App settings persistence
  getAppSettings: () =>
    ipcRenderer.invoke(IPC.APP_SETTINGS_GET),
  setAppSettings: (settings: any) =>
    ipcRenderer.invoke(IPC.APP_SETTINGS_SET, settings),

  // Order modification
  modifyOrder: (req: any) =>
    ipcRenderer.invoke(IPC.ORDER_MODIFY, req),

 // Screener
 screenerSearch: (filter: any) =>
   ipcRenderer.invoke(IPC.SCREENER_SEARCH, filter),

  // Stock search (gateway OpenAPI)
  searchStock: (keyword: string) =>
    ipcRenderer.invoke(IPC.STOCK_SEARCH, keyword),

  // Data export
  exportData: (req: any) =>
    ipcRenderer.invoke(IPC.EXPORT_DATA, req),

  // Fundamentals
  getFundamentals: (code: string) =>
    ipcRenderer.invoke("fundamentals:get", code),

  // Calendar
  getCalendar: (date?: string) =>
    ipcRenderer.invoke("calendar:get", date),

  // Layout persistence
  getPanelLayout: () =>
    ipcRenderer.invoke('layout:get'),
  setPanelLayout: (layout: any) =>
    ipcRenderer.invoke('layout:set', layout),

  // Fullscreen
  toggleFullscreen: () =>
    ipcRenderer.invoke('window:fullscreen:toggle'),
  onFullscreenChange: (cb: (f: boolean) => void) => {
    const handler = (_e: any, data: boolean) => cb(data);
    ipcRenderer.on('window:fullscreen:change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen:change', handler);
  },

  // Events
  onGatewayStatus: (cb: (status: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on(IPC.GATEWAY_STATUS_UPDATE, handler);
    return () => ipcRenderer.removeListener(IPC.GATEWAY_STATUS_UPDATE, handler);
  },
  onKlineData: (cb: (data: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on(IPC.KLINE_DATA, handler);
    return () => ipcRenderer.removeListener(IPC.KLINE_DATA, handler);
  },
  onSnapshotData: (cb: (data: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on(IPC.SNAPSHOT_DATA, handler);
    return () => ipcRenderer.removeListener(IPC.SNAPSHOT_DATA, handler);
  },
  onSubscribeData: (cb: (data: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on(IPC.SUBSCRIBE_DATA, handler);
    return () => ipcRenderer.removeListener(IPC.SUBSCRIBE_DATA, handler);
  },
  onAccountSummary: (cb: (data: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on('account:summary', handler);
    return () => ipcRenderer.removeListener('account:summary', handler);
  },
  onAIStreamChunk: (cb: (data: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on(IPC.AI_STREAM_CHUNK, handler);
    return () => ipcRenderer.removeListener(IPC.AI_STREAM_CHUNK, handler);
  },


  // SkillHub
  fetchSkillHub: (url?: string) =>
    ipcRenderer.invoke(IPC.SKILLHUB_FETCH, url),

  // Skill ZIP import
  importSkillZip: (zipBuffer: ArrayBuffer) =>
    ipcRenderer.invoke(IPC.SKILL_IMPORT_ZIP, zipBuffer),

  // History deals & Win rate analysis
  getHistoryDeals: (startTime?: string, endTime?: string) =>
    ipcRenderer.invoke(IPC.HISTORY_DEALS_GET, startTime, endTime),
  analyzeWinRate: (startTime?: string, endTime?: string) =>
    ipcRenderer.invoke(IPC.WIN_RATE_ANALYSIS, startTime, endTime),
  onHistoryDeals: (cb: (deals: any) => void) => {
    const handler = (_e: any, data: any) => cb(data);
    ipcRenderer.on('history:deals', handler);
    return () => ipcRenderer.removeListener('history:deals', handler);
  },
};

contextBridge.exposeInMainWorld('bangAPI', api);
