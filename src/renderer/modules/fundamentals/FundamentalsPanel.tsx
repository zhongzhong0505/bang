import React, { useEffect } from 'react';
import { useStore } from '../../store';
import type { Fundamentals } from '../../../shared/types';
import './fundamentals.css';

const formatLarge = (n: number) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '万亿';
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
  return n.toFixed(2);
};

const FundamentalsPanel: React.FC = () => {
  const toggleFundamentals = useStore((s) => s.toggleFundamentals);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const fundamentalsData = useStore((s) => s.fundamentalsData);
  const setFundamentalsData = useStore((s) => s.setFundamentalsData);

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
          <span>{currentName} 基本面</span>
          <button className="fundamentals-close" onClick={toggleFundamentals}>x</button>
        </div>
        <div className="fundamentals-body">
          {d ? (
            <>
              <div className="fundamentals-section">估值指标</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">市盈率 (PE)</span><span className="fundamentals-value">{d.peRatio.toFixed(1)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">市净率 (PB)</span><span className="fundamentals-value">{d.pbRatio.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">每股收益 (EPS)</span><span className="fundamentals-value">{d.eps.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">股息率</span><span className="fundamentals-value">{d.dividendYield.toFixed(2)}%</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">总市值</span><span className="fundamentals-value">{formatLarge(d.marketCap)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">Beta</span><span className="fundamentals-value">{d.beta.toFixed(2)}</span></div>
              </div>
              <div className="fundamentals-section">财务数据</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">营业收入</span><span className="fundamentals-value">{formatLarge(d.revenue)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">净利润</span><span className="fundamentals-value">{formatLarge(d.netIncome)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">总股本</span><span className="fundamentals-value">{formatLarge(d.totalShares)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">流通股</span><span className="fundamentals-value">{formatLarge(d.floatShares)}</span></div>
              </div>
              <div className="fundamentals-section">价格区间</div>
              <div className="fundamentals-grid">
                <div className="fundamentals-item"><span className="fundamentals-label">52周最高</span><span className="fundamentals-value">{d.high52Week.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">52周最低</span><span className="fundamentals-value">{d.low52Week.toFixed(2)}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">行业</span><span className="fundamentals-value">{d.industry}</span></div>
                <div className="fundamentals-item"><span className="fundamentals-label">板块</span><span className="fundamentals-value">{d.sector}</span></div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>加载中...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundamentalsPanel;
