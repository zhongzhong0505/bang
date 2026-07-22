import type { KlineData, StockSnapshot, Position, OrderRecord } from '../../shared/types';

const STOCK_PRICES: Record<string, number> = {
  'HK.00700': 380, 'HK.09988': 85, 'HK.03690': 155,
  'US.AAPL': 195, 'US.TSLA': 245, 'US.NVDA': 125,
  'SH.600519': 1520, 'SZ.000858': 145,
};

export { STOCK_PRICES };

export function generateMockKline(count: number, basePrice = 350): KlineData[] {
  const data: KlineData[] = [];
  let price = basePrice;
  const now = Date.now();
  const interval = 60 * 1000; // 1 minute default
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * interval;
    const volatility = 0.008;
    const change = price * volatility * (Math.random() - 0.48);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    const volume = Math.floor(50000 + Math.random() * 200000);
    const turnover = volume * ((open + close) / 2);
    price = close;
    data.push({ time: Math.floor(time / 1000), open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume, turnover: +turnover.toFixed(2) });
  }
  return data;
}

// Generate mock K-line data with proper interval based on subType
export function generateMockKlineBySubType(count: number, basePrice: number, subType: string): KlineData[] {
  const intervalSec = subType === '1' ? 60
    : subType === '5' ? 300
    : subType === '15' ? 900
    : subType === '30' ? 1800
    : subType === '60' ? 3600
    : subType === 'DAY' ? 86400
    : subType === 'WEEK' ? 604800
    : subType === 'MONTH' ? 2592000
    : 60;
  const data: KlineData[] = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * intervalSec;
    const volatility = 0.008;
    const change = price * volatility * (Math.random() - 0.48);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random();
    const low = Math.min(open, close) - Math.abs(change) * Math.random();
    const volume = Math.floor(50000 + Math.random() * 200000);
    const turnover = volume * ((open + close) / 2);
    price = close;
    data.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume, turnover: +turnover.toFixed(2) });
  }
  return data;
}

export function generateMockSnapshot(code: string): StockSnapshot {
  const base = STOCK_PRICES[code] ?? 100;
  const change = base * (Math.random() - 0.48) * 0.03;
  const curPrice = +(base + change).toFixed(2);
  const prevClose = +base.toFixed(2);
  return {
    code, name: '', curPrice,
    changeVal: +(curPrice - prevClose).toFixed(2),
    changeRate: +((curPrice - prevClose) / prevClose * 100).toFixed(2),
    volume: Math.floor(1000000 + Math.random() * 5000000),
    turnover: Math.floor(5e8 + Math.random() * 2e9),
    high: +(curPrice + Math.abs(change) * 1.5).toFixed(2),
    low: +(curPrice - Math.abs(change) * 1.2).toFixed(2),
    open: +(prevClose + change * 0.3).toFixed(2),
    prevClose,
  };
}

export function generateMockPositions(): Position[] {
  return [
    { code: 'HK.00700', name: '腾讯控股', qty: 200, avgPrice: 355.2, marketPrice: 380.4, pnl: 5040, pnlRatio: 7.09 },
    { code: 'US.AAPL', name: 'Apple Inc', qty: 50, avgPrice: 182.5, marketPrice: 195.0, pnl: 625, pnlRatio: 6.85 },
    { code: 'SH.600519', name: '贵州茅台', qty: 10, avgPrice: 1580, marketPrice: 1520, pnl: -600, pnlRatio: -3.8 },
  ];
}

export function generateMockOrders(): OrderRecord[] {
  return [
    { id: 'ORD001', code: 'HK.00700', name: '腾讯控股', side: 'BUY', type: 'LIMIT', price: 378.0, qty: 100, filledQty: 100, status: 'FILLED', time: Date.now() - 3600000 },
    { id: 'ORD002', code: 'US.TSLA', name: 'Tesla Inc', side: 'BUY', type: 'LIMIT', price: 240.0, qty: 30, filledQty: 0, status: 'PENDING', time: Date.now() - 600000 },
    { id: 'ORD003', code: 'HK.09988', name: '阿里巴巴-W', side: 'SELL', type: 'MARKET', price: 0, qty: 500, filledQty: 500, status: 'FILLED', time: Date.now() - 7200000 },
  ];
}
