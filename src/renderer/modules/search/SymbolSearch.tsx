import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import type { SymbolSearchResult } from '../../../shared/types';
import { COMPARISON_STOCK_LIST } from '../../../shared/types';
import '../toolbar/toolbar.css';

const SymbolSearch: React.FC = () => {
  const toggleSymbolSearch = useStore((s) => s.toggleSymbolSearch);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const watchlist = useStore((s) => s.watchlist);
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const gatewayConnected = useStore((s) => s.gatewayStatus.connected && s.gatewayStatus.loggedIn);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSearchResult[]>(COMPARISON_STOCK_LIST);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    const filterLocal = (kw: string): SymbolSearchResult[] => {
      if (!kw) return COMPARISON_STOCK_LIST;
      const ql = kw.toLowerCase();
      return COMPARISON_STOCK_LIST.filter(s =>
        s.code.toLowerCase().includes(ql) || s.name.toLowerCase().includes(ql)
      );
    };

    // Show local results immediately
    setResults(filterLocal(q));

    // Asynchronously augment with gateway results (non-blocking)
    if (gatewayConnected && window.bangAPI?.searchStock && q) {
      setSearching(true);
      searchTimer.current = setTimeout(async () => {
        try {
          const apiResults = await window.bangAPI.searchStock(q);
          if (apiResults && apiResults.length > 0) {
            // Merge: API results first, then local results not already included
            const existingCodes = new Set(apiResults.map((r) => r.code));
            const localExtras = filterLocal(q).filter((s) => !existingCodes.has(s.code));
            setResults([...apiResults, ...localExtras]);
          }
        } catch {
          // Keep local results already shown
        } finally {
          setSearching(false);
        }
      }, 400);
    }

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    }
  }, [query, gatewayConnected]);

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
          {searching && (
            <div className="text-muted-sm text-center padding-24">
              搜索中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolSearch;
