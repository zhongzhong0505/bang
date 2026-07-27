import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import type { Fundamentals, FinancialStatements } from '../../../shared/types';
import './fundamentals.css';
import { useT, useTBatch } from '../../i18n';

type FundTab = 'indicators' | 'income' | 'balance' | 'cashflow' | 'ai';

const formatLarge = (n: number, tr: Record<string, string>) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + tr['winrate.trillion'];
  if (n >= 1e8) return (n / 1e8).toFixed(2) + tr['winrate.billion'];
  if (n >= 1e4) return (n / 1e4).toFixed(2) + tr['winrate.tenThousand'];
  return n.toFixed(2);
};

const fmt = (n: number, digits = 2) => {
  if (!isFinite(n)) return '-';
  return n.toFixed(digits);
};

const fmtPct = (n: number) => {
  if (!isFinite(n)) return '-';
  const sign = n >= 0 ? '' : '';
  return `${sign}${n.toFixed(2)}%`;
};

// Build a comprehensive prompt from financial data for AI analysis
const buildFinancialPrompt = (
  code: string,
  name: string,
  d: Fundamentals,
  fs: FinancialStatements | null,
): string => {
  const ind = d.indicators;
  const fmtN = (n: number, digits = 2) => isFinite(n) ? n.toFixed(digits) : 'N/A';
  const fmtP = (n: number) => isFinite(n) ? n.toFixed(2) + '%' : 'N/A';
  const fmtL = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + '万亿';
    if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
    return n.toFixed(0);
  };

  let prompt = `请作为专业财务分析师，对以下公司的财务数据进行全面分析，给出投资价值评估和风险提示。\n\n`;
  prompt += `## 公司: ${name} (${code})\n`;
  prompt += `### 估值指标\n`;
  prompt += `- 市盈率 PE: ${fmtN(d.peRatio, 1)}\n`;
  prompt += `- 市净率 PB: ${fmtN(d.pbRatio)}\n`;
  prompt += `- 市销率 PS: ${fmtN(ind.psRatio)}\n`;
  prompt += `- 现金流量比率 PCF: ${fmtN(ind.pcfRatio)}\n`;
  prompt += `- EV/EBITDA: ${fmtN(ind.evEbitda)}\n`;
  prompt += `- 股息率: ${fmtP(d.dividendYield)}\n`;
  prompt += `- 总市值: ${fmtL(d.marketCap)}\n`;
  prompt += `- Beta: ${fmtN(d.beta)}\n\n`;
  prompt += `### 盈利能力\n`;
  prompt += `- 每股收益 EPS: ${fmtN(d.eps)}\n`;
  prompt += `- 净资产收益率 ROE: ${fmtP(ind.roe)}\n`;
  prompt += `- 总资产收益率 ROA: ${fmtP(ind.roa)}\n`;
  prompt += `- 毛利率: ${fmtP(ind.grossMargin)}\n`;
  prompt += `- 净利率: ${fmtP(ind.netMargin)}\n\n`;
  prompt += `### 偿债能力\n`;
  prompt += `- 资产负债率: ${fmtN(ind.debtToEquity)}\n`;
  prompt += `- 流动比率: ${fmtN(ind.currentRatio)}\n`;
  prompt += `- 速动比率: ${fmtN(ind.quickRatio)}\n\n`;
  prompt += `### 成长性\n`;
  prompt += `- 营收增长率: ${fmtP(ind.revenueGrowth)}\n`;
  prompt += `- 净利润增长率: ${fmtP(ind.netIncomeGrowth)}\n\n`;
  prompt += `### 每股数据\n`;
  prompt += `- 每股净资产 BVPS: ${fmtN(ind.bvps)}\n`;
  prompt += `- 每股现金流 CFPS: ${fmtN(ind.cfps)}\n`;
  prompt += `- 每股营收 SPS: ${fmtN(ind.sps)}\n\n`;

  if (fs && fs.income.length > 0) {
    const q = fs.income[fs.income.length - 1];
    const prev = fs.income.length > 1 ? fs.income[fs.income.length - 2] : null;
    prompt += `### 最新季度利润表 (${q.endDate})\n`;
    prompt += `- 营收: ${fmtL(q.revenue)}`;
    if (prev) prompt += ` (同比 ${prev.revenue > 0 ? ((q.revenue - prev.revenue) / Math.abs(prev.revenue) * 100).toFixed(1) : 'N/A'}%)`;
    prompt += `\n- 毛利润: ${fmtL(q.grossProfit)}\n`;
    prompt += `- 营业利润: ${fmtL(q.operatingIncome)}\n`;
    prompt += `- 净利润: ${fmtL(q.netIncome)}`;
    if (prev) prompt += ` (同比 ${prev.netIncome > 0 ? ((q.netIncome - prev.netIncome) / Math.abs(prev.netIncome) * 100).toFixed(1) : 'N/A'}%)`;
    prompt += `\n- EBITDA: ${fmtL(q.ebitda)}\n\n`;
  }

  if (fs && fs.balanceSheet.length > 0) {
    const q = fs.balanceSheet[fs.balanceSheet.length - 1];
    prompt += `### 最新资产负债表 (${q.endDate})\n`;
    prompt += `- 总资产: ${fmtL(q.totalAssets)}\n`;
    prompt += `- 总负债: ${fmtL(q.totalLiabilities)}\n`;
    prompt += `- 股东权益: ${fmtL(q.totalEquity)}\n`;
    prompt += `- 现金: ${fmtL(q.cash)}\n`;
    prompt += `- 长期负债: ${fmtL(q.longTermDebt)}\n\n`;
  }

  if (fs && fs.cashFlow.length > 0) {
    const q = fs.cashFlow[fs.cashFlow.length - 1];
    prompt += `### 最新现金流量表 (${q.endDate})\n`;
    prompt += `- 经营现金流: ${fmtL(q.operatingCashFlow)}\n`;
    prompt += `- 投资现金流: ${fmtL(q.investingCashFlow)}\n`;
    prompt += `- 筹资现金流: ${fmtL(q.financingCashFlow)}\n`;
    prompt += `- 自由现金流: ${fmtL(q.freeCashFlow)}\n\n`;
  }

  prompt += `请从以下几个方面进行分析：\n`;
  prompt += `1. 估值水平是否合理（结合 PE/PB/PS/EV-EBITDA 与行业常识）\n`;
  prompt += `2. 盈利能力评价（ROE/ROA/毛利率/净利率趋势）\n`;
  prompt += `3. 偿债风险（资产负债率/流动比率/速动比率）\n`;
  prompt += `4. 成长性分析（营收/利润增长趋势）\n`;
  prompt += `5. 现金流质量（经营现金流是否覆盖净利润，自由现金流是否为正）\n`;
  prompt += `6. 综合投资建议和风险提示\n\n`;
  prompt += `请用中文回答，语言简洁专业。`;
  return prompt;
};

// Indicator row component with color-coding for growth values
const IndRow: React.FC<{ label: string; value: string; growth?: boolean }> = ({ label, value, growth }) => {
  const cls = growth && value !== '-'
    ? parseFloat(value) >= 0 ? 'fund-growth-pos' : 'fund-growth-neg'
    : undefined;
  return (
    <div className="fundamentals-item">
      <span className="fundamentals-label">{label}</span>
      <span className={`fundamentals-value${cls ? ' ' + cls : ''}`}>{value}</span>
    </div>
  );
};

const FundamentalsPanel: React.FC = () => {
  const toggleFundamentals = useStore((s) => s.toggleFundamentals);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const fundamentalsData = useStore((s) => s.fundamentalsData);
  const setFundamentalsData = useStore((s) => s.setFundamentalsData);
  const financialStatements = useStore((s) => s.financialStatements);
  const setFinancialStatements = useStore((s) => s.setFinancialStatements);

  const [tab, setTab] = useState<FundTab>('indicators');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const unsubAIRef = useRef<(() => void) | null>(null);
  const aiAbortedRef = useRef(false);

  const tr = useTBatch([
    'fund.title', 'fund.valuation', 'fund.pe', 'fund.pb', 'fund.ps', 'fund.pcf',
    'fund.evEbitda', 'fund.dividendYield', 'fund.marketCap', 'fund.beta',
    'fund.profitability', 'fund.eps', 'fund.roe', 'fund.roa', 'fund.grossMargin', 'fund.netMargin',
    'fund.solvency', 'fund.debtToEquity', 'fund.currentRatio', 'fund.quickRatio',
    'fund.growth', 'fund.revenueGrowth', 'fund.netIncomeGrowth',
    'fund.perShare', 'fund.bvps', 'fund.cfps', 'fund.sps',
    'fund.financials', 'fund.revenue', 'fund.netIncome', 'fund.totalShares', 'fund.floatShares',
    'fund.priceRange', 'fund.high52', 'fund.low52', 'fund.industry', 'fund.sector',
    'fund.loading', 'fund.tab.indicators', 'fund.tab.income', 'fund.tab.balance', 'fund.tab.cashflow',
    'fund.tab.ai', 'fund.ai.analyze', 'fund.ai.regenerate', 'fund.ai.loading',
    'fund.ai.error', 'fund.ai.noData', 'fund.ai.thinking',
    'fund.income.revenue', 'fund.income.costRevenue', 'fund.income.grossProfit',
    'fund.income.operExp', 'fund.income.operIncome', 'fund.income.netIncome',
    'fund.income.eps', 'fund.income.ebitda',
    'fund.bs.totalAssets', 'fund.bs.totalLiab', 'fund.bs.totalEquity',
    'fund.bs.currentAssets', 'fund.bs.currentLiab', 'fund.bs.cash',
    'fund.bs.longTermDebt', 'fund.bs.retainedEarnings',
    'fund.cf.operCashFlow', 'fund.cf.investCashFlow', 'fund.cf.finCashFlow',
    'fund.cf.freeCashFlow', 'fund.cf.capex', 'fund.cf.dividendsPaid',
    'fund.period', 'fund.endDate',
    'winrate.trillion', 'winrate.billion', 'winrate.tenThousand',
    'ai.notConfigured',
  ]);

  // Cleanup AI stream listener on unmount
  useEffect(() => {
    return () => { unsubAIRef.current?.(); };
  }, []);

  useEffect(() => {
    const api = window.bangAPI as any;
    if (!api?.getFundamentals) return;
    api.getFundamentals(currentCode).then((data: Fundamentals | null) => {
      if (data) setFundamentalsData(data);
    }).catch(() => {});
  }, [currentCode, setFundamentalsData]);

  useEffect(() => {
    const api = window.bangAPI as any;
    if (!api?.getFinancialStatements) return;
    api.getFinancialStatements(currentCode).then((data: FinancialStatements | null) => {
      if (data) setFinancialStatements(data);
    }).catch(() => {});
  }, [currentCode, setFinancialStatements]);

  const d = fundamentalsData;
  const fs = financialStatements;

  const runAIAnalysis = useCallback(() => {
    if (!d || aiLoading) return;
    const api = window.bangAPI as any;
    if (!api?.aiChat) {
      setAiError(tr['ai.notConfigured']);
      return;
    }

    setAiAnalysis('');
    setAiError('');
    setAiLoading(true);
    aiAbortedRef.current = false;

    const prompt = buildFinancialPrompt(currentCode, currentName, d, fs);
    const messages = [{ role: 'user', content: prompt }];

    unsubAIRef.current?.();
    unsubAIRef.current = api.onAIStreamChunk((data: any) => {
      if (aiAbortedRef.current) return;
      if (data.done) {
        setAiLoading(false);
        unsubAIRef.current?.();
        unsubAIRef.current = null;
      } else if (data.delta) {
        setAiAnalysis((prev) => prev + data.delta);
      }
    });

    api.aiChat(messages)
      .then((result: any) => {
        if (aiAbortedRef.current) return;
        if (!result.success) {
          setAiError(tr['fund.ai.error'].replace('{error}', result.error));
        }
        setAiLoading(false);
        unsubAIRef.current?.();
        unsubAIRef.current = null;
      })
      .catch((err: any) => {
        if (aiAbortedRef.current) return;
        setAiError(tr['fund.ai.error'].replace('{error}', err.message));
        setAiLoading(false);
        unsubAIRef.current?.();
        unsubAIRef.current = null;
      });
  }, [d, fs, aiLoading, currentCode, currentName, tr]);

  const renderIndicators = () => {
    if (!d) return null;
    const ind = d.indicators;
    return (
      <>
        {/* Valuation */}
        <div className="fundamentals-section">{tr['fund.valuation']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.pe']} value={fmt(d.peRatio, 1)} />
          <IndRow label={tr['fund.pb']} value={fmt(d.pbRatio)} />
          <IndRow label={tr['fund.ps']} value={fmt(ind.psRatio)} />
          <IndRow label={tr['fund.pcf']} value={fmt(ind.pcfRatio)} />
          <IndRow label={tr['fund.evEbitda']} value={fmt(ind.evEbitda)} />
          <IndRow label={tr['fund.dividendYield']} value={fmtPct(d.dividendYield)} />
          <IndRow label={tr['fund.marketCap']} value={formatLarge(d.marketCap, tr)} />
          <IndRow label={tr['fund.beta']} value={fmt(d.beta)} />
        </div>

        {/* Profitability */}
        <div className="fundamentals-section">{tr['fund.profitability']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.eps']} value={fmt(d.eps)} />
          <IndRow label={tr['fund.roe']} value={fmtPct(ind.roe)} />
          <IndRow label={tr['fund.roa']} value={fmtPct(ind.roa)} />
          <IndRow label={tr['fund.grossMargin']} value={fmtPct(ind.grossMargin)} />
          <IndRow label={tr['fund.netMargin']} value={fmtPct(ind.netMargin)} />
        </div>

        {/* Solvency */}
        <div className="fundamentals-section">{tr['fund.solvency']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.debtToEquity']} value={fmt(ind.debtToEquity)} />
          <IndRow label={tr['fund.currentRatio']} value={fmt(ind.currentRatio)} />
          <IndRow label={tr['fund.quickRatio']} value={fmt(ind.quickRatio)} />
        </div>

        {/* Growth */}
        <div className="fundamentals-section">{tr['fund.growth']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.revenueGrowth']} value={fmtPct(ind.revenueGrowth)} growth />
          <IndRow label={tr['fund.netIncomeGrowth']} value={fmtPct(ind.netIncomeGrowth)} growth />
        </div>

        {/* Per-share data */}
        <div className="fundamentals-section">{tr['fund.perShare']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.bvps']} value={fmt(ind.bvps)} />
          <IndRow label={tr['fund.cfps']} value={fmt(ind.cfps)} />
          <IndRow label={tr['fund.sps']} value={fmt(ind.sps)} />
        </div>

        {/* Financials & Price Range (legacy) */}
        <div className="fundamentals-section">{tr['fund.financials']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.revenue']} value={formatLarge(d.revenue, tr)} />
          <IndRow label={tr['fund.netIncome']} value={formatLarge(d.netIncome, tr)} />
          <IndRow label={tr['fund.totalShares']} value={formatLarge(d.totalShares, tr)} />
          <IndRow label={tr['fund.floatShares']} value={formatLarge(d.floatShares, tr)} />
        </div>

        <div className="fundamentals-section">{tr['fund.priceRange']}</div>
        <div className="fundamentals-grid">
          <IndRow label={tr['fund.high52']} value={fmt(d.high52Week)} />
          <IndRow label={tr['fund.low52']} value={fmt(d.low52Week)} />
          <IndRow label={tr['fund.industry']} value={d.industry} />
          <IndRow label={tr['fund.sector']} value={d.sector} />
        </div>
      </>
    );
  };

  // Statement table renderer
  const renderStatementTable = (headers: string[], rows: string[][]) => (
    <div className="fund-statement-table-wrap">
      <table className="fund-statement-table">
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderIncome = () => {
    if (!fs) return null;
    const headers = [tr['fund.endDate'], tr['fund.income.revenue'], tr['fund.income.costRevenue'],
      tr['fund.income.grossProfit'], tr['fund.income.operExp'], tr['fund.income.operIncome'],
      tr['fund.income.netIncome'], tr['fund.income.eps'], tr['fund.income.ebitda']];
    const rows = fs.income.map(q => [
      q.endDate, formatLarge(q.revenue, tr), formatLarge(q.costOfRevenue, tr),
      formatLarge(q.grossProfit, tr), formatLarge(q.operatingExpenses, tr),
      formatLarge(q.operatingIncome, tr), formatLarge(q.netIncome, tr),
      fmt(q.eps), formatLarge(q.ebitda, tr),
    ]);
    return renderStatementTable(headers, rows);
  };

  const renderBalanceSheet = () => {
    if (!fs) return null;
    const headers = [tr['fund.endDate'], tr['fund.bs.totalAssets'], tr['fund.bs.totalLiab'],
      tr['fund.bs.totalEquity'], tr['fund.bs.currentAssets'], tr['fund.bs.currentLiab'],
      tr['fund.bs.cash'], tr['fund.bs.longTermDebt'], tr['fund.bs.retainedEarnings']];
    const rows = fs.balanceSheet.map(q => [
      q.endDate, formatLarge(q.totalAssets, tr), formatLarge(q.totalLiabilities, tr),
      formatLarge(q.totalEquity, tr), formatLarge(q.currentAssets, tr),
      formatLarge(q.currentLiabilities, tr), formatLarge(q.cash, tr),
      formatLarge(q.longTermDebt, tr), formatLarge(q.retainedEarnings, tr),
    ]);
    return renderStatementTable(headers, rows);
  };

  const renderCashFlow = () => {
    if (!fs) return null;
    const headers = [tr['fund.endDate'], tr['fund.cf.operCashFlow'], tr['fund.cf.investCashFlow'],
      tr['fund.cf.finCashFlow'], tr['fund.cf.freeCashFlow'], tr['fund.cf.capex'], tr['fund.cf.dividendsPaid']];
    const rows = fs.cashFlow.map(q => [
      q.endDate, formatLarge(q.operatingCashFlow, tr), formatLarge(q.investingCashFlow, tr),
      formatLarge(q.financingCashFlow, tr), formatLarge(q.freeCashFlow, tr),
      formatLarge(q.capitalExpenditure, tr), formatLarge(q.dividendsPaid, tr),
    ]);
    return renderStatementTable(headers, rows);
  };

  const tabs: { key: FundTab; label: string }[] = [
    { key: 'indicators', label: tr['fund.tab.indicators'] },
    { key: 'income', label: tr['fund.tab.income'] },
    { key: 'balance', label: tr['fund.tab.balance'] },
    { key: 'cashflow', label: tr['fund.tab.cashflow'] },
    { key: 'ai', label: tr['fund.tab.ai'] },
  ];

  return (
    <div className="fundamentals-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleFundamentals(); }}>
      <div className="fundamentals-panel">
        <div className="fundamentals-header">
          <span>{currentName} {tr['fund.title']}</span>
          <button className="fundamentals-close" onClick={toggleFundamentals}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>
        <div className="fund-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`fund-tab-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >{t.label}</button>
          ))}
        </div>
        <div className="fundamentals-body">
          {tab === 'indicators' && (d ? renderIndicators() : (
            <div className="fund-empty">{tr['fund.loading']}</div>
          ))}
          {tab === 'income' && (fs ? renderIncome() : (
            <div className="fund-empty">{tr['fund.loading']}</div>
          ))}
          {tab === 'balance' && (fs ? renderBalanceSheet() : (
            <div className="fund-empty">{tr['fund.loading']}</div>
          ))}
          {tab === 'cashflow' && (fs ? renderCashFlow() : (
            <div className="fund-empty">{tr['fund.loading']}</div>
          ))}
          {tab === 'ai' && (
            <div className="fund-ai-section">
              {!d ? (
                <div className="fund-empty">{tr['fund.ai.noData']}</div>
              ) : (
                <>
                  <div className="fund-ai-toolbar">
                    <button
                      className="fund-ai-analyze-btn"
                      onClick={runAIAnalysis}
                      disabled={aiLoading}
                    >{aiLoading ? tr['fund.ai.loading'] : (aiAnalysis ? tr['fund.ai.regenerate'] : tr['fund.ai.analyze'])}</button>
                  </div>
                  {aiError && <div className="fund-ai-error">{aiError}</div>}
                  {aiAnalysis && (
                    <div className="fund-ai-content">
                      {aiAnalysis.split('\n').map((line, i) => (
                        <p key={i}>{line || '\u00a0'}</p>
                      ))}
                      {aiLoading && <span className="fund-ai-cursor">&#9611;</span>}
                    </div>
                  )}
                  {aiLoading && !aiAnalysis && (
                    <div className="fund-ai-thinking">{tr['fund.ai.thinking']}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundamentalsPanel;
