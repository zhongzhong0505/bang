import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import type { SymbolSearchResult } from '../../../shared/types';
import '../toolbar/toolbar.css';

const MOCK_SYMBOLS: SymbolSearchResult[] = [
  { code: 'HK.00700', name: '腾讯控股', market: 'HK', type: '股票' },
  { code: 'HK.09988', name: '阿里巴巴-W', market: 'HK', type: '股票' },
  { code: 'HK.03690', name: '美团-W', market: 'HK', type: '股票' },
  { code: 'HK.02318', name: '中国平安', market: 'HK', type: '股票' },
  { code: 'HK.00939', name: '建设银行', market: 'HK', type: '股票' },
  { code: 'HK.01299', name: '友邦保险', market: 'HK', type: '股票' },
  { code: 'HK.00388', name: '港交所', market: 'HK', type: '股票' },
  { code: 'HK.00941', name: '中国移动', market: 'HK', type: '股票' },
  { code: 'HK.01109', name: '华润置地', market: 'HK', type: '股票' },
  { code: 'US.AAPL', name: 'Apple Inc', market: 'US', type: '股票' },
  { code: 'US.TSLA', name: 'Tesla Inc', market: 'US', type: '股票' },
  { code: 'US.NVDA', name: 'NVIDIA Corp', market: 'US', type: '股票' },
  { code: 'US.MSFT', name: 'Microsoft Corp', market: 'US', type: '股票' },
  { code: 'US.AMZN', name: 'Amazon.com Inc', market: 'US', type: '股票' },
  { code: 'US.GOOG', name: 'Alphabet Inc', market: 'US', type: '股票' },
  { code: 'US.META', name: 'Meta Platforms', market: 'US', type: '股票' },
  { code: 'US.NFLX', name: 'Netflix Inc', market: 'US', type: '股票' },
  { code: 'US.AMD', name: 'AMD Inc', market: 'US', type: '股票' },
  { code: 'US.INTEL', name: 'Intel Corp', market: 'US', type: '股票' },
  { code: 'SH.600519', name: '贵州茅台', market: 'SH', type: '股票' },
  { code: 'SH.600036', name: '招商银行', market: 'SH', type: '股票' },
  { code: 'SH.601318', name: '中国平安', market: 'SH', type: '股票' },
  { code: 'SH.600276', name: '恒瑞医药', market: 'SH', type: '股票' },
  { code: 'SH.601012', name: '隆基绿能', market: 'SH', type: '股票' },
  { code: 'SZ.000858', name: '五粮液', market: 'SZ', type: '股票' },
  { code: 'SZ.000001', name: '平安银行', market: 'SZ', type: '股票' },
  { code: 'SZ.002594', name: '比亚迪', market: 'SZ', type: '股票' },
  { code: 'SZ.300750', name: '宁德时代', market: 'SZ', type: '股票' },
];

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
