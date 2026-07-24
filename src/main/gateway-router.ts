import { gateway as futuGateway } from './gateway';
import { TigerGatewayClient } from './tiger-gateway';
import { LocalMockGatewayClient } from './local-mock-gateway';
import type { GatewayConfig, GatewayStatus, SubType, SymbolSearchResult, StockSnapshot, KlineData, LocalGatewayConfig } from '../shared/types';
import { BrowserWindow } from 'electron';

const tigerGateway = new TigerGatewayClient();
const localGateway = new LocalMockGatewayClient();

let activeProvider: 'futu' | 'tiger' | 'local' = 'futu';

export function setGatewayWindow(win: BrowserWindow) {
  futuGateway.setWindow(win);
  tigerGateway.setWindow(win);
  localGateway.setWindow(win);
}

export function connectGateway(config: GatewayConfig) {
  // Disconnect all gateways first to stop reconnect loops from the
  // previously active provider. Without this, a stale Futu/Tiger
  // reconnect timer would keep pushing {connected:false} status
  // updates to the renderer, overriding the new provider's state.
  futuGateway.disconnect();
  tigerGateway.disconnect();
  localGateway.disconnect();

  activeProvider = config.provider;
  if (config.provider === 'local') {
    localGateway.connect(config as LocalGatewayConfig);
  } else if (config.provider === 'tiger') {
    tigerGateway.connect(config);
  } else {
    futuGateway.connect(config);
  }
}

export function disconnectGateway() {
  futuGateway.disconnect();
  tigerGateway.disconnect();
  localGateway.disconnect();
}

export function getGatewayStatus(): GatewayStatus {
  if (activeProvider === 'local') {
    return localGateway.getStatus();
  } else if (activeProvider === 'tiger') {
    return tigerGateway.getStatus();
  }
  return futuGateway.getStatus();
}

export function requestKline(code: string, subType: SubType, count?: number): Promise<KlineData[]> {
  if (activeProvider === 'local') {
    return localGateway.requestKline(code, subType, count);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.requestKline(code, subType, count);
  }
  futuGateway.requestKline(code, subType, count);
  return Promise.resolve([]);
}

export function requestSnapshot(codes: string[]): Promise<StockSnapshot[]> {
  if (activeProvider === 'local') {
    return localGateway.requestSnapshot(codes);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.requestSnapshot(codes);
  }
  futuGateway.requestSnapshot(codes);
  return Promise.resolve([]);
}

export function subscribe(code: string, subTypes: SubType[]) {
  if (activeProvider === 'local') {
    localGateway.subscribe(code, subTypes);
  } else if (activeProvider === 'tiger') {
    tigerGateway.subscribe(code, subTypes);
  } else {
    futuGateway.subscribe(code, subTypes);
  }
}

export function placeOrder(req: any) {
  if (activeProvider === 'local') {
    return localGateway.placeOrder(req);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.placeOrder(req);
  }
  return futuGateway.placeOrder(req);
}

export function cancelOrder(id: string) {
  if (activeProvider === 'local') {
    return localGateway.cancelOrder(id);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.cancelOrder(id);
  }
  return futuGateway.cancelOrder(id);
}

export function getOrders() {
  if (activeProvider === 'local') {
    return localGateway.getOrders();
  } else if (activeProvider === 'tiger') {
    return tigerGateway.getOrders();
  }
  return futuGateway.getOrders();
}

export function getPositions() {
  if (activeProvider === 'local') {
    return localGateway.getPositions();
  } else if (activeProvider === 'tiger') {
    return tigerGateway.getPositions();
  }
  return futuGateway.getPositions();
}

export function getAccountSummary() {
  if (activeProvider === 'local') {
    return localGateway.getAccountSummary();
  } else if (activeProvider === 'tiger') {
    return tigerGateway.getAccountSummary();
  }
  return futuGateway.getAccountSummary();
}

export function modifyGatewayOrder(req: any) {
  if (activeProvider === 'local') {
    return localGateway.modifyOrder(req);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.modifyOrder(req);
  }
  return futuGateway.modifyOrder(req);
}

export function getHistoryDeals(startTime?: string, endTime?: string) {
  if (activeProvider === 'local') {
    return localGateway.getHistoryDeals(
      startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined,
      endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined,
    );
  } else if (activeProvider === 'tiger') {
    return tigerGateway.getHistoryDeals(
      startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined,
      endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined,
    );
  }
  return futuGateway.getHistoryDeals(startTime, endTime);
}

export function searchStock(keyword: string): Promise<SymbolSearchResult[]> {
  if (activeProvider === 'local') {
    return localGateway.searchStock(keyword);
  } else if (activeProvider === 'tiger') {
    return tigerGateway.searchStock(keyword);
  }
  return futuGateway.searchStock(keyword);
}
