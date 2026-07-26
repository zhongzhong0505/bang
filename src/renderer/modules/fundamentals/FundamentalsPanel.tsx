import React, { useEffect } from 'react';
import { useStore } from '../../store';
import type { Fundamentals } from '../../../shared/types';
import './fundamentals.css';
import { useT, useTBatch } from '../../i18n';

const formatLarge = (n: number, tr: Record<string, string>) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + tr['winrate.trillion'];
  if (n >= 1e8) return (n / 1e8).toFixed(2) + tr['winrate.billion'];
  if (n >= 1e4) return (n / 1e4).toFixed(2) + tr['winrate.tenThousand'];
  return n.toFixed(2);
};

const FundamentalsPanel: React.FC = () => {
  const toggleFundamentals = useStore((s) => s.toggleFundamentals);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const fundamentalsData = useStore((s) => s.fundamentalsData);
  const setFundamentalsData = useStore((s) => s.setFundamentalsData);

  const tr = useTBatch([
    'fund.title', 'fund.valuation', 'fund.pe', 'fund.pb', 'fund.eps',
    'fund.dividendYield', 'fund.marketCap', 'fund.beta', 'fund.financials',
    'fund.revenue', 'fund.netIncome', 'fund.totalShares', 'fund.floatShares',
    'fund.priceRange', 'fund.high52', 'fund.low52', 'fund.industry', 'fund.sector',
    'fund.loading', 'winrate.trillion', 'winrate.billion', 'winrate.tenThousand',
  ]);

  useEffect(() => {
    const api = window.bangAPI as any;
    if (!api?.getFundamentals) return;
    api.getFundamentals(currentCode).then((data: Fundamentals | null) => {
      if (data) setFundamentalsData(data);
    }).catch(() => {});
  }, [currentCode, setFundamentalsData]);

  const d = fundamentalsData;

  return (
    <div className="fundamentals-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleFundamentals(); }}>
      <div className="fundamentals-panel">
        <div className="fundamentals-header">
          <span>{currentName} {tr['fund.title']}</span>
          <button className="fundamentals-close" onClick={toggleFundamentals}>x</button>
        </div>
        <div className="fundamentals-body">
          {d ? (
            <>
              <div className="fundamentals-section">{tr['fund.valuation']}</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.pe']}</span><span className="fundamentals-value">{d.peRatio.toFixed(1)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.pb']}</span><span className="fundamentals-value">{d.pbRatio.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.eps']}</span><span className="fundamentals-value">{d.eps.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.dividendYield']}</span><span className="fundamentals-value">{d.dividendYield.toFixed(2)}%</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.marketCap']}</span><span className="fundamentals-value">{formatLarge(d.marketCap, tr)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.beta']}</span><span className="fundamentals-value">{d.beta.toFixed(2)}</span></div>
              </div>
              <div className="fundamentals-section">{tr['fund.financials']}</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.revenue']}</span><span className="fundamentals-value">{formatLarge(d.revenue, tr)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.netIncome']}</span><span className="fundamentals-value">{formatLarge(d.netIncome, tr)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.totalShares']}</span><span className="fundamentals-value">{formatLarge(d.totalShares, tr)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.floatShares']}</span><span className="fundamentals-value">{formatLarge(d.floatShares, tr)}</span></div>
              </div>
              <div className="fundamentals-section">{tr['fund.priceRange']}</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.high52']}</span><span className="fundamentals-value">{d.high52Week.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.low52']}</span><span className="fundamentals-value">{d.low52Week.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.industry']}</span><span className="fundamentals-value">{d.industry}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">{tr['fund.sector']}</span><span className="fundamentals-value">{d.sector}</span></div>
              </div>
            </>
          ) : (
            <div style={{ color: '#5d6070', textAlign: 'center', padding: 20 }}>{tr['fund.loading']}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundamentalsPanel;
