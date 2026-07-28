import type {
  Fundamentals,
  FinancialIndicators,
  FinancialStatements,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from '../shared/types';
import { getCurrencyFromMarket, getMarketFromCode } from '../shared/types';

interface MockFundamentals {
  peRatio: number;
  pbRatio: number;
  marketCap: number;
  eps: number;
  dividendYield: number;
  revenue: number;
  netIncome: number;
  totalShares: number;
  floatShares: number;
  beta: number;
  high52Week: number;
  low52Week: number;
  sector: string;
  industry: string;
  indicators: FinancialIndicators;
}

// Mock fundamentals data — in production this would query the gateway
const MOCK_FUNDAMENTALS: Record<string, MockFundamentals> = {
  'HK.00700': {
    peRatio: 22.5, pbRatio: 4.8, marketCap: 3460000000000, eps: 16.36, dividendYield: 0.82,
    revenue: 554600000000, netIncome: 115600000000, totalShares: 9400000000, floatShares: 9350000000,
    beta: 0.72, high52Week: 425.2, low52Week: 278.4, sector: '通信服务', industry: '互联网与新媒体',
    indicators: {
      roe: 24.8, roa: 16.2, grossMargin: 53.4, netMargin: 20.9,
      debtToEquity: 0.42, currentRatio: 1.85, quickRatio: 1.72,
      revenueGrowth: 8.4, netIncomeGrowth: 10.2,
      psRatio: 6.25, pcfRatio: 18.3, evEbitda: 14.8,
      bvps: 68.2, cfps: 20.1, sps: 58.9,
    },
  },
  'HK.09988': {
    peRatio: 12.3, pbRatio: 1.2, marketCap: 1620000000000, eps: 6.7, dividendYield: 0.95,
    revenue: 853000000000, netIncome: 132000000000, totalShares: 19700000000, floatShares: 19600000000,
    beta: 1.15, high52Week: 118.2, low52Week: 60.8, sector: '非必需消费品', industry: '电子商务',
    indicators: {
      roe: 10.5, roa: 5.8, grossMargin: 38.2, netMargin: 15.5,
      debtToEquity: 0.35, currentRatio: 1.42, quickRatio: 1.18,
      revenueGrowth: 5.2, netIncomeGrowth: 4.8,
      psRatio: 1.9, pcfRatio: 12.4, evEbitda: 7.2,
      bvps: 70.8, cfps: 6.6, sps: 43.3,
    },
  },
  'US.AAPL': {
    peRatio: 30.2, pbRatio: 45.6, marketCap: 3080000000000, eps: 6.57, dividendYield: 0.52,
    revenue: 383000000000, netIncome: 97000000000, totalShares: 15500000000, floatShares: 15500000000,
    beta: 1.28, high52Week: 199.62, low52Week: 164.08, sector: '信息技术', industry: '消费电子',
    indicators: {
      roe: 156.4, roa: 28.3, grossMargin: 44.1, netMargin: 25.3,
      debtToEquity: 1.95, currentRatio: 0.99, quickRatio: 0.85,
      revenueGrowth: -2.8, netIncomeGrowth: -3.1,
      psRatio: 8.0, pcfRatio: 22.1, evEbitda: 20.5,
      bvps: 4.38, cfps: 7.0, sps: 24.7,
    },
  },
  'US.TSLA': {
    peRatio: 62.8, pbRatio: 12.3, marketCap: 790000000000, eps: 3.95, dividendYield: 0,
    revenue: 96800000000, netIncome: 12600000000, totalShares: 3180000000, floatShares: 3180000000,
    beta: 2.05, high52Week: 299.29, low52Week: 152.37, sector: '非必需消费品', industry: '汽车制造',
    indicators: {
      roe: 21.5, roa: 12.8, grossMargin: 18.2, netMargin: 13.0,
      debtToEquity: 0.18, currentRatio: 1.73, quickRatio: 1.15,
      revenueGrowth: 18.8, netIncomeGrowth: 23.4,
      psRatio: 8.2, pcfRatio: 35.6, evEbitda: 28.4,
      bvps: 19.8, cfps: 4.5, sps: 30.4,
    },
  },
  'US.NVDA': {
    peRatio: 65.3, pbRatio: 52.1, marketCap: 2160000000000, eps: 13.41, dividendYield: 0.02,
    revenue: 60900000000, netIncome: 29800000000, totalShares: 2470000000, floatShares: 2470000000,
    beta: 1.68, high52Week: 902.5, low52Week: 392.3, sector: '信息技术', industry: '半导体',
    indicators: {
      roe: 91.2, roa: 42.5, grossMargin: 73.5, netMargin: 48.9,
      debtToEquity: 0.28, currentRatio: 4.15, quickRatio: 3.82,
      revenueGrowth: 125.9, netIncomeGrowth: 168.2,
      psRatio: 35.5, pcfRatio: 48.3, evEbitda: 42.8,
      bvps: 14.2, cfps: 15.6, sps: 24.7,
    },
  },
  'SH.600519': {
    peRatio: 32.1, pbRatio: 11.5, marketCap: 2167000000000, eps: 53.75, dividendYield: 1.52,
    revenue: 127600000000, netIncome: 62700000000, totalShares: 1256000000, floatShares: 1256000000,
    beta: 0.85, high52Week: 1888.0, low52Week: 1525.0, sector: '日常消费品', industry: '白酒',
    indicators: {
      roe: 32.8, roa: 24.5, grossMargin: 91.5, netMargin: 49.1,
      debtToEquity: 0.25, currentRatio: 4.82, quickRatio: 3.95,
      revenueGrowth: 12.5, netIncomeGrowth: 13.2,
      psRatio: 16.98, pcfRatio: 28.5, evEbitda: 22.4,
      bvps: 149.2, cfps: 47.8, sps: 101.6,
    },
  },
};

const DEFAULT_INDICATORS: FinancialIndicators = {
  roe: 12, roa: 6, grossMargin: 30, netMargin: 10,
  debtToEquity: 0.5, currentRatio: 1.5, quickRatio: 1.2,
  revenueGrowth: 5, netIncomeGrowth: 5,
  psRatio: 3, pcfRatio: 15, evEbitda: 10,
  bvps: 10, cfps: 2, sps: 5,
};

export function generateFundamentals(code: string): Fundamentals {
  const mock = MOCK_FUNDAMENTALS[code];

  return {
    code,
    name: code,
    market: getMarketFromCode(code),
    peRatio: mock?.peRatio ?? 15,
    pbRatio: mock?.pbRatio ?? 2,
    marketCap: mock?.marketCap ?? 500000000000,
    eps: mock?.eps ?? 5,
    dividendYield: mock?.dividendYield ?? 1.5,
    revenue: mock?.revenue ?? 200000000000,
    netIncome: mock?.netIncome ?? 30000000000,
    totalShares: mock?.totalShares ?? 10000000000,
    floatShares: mock?.floatShares ?? 9900000000,
    beta: mock?.beta ?? 1,
    high52Week: mock?.high52Week ?? 200,
    low52Week: mock?.low52Week ?? 100,
    sector: mock?.sector ?? '未知',
    industry: mock?.industry ?? '未知',
    description: '',
    updateTime: Date.now(),
    indicators: mock?.indicators ?? DEFAULT_INDICATORS,
  };
}

// ===== Financial Statements =====

const QUARTER_ENDS = ['03-31', '06-30', '09-30', '12-31'];

/** Deterministic pseudo-random based on code+seed so mock data is stable per symbol */
function hashSeed(code: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return h;
}

function jitter(code: string, idx: number, spread: number): number {
  const v = hashSeed(code, idx + 1) / 0xffffffff; // 0..1
  return 1 + (v - 0.5) * spread; // e.g. spread=0.3 -> 0.85..1.15
}

export function generateFinancialStatements(code: string): FinancialStatements {
  const market = getMarketFromCode(code);
  const currency = getCurrencyFromMarket(market);
  const base = MOCK_FUNDAMENTALS[code];
  const annualRevenue = base?.revenue ?? 200000000000;
  const totalAssets = (base?.marketCap ?? 500000000000) / (base?.pbRatio ?? 2);
  const totalLiabilities = totalAssets * 0.3;
  const totalEquity = totalAssets - totalLiabilities;

  const income: IncomeStatement[] = [];
  const balanceSheet: BalanceSheet[] = [];
  const cashFlow: CashFlowStatement[] = [];

  const year = 2025;
  // Generate 8 quarters: from Q1(prev-1) to Q4(current)
  for (let i = 7; i >= 0; i--) {
    const qIdx = (4 - i + 3) % 4; // 0..3 quarter index
    const yr = i > 3 ? year - 2 : i > 0 ? year - 1 : year;
    const endDate = `${yr}-${QUARTER_ENDS[qIdx]}`;
    const j = jitter(code, i, 0.25);
    const qRev = (annualRevenue / 4) * j;
    const qCost = qRev * (1 - (base?.indicators.grossMargin ?? 30) / 100);
    const qGross = qRev - qCost;
    const qOpEx = qRev * 0.15;
    const qOp = qGross - qOpEx;
    const qNet = qRev * ((base?.indicators.netMargin ?? 10) / 100) * j;
    const qEps = (base?.eps ?? 5) / 4 * j;
    const qEbitda = qOp * 1.2;
    income.push({
      period: 'quarter', endDate, revenue: Math.round(qRev),
      costOfRevenue: Math.round(qCost), grossProfit: Math.round(qGross),
      operatingExpenses: Math.round(qOpEx), operatingIncome: Math.round(qOp),
      netIncome: Math.round(qNet), eps: +qEps.toFixed(2), ebitda: Math.round(qEbitda),
    });

    const bsJ = jitter(code, i + 100, 0.1);
    balanceSheet.push({
      period: 'quarter', endDate,
      totalAssets: Math.round(totalAssets * bsJ),
      totalLiabilities: Math.round(totalLiabilities * bsJ),
      totalEquity: Math.round(totalEquity * bsJ),
      currentAssets: Math.round(totalAssets * 0.4 * bsJ),
      currentLiabilities: Math.round(totalLiabilities * 0.5 * bsJ),
      cash: Math.round(totalAssets * 0.15 * bsJ),
      longTermDebt: Math.round(totalLiabilities * 0.3 * bsJ),
      retainedEarnings: Math.round(totalEquity * 0.6 * bsJ),
    });

    const ocf = qNet * 1.3;
    const capex = qRev * 0.05;
    const fcf = ocf - capex;
    const icf = -capex * 1.1;
    const finCf = -qNet * 0.2;
    cashFlow.push({
      period: 'quarter', endDate,
      operatingCashFlow: Math.round(ocf),
      investingCashFlow: Math.round(icf),
      financingCashFlow: Math.round(finCf),
      freeCashFlow: Math.round(fcf),
      capitalExpenditure: Math.round(capex),
      dividendsPaid: Math.round(qNet * (base?.dividendYield ?? 1) * 0.5),
    });
  }

  // ===== Generate annual data by aggregating quarters =====
  const annualIncome: Record<string, IncomeStatement> = {};
  const annualBS: Record<string, BalanceSheet> = {};
  const annualCF: Record<string, CashFlowStatement> = {};

  for (const q of income) {
    const yr = q.endDate.slice(0, 4);
    const a = annualIncome[yr];
    if (a) {
      a.revenue += q.revenue; a.costOfRevenue += q.costOfRevenue;
      a.grossProfit += q.grossProfit; a.operatingExpenses += q.operatingExpenses;
      a.operatingIncome += q.operatingIncome; a.netIncome += q.netIncome;
      a.ebitda += q.ebitda; a.eps = +(a.eps + q.eps).toFixed(2);
    } else {
      annualIncome[yr] = { period: 'annual', endDate: `${yr}-12-31`,
        revenue: q.revenue, costOfRevenue: q.costOfRevenue, grossProfit: q.grossProfit,
        operatingExpenses: q.operatingExpenses, operatingIncome: q.operatingIncome,
        netIncome: q.netIncome, eps: q.eps, ebitda: q.ebitda,
      };
    }
  }
  // Balance sheet: take latest quarter of each year as snapshot
  for (const q of balanceSheet) {
    const yr = q.endDate.slice(0, 4);
    annualBS[yr] = { ...q, period: 'annual', endDate: `${yr}-12-31` };
  }
  // Cash flow: sum quarters per year
  for (const q of cashFlow) {
    const yr = q.endDate.slice(0, 4);
    const a = annualCF[yr];
    if (a) {
      a.operatingCashFlow += q.operatingCashFlow; a.investingCashFlow += q.investingCashFlow;
      a.financingCashFlow += q.financingCashFlow; a.freeCashFlow += q.freeCashFlow;
      a.capitalExpenditure += q.capitalExpenditure; a.dividendsPaid += q.dividendsPaid;
    } else {
      annualCF[yr] = { period: 'annual', endDate: `${yr}-12-31`,
        operatingCashFlow: q.operatingCashFlow, investingCashFlow: q.investingCashFlow,
        financingCashFlow: q.financingCashFlow, freeCashFlow: q.freeCashFlow,
        capitalExpenditure: q.capitalExpenditure, dividendsPaid: q.dividendsPaid,
      };
    }
  }

  // Append annual entries (sorted by year ascending)
  const years = Object.keys(annualIncome).sort();
  for (const yr of years) {
    if (annualIncome[yr]) income.push(annualIncome[yr]);
    if (annualBS[yr]) balanceSheet.push(annualBS[yr]);
    if (annualCF[yr]) cashFlow.push(annualCF[yr]);
  }

  return {
    code, currency, income, balanceSheet, cashFlow, updateTime: Date.now(),
  };
}
