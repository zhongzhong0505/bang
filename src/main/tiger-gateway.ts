import WebSocket from 'ws';
import https from 'https';
import crypto from 'crypto';
import type { TigerGatewayConfig, GatewayStatus, KlineData, SubType, StockSnapshot } from '../shared/types';
import { BrowserWindow } from 'electron';
import {
  parseTigerKline, parseTigerSnapshot, parseTigerPositions,
  parseTigerOrders, parseTigerPlaceOrder, parseTigerWsPush,
  parseTigerWsQuote, parseTigerWsKline,
  buildTigerPlaceOrderBody, subTypeToTigerPeriod,
  parseTigerHistoryFills,
} from './adapters/tiger-adapter';
import { parseTigerAccountSummary } from './adapters/tiger-adapter';

// Tiger OpenAPI gateway client
export class TigerGatewayClient {
  private ws: WebSocket | null = null;
  private config: TigerGatewayConfig | null = null;
  private status: GatewayStatus = {
    connected: false,
    loggedIn: false,
    provider: 'tiger',
  };
  private win: BrowserWindow | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reqId = 0;

  setWindow(win: BrowserWindow) {
    this.win = win;
  }

  getStatus(): GatewayStatus {
    return { ...this.status };
  }

  connect(config: TigerGatewayConfig) {
    this.config = config;
    this.disconnect();

    this.status = {
      connected: false,
      loggedIn: false,
      provider: 'tiger',
      host: config.httpBaseUrl ?? 'https://openapi.itigerup.com',
      port: 443,
    };

    this.verifyAndConnect();
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.status.connected = false;
    this.status.loggedIn = false;
  }

  private getBaseUrl(): string {
    const env = this.config?.env ?? 'sandbox';
    switch (env) {
      case 'prod': return 'https://openapi.itigerup.com';
      case 'us': return 'https://openapi.itigerup.com';
      case 'sandbox': return 'https://openapi.itigerup.com';
      default: return this.config?.httpBaseUrl ?? 'https://openapi.itigerup.com';
    }
  }

  private getWsUrl(): string {
    const env = this.config?.env ?? 'sandbox';
    switch (env) {
      case 'prod': return 'wss://openapi.itigerup.com/stream';
      case 'us': return 'wss://openapi.itigerup.com/stream';
      case 'sandbox': return 'wss://openapi.itigerup.com/stream';
      default: return this.config?.wsUrl ?? 'wss://openapi.itigerup.com/stream';
    }
  }

  private signParams(params: Record<string, string>): string {
    if (!this.config) throw new Error('Not configured');
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signStr);
    signer.end();
    const privateKey = this.config.privateKey.startsWith('-----BEGIN')
      ? this.config.privateKey
      : `-----BEGIN RSA PRIVATE KEY-----\n${this.config.privateKey}\n-----END RSA PRIVATE KEY-----`;
    return signer.sign(privateKey, 'base64');
  }

  private buildParams(method: string): Record<string, string> {
    if (!this.config) throw new Error('Not configured');
    const timestamp = Date.now().toString();
    return {
      tiger_id: this.config.tigerId,
      account: this.config.account,
      method,
      timestamp,
      sign_type: 'RSA',
      version: '3.2',
    };
  }

  private restRequest<T = any>(method: string, body?: Record<string, any>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.config) {
        reject(new Error('Not configured'));
        return;
      }

      const params = this.buildParams(method);
      const sign = this.signParams(params);
      const payload = { ...params, sign, ...body };

      const baseUrl = this.getBaseUrl();
      const url = new URL(`/v3/${method}`, baseUrl);
      const postData = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            try {
              const data = Buffer.concat(chunks).toString('utf-8');
              const json = JSON.parse(data);
              // Tiger API: code 200 or 0 means success
              if (json.code === 200 || json.code === 0) {
                resolve(json.data ?? json);
              } else {
                reject(new Error(json.message ?? `API error ${json.code}`));
              }
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  private async verifyAndConnect() {
    try {
      await this.restRequest('server_time');
      this.status.connected = true;
      this.status.loggedIn = true;
      this.sendStatus();
      this.connectWebSocket();
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
      this.scheduleReconnect();
    }
  }

  private connectWebSocket() {
    if (!this.config) return;

    const wsUrl = this.getWsUrl();
    const timestamp = Date.now().toString();
    const params: Record<string, string> = {
      tiger_id: this.config.tigerId,
      timestamp,
      sign_type: 'RSA',
    };
    const sign = this.signParams(params);

    try {
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'tiger-id': this.config.tigerId,
          timestamp,
          sign,
          'sign-type': 'RSA',
        },
      });

      this.ws.on('open', () => {
        this.startHeartbeat();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleWsMessage(data);
      });

      this.ws.on('close', () => {
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      this.ws.on('error', (err: Error) => {
        this.status.error = err.message;
        this.sendStatus();
      });
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ cmd: 'heartbeat', id: ++this.reqId }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleWsMessage(data: WebSocket.Data) {
    try {
      const raw = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data);
      const msg = JSON.parse(raw);

      // Use adapter to parse WS push
      const parsed = parseTigerWsPush(msg);
      if (!parsed) return;

      switch (parsed.type) {
        case 'heartbeat':
          break;

        case 'quote': {
          // Real-time quote update — convert to StockSnapshot partial
          const snapshot = parseTigerWsQuote(parsed.data);
          if (snapshot.code) {
            this.sendToRenderer('subscribe:data', snapshot);
          }
          break;
        }

        case 'kline': {
          // Real-time K-line update
          const kline = parseTigerWsKline(parsed.data);
          if (kline) {
            this.sendToRenderer('subscribe:data', { type: 'kline', data: kline });
          }
          break;
        }

        case 'order': {
          // Order status update
          this.sendToRenderer('order:update', parsed.data);
          break;
        }

        case 'position': {
          // Position update
          this.sendToRenderer('position:update', parsed.data);
          break;
        }

        default:
          break;
      }
    } catch {
      // ignore parse errors
    }
  }

  async requestKline(code: string, subType: SubType, count = 500) {
    try {
      // Use adapter's period mapping
      const period = subTypeToTigerPeriod(subType);
      const result = await this.restRequest('kline', {
        symbol: code,
        period,
        count,
        right: 'br', // backward rehab
      });
      // Use adapter to parse response
      const klineData = parseTigerKline(result, code);
      this.sendToRenderer('kline:data', { code, data: klineData });
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
    }
  }

  async requestSnapshot(codes: string[]) {
    try {
      const result = await this.restRequest('quote', {
        symbols: codes.join(','),
      });
      // Use adapter to parse response
      const snapshots = parseTigerSnapshot(result);
      this.sendToRenderer('snapshot:data', snapshots);
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
    }
  }

  async subscribe(code: string, _subTypes: SubType[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subMsg = {
      cmd: 'subscribe',
      id: ++this.reqId,
      data: { symbols: [code], types: ['quote', 'kline'] },
    };
    this.ws.send(JSON.stringify(subMsg));
  }

  async getPositions() {
    try {
      const result = await this.restRequest('positions');
      // Use adapter to parse response
      return parseTigerPositions(result);
    } catch {
      return [];
    }
  }

  async getOrders() {
    try {
      const result = await this.restRequest('orders');
      // Use adapter to parse response
      return parseTigerOrders(result);
    } catch {
      return [];
    }
  }

  async placeOrder(code: string, side: string, type: string, price: number, quantity: number) {
    try {
      // Use adapter to build request body
      const body = buildTigerPlaceOrderBody(code, side as any, type as any, price, quantity);
      const result = await this.restRequest('place_order', body);
      return parseTigerPlaceOrder(result);
    } catch (err: any) {
      return { orderId: '', success: false, message: err.message };
    }
  }

  async cancelOrder(orderId: string) {
    try {
      const result = await this.restRequest('cancel_order', { id: orderId });
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAccountSummary() {
    try {
      const result = await this.restRequest('assets');
      const summary = parseTigerAccountSummary(result, 'tiger');
      this.sendToRenderer('account:summary', summary);
      return summary;
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
      return null;
    }
  }

  async modifyOrder(req: any) {
    try {
      const result = await this.restRequest("replace_order", {
        id: req.orderId,
        price: req.price,
        total_quantity: req.quantity,
      });
      return { success: true, data: result };
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
      return { success: false, error: err.message };
    }
  }

  private sendStatus() {
    this.sendToRenderer('gateway:status:update', this.status);
  }

  private sendToRenderer(channel: string, data: any) {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, data);
    }
  }

  async getHistoryDeals(startTime?: number, endTime?: number) {
    try {
      const params: Record<string, any> = {};
      if (startTime) params.start_time = Math.floor(startTime);
      if (endTime) params.end_time = Math.floor(endTime);
      const result = await this.restRequest('fills', params);
      const deals = parseTigerHistoryFills(result);
      this.sendToRenderer('history:deals', deals);
    } catch (err: any) {
      this.status.error = err.message;
      this.sendStatus();
    }
  }

  private scheduleReconnect() {
    if (!this.config) return;
    this.reconnectTimer = setTimeout(() => {
      if (this.config) this.connect(this.config);
    }, 5000);
  }
}
