import React, { useMemo } from 'react';
import { useStore } from '../../store';
import './dom.css';

const DepthOfMarket: React.FC = () => {
  const currentName = useStore((s) => s.currentName);
  const klineData = useStore((s) => s.klineData);

  const lastPrice = klineData.length > 0 ? klineData[klineData.length - 1].close : 0;

  const domData = useMemo(() => {
    const asks: { price: number; qty: number; orders: number }[] = [];
    const bids: { price: number; qty: number; orders: number }[] = [];
    const step = lastPrice > 1000 ? 1 : lastPrice > 100 ? 0.5 : lastPrice > 10 ? 0.05 : 0.01;
    for (let i = 0; i < 10; i++) {
      asks.push({ price: +(lastPrice + step * (i + 1)).toFixed(2), qty: Math.floor(100 + Math.random() * 900) * (10 - i), orders: Math.floor(1 + Math.random() * 5) });
      bids.push({ price: +(lastPrice - step * (i + 1)).toFixed(2), qty: Math.floor(100 + Math.random() * 900) * (10 - i), orders: Math.floor(1 + Math.random() * 5) });
    }
    return { asks, bids };
  }, [lastPrice]);

  const maxQty = Math.max(...domData.asks.map((a) => a.qty), ...domData.bids.map((b) => b.qty), 1);

  return (
    <div className="dom-panel">
      <div className="dom-header">
        <span className="dom-title">盘口深度 {currentName}</span>
        <button className="dom-close" onClick={() => useStore.getState().toggleOrderPanel()}>x</button>
      </div>
      <div className="dom-body">
        <div className="dom-asks">
          {domData.asks.slice().reverse().map((a, i) => (
            <div key={i} className="dom-row dom-row-ask">
              <div className="dom-bar-ask" style={{ width: `${(a.qty / maxQty) * 100}%` }} />
              <span className="dom-price">{a.price.toFixed(2)}</span>
              <span className="dom-qty">{a.qty}</span>
              <span className="dom-orders">{a.orders}</span>
            </div>
          ))}
        </div>
        <div className="dom-current">
          <span className="dom-current-price">{lastPrice.toFixed(2)}</span>
          <span className="dom-current-spread">价差 {(domData.asks[0]?.price - domData.bids[0]?.price).toFixed(2)}</span>
        </div>
        <div className="dom-bids">
          {domData.bids.map((b, i) => (
            <div key={i} className="dom-row dom-row-bid">
              <div className="dom-bar-bid" style={{ width: `${(b.qty / maxQty) * 100}%` }} />
              <span className="dom-price">{b.price.toFixed(2)}</span>
              <span className="dom-qty">{b.qty}</span>
              <span className="dom-orders">{b.orders}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepthOfMarket;
