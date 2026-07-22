import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import type { SymbolSearchResult } from '../../../shared/types';
import { COMPARISON_STOCK_LIST } from '../../../shared/types';
import '../toolbar/toolbar.css';

const MOCK_SYMBOLS = COMPARISON_STOCK_LIST;

const SymbolSearch: React.FC = () => {
  const toggleSymbolSearch = useStore((s) => s.toggleSymbolSearch);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const watchlist = useStore((s) => s.watchlist);
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>(MOCK_SYMBOLS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(MOCK_SYMBOLS);
      return;
    }
    const q = query.toLowerCase();
    setResults(MOCK_SYMBOLS.filter((s) =>
      s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ));
  }, [query]);

  const handleSelect = (item: SymbolSearchResult) => {
    setCurrentStock(item.code, item.name);
    toggleSymbolSearch();
  };

  const handleAddToWatchlist = (item: SymbolSearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!watchlist.find((w) => w.code === item.code)) {
      addToWatchlist({ code: item.code, name: item.name, market: item.market });
    }
  };

  return (
    <div className="symbol-search-overlay" onClick={toggleSymbolSearch}>
      <div className="symbol-search-dialog" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="symbol-search-input"
          placeholder="搜索股票代码或名称..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') toggleSymbolSearch();
            if (e.key === 'Enter' && results.length > 0) handleSelect(results[0]);
          }}
        />
        <div className="symbol-search-results">
          {results.map((item) => (
            <div
              key={item.code}
              className="symbol-search-item"
              onClick={() => handleSelect(item)}
            >
              <div className="symbol-search-item-left">
                <span className="symbol-search-item-name">{item.name}</span>
                <span className="symbol-search-item-code">{item.code}</span>
              </div>
              <div className="flex-row gap-6">
            <span className="symbol-search-item-market">{item.market}</span>
                <button
                  className="quant-mini-btn"
                  onClick={(e) => handleAddToWatchlist(item, e)}
                  title="加入自选"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-muted-sm text-center padding-24">
              未找到匹配的股票
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolSearch;
