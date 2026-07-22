import React, { useMemo } from 'react';
import './chart.css';
import type { KlineData } from '../../../shared/types';
import { computeMA, computeEMA, computeRSI, computeMACD } from './indicators';

interface Props {
  data: { time: number; open: number; high: number; low: number; close: number; volume: number };
  indicators: string[];
  chartData: KlineData[];
}

const DataWindow: React.FC<Props> = ({ data, indicators, chartData }) => {
  const indicatorValues = useMemo(() => {
    const idx = chartData.findIndex((d) => d.time === data.time);
    if (idx === -1) return {};
    const vals: Record<string, string> = {};
    for (const ind of indicators) {
      if (ind.startsWith('MA')) {
        const period = parseInt(ind.slice(2));
        const ma = computeMA(chartData, period);
        vals[ind] = ma[idx] !== null ? (ma[idx] as number).toFixed(2) : '-';
      }
      if (ind.startsWith('EMA')) {
        const period = parseInt(ind.slice(3));
        const ema = computeEMA(chartData, period);
        vals[ind] = ema[idx] !== null ? (ema[idx] as number).toFixed(2) : '-';
      }
      if (ind === 'MACD') {
        const macd = computeMACD(chartData);
        vals['DIF'] = macd.dif[idx] !== null ? (macd.dif[idx] as number).toFixed(4) : '-';
        vals['DEA'] = macd.dea[idx] !== null ? (macd.dea[idx] as number).toFixed(4) : '-';
      }
      if (ind === 'RSI') {
        const rsi = computeRSI(chartData);
        vals['RSI'] = rsi[idx] !== null ? (rsi[idx] as number).toFixed(2) : '-';
      }
    }
    return vals;
  }, [data, indicators, chartData]);

  const change = data.close - data.open;
  const changePct = data.open !== 0 ? (change / data.open) * 100 : 0;
  const isUp = change >= 0;

  const timeStr = useMemo(() => {
    const d = new Date(data.time * 1000);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }, [data.time]);

  return (
    <div className="chart-info">
      <div className="chart-info-row">
        <span className="chart-info-label">{timeStr}</span>
      </div>
      <div className="chart-info-row">
        <span className="chart-info-label">开</span>
        <span className="chart-info-value">{data.open.toFixed(2)}</span>
        <span className="chart-info-label">高</span>
        <span className="chart-info-value up">{data.high.toFixed(2)}</span>
      </div>
      <div className="chart-info-row">
        <span className="chart-info-label">低</span>
        <span className="chart-info-value down">{data.low.toFixed(2)}</span>
        <span className="chart-info-label">收</span>
        <span className="chart-info-value">{data.close.toFixed(2)}</span>
      </div>
      <div className="chart-info-row">
        <span className="chart-info-label">涨跌</span>
        <span className={`chart-info-value ${isUp ? 'up' : 'down'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
        </span>
      </div>
      <div className="chart-info-row">
        <span className="chart-info-label">量</span>
        <span className="chart-info-value">{(data.volume / 10000).toFixed(0)}万</span>
      </div>
      {Object.entries(indicatorValues).length > 0 && (
        <div className="chart-info-divider">
          {Object.entries(indicatorValues).map(([key, val]) => (
            <div key={key} className="chart-info-row">
              <span className="chart-info-label">{key}</span>
              <span className="chart-info-value">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataWindow;
