import React, { useState, useCallback } from 'react';
import { useStore } from '../../store';
import type { ScreenerFilter, ScreenerResult, Market } from '../../../shared/types';
import { DEFAULT_SCREENER_FILTER } from '../../../shared/types';
import './screener.css';
import { useT, useTBatch } from '../../i18n';

const MARKET_KEYS: Record<string, string> = {
  ALL: 'screener.allMarkets', HK: 'screener.marketHK', US: 'screener.marketUS', SH: 'screener.marketSH', SZ: 'screener.marketSZ',
};

const SORT_KEYS: Record<string, string> = {
  changeRate: 'screener.sortChangeRate', volume: 'screener.sortVolume', turnover: 'screener.sortTurnover', price: 'screener.sortPrice',
};

const formatNum = (n: number, digits = 2, tr?: Record<string, string>) => {
  if (n >= 1e12) return (n / 1e12).toFixed(digits) + (tr?.['winrate.trillion'] ?? 'T');
  if (n >= 1e8) return (n / 1e8).toFixed(digits) + (tr?.['winrate.billion'] ?? 'B');
  if (n >= 1e4) return (n / 1e4).toFixed(digits) + (tr?.['winrate.tenThousand'] ?? 'K');
  return n.toFixed(digits);
};

const formatVolume = (n: number, tr?: Record<string, string>) => {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + (tr?.['winrate.billion'] ?? 'B');
  if (n >= 1e4) return (n / 1e4).toFixed(0) + (tr?.['winrate.tenThousand'] ?? 'K');
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

  const tr = useTBatch([
    'screener.title', 'screener.market', 'screener.minPrice', 'screener.maxPrice',
    'screener.noLimit', 'screener.changeRate', 'screener.sort', 'screener.search',
    'screener.thCode', 'screener.thName', 'screener.thPrice', 'screener.thChange',
    'screener.thVolume', 'screener.thTurnover', 'screener.thPE', 'screener.thMarketCap',
    'winrate.trillion', 'winrate.billion', 'winrate.tenThousand',
  ] + Object.values(MARKET_KEYS) + Object.values(SORT_KEYS) as any);

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
          <span>{tr['screener.title']}</span>
          <button className="screener-close" onClick={toggleScreener}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
        <div className="screener-filters">
          <div className="screener-filter-group">
            <span className="screener-filter-label">{tr['screener.market']}</span>
            <select className="screener-filter-select" value={screenerFilter.market}
              onChange={(e) => setScreenerFilter({ market: e.target.value as any })}>
              {Object.entries(MARKET_KEYS).map(([v, k]) => <option key={v} value={v}>{tr[k as any]}</option>)}
            </select>
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">{tr['screener.minPrice']}</span>
            <input className="screener-filter-input" type="number" placeholder="0"
              value={screenerFilter.minPrice || ''} onChange={(e) => setScreenerFilter({ minPrice: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">{tr['screener.maxPrice']}</span>
            <input className="screener-filter-input" type="number" placeholder={tr['screener.noLimit']}
              value={screenerFilter.maxPrice || ''} onChange={(e) => setScreenerFilter({ maxPrice: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">{tr['screener.changeRate']}</span>
            <input className="screener-filter-input" type="number" placeholder={tr['screener.noLimit']}
              value={screenerFilter.minChangeRate || ''} onChange={(e) => setScreenerFilter({ minChangeRate: +e.target.value || 0 })} />
          </div>
          <div className="screener-filter-group">
            <span className="screener-filter-label">{tr['screener.sort']}</span>
            <select className="screener-filter-select" value={screenerFilter.sortBy}
              onChange={(e) => setScreenerFilter({ sortBy: e.target.value as any })}>
              {Object.entries(SORT_KEYS).map(([v, k]) => <option key={v} value={v}>{tr[k as any]}</option>)}
            </select>
          </div>
          <button className="screener-search-btn" onClick={handleSearch}>{tr['screener.search']}</button>
        </div>
        <div className="screener-results">
          <table className="screener-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('code')}>{tr['screener.thCode']}</th>
                <th>{tr['screener.thName']}</th>
                <th onClick={() => handleSort('price')}>{tr['screener.thPrice']}{sortCol === 'price' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('changeRate')}>{tr['screener.thChange']}{sortCol === 'changeRate' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('volume')}>{tr['screener.thVolume']}{sortCol === 'volume' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('turnover')}>{tr['screener.thTurnover']}{sortCol === 'turnover' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('peRatio')}>PE{sortCol === 'peRatio' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
                <th onClick={() => handleSort('marketCap')}>{tr['screener.thMarketCap']}{sortCol === 'marketCap' && <span className="screener-sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.code} onClick={() => handleSelect(r)}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.price.toFixed(2)}</td>
                  <td className={r.changeRate > 0 ? 'up' : r.changeRate < 0 ? 'down' : ''}>{r.changeRate > 0 ? '+' : ''}{r.changeRate.toFixed(2)}%</td>
                  <td>{formatVolume(r.volume, tr)}</td>
                  <td>{formatNum(r.turnover, 2, tr)}</td>
                  <td>{r.peRatio.toFixed(1)}</td>
                  <td>{formatNum(r.marketCap, 2, tr)}</td>
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
