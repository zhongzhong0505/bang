import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'path';
import { setGatewayWindow, connectGateway, disconnectGateway, getGatewayStatus, requestKline, requestSnapshot, subscribe, placeOrder, cancelOrder, getOrders, getPositions } from './gateway-router';
import { getAccountSummary } from './gateway-router';

import { modifyGatewayOrder, getHistoryDeals } from './gateway-router';
import { searchStock } from './gateway-router';
import { analyzeWinRates } from './win-rate-service';
import type { HistoryDeal } from '../shared/types';

import fs from 'fs';
import { loadConfig, saveConfig } from './store';
import { loadAISettings, saveAISettings, evaluateOrder, streamChat } from './ai-service';
import { IPC } from '../shared/types';

import { generateScreenerResults } from './screener-service';
import { generateFundamentals } from './fundamentals-service';
import { getCalendarEvents } from './calendar-service';

let mainWindow: BrowserWindow | null = null;

// Register custom protocol before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Bang - Trading Terminal',
    backgroundColor: '#0a0e17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('app://./index.html');
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }

  setGatewayWindow(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen:change', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:fullscreen:change', false);
  });
}

// IPC handlers
ipcMain.handle(IPC.GATEWAY_CONFIG_GET, () => loadConfig());

ipcMain.handle(IPC.GATEWAY_CONFIG_SET, (_e, config) => {
  saveConfig(config);
  return true;
});

ipcMain.handle(IPC.GATEWAY_CONNECT, (_e, config) => {
  connectGateway(config);
  return true;
});

ipcMain.handle(IPC.GATEWAY_DISCONNECT, () => {
  disconnectGateway();
  return true;
});

ipcMain.handle(IPC.GATEWAY_STATUS, () => getGatewayStatus());

ipcMain.handle(IPC.KLINE_REQUEST, (_e, code, subType, count) => {
  requestKline(code, subType, count);
  return true;
});

ipcMain.handle(IPC.SNAPSHOT_REQUEST, (_e, codes) => requestSnapshot(codes));

ipcMain.handle(IPC.SUBSCRIBE, (_e, code, subTypes) => {
  subscribe(code, subTypes);
  return true;
});

ipcMain.handle(IPC.ORDER_PLACE, (_e, req) => {
  return placeOrder(req);
});

ipcMain.handle(IPC.ORDER_CANCEL, (_e, id) => {
  return cancelOrder(id);
});

ipcMain.handle(IPC.ORDER_LIST, () => {
  return getOrders();
});

ipcMain.handle(IPC.POSITIONS, () => {
  return getPositions();
});

ipcMain.handle(IPC.ACCOUNT_SUMMARY, () => {
  return getAccountSummary();
});

// Order modification
ipcMain.handle(IPC.ORDER_MODIFY, (_e, req) => {
  return modifyGatewayOrder(req);
});

// Screener search
ipcMain.handle(IPC.SCREENER_SEARCH, (_e, filter) => {
  return generateScreenerResults(filter);
});

// Stock search — call gateway OpenAPI when connected, otherwise return empty
ipcMain.handle(IPC.STOCK_SEARCH, async (_e, keyword: string) => {
  try {
    const results = await searchStock(keyword);
    if (results && results.length > 0) return results;
  } catch { /* gateway not connected or search failed */ }
  return [];
});

// Fundamentals
ipcMain.handle('fundamentals:get', (_e, code: string) => {
  return generateFundamentals(code);
});

// Calendar
ipcMain.handle('calendar:get', (_e, date?: string) => {
  return getCalendarEvents(date);
});

// Data export
ipcMain.handle(IPC.EXPORT_DATA, (_e, req) => {
  try {
    const { format, filename, data } = req;
    const downloadsDir = app.getPath('downloads');
    const filePath = path.join(downloadsDir, filename);
    let content: string;
    if (format === 'csv') {
      if (!Array.isArray(data) || data.length === 0) {
        content = '';
      } else {
        const headers = Object.keys(data[0]);
        const rows = data.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            const str = val === null || val === undefined ? '' : String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        );
        content = [headers.join(','), ...rows].join('\n');
      }
    } else {
      content = JSON.stringify(data, null, 2);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Layout persistence
ipcMain.handle('layout:get', () => {
  try {
    const file = path.join(app.getPath('userData'), 'panel-layout.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch {}
  return null;
});
ipcMain.handle('layout:set', (_e, layout) => {
  try {
    const file = path.join(app.getPath('userData'), 'panel-layout.json');
    fs.writeFileSync(file, JSON.stringify(layout, null, 2), 'utf-8');
    return true;
  } catch { return false; }
});

// Fullscreen toggle
ipcMain.handle('window:fullscreen:toggle', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const isFs = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(isFs);
    return isFs;
  }
  return false;
});

// AI evaluation
ipcMain.handle(IPC.AI_EVALUATE_ORDER, (_e, ctx) => {
  return evaluateOrder(ctx);
});

ipcMain.handle(IPC.AI_CHAT, async (_e, messages) => {
  try {
    const text = await streamChat(messages, mainWindow, undefined);
    return { success: true, text };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle(IPC.AI_CONFIG_GET, () => {
  return loadAISettings();
});

ipcMain.handle(IPC.AI_CONFIG_SET, (_e, settings) => {
  return saveAISettings(settings);
});

// App settings persistence
ipcMain.handle(IPC.APP_SETTINGS_GET, () => {
  try {
    const file = path.join(app.getPath("userData"), "app-settings.json");
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch {}
  return null;
});

ipcMain.handle(IPC.APP_SETTINGS_SET, (_e, settings) => {
  try {
    const file = path.join(app.getPath("userData"), "app-settings.json");
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
});


// History deals — request from gateway and collect via push
let pendingDealsResolve: ((deals: HistoryDeal[]) => void) | null = null;
let pendingDealsTimeout: ReturnType<typeof setTimeout> | null = null;

ipcMain.on('history:deals', (_e, deals) => {
  if (pendingDealsResolve) {
    clearTimeout(pendingDealsTimeout!);
    const resolve = pendingDealsResolve;
    pendingDealsResolve = null;
    pendingDealsTimeout = null;
    resolve(deals);
  }
  // Also forward to renderer for live updates
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('history:deals', deals);
  }
});

ipcMain.handle(IPC.HISTORY_DEALS_GET, (_e, startTime?: string, endTime?: string) => {
  return new Promise((resolve) => {
    pendingDealsResolve = resolve;
    pendingDealsTimeout = setTimeout(() => {
      pendingDealsResolve = null;
      resolve([]);
    }, 15000);
    getHistoryDeals(startTime, endTime);
  });
});

ipcMain.handle(IPC.WIN_RATE_ANALYSIS, async (_e, startTime?: string, endTime?: string) => {
  try {
    const deals = await new Promise<HistoryDeal[]>((resolve) => {
      pendingDealsResolve = resolve;
      pendingDealsTimeout = setTimeout(() => {
        pendingDealsResolve = null;
        resolve([]);
      }, 15000);
      getHistoryDeals(startTime, endTime);
    });
    const result = analyzeWinRates(deals);
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
});

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const filePath = path.join(__dirname, url.pathname);
    return net.fetch('file://' + filePath);
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  disconnectGateway();
  app.quit();
});
