/**
 * Local mock gateway client.
 *
 * Mirrors the public surface of TigerGatewayClient so the gateway-router
 * can treat it identically, but every method returns hard-coded static
 * data. No network or external process is required, which makes it ideal
 * for local development, demos, and screenshots.
 *
 * Return shapes deliberately align with the Tiger adapter's output
 * (mapSdkKline / mapSdkBrief / mapSdkPosition / …) so the renderer
 * needs no provider-specific branching for `local`.
 */
import type { BrowserWindow } from 'electron';
import type {
  LocalGatewayConfig, GatewayStatus, KlineData, SubType, StockSnapshot,
  Position, OrderRecord, AccountSummary, HistoryDeal, SymbolSearchResult,
} from '../shared/types';
import { COMPARISON_STOCK_LIST } from '../shared/types';

const DAY = 24 * 60 * 60 * 1000;

/** Deterministic pseudo-random in [0,1) seeded by an integer — stable mock data. */
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build a stable K-line series around a base price derived from the code. */
function buildKline(code: string, subType: SubType, count: number): KlineData[] {
  let base = 100;
  for (let i = 0; i < code.length; i++) base += code.charCodeAt(i);
  base = (base % 200) + 50;

  const isIntraday = subType === '1' || subType === '5' || subType === '15' || subType === '30' || subType === '60';
  const stepMs = isIntraday
    ? Number(subType) * 60 * 1000
    : subType === 'WEEK' ? 7 * DAY : subType === 'MONTH' ? 30 * DAY : DAY;

  const now = Date.now();
  const out: KlineData[] = [];
  let prevClose = base;
  for (let i = count - 1; i >= 0; i--) {
    const time = Math.floor((now - i * stepMs) / 1000);
    const noise = (seeded(base + i) - 0.5) * base * 0.03;
    const open = prevClose;
    const close = Math.max(1, open + noise);
    const high = Math.max(open, close) + Math.abs(noise) * 0.6;
    const low = Math.min(open, close) - Math.abs(noise) * 0.6;
    const volume = Math.floor(seeded(base * 2 + i) * 500000) + 50000;
    out.push({
      time,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
      turnover: Math.floor(volume * close),
    });
    prevClose = close;
  }
  return out;
}

/** Static snapshots; falls back to a value derived from the mock K-line. */
function buildSnapshot(codes: string[]): StockSnapshot[] {
  return codes.map(code => {
    const kline = buildKline(code, 'DAY', 2);
    const last = kline[kline.length - 1];
    const prev = kline[kline.length - 2] ?? last;
    const meta = COMPARISON_STOCK_LIST.find(s => s.code === code);
    const changeVal = round2(last.close - prev.close);
    return {
      code,
      name: meta?.name ?? '',
      curPrice: last.close,
      changeVal,
      changeRate: round2((changeVal / (prev.close || 1)) * 100),
      volume: last.volume,
      turnover: last.turnover,
      high: last.high,
      low: last.low,
      open: last.open,
      prevClose: prev.close,
    };
  });
}

// ─── Static trade / account fixtures ───────────────────────

const now = Date.now();

const STATIC_POSITIONS: Position[] = [
  { code: 'HK.00700', name: '腾讯控股', qty: 500, avgPrice: 320.5, marketPrice: 358.2, pnl: round2((358.2 - 320.5) * 500), pnlRatio: round2(((358.2 - 320.5) / 320.5) * 100) },
  { code: 'US.AAPL', name: 'Apple Inc', qty: 200, avgPrice: 178.3, marketPrice: 192.8, pnl: round2((192.8 - 178.3) * 200), pnlRatio: round2(((192.8 - 178.3) / 178.3) * 100) },
  { code: 'US.TSLA', name: 'Tesla Inc', qty: 120, avgPrice: 245.0, marketPrice: 232.6, pnl: round2((232.6 - 245.0) * 120), pnlRatio: round2(((232.6 - 245.0) / 245.0) * 100) },
  { code: 'SH.600519', name: '贵州茅台', qty: 100, avgPrice: 1680.0, marketPrice: 1745.5, pnl: round2((1745.5 - 1680.0) * 100), pnlRatio: round2(((1745.5 - 1680.0) / 1680.0) * 100) },
];

const STATIC_ORDERS: OrderRecord[] = [
  { id: 'mock-1001', code: 'HK.00700', name: '腾讯控股', side: 'BUY', type: 'LIMIT', price: 355.0, qty: 500, filledQty: 500, status: 'FILLED', time: Math.floor((now - 3 * DAY) / 1000) },
  { id: 'mock-1002', code: 'US.AAPL', name: 'Apple Inc', side: 'BUY', type: 'LIMIT', price: 190.0, qty: 200, filledQty: 200, status: 'FILLED', time: Math.floor((now - 2 * DAY) / 1000) },
  { id: 'mock-1003', code: 'US.TSLA', name: 'Tesla Inc', side: 'SELL', type: 'LIMIT', price: 240.0, qty: 100, filledQty: 0, status: 'PENDING', time: Math.floor((now - 1 * DAY) / 1000) },
  { id: 'mock-1004', code: 'SH.600519', name: '贵州茅台', side: 'BUY', type: 'MARKET', price: 0, qty: 100, filledQty: 60, status: 'PARTIAL', time: Math.floor(now / 1000) },
];

const STATIC_DEALS: HistoryDeal[] = [
  { id: 'deal-1', code: 'HK.00700', name: '腾讯控股', side: 'BUY', price: 355.0, qty: 500, amount: 177500, fee: 88.75, time: Math.floor((now - 3 * DAY) / 1000), provider: 'local' },
  { id: 'deal-2', code: 'US.AAPL', name: 'Apple Inc', side: 'BUY', price: 190.0, qty: 200, amount: 38000, fee: 9.5, time: Math.floor((now - 2 * DAY) / 1000), provider: 'local' },
  { id: 'deal-3', code: 'SH.600519', name: '贵州茅台', side: 'BUY', price: 1680.0, qty: 100, amount: 168000, fee: 50.4, time: Math.floor((now - 5 * DAY) / 1000), provider: 'local' },
];

const STATIC_ACCOUNT: AccountSummary = {
  provider: 'local',
  accountId: 'MOCK-000001',
  totalAssets: 528640.5,
  cash: 145240.5,
  marketValue: 383400.0,
  unrealizedPnl: 18250.0,
  unrealizedPnlRatio: 5.0,
  realizedPnl: 8420.0,
  buyingPower: 290481.0,
  withdrawableCash: 120000.0,
  frozenCash: 12000.0,
  initialMargin: 96000.0,
  maintenanceMargin: 72000.0,
  currency: 'HKD',
  markets: [
    { market: 'HK', totalAssets: 285000, cash: 106000, marketValue: 179000, unrealizedPnl: 12500, buyingPower: 212000, currency: 'HKD' },
    { market: 'US', totalAssets: 165000, cash: 30000, marketValue: 135000, unrealizedPnl: 4500, buyingPower: 60000, currency: 'USD' },
    { market: 'SH', totalAssets: 78640.5, cash: 9240.5, marketValue: 69400, unrealizedPnl: 1250, buyingPower: 18481, currency: 'CNY' },
  ],
  updateTime: Math.floor(Date.now() / 1000),
};

// ─── Client ────────────────────────────────────────────────

export class LocalMockGatewayClient {
  private config: LocalGatewayConfig | null = null;
  private status: GatewayStatus = {
    connected: false,
    loggedIn: false,
    provider: 'local',
  };
  private win: BrowserWindow | null = null;
  private orderSeq = 2000;

  setWindow(win: BrowserWindow) {
    this.win = win;
  }

  getStatus(): GatewayStatus {
    return { ...this.status };
  }

  connect(config: LocalGatewayConfig) {
    this.config = config;
    this.status = {
      connected: true,
      loggedIn: true,
      provider: 'local',
      host: 'mock',
    };
    this.sendStatus();
  }

  disconnect() {
    this.config = null;
    this.status.connected = false;
    this.status.loggedIn = false;
    this.status.error = undefined;
  }

  // ─── Quote methods ───────────────────────────────────────

  async requestKline(code: string, subType: SubType, count = 500): Promise<KlineData[]> {
    const data = buildKline(code, subType, count);
    this.sendToRenderer('kline:data', { code, subType, data });
    return data;
  }

  async requestSnapshot(codes: string[]): Promise<StockSnapshot[]> {
    const snapshots = buildSnapshot(codes);
    this.sendToRenderer('snapshot:data', snapshots);
    return snapshots;
  }

  async subscribe(_code: string, _subTypes: SubType[]) {
    // No real push feed for the mock; nothing to do.
  }

  // ─── Trade methods ───────────────────────────────────────

  async getPositions(): Promise<Position[]> {
    return STATIC_POSITIONS;
  }

  async getOrders(): Promise<OrderRecord[]> {
    return STATIC_ORDERS;
  }

  async placeOrder(req: any): Promise<{ orderId: string; success: boolean; message?: string }> {
    const orderId = `mock-${++this.orderSeq}`;
    const meta = COMPARISON_STOCK_LIST.find(s => s.code === req.code);
    const order: OrderRecord = {
      id: orderId,
      code: req.code,
      name: meta?.name ?? '',
      side: req.side,
      type: req.type,
      price: req.price ?? 0,
      qty: req.quantity,
      filledQty: 0,
      status: 'PENDING',
      time: Math.floor(Date.now() / 1000),
    };
    this.sendToRenderer('order:place:result', { orderId, success: true });
    this.sendToRenderer('order:update', order);
    return { orderId, success: true };
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    const order = STATIC_ORDERS.find(o => o.id === orderId);
    if (order) order.status = 'CANCELLED';
    return { success: true };
  }

  async getAccountSummary(): Promise<AccountSummary | null> {
    this.sendToRenderer('account:summary', STATIC_ACCOUNT);
    return STATIC_ACCOUNT;
  }

  async modifyOrder(req: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const order = STATIC_ORDERS.find(o => o.id === req.orderId);
    if (order) {
      if (req.price != null) order.price = req.price;
      if (req.quantity != null) order.qty = req.quantity;
    }
    return { success: true };
  }

  async getHistoryDeals(_startTime?: number, _endTime?: number) {
    this.sendToRenderer('history:deals', STATIC_DEALS);
  }

  /** Static stock search — filters the bundled COMPARISON_STOCK_LIST. */
  async searchStock(keyword: string): Promise<SymbolSearchResult[]> {
    const kw = keyword.trim().toUpperCase();
    if (!kw) return [];
    return COMPARISON_STOCK_LIST
      .filter(s => s.code.toUpperCase().includes(kw) || s.name.toUpperCase().includes(kw))
      .slice(0, 30)
      .map(({ code, name, market, type }) => ({ code, name, market, type }));
  }

  // ─── Helpers ─────────────────────────────────────────────

  private sendStatus() {
    this.sendToRenderer('gateway:status:update', this.status);
  }

  private sendToRenderer(channel: string, data: any) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, data);
    }
  }
}
