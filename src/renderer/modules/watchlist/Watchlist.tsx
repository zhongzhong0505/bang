import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { useStore } from '../../store';
import { generateMockSnapshot, generateMockKline, STOCK_PRICES } from '../../mock';
import './watchlist.css';

const Watchlist: React.FC = () => {
  const watchlist = useStore((s) => s.watchlist);
  const snapshots = useStore((s) => s.snapshots);
  const updateSnapshot = useStore((s) => s.updateSnapshot);
  const setCurrentStock = useStore((s) => s.setCurrentStock);
  const currentCode = useStore((s) => s.currentCode);
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist);

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
      }).catch(() => {
        // fallback to mock
        currentWatchlist.forEach((item) => {
          const snap = generateMockSnapshot(item.code);
          snap.name = item.name;
          currentUpdateSnapshot(item.code, snap);
        });
      });
    } else {
      currentWatchlist.forEach((item) => {
        const snap = generateMockSnapshot(item.code);
        snap.name = item.name;
        currentUpdateSnapshot(item.code, snap);
      });
    }
  }, []);

  useEffect(() => {
    updateAll();
    const timer = setInterval(updateAll, 3000);
    return () => clearInterval(timer);
  }, [updateAll]);

  // Re-run initial snapshot whenever watchlist items change
  useEffect(() => {
    updateAll();
  }, [watchlist, updateAll]);

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <span className="watchlist-title">自选股</span>
      </div>
      <div className="watchlist-list">
        {watchlist.map((item) => {
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
      </div>
    </div>
  );
};

export default Watchlist;

// Mini sparkline component for watchlist items
const MiniSparkline: React.FC<{ code: string }> = ({ code }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = useMemo(() => {
    const base = STOCK_PRICES[code] ?? 100;
    return generateMockKline(30, base);
  }, [code]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 48;
    const h = 16;
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
