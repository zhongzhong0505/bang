import type { Fundamentals, Market } from '../shared/types';

// Mock fundamentals data — in production this would query the gateway
const MOCK_FUNDAMENTALS: Record<string, Partial<Fundamentals>> = {
  'HK.00700': { peRatio: 22.5, pbRatio: 4.8, marketCap: 3460000000000, eps: 16.36, dividendYield: 0.82, revenue: 554600000000, netIncome: 115600000000, totalShares: 9400000000, floatShares: 9350000000, beta: 0.72, high52Week: 425.2, low52Week: 278.4, sector: '通信服务', industry: '互联网与新媒体' },
  'HK.09988': { peRatio: 12.3, pbRatio: 1.2, marketCap: 1620000000000, eps: 6.7, dividendYield: 0.95, revenue: 853000000000, netIncome: 132000000000, totalShares: 19700000000, floatShares: 19600000000, beta: 1.15, high52Week: 118.2, low52Week: 60.8, sector: '非必需消费品', industry: '电子商务' },
  'US.AAPL': { peRatio: 30.2, pbRatio: 45.6, marketCap: 3080000000000, eps: 6.57, dividendYield: 0.52, revenue: 383000000000, netIncome: 97000000000, totalShares: 15500000000, floatShares: 15500000000, beta: 1.28, high52Week: 199.62, low52Week: 164.08, sector: '信息技术', industry: '消费电子' },
  'US.TSLA': { peRatio: 62.8, pbRatio: 12.3, marketCap: 790000000000, eps: 3.95, dividendYield: 0, revenue: 96800000000, netIncome: 12600000000, totalShares: 3180000000, floatShares: 3180000000, beta: 2.05, high52Week: 299.29, low52Week: 152.37, sector: '非必需消费品', industry: '汽车制造' },
  'US.NVDA': { peRatio: 65.3, pbRatio: 52.1, marketCap: 2160000000000, eps: 13.41, dividendYield: 0.02, revenue: 60900000000, netIncome: 29800000000, totalShares: 2470000000, floatShares: 2470000000, beta: 1.68, high52Week: 902.5, low52Week: 392.3, sector: '信息技术', industry: '半导体' },
  'SH.600519': { peRatio: 32.1, pbRatio: 11.5, marketCap: 2167000000000, eps: 53.75, dividendYield: 1.52, revenue: 127600000000, netIncome: 62700000000, totalShares: 1256000000, floatShares: 1256000000, beta: 0.85, high52Week: 1888.0, low52Week: 1525.0, sector: '日常消费品', industry: '白酒' },
};

function getMarketFromCode(code: string): Market {
  if (code.startsWith('HK.')) return 'HK';
  if (code.startsWith('US.')) return 'US';
  if (code.startsWith('SH.')) return 'SH';
  if (code.startsWith('SZ.')) return 'SZ';
  return 'HK';
}

export function generateFundamentals(code: string): Fundamentals {
  const mock = MOCK_FUNDAMENTALS[code] ?? {
    peRatio: 15, pbRatio: 2, marketCap: 500000000000, eps: 5, dividendYield: 1.5,
    revenue: 200000000000, netIncome: 30000000000, totalShares: 10000000000,
    floatShares: 9900000000, beta: 1, high52Week: 200, low52Week: 100,
    sector: '未知', industry: '未知',
  };

  return {
    code,
    name: code,
    market: getMarketFromCode(code),
    peRatio: mock.peRatio ?? 0,
    pbRatio: mock.pbRatio ?? 0,
    marketCap: mock.marketCap ?? 0,
    eps: mock.eps ?? 0,
    dividendYield: mock.dividendYield ?? 0,
    revenue: mock.revenue ?? 0,
    netIncome: mock.netIncome ?? 0,
    totalShares: mock.totalShares ?? 0,
    floatShares: mock.floatShares ?? 0,
    beta: mock.beta ?? 1,
    high52Week: mock.high52Week ?? 0,
    low52Week: mock.low52Week ?? 0,
    sector: mock.sector ?? '',
    industry: mock.industry ?? '',
    description: '',
    updateTime: Date.now(),
  };
}
