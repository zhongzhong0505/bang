import WebSocket from 'ws';
import type { FutuGatewayConfig, GatewayConfig, GatewayStatus, KlineData, SubType } from '../shared/types';
import { BrowserWindow } from 'electron';
import {
  parseFutuKline, parseFutuSnapshot, parseFutuStockUpdate,
  parseFutuOrders, parseFutuPositions, parseFutuPlaceOrder,
  buildFutuKlineRequest, buildFutuSnapshotRequest, buildFutuSubscribeRequest,
  buildFutuPlaceOrderRequest,
  codeToFutuMarket,
  parseFutuHistoryDeals, buildFutuHistoryDealRequest,
} from './adapters/futu-adapter';
import { parseFutuAccountSummary, buildFutuAccInfoRequest } from './adapters/futu-adapter';

// Futu OpenD WebSocket gateway client
export class GatewayClient {
  private ws: WebSocket | null = null;
  private config: GatewayConfig | null = null;
  private status: GatewayStatus = {
    connected: false,
    loggedIn: false,
    provider: 'futu',
    host: '',
    port: 0,
  };
  private win: BrowserWindow | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;

  setWindow(win: BrowserWindow) {
    this.win = win;
  }

  getStatus(): GatewayStatus {
    return { ...this.status };
  }

  connect(config: GatewayConfig) {
    this.config = config;
    this.disconnect();

    const futu = config as FutuGatewayConfig;
    const protocol = futu.sslCert ? 'wss' : 'ws';
    const url = `${protocol}://${futu.host}:${futu.wsPort}`;

    this.status = {
      connected: false,
      loggedIn: false,
      provider: 'futu',
      host: futu.host,
      port: futu.wsPort,
    };

    try {
      this.ws = new WebSocket(url, {
        headers: futu.wsAuthKey
          ? { 'Futu-Authorization': futu.wsAuthKey }
          : undefined,
      });

      this.ws.on('open', () => {
        this.status.connected = true;
        this.sendStatus();
        this.initConnection();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        this.status.connected = false;
        this.status.loggedIn = false;
        this.sendStatus();
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

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.status.connected = false;
    this.status.loggedIn = false;
  }

  private initConnection() {
    // Send InitConnect (ProtoID 1001) to OpenD
    this.sendRequest(1001, {
      c2s: {
        privateKey: (this.config as FutuGatewayConfig)?.rsaPrivateKey || '',
      },
    });
  }

  private sendRequest(protoId: number, body: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.seq++;
    const req = {
      protoId,
      seq: this.seq,
      body: JSON.stringify(body),
    };

    // Futu OpenD binary protocol:
    // [4 bytes header][4 bytes protoId][4 bytes seq][4 bytes bodyLen][body JSON]
    const bodyBuf = Buffer.from(req.body, 'utf-8');
    const header = Buffer.alloc(16);
    header.writeUInt32BE(0, 0); // header flag
    header.writeUInt32BE(protoId, 4);
    header.writeUInt32BE(this.seq, 8);
    header.writeUInt32BE(bodyBuf.length, 12);

    this.ws.send(Buffer.concat([header, bodyBuf]));
  }

  private handleMessage(data: WebSocket.Data) {
    try {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as any);

      if (buf.length < 16) return;

      const protoId = buf.readUInt32BE(4);
      const _seq = buf.readUInt32BE(8);
      const bodyLen = buf.readUInt32BE(12);

      if (buf.length < 16 + bodyLen) return;

      const bodyStr = buf.subarray(16, 16 + bodyLen).toString('utf-8');
      const body = JSON.parse(bodyStr);

      switch (protoId) {
        case 1001: { // InitConnect response
          this.status.loggedIn = true;
          this.sendStatus();
          break;
        }
        case 1004: // GetGlobalState response
          break;

        case 3001: // Subscription response
          break;

        case 3002: { // StockUpdate (real-time push) — use adapter
          const update = parseFutuStockUpdate(body);
          if (update.code) {
            this.sendToRenderer('subscribe:data', update);
          }
          break;
        }

        case 5001: { // GetHistoryKLines response — use adapter
          const code = body?.s2c?.security?.code ?? '';
          const klineData = parseFutuKline(body, code);
          this.sendToRenderer('kline:data', { code, data: klineData });
          break;
        }

        case 5003: { // GetMarketSnapshot response — use adapter
          const snapshots = parseFutuSnapshot(body);
          this.sendToRenderer('snapshot:data', snapshots);
          break;
        }

        case 2222: { // OrderList response — use adapter
          const orders = parseFutuOrders(body);
          this.sendToRenderer('order:list', orders);
          break;
        }

        case 2223: { // PositionList response — use adapter
          const positions = parseFutuPositions(body);
          this.sendToRenderer('position:list', positions);
          break;
        }


        case 2221: { // HistoryDealList response
          const deals = parseFutuHistoryDeals(body);
          this.sendToRenderer('history:deals', deals);
          break;
        }

        case 2212: { // PlaceOrder response — use adapter
          const result = parseFutuPlaceOrder(body);
         this.sendToRenderer('order:place:result', result);
         break;
       }

        default:
          // 2225 AccInfo
          if (protoId === 2225) {
            const summary = parseFutuAccountSummary(body, 'futu');
            this.sendToRenderer('account:summary', summary);
          }
          break;
      }
    } catch {
      // ignore parse errors
    }
  }

  requestKline(code: string, subType: SubType, count = 500) {
    // Use adapter to build request body
    const body = buildFutuKlineRequest(code, subType, count);
    this.sendRequest(5001, body);
  }

  requestSnapshot(codes: string[]) {
    // Use adapter to build request body
    const body = buildFutuSnapshotRequest(codes);
    this.sendRequest(5003, body);
  }

  subscribe(code: string, subType: SubType[]) {
    // Use adapter to build request body
    const body = buildFutuSubscribeRequest(code, subType);
    this.sendRequest(3001, body);
  }

  async placeOrder(req: any) {
    // Use adapter to build request body
    const body = buildFutuPlaceOrderRequest(
      req.code, req.side, req.type, req.price, req.quantity,
    );
    this.sendRequest(2212, body);
    return Promise.resolve({ success: true, message: 'Order submitted' });
  }

  cancelOrder(_id: string) {
    // ProtoID 2215 CancelOrder
    this.sendRequest(2215, {
      c2s: { orderID: _id },
    });
    return Promise.resolve({ success: true, message: 'Cancel submitted' });
  }

  getOrders() {
    // ProtoID 2222 OrderList
    this.sendRequest(2222, {
      c2s: { header: { trdEnv: 1, accID: '', trdMarket: 1 } },
    });
    return Promise.resolve([]);
  }

  getPositions() {
    // ProtoID 2223 PositionList
    this.sendRequest(2223, {
      c2s: { header: { trdEnv: 1, accID: '', trdMarket: 1 } },
    });
    return Promise.resolve([]);
  }

  async getAccountSummary() {
    const body = buildFutuAccInfoRequest();
    this.sendRequest(2225, body);
    return Promise.resolve(null);
  }

  modifyOrder(req: any) {
    this.sendRequest(2213, {
      c2s: {
        orderID: req.orderId,
        price: req.price,
        qty: req.quantity,
      },
    });
    return Promise.resolve({ success: true, message: "Modify submitted" });
  }

  getHistoryDeals(startTime?: string, endTime?: string) {
    const body = buildFutuHistoryDealRequest(startTime, endTime);
    this.sendRequest(2221, body);
  }
}

export const gateway = new GatewayClient();
