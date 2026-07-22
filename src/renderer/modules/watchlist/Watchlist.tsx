import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useStore } from '../../store';

import { getMarketFromCode } from '../../../shared/types';
import type { Market, Position } from '../../../shared/types';
import './watchlist.css';

const MARKET_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'US', label: '美股' },
  { key: 'HK', label: '港股' },
  { key: 'SH', label: '沪A' },
  { key: 'SZ', label: '深A' },
];

// ─── Main component ────────────────────────────────────────

const Watchlist: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'positions'>('watchlist');
  const [marketFilter, setMarketFilter] = useState('ALL');

  return (
    <div className="watchlist">
      {/* Tab bar */}
      <div className="watchlist-tabs">
        <button
          className={`watchlist-tab${activeTab === 'watchlist' ? ' watchlist-tab-active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >自选</button>
        <button
          className={`watchlist-tab${activeTab === 'positions' ? ' watchlist-tab-active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >持仓</button>
      </div>

      {/* Market filter (only in watchlist tab) */}
      {activeTab === 'watchlist' && (
        <div className="watchlist-market-filter">
          {MARKET_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`watchlist-market-btn${marketFilter === f.key ? ' watchlist-market-btn-active' : ''}`}
              onClick={() => setMarketFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="watchlist-list">
        {activeTab === 'watchlist'
          ? <WatchlistContent marketFilter={marketFilter} />
          : <PositionsContent />
        }
      </div>
    </div>
  );
};

// ─── Watchlist content ─────────────────────────────────────

const WatchlistContent: React.FC<{ marketFilter: string }> = ({ marketFilter }) => {
  const watchlist = useStore((s) => s.watchlist);
  const snapshots = useStore((s) => s.snapshots);
  const updateSnapshot = useStore((s) => s.updateSnapshot);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const currentCode = useStore((s) => s.currentCode);
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist);

  const filteredList = useMemo(() => {
    if (marketFilter === 'ALL') return watchlist;
    return watchlist.filter((item) => getMarketFromCode(item.code) === marketFilter);
  }, [watchlist, marketFilter]);

  const updateAll = useCallback(() => {
    const currentWatchlist = useStore.getState().watchlist;
    const currentUpdateSnapshot = useStore.getState().updateSnapshot;
    const api = window.bangAPI;
    const gwStatus = useStore.getState().gatewayStatus;
    if (api?.requestSnapshot && gwStatus.connected && gwStatus.loggedIn) {
      const codes = currentWatchlist.map((item) => item.code);
      if (codes.length === 0) return;
      api.requestSnapshot(codes).then((snaps: any[]) => {
        if (!Array.isArray(snaps)) return;
        snaps.forEach((s: any) => {
          const item = currentWatchlist.find((w) => w.code === s.code);
          currentUpdateSnapshot(s.code, { ...s, name: item?.name ?? s.name ?? s.code });
        });
      }).catch(() => { /* leave existing data */ });
    }
    // Not connected: do nothing, leave existing snapshots as-is
  }, []);

  useEffect(() => {
    updateAll();
    const timer = setInterval(updateAll, 3000);
    return () => clearInterval(timer);
  }, [updateAll]);

  useEffect(() => { updateAll(); }, [watchlist, updateAll]);

  if (filteredList.length === 0) {
    return <div className="watchlist-empty">暂无{marketFilter !== 'ALL' ? MARKET_FILTERS.find(f => f.key === marketFilter)?.label : ''}自选股</div>;
  }

  return (
    <>
      {filteredList.map((item) => {
        const snap = snapshots[item.code];
        const isUp = snap ? snap.changeVal >= 0 : true;
        return (
          <div
            key={item.code}
            className={`watchlist-item${item.code === currentCode ? ' watchlist-item-active' : ''}`}
            onClick={() => setCurrentStock(item.code, item.name)}
          >
            <div className="watchlist-item-left">
              <span className="watchlist-item-name">{item.name}</span>
              <span className="watchlist-item-code">{item.code}</span>
              <MiniSparkline code={item.code} />
            </div>
            <div className="watchlist-item-right">
              {snap ? (
                <>
                  <span className={`watchlist-price ${isUp ? 'watchlist-price-up' : 'watchlist-price-down'}`}>
                    {snap.curPrice.toFixed(2)}
                  </span>
                  <span className={`watchlist-change ${isUp ? 'watchlist-change-up' : 'watchlist-change-down'}`}>
                    {isUp ? '+' : ''}{snap.changeRate.toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="watchlist-price">--</span>
              )}
              <button
                className="watchlist-remove"
                onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.code); }}
                title="移除"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ─── Positions content ─────────────────────────────────────

const PositionsContent: React.FC = () => {
  const positions = useStore((s) => s.positions);
  const setPositions = useStore((s) => s.setPositions);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const currentCode = useStore((s) => s.currentCode);
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const snapshots = useStore((s) => s.snapshots);

  const fetchPositions = useCallback(async () => {
    const api = window.bangAPI;
    const gwStatus = useStore.getState().gatewayStatus;
    if (!api?.getPositions || !gwStatus.connected || !gwStatus.loggedIn) return;
    try {
      const result = await api.getPositions();
      if (Array.isArray(result)) setPositions(result);
    } catch { /* leave existing */ }
  }, [setPositions]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  if (positions.length === 0) {
    return <div className="watchlist-empty">暂无持仓</div>;
  }

  return (
    <>
      {positions.map((pos) => {
        const isUp = pos.pnl >= 0;
        const snap = snapshots[pos.code];
        const marketPrice = snap?.curPrice ?? pos.marketPrice;
        return (
          <div
            key={pos.code}
            className={`watchlist-item${pos.code === currentCode ? ' watchlist-item-active' : ''}`}
            onClick={() => setCurrentStock(pos.code, pos.name)}
          >
            <div className="watchlist-item-left">
              <span className="watchlist-item-name">{pos.name || pos.code}</span>
              <span className="watchlist-item-code">{pos.code} · {pos.qty}股</span>
            </div>
            <div className="watchlist-item-right">
              <span className={`watchlist-price ${isUp ? 'watchlist-price-up' : 'watchlist-price-down'}`}>
                {marketPrice.toFixed(2)}
              </span>
              <span className={`watchlist-change ${isUp ? 'watchlist-change-up' : 'watchlist-change-down'}`}>
                {isUp ? '+' : ''}{pos.pnlRatio.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ─── Sparkline ─────────────────────────────────────────────

const MiniSparkline: React.FC<{ code: string }> = ({ code }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const klineData = useStore((s) => s.klineData);
  const data = useMemo(() => {
    if (klineData && klineData.length > 0) {
      return klineData.slice(-30);
    }
    return [];
  }, [klineData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 48;
    const h = 16;
    if (data.length < 2) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.clearRect(0, 0, w, h);
      return;
    }
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const prices = data.map((d) => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const lastPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const isUp = lastPrice >= firstPrice;
    ctx.strokeStyle = isUp ? '#26a69a' : '#ef5350';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((prices[i] - min) / range) * (h - 2) - 1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);

  return <canvas ref={canvasRef} className="watchlist-sparkline" />;
};

export default Watchlist;
