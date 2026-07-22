/**
 * Tiger OpenAPI data adapter (SDK-based).
 *
 * Maps strongly-typed SDK response objects to the app's unified internal types.
 * Since the SDK (@tigeropenapi/tigeropen v0.3+) returns typed objects
 * (Brief, Kline, Position, Order, Asset, Transaction, …), this adapter
 * is purely a thin field-mapping layer — no raw-JSON parsing needed.
 */
import type {
  KlineData, StockSnapshot, SubType, Position, OrderRecord,
  OrderSide, OrderType, AccountSummary, AccountMarketDetail, Market,
  HistoryDeal,
} from '../../shared/types';
import type {
  Kline as SdkKline, Brief as SdkBrief,
  Position as SdkPosition, Order as SdkOrder,
  Asset as SdkAsset, AssetSegment,
  Transaction as SdkTransaction,
} from '@tigeropenapi/tigeropen';
import { BarPeriod, normalizeOrderStatus } from '@tigeropenapi/tigeropen';

// ===== Symbol format conversion =====
// App internal format (Futu-style): HK.00700, US.AAPL, SH.600519, SZ.000858
// Tiger SDK format: 00700.HK, AAPL, 600519.SH, 000858.SZ

/** Convert app-internal code to Tiger SDK symbol */
export function toTigerSymbol(code: string): string {
  const dot = code.indexOf('.');
  if (dot === -1) return code; // already Tiger format or unknown
  const market = code.slice(0, dot);   // HK, US, SH, SZ
  const symbol = code.slice(dot + 1);  // 00700, AAPL, 600519
  switch (market) {
    case 'US': return symbol;           // AAPL
    case 'HK': return symbol + '.HK';   // 00700.HK
    case 'SH': return symbol + '.SH';   // 600519.SH
    case 'SZ': return symbol + '.SZ';   // 000858.SZ
    default:   return symbol + '.' + market;
  }
}

/** Convert Tiger SDK symbol back to app-internal code */
export function fromTigerSymbol(symbol: string): string {
  const dot = symbol.lastIndexOf('.');
  if (dot === -1) return 'US.' + symbol; // AAPL → US.AAPL
  const code = symbol.slice(0, dot);      // 00700
  const market = symbol.slice(dot + 1);   // HK
  switch (market.toUpperCase()) {
    case 'HK': return 'HK.' + code;
    case 'US': return 'US.' + code;
    case 'SH': return 'SH.' + code;
    case 'SZ': return 'SZ.' + code;
    default:   return market.toUpperCase() + '.' + code;
  }
}

// ===== Period mapping =====

/** Map app SubType to SDK BarPeriod string */
export function subTypeToBarPeriod(subType: SubType): string {
  const map: Record<SubType, string> = {
    '1': BarPeriod.Min1, '5': BarPeriod.Min5, '15': BarPeriod.Min15,
    '30': BarPeriod.Min30, '60': BarPeriod.Min60,
    DAY: BarPeriod.Day, WEEK: BarPeriod.Week, MONTH: BarPeriod.Month,
  };
  return map[subType] ?? BarPeriod.Min1;
}

// ===== K-line =====

/** Map SDK Kline[] to internal KlineData[] */
export function mapSdkKline(klines: SdkKline[], _code: string): KlineData[] {
  const items = klines.length > 0 ? klines[0].items : [];
  return items.map(item => ({
    time: item.time, // SDK returns ms timestamp
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    turnover: item.amount ?? 0,
  }));
}

// ===== Quote / Snapshot =====

/** Map SDK Brief[] to internal StockSnapshot[] */
export function mapSdkBrief(briefs: SdkBrief[]): StockSnapshot[] {
  return briefs.map(b => ({
    code: fromTigerSymbol(b.symbol),
    name: '',
    curPrice: b.latestPrice ?? 0,
    changeVal: b.change ?? 0,
    changeRate: (b.changeRate ?? 0) * 100, // SDK returns decimal (0.025 = 2.5%)
    volume: b.volume ?? 0,
    turnover: 0, // Brief doesn't include turnover
    high: b.high ?? 0,
    low: b.low ?? 0,
    open: b.open ?? 0,
    prevClose: b.preClose ?? 0,
  }));
}

// ===== Position =====

/** Map SDK Position[] to internal Position[] */
export function mapSdkPosition(positions: SdkPosition[]): Position[] {
  return positions.map(p => ({
    code: fromTigerSymbol(p.symbol ?? ''),
    name: p.name ?? '',
    qty: p.positionQty ?? p.position ?? 0,
    avgPrice: p.averageCost ?? 0,
    marketPrice: p.latestPrice ?? 0,
    pnl: p.unrealizedPnl ?? 0,
    pnlRatio: (p.unrealizedPnlPercent ?? 0) * 100,
  }));
}

// ===== Order =====

/** Map SDK Order[] to internal OrderRecord[] */
export function mapSdkOrder(orders: SdkOrder[]): OrderRecord[] {
  return orders.map(o => ({
    id: String(o.id ?? o.orderId ?? ''),
    code: fromTigerSymbol(o.symbol ?? ''),
    name: o.name ?? '',
    side: (o.action === 'BUY' ? 'BUY' : 'SELL') as OrderSide,
    type: mapSdkOrderType(o.orderType),
    price: o.limitPrice ?? o.avgFillPrice ?? 0,
    qty: o.totalQuantity ?? 0,
    filledQty: o.filledQuantity ?? 0,
    status: mapSdkOrderStatus(o.status),
    time: o.updateTime ?? o.openTime ?? Date.now(),
  }));
}

function mapSdkOrderType(orderType?: string): OrderType {
  switch (orderType) {
    case 'MKT': return 'MARKET';
    case 'LMT': return 'LIMIT';
    case 'STP': return 'STOP';
    case 'STP_LMT': return 'STOP_LIMIT';
    default: return 'LIMIT';
  }
}

function mapSdkOrderStatus(status?: string): OrderRecord['status'] {
  const normalized = normalizeOrderStatus(status);
  switch (normalized) {
    case 'Filled': return 'FILLED';
    case 'Submitted': return 'SUBMITTED';
    case 'PendingCancel': return 'PENDING_CANCEL';
    case 'PendingSubmit': return 'PENDING';
    case 'Cancelled': return 'CANCELLED';
    case 'Invalid':
    case 'Inactive': return 'REJECTED';
    default:
      // Partial fill detection: if raw status contains "Partial" or "partial"
      if (status && /partial/i.test(status)) return 'PARTIAL';
      return 'PENDING';
  }
}

// ===== Account / Asset =====

/** Map SDK Asset[] to internal AccountSummary */
export function mapSdkAsset(assets: SdkAsset[]): AccountSummary {
  if (!assets || assets.length === 0) {
    return emptyAccountSummary();
  }

  // Aggregate across all asset entries (one per currency/segment)
  let totalAssets = 0;
  let cash = 0;
  let marketValue = 0;
  let unrealizedPnl = 0;
  let realizedPnl = 0;
  let buyingPower = 0;
  let primaryCurrency = 'USD';
  const markets: AccountMarketDetail[] = [];

  for (const a of assets) {
    totalAssets += a.netLiquidation ?? 0;
    cash += a.cashValue ?? 0;
    unrealizedPnl += a.unrealizedPnL ?? 0;
    realizedPnl += a.realizedPnL ?? 0;
    buyingPower += a.buyingPower ?? 0;

    if ((a.netLiquidation ?? 0) > 0 && primaryCurrency === 'USD') {
      primaryCurrency = a.currency ?? 'USD';
    }

    // Drill into segments for per-market detail
    if (a.segments) {
      for (const seg of a.segments) {
        const segValue = seg.netLiquidation ?? 0;
        const segCash = seg.cashValue ?? 0;
        const segMarketValue = seg.grossPositionValue ?? 0;
        if (segValue > 0) {
          const market = currencyToMarket(a.currency ?? 'USD');
          markets.push({
            market,
            totalAssets: segValue,
            cash: segCash,
            marketValue: segMarketValue,
            unrealizedPnl: 0,
            buyingPower: seg.availableFunds ?? 0,
            currency: a.currency ?? 'USD',
          });
        }
      }
    }
  }

  // marketValue = totalAssets - cash (approximation when not directly available)
  marketValue = totalAssets - cash;

  return {
    provider: 'tiger',
    accountId: assets[0].account ?? '',
    totalAssets,
    cash,
    marketValue,
    unrealizedPnl,
    unrealizedPnlRatio: totalAssets > 0 ? (unrealizedPnl / (totalAssets - unrealizedPnl)) * 100 : 0,
    realizedPnl,
    buyingPower,
    withdrawableCash: 0,
    frozenCash: 0,
    initialMargin: 0,
    maintenanceMargin: 0,
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

function emptyAccountSummary(): AccountSummary {
  return {
    provider: 'tiger',
    accountId: '',
    totalAssets: 0, cash: 0, marketValue: 0,
    unrealizedPnl: 0, unrealizedPnlRatio: 0, realizedPnl: 0,
    buyingPower: 0, withdrawableCash: 0, frozenCash: 0,
    initialMargin: 0, maintenanceMargin: 0,
    currency: 'USD', markets: [],
    updateTime: Math.floor(Date.now() / 1000),
  };
}

// ===== Transaction / HistoryDeal =====

/** Map SDK Transaction[] to internal HistoryDeal[] */
export function mapSdkTransaction(transactions: SdkTransaction[]): HistoryDeal[] {
  if (!transactions || !Array.isArray(transactions)) return [];
  return transactions.map(t => {
    const price = t.filledPrice ?? t.price ?? 0;
    const qty = t.filledQuantity ?? t.quantity ?? 0;
    return {
      id: String(t.id ?? t.orderId ?? ''),
      code: fromTigerSymbol(t.symbol ?? ''),
      name: '',
      side: (t.action === 'BUY' ? 'BUY' : 'SELL') as OrderSide,
      price,
      qty,
      amount: price * qty,
      fee: t.commission ?? 0,
      time: t.transactionTime ? Math.floor(t.transactionTime / 1000) : Date.now(),
      provider: 'tiger',
    };
  });
}
