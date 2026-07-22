import React, { useState, useCallback } from 'react';
import { useStore } from '../../store';
import type { ScreenerFilter, ScreenerResult, Market } from '../../../shared/types';
import { DEFAULT_SCREENER_FILTER } from '../../../shared/types';
import './screener.css';

const MARKETS: { label: string; value: Market | 'ALL' }[] = [
  { label: '全部', value: 'ALL' },
  { label: '港股', value: 'HK' },
  { label: '美股', value: 'US' },
  { label: '沪A', value: 'SH' },
  { label: '深A', value: 'SZ' },
];

const SORT_OPTIONS = [
  { label: '涨跌幅', value: 'changeRate' },
  { label: '成交量', value: 'volume' },
  { label: '成交额', value: 'turnover' },
  { label: '价格', value: 'price' },
];

const formatNum = (n: number, digits = 2) => {
  if (n >= 1e12) return (n / 1e12).toFixed(digits) + '万亿';
  if (n >= 1e8) return (n / 1e8).toFixed(digits) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(digits) + '万';
  return n.toFixed(digits);
};

const formatVolume = (n: number) => {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(0) + '万';
  return n.toString();
};

const ScreenerPanel: React.FC = () => {
  const toggleScreener = useStore((s) => s.toggleScreener);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const screenerResults = useStore((s) => s.screenerResults);
  const setScreenerResults = useStore((s) => s.setScreenerResults);
  const screenerFilter = useStore((s) => s.screenerFilter);
  const setScreenerFilter = useStore((s) => s.setScreenerFilter);

  const [sortCol, setSortCol] = useState<string>('changeRate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSearch = useCallback(async () => {
    const api = window.bangAPI;
    if (api?.screenerSearch) {
      const results = await api.screenerSearch(screenerFilter);
      setScreenerResults(results || []);
    }
  }, [screenerFilter, setScreenerResults]);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }, [sortCol]);

  const sorted = [...screenerResults].sort((a, b) => {
    const va = (a as any)[sortCol] ?? 0;
    const vb = (b as any)[sortCol] ?? 0;
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const handleSelect = (r: ScreenerResult) => {
    setCurrentStock(r.code, r.name);
    toggleScreener();
  };

  return (
    <div className="screener-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleScreener(); }}>
      <div className="screener-panel">
        <div className="screener-header">
          <span>条件选股</span>
          <button className="screener-close" onClick={toggleScreener}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
        <div className="screener-filters">
          <div className="screener-filter-group">
            <span className="screener-filter-label">市场</span>
            <select className="screener-filter-select" value={screenerFilter.market}
              onChange={(e) => setScreenerFilter({ market: e.target.value as any })}>
              {MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">最低价</span>
            <input className="screener-filter-input" type="number" placeholder="0"
              value={screenerFilter.minPrice || ''} onChange={(e) => setScreenerFilter({ minPrice: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">最高价</span>
            <input className="screener-filter-input" type="number" placeholder="不限"
              value={screenerFilter.maxPrice || ''} onChange={(e) => setScreenerFilter({ maxPrice: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">涨跌幅(%)</span>
            <input className="screener-filter-input" type="number" placeholder="不限"
              value={screenerFilter.minChangeRate || ''} onChange={(e) => setScreenerFilter({ minChangeRate: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">排序</span>
            <select className="screener-filter-select" value={screenerFilter.sortBy}
              onChange={(e) => setScreenerFilter({ sortBy: e.target.value as any })}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="screener-search-btn" onClick={handleSearch}>筛选</button>
        </div>
        <div className="screener-results">
          <table className="screener-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('code')}>代码</th>
                <th>名称</th>
                <th onClick={() => handleSort('price')}>最新价{sortCol === 'price' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('changeRate')}>涨跌幅{sortCol === 'changeRate' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('volume')}>成交量{sortCol === 'volume' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('turnover')}>成交额{sortCol === 'turnover' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('peRatio')}>PE{sortCol === 'peRatio' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('marketCap')}>市值{sortCol === 'marketCap' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.code} onClick={() => handleSelect(r)}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.price.toFixed(2)}</td>
                  <td className={r.changeRate > 0 ? 'up' : r.changeRate < 0 ? 'down' : ''}>{r.changeRate > 0 ? '+' : ''}{r.changeRate.toFixed(2)}%</td>
                  <td>{formatVolume(r.volume)}</td>
                  <td>{formatNum(r.turnover)}</td>
                  <td>{r.peRatio.toFixed(1)}</td>
                  <td>{formatNum(r.marketCap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScreenerPanel;
