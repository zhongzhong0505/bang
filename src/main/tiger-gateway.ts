/**
 * Tiger OpenAPI gateway client — powered by the official @tigeropenapi/tigeropen SDK.
 *
 * Uses QuoteClient / TradeClient / PushClient from the SDK instead of
 * hand-rolled REST + WebSocket protocol. The SDK handles:
 *  - Protobuf serialization (v3 wire protocol)
 *  - RSA-SHA256 signing & response verification
 *  - Dynamic domain garden resolution
 *  - Quote server auto-routing
 *  - Device ID auto-detection
 *  - Push via TCP+TLS+Protobuf (not plain WebSocket)
 */
import {
  createClientConfig,
  HttpClient,
  QuoteClient,
  TradeClient,
  PushClient,
  ConnectionState,
  BarPeriod,
  SecurityType,
  TimeInForce,
  marketOrder,
  limitOrder,
  stopOrder,
  stopLimitOrder,
} from '@tigeropenapi/tigeropen';
import type { ClientConfig, ClientConfigOptions } from '@tigeropenapi/tigeropen';
import type { Order as SdkOrder, Position as SdkPosition, Asset as SdkAsset, Transaction as SdkTransaction } from '@tigeropenapi/tigeropen';
import type {
  TigerGatewayConfig, GatewayStatus, KlineData, SubType, StockSnapshot,
  Position, OrderRecord, AccountSummary, HistoryDeal, SymbolSearchResult,
} from '../shared/types';
import { BrowserWindow } from 'electron';
import {
  mapSdkKline, mapSdkBrief, mapSdkPosition, mapSdkOrder,
  mapSdkAsset, mapSdkTransaction, subTypeToBarPeriod,
  toTigerSymbol, fromTigerSymbol,
} from './adapters/tiger-adapter';

/** Derive market from app-internal code (e.g. "HK.00700" → HK, "US.AAPL" → US) */
function inferMarketFromCode(code: string): string {
  const dot = code.indexOf('.');
  if (dot === -1) return 'US';
  return code.slice(0, dot);
}

/** Map app market to Tiger license */
function marketToLicense(market: string): string {
  switch (market.toUpperCase()) {
    case 'US': return 'TBUS';
    case 'HK': return 'TBHK';
    case 'SG': return 'TBSG';
    case 'NZ': return 'TBNZ';
    case 'AU': return 'TBAU';
    default: return 'TBUS';
  }
}

/** Derive market from symbol suffix (e.g. "00700.HK" → HK, "AAPL" → US) */
function inferMarket(symbol: string): string {
  if (symbol.endsWith('.HK') || symbol.endsWith('.SZ') || symbol.endsWith('.SH')) return symbol.slice(-2);
  return 'US';
}

/** Derive secType from symbol (default STK) */
function inferSecType(_symbol: string): string {
  return SecurityType.STK;
}

// Tiger OpenAPI gateway client (SDK-based)
export class TigerGatewayClient {
  private config: TigerGatewayConfig | null = null;
  private sdkConfig: ClientConfig | null = null;
  private quoteClients: Map<string, QuoteClient> = new Map();
  private primaryLicense: string = 'TBUS';
  private tradeClient: TradeClient | null = null;
  private pushClient: PushClient | null = null;
  private status: GatewayStatus = {
    connected: false,
    loggedIn: false,
    provider: 'tiger',
  };
  private win: BrowserWindow | null = null;
  /** Per-market symbol name cache for searchStock */
  private symbolCache: Map<string, { symbol: string; name: string; market: string }[]> = new Map();

  setWindow(win: BrowserWindow) {
    this.win = win;
  }

  getStatus(): GatewayStatus {
    return { ...this.status };
  }

  connect(config: TigerGatewayConfig) {
    this.config = config;
    this.disconnect();

    try {
      const options: ClientConfigOptions = {
        tigerId: config.tigerId,
        privateKey: config.privateKey,
        account: config.account,
        token: config.token || undefined,
      };

      // Allow serverUrl override (advanced)
      if (config.serverUrl) {
        options.serverUrl = config.serverUrl;
        options.enableDynamicDomain = false;
      }

      // Create a QuoteClient per license, each resolving to its optimal quote server
      const licenses = config.licenses && config.licenses.length > 0 ? config.licenses : ['TBUS'];
      this.primaryLicense = licenses[0];
      this.quoteClients.clear();

      for (const lic of licenses) {
        const licOpts = { ...options, license: lic };
        const licConfig = createClientConfig(licOpts);
        this.quoteClients.set(lic, new QuoteClient(
          new HttpClient(licConfig, undefined, { useQuoteServerUrl: true }),
        ));
      }

      // Primary config uses first license for trading + push
      const primaryOpts = { ...options, license: this.primaryLicense };
      this.sdkConfig = createClientConfig(primaryOpts);

      // Create trade client
      this.tradeClient = new TradeClient(
        new HttpClient(this.sdkConfig),
        this.sdkConfig.account,
      );

      // Create push client (TCP+TLS+Protobuf)
      this.pushClient = new PushClient(this.sdkConfig);
      this.setupPushCallbacks();

      this.status = {
        connected: true,
        loggedIn: true,
        provider: 'tiger',
        host: (config.licenses && config.licenses.length > 0 ? config.licenses.join('+') : 'TBUS'),
      };
      this.sendStatus();

      // Connect push asynchronously
      this.pushClient.connect().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Push connection failed';
        this.status.error = msg;
        this.sendStatus();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      this.status = {
        connected: false,
        loggedIn: false,
        provider: 'tiger',
        error: msg,
      };
      this.sendStatus();
    }
  }

  disconnect() {
    if (this.pushClient) {
      try { this.pushClient.disconnect(); } catch { /* ignore */ }
      this.pushClient = null;
    }
    this.quoteClients.clear();
    this.tradeClient = null;
    this.sdkConfig = null;
    this.symbolCache.clear();
    this.status.connected = false;
    this.status.loggedIn = false;
    this.status.error = undefined;
  }

  // ─── Quote methods ───────────────────────────────────────

  async requestKline(code: string, subType: SubType, count = 500) {
    const qc = this.getQuoteClient(code);
    if (!qc) return;
    try {
      const period = subTypeToBarPeriod(subType);
      const tigerCode = toTigerSymbol(code);
      const klines = await qc.getKline({
        symbols: [tigerCode],
        period,
        right: 'br', // backward rehab
        limit: count,
      });
      const klineData = mapSdkKline(klines, code);
      this.sendToRenderer('kline:data', { code, data: klineData });
    } catch (err: unknown) {
      this.status.error = err instanceof Error ? err.message : String(err);
      this.sendStatus();
    }
  }

  async requestSnapshot(codes: string[]) {
    if (!this.quoteClient) return;
    try {
      const tigerCodes = codes.map(toTigerSymbol);
      const briefs = await this.quoteClient.getRealTimeQuote({ symbols: tigerCodes });
      const snapshots = mapSdkBrief(briefs);
      this.sendToRenderer('snapshot:data', snapshots);
    } catch (err: unknown) {
      this.status.error = err instanceof Error ? err.message : String(err);
      this.sendStatus();
    }
  }

  async subscribe(code: string, _subTypes: SubType[]) {
    if (!this.pushClient || this.pushClient.state !== ConnectionState.Connected) return;
    try {
      const tigerCode = toTigerSymbol(code);
      this.pushClient.subscribeQuote([tigerCode]);
      this.pushClient.subscribeKline([tigerCode]);
    } catch { /* ignore subscribe errors */ }
  }

  // ─── Trade methods ───────────────────────────────────────

  async getPositions(): Promise<Position[]> {
    if (!this.tradeClient) return [];
    try {
      const positions = await this.tradeClient.getPositions();
      return mapSdkPosition(positions);
    } catch {
      return [];
    }
  }

  async getOrders(): Promise<OrderRecord[]> {
    if (!this.tradeClient) return [];
    try {
      const orders = await this.tradeClient.getOrders();
      return mapSdkOrder(orders);
    } catch {
      return [];
    }
  }

  async placeOrder(req: any): Promise<{ orderId: string; success: boolean; message?: string }> {
    if (!this.tradeClient) return { orderId: '', success: false, message: 'Not connected' };
    try {
      const account = this.sdkConfig!.account;
      const symbol = toTigerSymbol(req.code as string);
      const action = (req.side as string).toUpperCase(); // BUY / SELL
      const orderType = (req.type as string).toUpperCase(); // MARKET / LIMIT / STOP / STOP_LIMIT
      const quantity = req.quantity as number;
      const price = req.price as number;
      const secType = inferSecType(symbol);
      const market = inferMarket(symbol);

      let orderReq;
      switch (orderType) {
        case 'MARKET':
        case 'MKT':
          orderReq = marketOrder(account, symbol, secType, action, quantity);
          break;
        case 'LIMIT':
        case 'LMT':
          orderReq = limitOrder(account, symbol, secType, action, quantity, price);
          break;
        case 'STOP':
        case 'STP':
          orderReq = stopOrder(account, symbol, secType, action, quantity, price);
          break;
        case 'STOP_LIMIT':
        case 'STP_LMT':
          orderReq = stopLimitOrder(account, symbol, secType, action, quantity, price, price);
          break;
        default:
          orderReq = limitOrder(account, symbol, secType, action, quantity, price);
      }

      orderReq.market = market;

      const result = await this.tradeClient.placeOrder(orderReq);
      const orderId = result ? String(result.id) : '';
      return { orderId, success: !!result, message: result ? undefined : 'Place order failed' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { orderId: '', success: false, message: msg };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    if (!this.tradeClient) return { success: false, message: 'Not connected' };
    try {
      const result = await this.tradeClient.cancelOrder(orderId);
      return { success: true, data: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  }

  async getAccountSummary(): Promise<AccountSummary | null> {
    if (!this.tradeClient) return null;
    try {
      const assets = await this.tradeClient.getAssets({ segment: true, marketValue: true });
      const summary = mapSdkAsset(assets);
      this.sendToRenderer('account:summary', summary);
      return summary;
    } catch (err: unknown) {
      this.status.error = err instanceof Error ? err.message : String(err);
      this.sendStatus();
      return null;
    }
  }

  async modifyOrder(req: any): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.tradeClient) return { success: false, error: 'Not connected' };
    try {
      const account = this.sdkConfig!.account;
      const symbol = req.code ?? '';
      const secType = inferSecType(symbol);
      const orderReq = limitOrder(account, symbol, secType, req.side ?? 'BUY', req.quantity ?? 0, req.price ?? 0);
      const result = await this.tradeClient.modifyOrder(req.orderId, orderReq);
      return { success: true, data: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.status.error = msg;
      this.sendStatus();
      return { success: false, error: msg };
    }
  }

  async getHistoryDeals(startTime?: number, endTime?: number) {
    if (!this.tradeClient) return;
    try {
      const req: any = {};
      if (startTime) req.startDate = startTime * 1000; // SDK expects ms
      if (endTime) req.endDate = endTime * 1000;
      const transactions = await this.tradeClient.getOrderTransactions(req);
      const deals = mapSdkTransaction(transactions);
      this.sendToRenderer('history:deals', deals);
    } catch (err: unknown) {
      this.status.error = err instanceof Error ? err.message : String(err);
      this.sendStatus();
    }
  }

  /** Search stocks via SDK getSymbolNames with local cache + filter */
  async searchStock(keyword: string): Promise<SymbolSearchResult[]> {
    if (this.quoteClients.size === 0) return [];
    try {
      const markets = ['US', 'HK', 'CN'];
      let allNames: { symbol: string; name: string; market: string }[] = [];

      for (const m of markets) {
        if (!this.symbolCache.has(m)) {
          try {
            const lic = marketToLicense(m);
            const qc = this.quoteClients.get(lic) ?? this.quoteClients.values().next().value;
            if (!qc) continue;
            const names = await qc.getSymbolNames({ market: m });
            this.symbolCache.set(m, names.map(n => ({
              symbol: n.symbol ?? '',
              name: n.name ?? '',
              market: n.market ?? m,
            })));
          } catch {
            this.symbolCache.set(m, []);
          }
        }
        allNames = allNames.concat(this.symbolCache.get(m)!);
      }

      const kw = keyword.toUpperCase();
      const results = allNames
        .filter(s => s.symbol.toUpperCase().includes(kw) || s.name.toUpperCase().includes(kw))
        .slice(0, 30)
        .map(s => ({
          code: fromTigerSymbol(s.symbol),
          name: s.name,
          market: s.market === 'HK' ? 'HK' as const
            : s.market === 'US' ? 'US' as const
            : s.market === 'SH' ? 'SH' as const
            : s.market === 'SZ' ? 'SZ' as const
            : 'HK' as const,
          type: '股票',
        }));

      return results;
    } catch {
      return [];
    }
  }

  // ─── Push callbacks ──────────────────────────────────────

  private setupPushCallbacks() {
    if (!this.pushClient) return;
    // setCallbacks expects the Callbacks interface; push data types
    // are Protobuf-generated and not re-exported from the main entry,
    // so we use structural typing with `any` for the callback params.
    (this.pushClient as any).setCallbacks({
      onConnect: () => {
        this.status.connected = true;
        this.status.loggedIn = true;
        this.status.error = undefined;
        this.sendStatus();
      },
      onDisconnect: () => {
        this.status.connected = false;
        this.status.loggedIn = false;
        this.sendStatus();
      },
      onError: (err: Error) => {
        this.status.error = err.message;
        this.sendStatus();
      },
      onQuote: (data: any) => {
        try {
          const snapshot: StockSnapshot = {
            code: data.symbol,
            name: '',
            curPrice: data.latestPrice ?? 0,
            changeVal: 0,
            changeRate: 0,
            volume: data.volume ?? 0,
            turnover: data.amount ?? 0,
            high: data.high ?? 0,
            low: data.low ?? 0,
            open: data.open ?? 0,
            prevClose: data.preClose ?? 0,
          };
          this.sendToRenderer('subscribe:data', snapshot);
        } catch { /* ignore */ }
      },
      onKline: (data: any) => {
        try {
          const kline: KlineData = {
            time: data.time,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            turnover: data.amount ?? 0,
          };
          this.sendToRenderer('subscribe:data', { code: data.symbol, ...kline });
        } catch { /* ignore */ }
      },
      onAsset: (data: any) => {
        try {
          const summary: AccountSummary = {
            provider: 'tiger',
            accountId: data.account,
            totalAssets: data.netLiquidation ?? 0,
            cash: data.cashBalance ?? 0,
            marketValue: data.grossPositionValue ?? 0,
            unrealizedPnl: 0,
            unrealizedPnlRatio: 0,
            realizedPnl: 0,
            buyingPower: data.buyingPower ?? 0,
            withdrawableCash: 0,
            frozenCash: 0,
            initialMargin: data.initMarginReq ?? 0,
            maintenanceMargin: data.maintMarginReq ?? 0,
            currency: data.currency ?? 'USD',
            markets: [],
            updateTime: Math.floor(Date.now() / 1000),
          };
          this.sendToRenderer('account:summary', summary);
        } catch { /* ignore */ }
      },
      onPosition: (data: any) => {
        try {
          const pos: Position = {
            code: data.symbol,
            name: data.name ?? '',
            qty: data.positionQty ?? data.position ?? 0,
            avgPrice: data.averageCost ?? 0,
            marketPrice: data.latestPrice ?? 0,
            pnl: data.unrealizedPnl ?? 0,
            pnlRatio: 0,
          };
          this.sendToRenderer('position:update', pos);
        } catch { /* ignore */ }
      },
      onOrder: (data: any) => {
        try {
          const order: OrderRecord = {
            id: String(data.id),
            code: data.symbol,
            name: '',
            side: data.action === 'BUY' ? 'BUY' : 'SELL',
            type: data.orderType === 'MKT' ? 'MARKET' : data.orderType === 'LMT' ? 'LIMIT' : data.orderType === 'STP' ? 'STOP' : 'STOP_LIMIT',
            price: data.limitPrice ?? 0,
            qty: data.totalQuantity ?? 0,
            filledQty: data.filledQuantity ?? 0,
            status: data.status === 'Filled' ? 'FILLED' : data.status === 'Cancelled' ? 'CANCELLED' : data.status === 'Rejected' ? 'REJECTED' : 'PENDING',
            time: Date.now(),
          };
          this.sendToRenderer('order:update', order);
        } catch { /* ignore */ }
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────

  /** Get the QuoteClient for a given app-internal code (routes by market → license) */
  private getQuoteClient(code: string): QuoteClient | null {
    const market = inferMarketFromCode(code);
    const lic = marketToLicense(market);
    return this.quoteClients.get(lic) ?? this.quoteClients.values().next().value ?? null;
  }

  private sendStatus() {
    this.sendToRenderer('gateway:status:update', this.status);
  }

  private sendToRenderer(channel: string, data: any) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, data);
    }
  }
}
