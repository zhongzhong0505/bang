import type { ScreenerFilter, ScreenerResult, Market } from '../shared/types';

// Mock data for screener — in production this would query the gateway
const MOCK_STOCKS: ScreenerResult[] = [
  { code: 'HK.00700', name: '腾讯控股', market: 'HK', price: 368.2, changeRate: 1.23, volume: 18500000, turnover: 6812000000, peRatio: 22.5, marketCap: 3460000000000 },
  { code: 'HK.09988', name: '阿里巴巴-W', market: 'HK', price: 82.35, changeRate: -0.67, volume: 22000000, turnover: 1812000000, peRatio: 12.3, marketCap: 1620000000000 },
  { code: 'HK.03690', name: '美团-W', market: 'HK', price: 132.8, changeRate: 2.15, volume: 15000000, turnover: 1992000000, peRatio: 35.6, marketCap: 820000000000 },
  { code: 'HK.09888', name: '百度集团-SW', market: 'HK', price: 89.5, changeRate: 0.89, volume: 5200000, turnover: 465400000, peRatio: 18.2, marketCap: 248000000000 },
  { code: 'HK.01810', name: '小米集团-W', market: 'HK', price: 22.45, changeRate: 3.42, volume: 48000000, turnover: 1077600000, peRatio: 25.1, marketCap: 562000000000 },
  { code: 'HK.02318', name: '中国平安', market: 'HK', price: 38.2, changeRate: -1.15, volume: 32000000, turnover: 1222400000, peRatio: 8.9, marketCap: 695000000000 },
  { code: 'HK.00005', name: '汇丰控股', market: 'HK', price: 62.5, changeRate: 0.32, volume: 12000000, turnover: 750000000, peRatio: 11.7, marketCap: 1280000000000 },
  { code: 'US.AAPL', name: 'Apple Inc', market: 'US', price: 198.5, changeRate: 1.56, volume: 52000000, turnover: 10322000000, peRatio: 30.2, marketCap: 3080000000000 },
  { code: 'US.TSLA', name: 'Tesla Inc', market: 'US', price: 248.3, changeRate: -2.34, volume: 85000000, turnover: 21106000000, peRatio: 62.8, marketCap: 790000000000 },
  { code: 'US.NVDA', name: 'NVIDIA Corp', market: 'US', price: 875.6, changeRate: 4.12, volume: 42000000, turnover: 36775000000, peRatio: 65.3, marketCap: 2160000000000 },
  { code: 'US.MSFT', name: 'Microsoft Corp', market: 'US', price: 425.8, changeRate: 0.78, volume: 22000000, turnover: 9368000000, peRatio: 35.1, marketCap: 3160000000000 },
  { code: 'US.GOOG', name: 'Alphabet Inc', market: 'US', price: 178.2, changeRate: 1.05, volume: 28000000, turnover: 4990000000, peRatio: 24.8, marketCap: 2200000000000 },
  { code: 'US.AMZN', name: 'Amazon.com Inc', market: 'US', price: 185.6, changeRate: 1.89, volume: 35000000, turnover: 6496000000, peRatio: 58.9, marketCap: 1920000000000 },
  { code: 'US.META', name: 'Meta Platforms', market: 'US', price: 502.3, changeRate: 2.45, volume: 18000000, turnover: 9041000000, peRatio: 27.4, marketCap: 1280000000000 },
  { code: 'SH.600519', name: '贵州茅台', market: 'SH', price: 1725.0, changeRate: 0.56, volume: 3500000, turnover: 6037500000, peRatio: 32.1, marketCap: 2167000000000 },
  { code: 'SZ.000858', name: '五粮液', market: 'SZ', price: 152.8, changeRate: -0.89, volume: 8500000, turnover: 1298800000, peRatio: 21.5, marketCap: 592000000000 },
  { code: 'SH.601318', name: '中国平安', market: 'SH', price: 45.6, changeRate: 0.34, volume: 55000000, turnover: 2508000000, peRatio: 9.2, marketCap: 832000000000 },
  { code: 'SH.600036', name: '招商银行', market: 'SH', price: 35.2, changeRate: -0.45, volume: 42000000, turnover: 1478400000, peRatio: 6.8, marketCap: 887000000000 },
  { code: 'SZ.000001', name: '平安银行', market: 'SZ', price: 11.8, changeRate: 0.68, volume: 68000000, turnover: 802400000, peRatio: 5.9, marketCap: 229000000000 },
  { code: 'SH.601398', name: '工商银行', market: 'SH', price: 5.42, changeRate: 0.18, volume: 120000000, turnover: 650400000, peRatio: 5.2, marketCap: 1928000000000 },
];

export function generateScreenerResults(filter: ScreenerFilter): ScreenerResult[] {
  let results = [...MOCK_STOCKS];

  if (filter.market !== 'ALL') {
    results = results.filter((r) => r.market === filter.market);
  }
  if (filter.minPrice > 0) {
    results = results.filter((r) => r.price >= filter.minPrice);
  }
  if (filter.maxPrice > 0) {
    results = results.filter((r) => r.price <= filter.maxPrice);
  }
  if (filter.minChangeRate !== 0) {
    results = results.filter((r) => r.changeRate >= filter.minChangeRate);
  }
  if (filter.maxChangeRate !== 0) {
    results = results.filter((r) => r.changeRate <= filter.maxChangeRate);
  }
  if (filter.minVolume > 0) {
    results = results.filter((r) => r.volume >= filter.minVolume);
  }
  if (filter.minTurnover > 0) {
    results = results.filter((r) => r.turnover >= filter.minTurnover);
  }

  const sortKey = filter.sortBy as keyof ScreenerResult;
  results.sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return filter.sortDir === 'asc' ? va - vb : vb - va;
  });

  return results;
}
