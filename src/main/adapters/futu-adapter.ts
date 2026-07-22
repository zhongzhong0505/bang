/**
 * Futu OpenD data adapter.
 *
 * Converts raw Futu OpenD protocol responses (ProtoID-based JSON bodies)
 * into the app's unified internal types.
 *
 * Futu ProtoID reference:
 *   1001 InitConnect
 *   1004 GetGlobalState
 *   3001 Subscription
 *   3002 StockUpdate (real-time push)
 *   5001 GetHistoryKLines
 *   5003 GetMarketSnapshot
 *   2212 PlaceOrder
 *   2213 ModifyOrder
 *   2215 CancelOrder
 *   2222 OrderList (today's orders)
 *   2223 PositionList
 *
 * All numeric fields from Futu come as strings (protobuf string encoding).
 */
import type {
  KlineData, StockSnapshot, SubType, Position, OrderRecord,
  OrderSide, OrderType,
} from '../../shared/types';
import type { AccountSummary, AccountMarketDetail } from '../../shared/types';

// ===== Raw Futu response types (as returned by OpenD) =====

/** Futu market code enum */
export const FutuMarket = {
  HK: 1,
  SH: 2,
  SZ: 3,
  US: 11,
  SG: 8,
  JP: 9,
} as const;

/** Futu K-line subType enum */
export const FutuSubType: Record<SubType, number> = {
  '1': 1,
  '5': 5,
  '15': 15,
  '30': 30,
  '60': 60,
  DAY: 7,
  WEEK: 8,
  MONTH: 9,
};

/** Futu rehab type */
export const FutuRehabType = {
  NONE: 0,
  FORWARD: 1,
  BACKWARD: 2,
} as const;

interface FutuSecurity {
  market: number;
  code: string;
}

// 5001 GetHistoryKLines response body
interface FutuKlineResponse {
  s2c: {
    security?: FutuSecurity;
    klineList: {
      time: string;       // e.g. "2024.01.15" or "2024.01.15 09:31"
      open: string;
      close: string;
      high: string;
      low: string;
      volume: string;
      turnover: string;
      pe?: string;
      turnoverRate?: string;
      changeRate?: string;
      lastClose?: string;
    }[];
    rehabType?: number;
    subType?: number;
    isFull?: boolean;
  };
}

// 5003 GetMarketSnapshot response body
interface FutuSnapshotResponse {
  s2c: {
    snapshotList: {
      basicSecurity: FutuSecurity;
      securityName: string;
      updateTime: string;         // e.g. "2024.01.15 10:30:00"
      lastPrice: string;          // current price
      open: string;
      high: string;
      low: string;
      prevClose: string;
      volume: string;             // in shares
      turnover: string;           // in currency
      changeVal: string;
      changeRate: string;         // percentage, e.g. "2.5" means 2.5%
      turnoverRate?: string;
      pe?: string;
      amplitude?: string;
      listTime?: string;
      lotSize?: string;
      priceSpread?: string;
      dataDate?: string;
      dataTime?: string;
      // Level-2 fields
      high52Weeks?: string;
      low52Weeks?: string;
    }[];
  };
}

// 3002 StockUpdate (real-time quote push)
interface FutuStockUpdate {
  s2c: {
    security: FutuSecurity;
    securityName?: string;
    updateTimestamp?: string;
    // Fields that changed (only present if updated)
    open?: string;
    close?: string;        // current price
    high?: string;
    low?: string;
    prevClose?: string;
    volume?: string;
    turnover?: string;
    changeVal?: string;
    changeRate?: string;
  };
}

// 2222 OrderList response
interface FutuOrderListResponse {
  s2c: {
    header?: { trdEnv: number };
    orderList?: FutuRawOrder[];
  };
}

interface FutuRawOrder {
  orderID: string;
  trdSide: number;          // 0=buy, 1=sell, 2=buy back, 3=sell short
  orderType: number;        // 0=market, 1=limit, 2=stop, 3=stop limit
  orderStatus: number;      // 0=filled, 1=working, 2=cancelled, 3=partially filled, 4=rejected, 5=waiting
  code: string;
  stockName?: string;
  qty: string;
  filledQty: string;
    price: string;
  avgPrice?: string;
  createdTime?: string;
  updatedTime?: string;
  market?: number;
}

// 2223 PositionList response
interface FutuPositionListResponse {
  s2c: {
    header?: { trdEnv: number };
    positionList?: FutuRawPosition[];
  };
}

interface FutuRawPosition {
  positionSide: number;     // 0=long, 1=short
  code: string;
  stockName?: string;
  qty: string;              // current holding qty
  canSellQty?: string;
  costPrice: string;        // avg cost
  marketValue?: string;
  lastPrice?: string;
  pnl?: string;
  pnlRatio?: string;        // percentage
  todayQty?: string;
  todayReceivable?: string;
  market?: number;
}

// 2212 PlaceOrder response
interface FutuPlaceOrderResponse {
  s2c: {
    header: { trdEnv: number; accID: string; trdMarket: number };
    orderID: string;
  };
}

// ===== Type conversion helpers =====

function toNum(v: string | number | undefined, fallback = 0): number {
  if (v === undefined || v === null || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? fallback : n;
}

/**
 * Parse Futu K-line timestamp string into Unix seconds.
 * Futu formats:
 *   Intraday: "2024.01.15 09:31"
 *   Daily:    "2024.01.15"
 */
function parseFutuTime(timeStr: string): number {
  // "2024.01.15 09:31" or "2024.01.15"
  const cleaned = timeStr.replace(/\./g, '-');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    // Fallback: try as number (some responses return epoch)
    const n = Number(timeStr);
    return isNaN(n) ? 0 : n;
  }
  return Math.floor(d.getTime() / 1000);
}

/** Extract market code from Futu security format "SH.600519" -> market=2 */
export function codeToFutuMarket(code: string): number {
  if (code.startsWith('HK.')) return FutuMarket.HK;
  if (code.startsWith('SH.')) return FutuMarket.SH;
  if (code.startsWith('SZ.')) return FutuMarket.SZ;
  if (code.startsWith('US.')) return FutuMarket.US;
  if (code.startsWith('SG.')) return FutuMarket.SG;
  if (code.startsWith('JP.')) return FutuMarket.JP;
  return FutuMarket.HK;
}

/** Convert Futu order side (trdSide) to app OrderSide */
function futuTrdSideToOrderSide(trdSide: number): OrderSide {
  // 0=buy, 1=sell, 2=buy back, 3=sell short
  return trdSide === 1 || trdSide === 3 ? 'SELL' : 'BUY';
}

/** Convert Futu order type to app OrderType */
function futuOrderTypeToOrderType(orderType: number): OrderType {
  // 0=market, 1=limit, 2=stop, 3=stop limit
  switch (orderType) {
    case 0: return 'MARKET';
    case 1: return 'LIMIT';
    case 2: return 'STOP';
    case 3: return 'STOP_LIMIT';
    default: return 'LIMIT';
  }
}

/** Convert Futu order status to app status */
function futuOrderStatusToStatus(status: number): OrderRecord['status'] {
  // 0=filled, 1=working, 2=cancelled, 3=partially filled, 4=rejected, 5=waiting
  switch (status) {
    case 0: return 'FILLED';
    case 1: return 'PENDING';
    case 2: return 'CANCELLED';
    case 3: return 'PENDING';
    case 4: return 'REJECTED';
    case 5: return 'PENDING';
    default: return 'PENDING';
  }
}

// ===== Public adapter functions =====

/** Parse K-line response from ProtoID 5001 */
export function parseFutuKline(body: any, code: string): KlineData[] {
  const resp = body as FutuKlineResponse;
  if (!resp?.s2c?.klineList) return [];

  return resp.s2c.klineList.map((k) => ({
    time: parseFutuTime(k.time),
    open: toNum(k.open),
    high: toNum(k.high),
    low: toNum(k.low),
    close: toNum(k.close),
    volume: toNum(k.volume),
    turnover: toNum(k.turnover),
  }));
}

/** Parse snapshot response from ProtoID 5003 */
export function parseFutuSnapshot(body: any): Record<string, StockSnapshot> {
  const resp = body as FutuSnapshotResponse;
  if (!resp?.s2c?.snapshotList) return {};

  const result: Record<string, StockSnapshot> = {};
  for (const s of resp.s2c.snapshotList) {
    const code = s.basicSecurity?.code ?? '';
    const curPrice = toNum(s.lastPrice);
    const prevClose = toNum(s.prevClose);
    result[code] = {
      code,
      name: s.securityName ?? '',
      curPrice,
      changeVal: toNum(s.changeVal),
      changeRate: toNum(s.changeRate),
      volume: toNum(s.volume),
      turnover: toNum(s.turnover),
      high: toNum(s.high),
      low: toNum(s.low),
      open: toNum(s.open),
      prevClose,
    };
  }
  return result;
}

/** Parse real-time stock update from ProtoID 3002 */
export function parseFutuStockUpdate(body: any): Partial<StockSnapshot> & { code: string } {
  const resp = body as FutuStockUpdate;
  const s = resp?.s2c;
  if (!s?.security) return { code: '' };

  const curPrice = toNum(s.close);
  const prevClose = toNum(s.prevClose);
  return {
    code: s.security.code,
    name: s.securityName ?? '',
    curPrice,
    changeVal: toNum(s.changeVal),
    changeRate: toNum(s.changeRate),
    volume: toNum(s.volume),
    turnover: toNum(s.turnover),
    high: toNum(s.high),
    low: toNum(s.low),
    open: toNum(s.open),
    prevClose,
  };
}

/** Parse order list from ProtoID 2222 */
export function parseFutuOrders(body: any): OrderRecord[] {
  const resp = body as FutuOrderListResponse;
  if (!resp?.s2c?.orderList) return [];

  return resp.s2c.orderList.map((o): OrderRecord => ({
    id: o.orderID,
    code: o.code,
    name: o.stockName ?? '',
    side: futuTrdSideToOrderSide(o.trdSide),
    type: futuOrderTypeToOrderType(o.orderType),
    price: toNum(o.price),
    qty: toNum(o.qty),
    filledQty: toNum(o.filledQty),
    status: futuOrderStatusToStatus(o.orderStatus),
    time: o.createdTime ? parseFutuTime(o.createdTime) : Date.now(),
  }));
}

/** Parse position list from ProtoID 2223 */
export function parseFutuPositions(body: any): Position[] {
  const resp = body as FutuPositionListResponse;
  if (!resp?.s2c?.positionList) return [];

  return resp.s2c.positionList.map((p): Position => ({
    code: p.code,
    name: p.stockName ?? '',
    qty: toNum(p.qty),
    avgPrice: toNum(p.costPrice),
    marketPrice: toNum(p.lastPrice),
    pnl: toNum(p.pnl),
    pnlRatio: toNum(p.pnlRatio),
  }));
}

/** Parse place order response from ProtoID 2212 */
export function parseFutuPlaceOrder(body: any): { orderId: string; success: boolean; message?: string } {
  const resp = body as FutuPlaceOrderResponse;
  if (resp?.s2c?.orderID) {
    return { orderId: resp.s2c.orderID, success: true };
  }
  return { orderId: '', success: false, message: 'No order ID in response' };
}

// 2225 AccInfo response — account asset summary
interface FutuAccInfoResponse {
  s2c: {
    header?: { trdEnv: number; accID: string; trdMarket: number };
    funds?: {
      power?: string;               // buying power
      totalAssets?: string;         // total net assets
      cash?: string;                // cash info
      cashInfo?: {
        hkCash?: string;
        usCash?: string;
        cnCash?: string;
        totalCash?: string;         // total cash
      };
      marketValue?: string;         // total market value
      unrealizedPnl?: string;       // unrealized P&L
      unrealizedPnlRatio?: string;
      realizedPnl?: string;         // realized P&L today
      withdrawCash?: string;        // withdrawable cash
      maxAdvertisePower?: string;
      frozenCash?: string;
      nlv?: string;                 // net liquidation value
      initialMargin?: string;
      maintenanceMargin?: string;
    };
    // Per-market fund details (optional)
    marketFunds?: Array<{
      market: number;
      totalAssets?: string;
      cash?: string;
      marketValue?: string;
      unrealizedPnl?: string;
      power?: string;
      currency?: string;
    }>;
  };
}

/** Futu market enum to Market type */
function futuMarketToMarket(m: number): import('../../shared/types').Market {
  switch (m) {
    case FutuMarket.HK: return 'HK';
    case FutuMarket.SH: return 'SH';
    case FutuMarket.SZ: return 'SZ';
    case FutuMarket.US: return 'US';
    case FutuMarket.SG: return 'SG';
    case FutuMarket.JP: return 'JP';
    default: return 'HK';
  }
}

/** Parse account summary from ProtoID 2225 (AccInfo) */
export function parseFutuAccountSummary(body: any, provider: 'futu'): AccountSummary {
  const resp = body as FutuAccInfoResponse;
  const f = resp?.s2c?.funds ?? {};
  const ci = f.cashInfo ?? {};

  const markets: AccountMarketDetail[] = (resp?.s2c?.marketFunds ?? []).map((mf) => ({
    market: futuMarketToMarket(mf.market),
    totalAssets: toNum(mf.totalAssets),
    cash: toNum(mf.cash),
    marketValue: toNum(mf.marketValue),
    unrealizedPnl: toNum(mf.unrealizedPnl),
    buyingPower: toNum(mf.power),
    currency: mf.currency ?? getMarketCurrency(futuMarketToMarket(mf.market)),
  }));

  return {
    provider,
    accountId: resp?.s2c?.header?.accID ?? '',
    totalAssets: toNum(f.totalAssets ?? f.nlv),
    cash: toNum(ci.totalCash ?? f.cash),
    marketValue: toNum(f.marketValue),
    unrealizedPnl: toNum(f.unrealizedPnl),
    unrealizedPnlRatio: toNum(f.unrealizedPnlRatio),
    realizedPnl: toNum(f.realizedPnl),
    buyingPower: toNum(f.power),
    withdrawableCash: toNum(f.withdrawCash),
    frozenCash: toNum(f.frozenCash),
    initialMargin: toNum(f.initialMargin),
    maintenanceMargin: toNum(f.maintenanceMargin),
    currency: 'HKD',
    markets,
    updateTime: Math.floor(Date.now() / 1000),
  };
}

/** Build Futu AccInfo request body (ProtoID 2225 c2s) */
export function buildFutuAccInfoRequest(): object {
  return {
    c2s: {
      header: { trdEnv: 1, accID: '', trdMarket: 1 },
    },
  };
}

function getMarketCurrency(market: import('../../shared/types').Market): string {
  switch (market) {
    case 'HK': return 'HKD';
    case 'US': return 'USD';
    case 'SH':
    case 'SZ': return 'CNY';
    case 'SG': return 'SGD';
    case 'JP': return 'JPY';
    default: return 'HKD';
  }
}

/** Build Futu K-line request body (ProtoID 5001 c2s) */
export function buildFutuKlineRequest(code: string, subType: SubType, count = 500): object {
  return {
    c2s: {
      security: { market: codeToFutuMarket(code), code },
      rehabType: FutuRehabType.FORWARD,
      subType: FutuSubType[subType],
      count,
    },
  };
}

/** Build Futu snapshot request body (ProtoID 5003 c2s) */
export function buildFutuSnapshotRequest(codes: string[]): object {
  return {
    c2s: {
      securityList: codes.map((code) => ({
        market: codeToFutuMarket(code),
        code,
      })),
    },
  };
}

/** Build Futu subscribe request body (ProtoID 3001 c2s) */
export function buildFutuSubscribeRequest(code: string, subTypes: SubType[]): object {
  return {
    c2s: {
      subType: subTypes.map((t) => FutuSubType[t]),
      isSubOrUnSub: true,
      securityList: [{ market: codeToFutuMarket(code), code }],
      noSnapshot: true,
    },
  };
}

/** Build Futu place order request body (ProtoID 2212 c2s) */
export function buildFutuPlaceOrderRequest(
  code: string,
  side: OrderSide,
  type: OrderType,
  price: number,
  qty: number,
): object {
  // Futu trdSide: 0=buy, 1=sell
  // Futu orderType: 0=market, 1=limit, 2=stop, 3=stop limit
  const trdSide = side === 'SELL' ? 1 : 0;
  const futuOrderType = type === 'MARKET' ? 0 : type === 'LIMIT' ? 1 : type === 'STOP' ? 2 : 3;

  return {
    c2s: {
      header: { trdEnv: 1, accID: '', trdMarket: 1 },
      trdSide,
      orderType: futuOrderType,
      code,
      qty: String(qty),
      price: type === 'MARKET' ? '0' : String(price),
      adjustLimit: 0,
      trdMarket: codeToFutuMarket(code),
    },
  };
}

// ===== HistoryDealList (ProtoID 2221) =====

interface FutuHistoryDealResponse {
  s2c: {
    header?: { trdEnv: number; accID: string; trdMarket: number };
    dealList?: FutuRawDeal[];
  };
}

interface FutuRawDeal {
  dealID: string;
  trdSide: number;        // 0=buy, 1=sell, 2=buy back, 3=sell short
  code: string;
  stockName?: string;
  qty: string;
  price: string;
  createTime?: string;    // e.g. "2024.01.15 10:30:00"
  counterBrokerID?: string;
  tradeFee?: string;      // transaction fee
}

/** Build Futu HistoryDealList request body (ProtoID 2221 c2s) */
export function buildFutuHistoryDealRequest(startTime?: string, endTime?: string): object {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear() - 1, 0, 1);
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return {
    c2s: {
      header: { trdEnv: 1, accID: '', trdMarket: 1 },
      startTime: startTime ?? fmt(defaultStart),
      endTime: endTime ?? fmt(now),
    },
  };
}

/** Parse history deal list from ProtoID 2221 */
export function parseFutuHistoryDeals(body: any): import('../../shared/types').HistoryDeal[] {
  const resp = body as FutuHistoryDealResponse;
  if (!resp?.s2c?.dealList) return [];

  return resp.s2c.dealList.map((d): import('../../shared/types').HistoryDeal => {
    const price = toNum(d.price);
    const qty = toNum(d.qty);
    return {
      id: d.dealID,
      code: d.code,
      name: d.stockName ?? '',
      side: futuTrdSideToOrderSide(d.trdSide),
      price,
      qty,
      amount: price * qty,
      fee: toNum(d.tradeFee),
      time: d.createTime ? parseFutuTime(d.createTime) : Date.now(),
      provider: 'futu',
    };
  });
}
