import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import type { OverallWinRate, StockWinRate, MatchedTrade } from '../../../shared/types';
import DatePicker from '../../components/DatePicker';
import './analytics.css';

const MOCK_WIN_RATE: OverallWinRate = {
  "totalTrades": 17,
  "winTrades": 12,
  "lossTrades": 5,
  "evenTrades": 0,
  "winRate": 70.6,
  "avgPnl": 1272.94,
  "avgPnlPct": 3.22,
  "avgNetPnl": 1137.18,
  "totalPnl": 21640.0,
  "totalNetPnl": 19332.1,
  "totalFee": 2307.9,
  "profitFactor": 3.2,
  "bestStock": "腾讯控股",
  "worstStock": "美团-W",
  "stockRates": [
    {
      "code": "HK.00700",
      "name": "腾讯控股",
      "totalTrades": 6,
      "winTrades": 5,
      "lossTrades": 1,
      "evenTrades": 0,
      "winRate": 83.3,
      "avgPnl": 2101.67,
      "avgPnlPct": 3.95,
      "avgNetPnl": 1956.13,
      "totalPnl": 12610.0,
      "totalNetPnl": 11736.8,
      "totalFee": 873.2,
      "avgHoldSeconds": 1666400,
      "maxWin": 5373.4,
      "maxLoss": -1508.1,
      "trades": [
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 298.4,
          "buyQty": 200,
          "buyTime": 1704326400,
          "buyFee": 95.5,
          "sellPrice": 318.2,
          "sellQty": 200,
          "sellTime": 1706227200,
          "sellFee": 114.6,
          "totalFee": 210.1,
          "pnl": 3960.0,
          "pnlPct": 6.64,
          "netPnl": 3749.9,
          "holdSeconds": 1900800
        },
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 310.0,
          "buyQty": 50,
          "buyTime": 1704931200,
          "buyFee": 23.8,
          "sellPrice": 318.2,
          "sellQty": 50,
          "sellTime": 1706227200,
          "sellFee": 28.6,
          "totalFee": 52.4,
          "pnl": 410.0,
          "pnlPct": 2.65,
          "netPnl": 357.6,
          "holdSeconds": 1296000
        },
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 310.0,
          "buyQty": 50,
          "buyTime": 1704931200,
          "buyFee": 23.8,
          "sellPrice": 326.8,
          "sellQty": 50,
          "sellTime": 1708363200,
          "sellFee": 32.7,
          "totalFee": 56.5,
          "pnl": 840.0,
          "pnlPct": 5.42,
          "netPnl": 783.5,
          "holdSeconds": 3432000
        },
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 335.0,
          "buyQty": 200,
          "buyTime": 1709136000,
          "buyFee": 107.2,
          "sellPrice": 351.0,
          "sellQty": 200,
          "sellTime": 1710259200,
          "sellFee": 112.3,
          "totalFee": 219.5,
          "pnl": 3200.0,
          "pnlPct": 4.78,
          "netPnl": 2980.5,
          "holdSeconds": 1123200
        },
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 345.0,
          "buyQty": 100,
          "buyTime": 1710777600,
          "buyFee": 55.2,
          "sellPrice": 331.0,
          "sellQty": 100,
          "sellTime": 1711728000,
          "sellFee": 52.9,
          "totalFee": 108.1,
          "pnl": -1400.0,
          "pnlPct": -4.06,
          "netPnl": -1508.1,
          "holdSeconds": 950400
        },
        {
          "code": "HK.00700",
          "name": "腾讯控股",
          "side": "BUY_THEN_SELL",
          "buyPrice": 340.0,
          "buyQty": 200,
          "buyTime": 1712160000,
          "buyFee": 108.8,
          "sellPrice": 368.0,
          "sellQty": 200,
          "sellTime": 1713456000,
          "sellFee": 117.8,
          "totalFee": 226.6,
          "pnl": 5600.0,
          "pnlPct": 8.24,
          "netPnl": 5373.4,
          "holdSeconds": 1296000
        }
      ]
    },
    {
      "code": "HK.03690",
      "name": "美团-W",
      "totalTrades": 3,
      "winTrades": 1,
      "lossTrades": 2,
      "evenTrades": 0,
      "winRate": 33.3,
      "avgPnl": -810.0,
      "avgPnlPct": -3.15,
      "avgNetPnl": -997.87,
      "totalPnl": -2430.0,
      "totalNetPnl": -2993.6,
      "totalFee": 563.6,
      "avgHoldSeconds": 1408000,
      "maxWin": 2323.1,
      "maxLoss": -3372.1,
      "trades": [
        {
          "code": "HK.03690",
          "name": "美团-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 118.0,
          "buyQty": 300,
          "buyTime": 1704758400,
          "buyFee": 106.2,
          "sellPrice": 126.5,
          "sellQty": 300,
          "sellTime": 1706745600,
          "sellFee": 120.7,
          "totalFee": 226.9,
          "pnl": 2550.0,
          "pnlPct": 7.2,
          "netPnl": 2323.1,
          "holdSeconds": 1987200
        },
        {
          "code": "HK.03690",
          "name": "美团-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 125.0,
          "buyQty": 200,
          "buyTime": 1708108800,
          "buyFee": 75.0,
          "sellPrice": 116.0,
          "sellQty": 200,
          "sellTime": 1709222400,
          "sellFee": 69.6,
          "totalFee": 144.6,
          "pnl": -1800.0,
          "pnlPct": -7.2,
          "netPnl": -1944.6,
          "holdSeconds": 1113600
        },
        {
          "code": "HK.03690",
          "name": "美团-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 112.0,
          "buyQty": 300,
          "buyTime": 1710086400,
          "buyFee": 100.8,
          "sellPrice": 101.4,
          "sellQty": 300,
          "sellTime": 1711209600,
          "sellFee": 91.3,
          "totalFee": 192.1,
          "pnl": -3180.0,
          "pnlPct": -9.46,
          "netPnl": -3372.1,
          "holdSeconds": 1123200
        }
      ]
    },
    {
      "code": "HK.09988",
      "name": "阿里-W",
      "totalTrades": 3,
      "winTrades": 2,
      "lossTrades": 1,
      "evenTrades": 0,
      "winRate": 66.7,
      "avgPnl": 1233.33,
      "avgPnlPct": 3.67,
      "avgNetPnl": 1069.63,
      "totalPnl": 3700.0,
      "totalNetPnl": 3208.9,
      "totalFee": 491.1,
      "avgHoldSeconds": 1939200,
      "maxWin": 3022.4,
      "maxLoss": -1291.2,
      "trades": [
        {
          "code": "HK.09988",
          "name": "阿里-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 72.4,
          "buyQty": 500,
          "buyTime": 1704585600,
          "buyFee": 108.6,
          "sellPrice": 75.8,
          "sellQty": 500,
          "sellTime": 1706659200,
          "sellFee": 113.7,
          "totalFee": 222.3,
          "pnl": 1700.0,
          "pnlPct": 4.7,
          "netPnl": 1477.7,
          "holdSeconds": 2073600
        },
        {
          "code": "HK.09988",
          "name": "阿里-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 78.0,
          "buyQty": 300,
          "buyTime": 1708454400,
          "buyFee": 46.8,
          "sellPrice": 74.0,
          "sellQty": 300,
          "sellTime": 1710364800,
          "sellFee": 44.4,
          "totalFee": 91.2,
          "pnl": -1200.0,
          "pnlPct": -5.13,
          "netPnl": -1291.2,
          "holdSeconds": 1910400
        },
        {
          "code": "HK.09988",
          "name": "阿里-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 70.0,
          "buyQty": 400,
          "buyTime": 1712102400,
          "buyFee": 84.0,
          "sellPrice": 78.0,
          "sellQty": 400,
          "sellTime": 1713936000,
          "sellFee": 93.6,
          "totalFee": 177.6,
          "pnl": 3200.0,
          "pnlPct": 11.43,
          "netPnl": 3022.4,
          "holdSeconds": 1833600
        }
      ]
    },
    {
      "code": "HK.01810",
      "name": "小米-W",
      "totalTrades": 3,
      "winTrades": 2,
      "lossTrades": 1,
      "evenTrades": 0,
      "winRate": 66.7,
      "avgPnl": 2200.0,
      "avgPnlPct": 7.57,
      "avgNetPnl": 2096.4,
      "totalPnl": 6600.0,
      "totalNetPnl": 6289.2,
      "totalFee": 310.8,
      "avgHoldSeconds": 1795200,
      "maxWin": 3494.4,
      "maxLoss": -671.6,
      "trades": [
        {
          "code": "HK.01810",
          "name": "小米-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 15.8,
          "buyQty": 2000,
          "buyTime": 1705104000,
          "buyFee": 63.2,
          "sellPrice": 17.6,
          "sellQty": 2000,
          "sellTime": 1706745600,
          "sellFee": 70.4,
          "totalFee": 133.6,
          "pnl": 3600.0,
          "pnlPct": 11.39,
          "netPnl": 3466.4,
          "holdSeconds": 1641600
        },
        {
          "code": "HK.01810",
          "name": "小米-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 18.2,
          "buyQty": 1000,
          "buyTime": 1708454400,
          "buyFee": 36.4,
          "sellPrice": 17.6,
          "sellQty": 1000,
          "sellTime": 1710364800,
          "sellFee": 35.2,
          "totalFee": 71.6,
          "pnl": -600.0,
          "pnlPct": -3.3,
          "netPnl": -671.6,
          "holdSeconds": 1910400
        },
        {
          "code": "HK.01810",
          "name": "小米-W",
          "side": "BUY_THEN_SELL",
          "buyPrice": 16.4,
          "buyQty": 1500,
          "buyTime": 1712102400,
          "buyFee": 49.2,
          "sellPrice": 18.8,
          "sellQty": 1500,
          "sellTime": 1713936000,
          "sellFee": 56.4,
          "totalFee": 105.6,
          "pnl": 3600.0,
          "pnlPct": 14.63,
          "netPnl": 3494.4,
          "holdSeconds": 1833600
        }
      ]
    },
    {
      "code": "SH.600519",
      "name": "贵州茅台",
      "totalTrades": 2,
      "winTrades": 2,
      "lossTrades": 0,
      "evenTrades": 0,
      "winRate": 100.0,
      "avgPnl": 580.0,
      "avgPnlPct": 3.41,
      "avgNetPnl": 545.4,
      "totalPnl": 1160.0,
      "totalNetPnl": 1090.8,
      "totalFee": 69.2,
      "avgHoldSeconds": 1905600,
      "maxWin": 565.0,
      "maxLoss": 525.8,
      "trades": [
        {
          "code": "SH.600519",
          "name": "贵州茅台",
          "side": "BUY_THEN_SELL",
          "buyPrice": 1680.0,
          "buyQty": 10,
          "buyTime": 1704326400,
          "buyFee": 16.8,
          "sellPrice": 1736.0,
          "sellQty": 10,
          "sellTime": 1706227200,
          "sellFee": 17.4,
          "totalFee": 34.2,
          "pnl": 560.0,
          "pnlPct": 3.33,
          "netPnl": 525.8,
          "holdSeconds": 1900800
        },
        {
          "code": "SH.600519",
          "name": "贵州茅台",
          "side": "BUY_THEN_SELL",
          "buyPrice": 1720.0,
          "buyQty": 10,
          "buyTime": 1708454400,
          "buyFee": 17.2,
          "sellPrice": 1780.0,
          "sellQty": 10,
          "sellTime": 1710364800,
          "sellFee": 17.8,
          "totalFee": 35.0,
          "pnl": 600.0,
          "pnlPct": 3.49,
          "netPnl": 565.0,
          "holdSeconds": 1910400
        }
      ]
    }
  ],
  "startDate": 1704326400,
  "endDate": 1713456000
};

declare global {
  interface Window {
    bangAPI?: {
      analyzeWinRate?: (startTime?: string, endTime?: string) => Promise<any>;
    } & Record<string, any>;
  }
}

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const fmtNum = (v: number, dp = 2) => v.toFixed(dp);
const fmtMoney = (v: number) => {
  const sign = v >= 0 ? '' : '-';
  const abs = Math.abs(v);
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(2)}万`;
  return `${sign}${abs.toFixed(2)}`;
};

const fmtDate = (ts: number) => {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtHoldTime = (seconds: number) => {
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}小时`;
  return `${(seconds / 86400).toFixed(1)}天`;
};

type SortKey = 'winRate' | 'totalNetPnl' | 'totalTrades' | 'avgPnlPct';

const WinRatePanel: React.FC = () => {
  const toggleWinRate = useStore((s) => s.toggleWinRate);
  const winRateData = useStore((s) => s.winRateData);
  const setWinRateData = useStore((s) => s.setWinRateData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('totalNetPnl');
  const [sortAsc, setSortAsc] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

 const fetchData = useCallback(async () => {
   const api = window.bangAPI;
   // Check if gateway is connected — if not, always show mock for preview
   const gwConnected = useStore.getState().gatewayStatus.connected && useStore.getState().gatewayStatus.loggedIn;

   if (!api?.analyzeWinRate) {
     // No live API available yet — show mock data for preview
     setWinRateData(MOCK_WIN_RATE);
     setIsMock(true);
     setError(null);
     return;
   }
   if (!gwConnected) {
     // Gateway not connected — show mock data immediately instead of waiting 15s timeout
     setWinRateData(MOCK_WIN_RATE);
     setIsMock(true);
     setError(null);
     return;
   }
   setLoading(true);
   setError(null);
   try {
     const result = await api.analyzeWinRate(
       startDate || undefined,
       endDate || undefined,
     );
     if (result?.error || !result || result.totalTrades === 0) {
       // Error or no deals found — fall back to mock data for preview
       setWinRateData(MOCK_WIN_RATE);
       setIsMock(true);
       setError(null);
      } else {
        setWinRateData(result as OverallWinRate);
        setIsMock(false);
      }
    } catch (err: any) {
      setWinRateData(MOCK_WIN_RATE);
      setIsMock(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, setWinRateData]);

  // Show mock data immediately on mount for preview
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedStocks: StockWinRate[] = winRateData
    ? [...winRateData.stockRates].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortAsc ? av - bv : bv - av;
      })
    : [];

  const renderWinRateBar = (rate: number) => {
    const color = rate >= 50 ? 'var(--green, #26a69a)' : 'var(--red, #ef5350)';
    return (
      <span className="winrate-winrate-bar">
        <span
          className="winrate-winrate-bar-fill"
          style={{ width: `${Math.min(rate, 100)}%`, background: color }}
        />
      </span>
    );
  };

  return (
    <div className="winrate-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleWinRate(); }}>
      <div className="winrate-panel">
       <div className="winrate-header">
         <h2 className="winrate-title">交易胜率分析</h2>
          {isMock && <span className="winrate-mock-badge">演示数据</span>}
        <div className="winrate-controls">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="开始日期"
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>至</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="结束日期"
            />
            <button className="winrate-btn" onClick={fetchData} disabled={loading}>
              {loading ? '分析中...' : '查询'}
            </button>
            <button className="winrate-btn winrate-btn-secondary" onClick={toggleWinRate}>关闭</button>
          </div>
        </div>

        <div className="winrate-body">
          {loading && <div className="winrate-loading">正在拉取历史成交记录并分析...</div>}

          {error && (
            <div className="winrate-empty">
              <span style={{ color: 'var(--red)' }}>{error}</span>
              <span>请确认网关已连接，且券商支持历史成交记录查询</span>
            </div>
          )}

          {!loading && !error && !winRateData && (
            <div className="winrate-empty">
              <span>暂无数据，点击「查询」获取分析结果</span>
            </div>
          )}

          {!loading && !error && winRateData && winRateData.totalTrades === 0 && (
            <div className="winrate-empty">
              <span>未找到匹配的买卖记录</span>
              <span style={{ fontSize: 12 }}>请确认所选时间范围内有已完成的交易</span>
            </div>
          )}

          {!loading && !error && winRateData && winRateData.totalTrades > 0 && (
            <>
              {/* Summary cards */}
              <div className="winrate-summary">
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">总交易次数</div>
                  <div className="winrate-stat-value">{winRateData.totalTrades}</div>
                </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">胜率</div>
                  <div className={`winrate-stat-value winrate-winrate ${winRateData.winRate >= 50 ? 'positive' : 'negative'}`}>
                    {winRateData.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">盈利次数</div>
                  <div className="winrate-stat-value positive">{winRateData.winTrades}</div>
                </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">亏损次数</div>
                  <div className="winrate-stat-value negative">{winRateData.lossTrades}</div>
                </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">总净盈亏</div>
                  <div className={`winrate-stat-value ${winRateData.totalNetPnl >= 0 ? 'positive' : 'negative'}`}>
                    {fmtMoney(winRateData.totalNetPnl)}
                  </div>
                </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">平均每笔盈亏</div>
                  <div className={`winrate-stat-value ${winRateData.avgNetPnl >= 0 ? 'positive' : 'negative'}`}>
                    {fmtMoney(winRateData.avgNetPnl)}
                  </div>
                </div>
               <div className="winrate-stat-card">
                 <div className="winrate-stat-label">盈亏比</div>
                 <div className="winrate-stat-value">
                   {winRateData.profitFactor === Infinity ? '∞' : winRateData.profitFactor.toFixed(2)}
                 </div>
               </div>
                <div className="winrate-stat-card">
                  <div className="winrate-stat-label">总交易费用</div>
                  <div className="winrate-stat-value" style={{ color: 'var(--text-muted)' }}>
                    {fmtMoney(winRateData.totalFee)}
                  </div>
                </div>
               <div className="winrate-stat-card">
                 <div className="winrate-stat-label">交易标的数</div>
                 <div className="winrate-stat-value">{winRateData.stockRates.length}</div>
               </div>
              </div>

              {/* Per-stock table */}
              <div className="winrate-table-section">
                <div className="winrate-section-title">个股胜率明细</div>
                <table className="winrate-table">
                  <thead>
                    <tr>
                      <th>股票</th>
                      <th onClick={() => handleSort('totalTrades')} style={{ cursor: 'pointer' }}>交易次数</th>
                      <th>盈利</th>
                      <th>亏损</th>
                      <th onClick={() => handleSort('winRate')} style={{ cursor: 'pointer' }}>胜率</th>
                      <th onClick={() => handleSort('avgPnlPct')} style={{ cursor: 'pointer' }}>平均盈亏%</th>
                      <th onClick={() => handleSort('totalNetPnl')} style={{ cursor: 'pointer' }}>总净盈亏</th>
                     <th>最大盈利</th>
                     <th>最大亏损</th>
                      <th>总费用</th>
                     <th>平均持仓</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sortedStocks.map((stock) => (
                     <React.Fragment key={stock.code}>
                       <tr onClick={() => setExpandedStock(expandedStock === stock.code ? null : stock.code)}>
                         <td className="winrate-stock-cell">{stock.code} {stock.name}</td>
                         <td>{stock.totalTrades}</td>
                         <td className="positive">{stock.winTrades}</td>
                         <td className="negative">{stock.lossTrades}</td>
                         <td>
                           {renderWinRateBar(stock.winRate)}
                           {stock.winRate.toFixed(1)}%
                         </td>
                         <td className={stock.avgPnlPct >= 0 ? 'positive' : 'negative'}>
                           {fmtPct(stock.avgPnlPct)}
                         </td>
                         <td className={stock.totalNetPnl >= 0 ? 'positive' : 'negative'}>
                           {fmtMoney(stock.totalNetPnl)}
                         </td>
                         <td className="positive">{fmtMoney(stock.maxWin)}</td>
                         <td className="negative">{fmtMoney(stock.maxLoss)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{fmtMoney(stock.totalFee)}</td>
                         <td>{fmtHoldTime(stock.avgHoldSeconds)}</td>
                       </tr>
                        {expandedStock === stock.code && (
                          <tr>
                            <td colSpan={11} style={{ padding: 0 }}>
                             <div className="winrate-trade-detail">
                               <table className="winrate-trade-table">
                                 <thead>
                                   <tr>
                                     <th>买入时间</th>
                                     <th>买入价</th>
                                     <th>数量</th>
                                      <th>买入费</th>
                                     <th>卖出时间</th>
                                     <th>卖出价</th>
                                     <th>数量</th>
                                      <th>卖出费</th>
                                     <th>持仓时间</th>
                                     <th>毛盈亏</th>
                                      <th>总费用</th>
                                     <th>净盈亏</th>
                                     <th>盈亏%</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {stock.trades.map((t: MatchedTrade, i: number) => (
                                     <tr key={i}>
                                       <td>{fmtDate(t.buyTime)}</td>
                                       <td>{fmtNum(t.buyPrice)}</td>
                                       <td>{t.buyQty}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{fmtMoney(t.buyFee)}</td>
                                       <td>{fmtDate(t.sellTime)}</td>
                                       <td>{fmtNum(t.sellPrice)}</td>
                                       <td>{t.sellQty}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{fmtMoney(t.sellFee)}</td>
                                       <td>{fmtHoldTime(t.holdSeconds)}</td>
                                       <td className={t.pnl >= 0 ? 'positive' : 'negative'}>
                                         {fmtMoney(t.pnl)}
                                       </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{fmtMoney(t.totalFee)}</td>
                                       <td className={t.netPnl >= 0 ? 'positive' : 'negative'}>
                                         {fmtMoney(t.netPnl)}
                                       </td>
                                       <td className={t.pnlPct >= 0 ? 'positive' : 'negative'}>
                                         {fmtPct(t.pnlPct)}
                                       </td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 11 }}>
                数据范围: {fmtDate(winRateData.startDate)} ~ {fmtDate(winRateData.endDate)}
                {' | '}
                最赚钱标的: <span style={{ color: 'var(--green)' }}>{winRateData.bestStock}</span>
                {' | '}
                最亏钱标的: <span style={{ color: 'var(--red)' }}>{winRateData.worstStock}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinRatePanel;
