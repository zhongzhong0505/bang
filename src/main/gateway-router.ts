import { gateway as futuGateway } from './gateway';
import { TigerGatewayClient } from './tiger-gateway';
import type { GatewayConfig, GatewayStatus, SubType } from '../shared/types';
import { BrowserWindow } from 'electron';

const tigerGateway = new TigerGatewayClient();

let activeProvider: 'futu' | 'tiger' = 'futu';

export function setGatewayWindow(win: BrowserWindow) {
  futuGateway.setWindow(win);
  tigerGateway.setWindow(win);
}

export function connectGateway(config: GatewayConfig) {
  activeProvider = config.provider;
  if (config.provider === 'futu') {
    futuGateway.connect(config);
  } else {
    tigerGateway.connect(config);
  }
}

export function disconnectGateway() {
  futuGateway.disconnect();
  tigerGateway.disconnect();
}

export function getGatewayStatus(): GatewayStatus {
  if (activeProvider === 'tiger') {
    return tigerGateway.getStatus();
  }
  return futuGateway.getStatus();
}

export function requestKline(code: string, subType: SubType, count?: number) {
  if (activeProvider === 'tiger') {
    tigerGateway.requestKline(code, subType, count);
  } else {
    futuGateway.requestKline(code, subType, count);
  }
}

export function requestSnapshot(codes: string[]) {
  if (activeProvider === 'tiger') {
    tigerGateway.requestSnapshot(codes);
  } else {
    futuGateway.requestSnapshot(codes);
  }
}

export function subscribe(code: string, subTypes: SubType[]) {
  if (activeProvider === 'tiger') {
    tigerGateway.subscribe(code, subTypes);
  } else {
    futuGateway.subscribe(code, subTypes);
  }
}

export function placeOrder(req: any) {
  if (activeProvider === 'tiger') {
    return tigerGateway.placeOrder(req);
  }
  return futuGateway.placeOrder(req);
}

export function cancelOrder(id: string) {
  if (activeProvider === 'tiger') {
    return tigerGateway.cancelOrder(id);
  }
  return futuGateway.cancelOrder(id);
}

export function getOrders() {
  if (activeProvider === 'tiger') {
    return tigerGateway.getOrders();
  }
  return futuGateway.getOrders();
}

export function getPositions() {
  if (activeProvider === 'tiger') {
    return tigerGateway.getPositions();
  }
  return futuGateway.getPositions();
}

export function getAccountSummary() {
  if (activeProvider === 'tiger') {
    return tigerGateway.getAccountSummary();
  }
  return futuGateway.getAccountSummary();
}

export function modifyGatewayOrder(req: any) {
  if (activeProvider === 'tiger') {
    return tigerGateway.modifyOrder(req);
  }
  return futuGateway.modifyOrder(req);
}

export function getHistoryDeals(startTime?: string, endTime?: string) {
  if (activeProvider === 'tiger') {
    return tigerGateway.getHistoryDeals(
      startTime ? Math.floor(new Date(startTime).getTime() / 1000) : undefined,
      endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined,
    );
  }
  return futuGateway.getHistoryDeals(startTime, endTime);
}
