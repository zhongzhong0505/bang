import React from 'react';
import { useStore } from '../../store';
import './status-bar.css';

const StatusBar: React.FC = () => {
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const klineData = useStore((s) => s.klineData);

  const lastBar = klineData[klineData.length - 1];

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${gatewayStatus.connected ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
        <span className="status-text">
          {gatewayStatus.connected
            ? `已连接 ${gatewayStatus.host}:${gatewayStatus.port}`
            : '未连接'}
        </span>
        {gatewayStatus.provider && (
          <span className="status-text status-text-small">
            {gatewayStatus.provider === 'futu' ? '富途' : '老虎'}
          </span>
        )}
        {gatewayStatus.loggedIn && <span className="status-text status-text-green">已登录</span>}
      </div>
      <div className="status-right">
        {lastBar && (
          <>
            <span className="status-text">O <span className="status-text-ohlc">{lastBar.open.toFixed(2)}</span></span>
            <span className="status-text">H <span className="status-text-ohlc-up">{lastBar.high.toFixed(2)}</span></span>
            <span className="status-text">L <span className="status-text-ohlc-down">{lastBar.low.toFixed(2)}</span></span>
            <span className="status-text">C <span className="status-text-ohlc">{lastBar.close.toFixed(2)}</span></span>
            <span className="status-text">V {(lastBar.volume / 10000).toFixed(0)}万</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
