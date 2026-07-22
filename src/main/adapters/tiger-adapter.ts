/**
 * Tiger OpenAPI data adapter.
 *
 * Converts raw Tiger OpenAPI REST/WebSocket responses into the app's
 * unified internal types.
 *
 * Tiger OpenAPI v3 reference:
 *   REST:  https://openapi.itigerup.com/v3/{method}
 *   WS:    wss://openapi.itigerup.com/stream
 *
 * Key REST methods:
 *   kline       — Historical K-line data
 *   quote       — Real-time quote snapshot
 *   positions   — Account positions
 *   orders      — Order list
 *   place_order — Place order
 *   modify_order — Modify order
 *   cancel_order — Cancel order
 *   assets      — Account asset summary
 *   timeline    — Account transaction timeline
 *
 * WebSocket push types (data_type):
 *   quote      — Quote update
 *   kline      — K-line update
 *   depth      — Order book depth
 *   trade      — Trade tick
 *   asset      — Account asset update
 *   order      — Order status update
 *   position   — Position update
 */
import type {
  KlineData, StockSnapshot, SubType, Position, OrderRecord,
  OrderSide, OrderType,
} from '../../shared/types';
import type { AccountSummary, AccountMarketDetail, Market } from '../../shared/types';

// ===== Tiger period mapping =====

/** Map app SubType to Tiger period string */
export function subTypeToTigerPeriod(subType: SubType): string {
  const map: Record<SubType, string> = {
    '1': '1min', '5': '5min', '15': '15min', '30': '30min', '60': '60min',
    DAY: 'day', WEEK: 'week', MONTH: 'month',
  };
  return map[subType] ?? '1min';
}

/** Map Tiger period string back to SubType */
export function tigerPeriodToSubType(period: string): SubType {
  const map: Record<string, SubType> = {
    '1min': '1', '5min': '5', '15min': '15', '30min': '30', '60min': '60',
    day: 'DAY', week: 'WEEK', month: 'MONTH',
  };
  return map[period] ?? '1';
}

// ===== Tiger REST response types =====

/**
 * Tiger K-line response format:
 *   { items: [[timestamp_ms, open, high, low, close, volume, turnover], ...], ... }
 *
 * Each item is a 7-element array. The exact column order may vary by API version
 * so we also support object format: { time, open, high, low, close, volume, turnover }
 */
interface TigerKlineResponse {
  items: (number[] | TigerKlineItemObj)[];
  hasMore?: boolean;
  nextToken?: string;
}

interface TigerKlineItemObj {
  time: number;       // timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

/**
 * Tiger quote (snapshot) response format:
 *   { items: [{ symbol, latestPrice, preClose, open, high, low, volume, turnover, ... }] }
 */
interface TigerQuoteResponse {
  items: TigerQuoteItem[];
}

interface TigerQuoteItem {
  symbol: string;
  identifier?: string;        // e.g. "00700.HK"
  name?: string;
  displayName?: string;
  latestPrice?: number;       // current price
  preClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  turnover?: number;
  change?: number;            // change value
  changePct?: number;         // change rate (decimal, 0.025 = 2.5%)
  askPrice?: number;
  bidPrice?: number;
  askSize?: number;
  bidSize?: number;
  high52w?: number;
  low52w?: number;
  status?: string;            // "NORMAL", "HALTED", etc.
  updateTime?: number;        // timestamp ms
}

/**
 * Tiger positions response:
 *   { items: [{ symbol, qty, costPrice, marketPrice, pnl, pnlPct, ... }] }
 */
interface TigerPositionsResponse {
  items: TigerPositionItem[];
  hasMore?: boolean;
}

interface TigerPositionItem {
  symbol: string;
  name?: string;
  qty: number;
  costPrice: number;          // average cost
  marketPrice: number;
  pnl: number;
  pnlPct: number;             // decimal, 0.07 = 7%
  avgFillPrice?: number;      // filled avg price (cost)
  currency?: string;
  side?: string;              // "long" / "short"
  updateTimestamp?: number;
}

/**
 * Tiger orders response:
 *   { items: [{ id, symbol, action, orderType, price, quantity, filledQty, status, ... }] }
 */
interface TigerOrdersResponse {
  items: TigerOrderItem[];
  hasMore?: boolean;
}

interface TigerOrderItem {
  id: string;
  orderId?: string;
  symbol: string;
  name?: string;
  action: string;             // "BUY" / "SELL"
  orderType: string;          // "MKT" / "LMT" / "STP" / "STP_LMT"
  price?: number;
  limitPrice?: number;
  auxPrice?: number;          // stop price
  quantity: number;
  filledQty?: number;
  avgFillPrice?: number;
  status: string;             // "FILLED" / "NEW" / "CANCELLED" / "REJECTED" / "PARTIAL_FILLED"
  reason?: string;
  createTime?: number;        // timestamp ms
  updateTime?: number;
}

/** Tiger place_order response */
interface TigerPlaceOrderResponse {
  id: string;
  orderId?: string;
  isSuccess?: boolean;
  message?: string;
}

// ===== Tiger WebSocket push types =====

interface TigerWsMessage {
  cmd?: string;
  id?: number;
  data_type?: string;         // "quote", "kline", "depth", "trade", "asset", "order", "position"
  data?: any;
}

// ===== Type conversion helpers =====

function toNum(v: string | number | undefined | null, fallback = 0): number {
  if (v === undefined || v === null || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? fallback : n;
}

/** Convert Tiger action string to OrderSide */
function tigerActionToOrderSide(action: string): OrderSide {
  const a = action.toUpperCase();
  return a === 'SELL' || a === 'SELL_SHORT' ? 'SELL' : 'BUY';
}

/** Convert Tiger orderType string to app OrderType */
function tigerOrderTypeToOrderType(orderType: string): OrderType {
  const t = orderType.toUpperCase();
  if (t === 'MKT' || t === 'MARKET') return 'MARKET';
  if (t === 'LMT' || t === 'LIMIT') return 'LIMIT';
  if (t === 'STP' || t === 'STOP') return 'STOP';
  if (t === 'STP_LMT' || t === 'STOP_LIMIT') return 'STOP_LIMIT';
  return 'LIMIT';
}

/** Convert Tiger order status to app status */
function tigerStatusToStatus(status: string): OrderRecord['status'] {
  const s = status.toUpperCase();
  if (s === 'FILLED' || s === 'COMPLETE') return 'FILLED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'REJECTED' || s === 'REJECT') return 'REJECTED';
  if (s === 'PARTIAL_FILLED' || s === 'PARTIAL') return 'PENDING';
  // NEW, PENDING_SUBMIT, PENDING_CANCEL, etc.
  return 'PENDING';
}

// ===== Public adapter functions =====

/** Parse K-line response from REST /v3/kline */
export function parseTigerKline(body: any, code: string): KlineData[] {
  const resp = body as TigerKlineResponse;
  if (!resp?.items || !Array.isArray(resp.items)) return [];

  return resp.items.map((item): KlineData => {
    // Array format: [timestamp_ms, open, high, low, close, volume, turnover]
    if (Array.isArray(item)) {
      return {
        time: Math.floor(toNum(item[0]) / 1000),
        open: toNum(item[1]),
        high: toNum(item[2]),
        low: toNum(item[3]),
        close: toNum(item[4]),
        volume: toNum(item[5]),
        turnover: toNum(item[6]),
      };
    }
    // Object format
    const obj = item as TigerKlineItemObj;
    return {
      time: Math.floor(toNum(obj.time) / 1000),
      open: toNum(obj.open),
      high: toNum(obj.high),
      low: toNum(obj.low),
      close: toNum(obj.close),
      volume: toNum(obj.volume),
      turnover: toNum(obj.turnover),
    };
  });
}

/** Parse quote (snapshot) response from REST /v3/quote */
export function parseTigerSnapshot(body: any): Record<string, StockSnapshot> {
  const resp = body as TigerQuoteResponse;
  if (!resp?.items || !Array.isArray(resp.items)) return {};

  const result: Record<string, StockSnapshot> = {};
  for (const item of resp.items) {
    const code = item.symbol ?? '';
    const curPrice = toNum(item.latestPrice);
    const prevClose = toNum(item.preClose);
    // Tiger changePct is decimal (0.025 = 2.5%), convert to percentage
    const changeRate = item.changePct !== undefined
      ? item.changePct * 100
      : (prevClose > 0 ? ((curPrice - prevClose) / prevClose) * 100 : 0);

    result[code] = {
      code,
      name: item.name ?? item.displayName ?? '',
      curPrice,
      changeVal: item.change !== undefined ? item.change : +(curPrice - prevClose).toFixed(4),
      changeRate: +changeRate.toFixed(2),
      volume: toNum(item.volume),
      turnover: toNum(item.turnover),
      high: toNum(item.high),
      low: toNum(item.low),
      open: toNum(item.open),
      prevClose,
    };
  }
  return result;
}

/** Parse positions response from REST /v3/positions */
export function parseTigerPositions(body: any): Position[] {
  const resp = body as TigerPositionsResponse;
  if (!resp?.items || !Array.isArray(resp.items)) return [];

  return resp.items.map((p): Position => ({
    code: p.symbol,
    name: p.name ?? '',
    qty: p.qty,
    avgPrice: p.costPrice ?? p.avgFillPrice ?? 0,
    marketPrice: p.marketPrice,
    pnl: p.pnl,
    // Tiger pnlPct is decimal (0.07 = 7%), convert to percentage
    pnlRatio: p.pnlPct !== undefined ? p.pnlPct * 100 : 0,
  }));
}

/** Parse orders response from REST /v3/orders */
export function parseTigerOrders(body: any): OrderRecord[] {
  const resp = body as TigerOrdersResponse;
  if (!resp?.items || !Array.isArray(resp.items)) return [];

  return resp.items.map((o): OrderRecord => ({
    id: o.id ?? o.orderId ?? '',
    code: o.symbol,
    name: o.name ?? '',
    side: tigerActionToOrderSide(o.action),
    type: tigerOrderTypeToOrderType(o.orderType),
    price: o.price ?? o.limitPrice ?? 0,
    qty: o.quantity,
    filledQty: o.filledQty ?? 0,
    status: tigerStatusToStatus(o.status),
    time: o.createTime ? Math.floor(o.createTime / 1000) : Date.now(),
  }));
}

/** Parse place_order response */
export function parseTigerPlaceOrder(body: any): { orderId: string; success: boolean; message?: string } {
  const resp = body as TigerPlaceOrderResponse;
  if (resp?.id || resp?.orderId) {
    return { orderId: resp.id ?? resp.orderId ?? '', success: true };
  }
  if (resp?.isSuccess === false) {
    return { orderId: '', success: false, message: resp.message ?? 'Order failed' };
  }
  return { orderId: '', success: false, message: 'Unknown response format' };
}

/** Parse WebSocket push message */
export function parseTigerWsPush(msg: any): {
  type: 'quote' | 'kline' | 'depth' | 'trade' | 'order' | 'position' | 'heartbeat' | 'unknown';
  data: any;
} | null {
  if (!msg) return null;

  const m = msg as TigerWsMessage;

  // Heartbeat
  if (m.cmd === 'heartbeat' || m.cmd === 'ping') {
    return { type: 'heartbeat', data: null };
  }

  // Subscribe response
  if (m.cmd === 'subscribe' || m.cmd === 'unsubscribe') {
    return null;
  }

  // Data push
  const dataType = (m.data_type ?? m.type ?? '').toLowerCase();
  if (!dataType || !m.data) return null;

  if (dataType.includes('quote')) return { type: 'quote', data: m.data };
  if (dataType.includes('kline')) return { type: 'kline', data: m.data };
  if (dataType.includes('depth')) return { type: 'depth', data: m.data };
  if (dataType.includes('trade')) return { type: 'trade', data: m.data };
  if (dataType.includes('order')) return { type: 'order', data: m.data };
  if (dataType.includes('position')) return { type: 'position', data: m.data };

  return { type: 'unknown', data: m.data };
}

/** Parse WebSocket quote push into partial StockSnapshot */
export function parseTigerWsQuote(data: any): Partial<StockSnapshot> & { code: string } {
  if (!data) return { code: '' };
  const curPrice = toNum(data.latestPrice ?? data.lastPrice ?? data.close);
  const prevClose = toNum(data.preClose ?? data.prevClose);
  return {
    code: data.symbol ?? data.code ?? '',
    name: data.name ?? '',
    curPrice,
    changeVal: data.change !== undefined ? data.change : undefined,
    changeRate: data.changePct !== undefined ? data.changePct * 100 : undefined,
    volume: toNum(data.volume),
    turnover: toNum(data.turnover ?? data.amount),
    high: toNum(data.high),
    low: toNum(data.low),
    open: toNum(data.open),
    prevClose,
  };
}

/** Parse WebSocket K-line push into partial KlineData */
export function parseTigerWsKline(data: any): KlineData | null {
  if (!data) return null;
  // Could be array or object format
  if (Array.isArray(data)) {
    return {
      time: Math.floor(toNum(data[0]) / 1000),
      open: toNum(data[1]),
      high: toNum(data[2]),
      low: toNum(data[3]),
      close: toNum(data[4]),
      volume: toNum(data[5]),
      turnover: toNum(data[6]),
    };
  }
  return {
    time: Math.floor(toNum(data.time ?? data.timestamp) / 1000),
    open: toNum(data.open),
    high: toNum(data.high),
    low: toNum(data.low),
    close: toNum(data.close),
    volume: toNum(data.volume),
    turnover: toNum(data.turnover),
  };
}

/** Build Tiger place_order request body */
export function buildTigerPlaceOrderBody(
  code: string,
  side: OrderSide,
  type: OrderType,
  price: number,
  qty: number,
): Record<string, any> {
  const action = side === 'SELL' ? 'SELL' : 'BUY';
  let orderType: string;
  let body: Record<string, any> = {
    symbol: code,
    action,
    quantity: qty,
  };

  switch (type) {
    case 'MARKET':
      orderType = 'MKT';
      break;
    case 'LIMIT':
      orderType = 'LMT';
      body.limitPrice = price;
      break;
    case 'STOP':
      orderType = 'STP';
      body.auxPrice = price; // stop price
      break;
    case 'STOP_LIMIT':
      orderType = 'STP_LMT';
      body.auxPrice = price; // stop price
      body.limitPrice = price; // limit price (same as stop in simple case)
      break;
    default:
      orderType = 'LMT';
      body.limitPrice = price;
  }

  body.orderType = orderType;
  return body;
}

// ===== Account Summary (REST /v3/assets) =====

/**
 * Tiger assets response format:
 *   { items: [{ currency, cashBalance, grossPositionValue, netLiquidationValue,
 *      unrealizedPnl, unrealizedPnlPct, realizedPnl, buyingPower,
 *      withdrawableCash, frozenCash, initialMargin, maintenanceMargin, ... }] }
 */
interface TigerAssetsResponse {
  items: TigerAssetItem[];
  hasMore?: boolean;
}

interface TigerAssetItem {
  currency: string;
  cashBalance: number;
  grossPositionValue: number;
  netLiquidationValue: number;       // net asset value
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  realizedPnl?: number;
  buyingPower?: number;
  maxPurchasingPower?: number;
  withdrawableCash?: number;
  frozenCash?: number;
  initialMargin?: number;
  maintenanceMargin?: number;
  account?: string;
  segment?: string;                  // e.g. "CASH", "MARGIN"
}

/** Parse account assets response from REST /v3/assets */
export function parseTigerAccountSummary(body: any, provider: 'tiger'): AccountSummary {
  const resp = body as TigerAssetsResponse;
  if (!resp?.items || resp.items.length === 0) {
    return emptyTigerAccountSummary(provider);
  }

  // Sum across all currency segments
  let totalAssets = 0;
  let cash = 0;
  let marketValue = 0;
  let unrealizedPnl = 0;
  let realizedPnl = 0;
  let buyingPower = 0;
  let withdrawableCash = 0;
  let frozenCash = 0;
  let initialMargin = 0;
  let maintenanceMargin = 0;
  let primaryCurrency = 'USD';

  const markets: AccountMarketDetail[] = [];

  for (const item of resp.items) {
    const itemAssets = toNum(item.netLiquidationValue);
    const itemCash = toNum(item.cashBalance);
    const itemMarketValue = toNum(item.grossPositionValue);
    const itemPnl = toNum(item.unrealizedPnl);
    const itemBuyPower = toNum(item.buyingPower ?? item.maxPurchasingPower);
    const itemWithdraw = toNum(item.withdrawableCash);
    const itemFrozen = toNum(item.frozenCash);
    const itemInitMargin = toNum(item.initialMargin);
    const itemMaintMargin = toNum(item.maintenanceMargin);

    totalAssets += itemAssets;
    cash += itemCash;
    marketValue += itemMarketValue;
    unrealizedPnl += itemPnl;
    realizedPnl += toNum(item.realizedPnl);
    buyingPower += itemBuyPower;
    withdrawableCash += itemWithdraw;
    frozenCash += itemFrozen;
    initialMargin += itemInitMargin;
    maintenanceMargin += itemMaintMargin;

    if (itemAssets > 0 && primaryCurrency === 'USD') {
      primaryCurrency = item.currency ?? 'USD';
    }

    // Derive market from currency for per-market breakdown
    const market = currencyToMarket(item.currency ?? 'USD');
    markets.push({
      market,
      totalAssets: itemAssets,
      cash: itemCash,
      marketValue: itemMarketValue,
      unrealizedPnl: itemPnl,
      buyingPower: itemBuyPower,
      currency: item.currency ?? 'USD',
    });
  }

  return {
    provider,
    accountId: resp.items[0]?.account ?? '',
    totalAssets,
    cash,
    marketValue,
    unrealizedPnl,
    unrealizedPnlRatio: totalAssets > 0 ? (unrealizedPnl / (totalAssets - unrealizedPnl)) * 100 : 0,
    realizedPnl,
    buyingPower,
    withdrawableCash,
    frozenCash,
    initialMargin,
    maintenanceMargin,
    currency: primaryCurrency,
    markets,
    updateTime: Math.floor(Date.now() / 1000),
  };
}

function currencyToMarket(currency: string): Market {
  switch (currency.toUpperCase()) {
    case 'HKD': return 'HK';
    case 'USD': return 'US';
    case 'CNY':
    case 'CNH': return 'SH';
    case 'SGD': return 'SG';
    case 'JPY': return 'JP';
    default: return 'US';
  }
}

function emptyTigerAccountSummary(provider: 'tiger'): AccountSummary {
  return {
    provider,
    accountId: '',
    totalAssets: 0,
    cash: 0,
    marketValue: 0,
    unrealizedPnl: 0,
    unrealizedPnlRatio: 0,
    realizedPnl: 0,
    buyingPower: 0,
    withdrawableCash: 0,
    frozenCash: 0,
    initialMargin: 0,
    maintenanceMargin: 0,
    currency: 'USD',
    markets: [],
    updateTime: Math.floor(Date.now() / 1000),
  };
}

// ===== Historical Fills (REST /v3/fills) =====

interface TigerFillsResponse {
  items: TigerFillItem[];
  hasMore?: boolean;
}

interface TigerFillItem {
  id: string;
  orderId?: string;
  symbol: string;
  name?: string;
  action: string;         // "BUY" / "SELL"
  fillPrice: number;
  quantity: number;
  fillTime?: number;      // timestamp ms
  commission?: number;
  fee?: number;           // total fee
  currency?: string;
}

/** Parse historical fills response from REST /v3/fills */
export function parseTigerHistoryFills(body: any): import('../../shared/types').HistoryDeal[] {
  const resp = body as TigerFillsResponse;
  if (!resp?.items || !Array.isArray(resp.items)) return [];

  return resp.items.map((f): import('../../shared/types').HistoryDeal => {
    const price = toNum(f.fillPrice);
    const qty = toNum(f.quantity);
    return {
      id: f.id ?? f.orderId ?? '',
      code: f.symbol,
      name: f.name ?? '',
      side: tigerActionToOrderSide(f.action),
      price,
      qty,
      amount: price * qty,
      fee: toNum(f.fee ?? f.commission),
      time: f.fillTime ? Math.floor(f.fillTime / 1000) : Date.now(),
      provider: 'tiger',
    };
  });
}
