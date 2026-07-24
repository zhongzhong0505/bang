import React, { useEffect, useRef } from 'react';
import {
  createChart,
  LineSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import type { KlineData, CustomIndicator } from '../../../shared/types';
import {
  computeMACD, computeRSI, computeStochastic, computeOBV,
  computeATR, computeCCI, computeADX, computeWilliamsR, computeKDJ,
} from './indicators';
import { evalCustomIndicator } from './custom-indicator-engine';

interface SubChartProps {
  indicator: string;
  data: KlineData[];
  syncFromChart: IChartApi | null;
  customIndicators: CustomIndicator[];
  activeCustomIndicators: string[];
}

const SUB_CHART_COLORS: Record<string, Record<string, string>> = {
  MACD: { dif: '#2962ff', dea: '#ef5350' },
  RSI: { rsi: '#ab47bc' },
  KDJ: { k: '#2962ff', d: '#ef5350', j: '#26a69a' },
  STOCH: { k: '#2962ff', d: '#ef5350' },
  CCI: { cci: '#f59e0b' },
  OBV: { obv: '#29b6f6' },
  ATR: { atr: '#ab47bc' },
  ADX: { adx: '#f59e0b', plusDI: '#26a69a', minusDI: '#ef5350' },
  WR: { wr: '#ab47bc' },
};

const SubChart: React.FC<SubChartProps> = ({ indicator, data, syncFromChart, customIndicators, activeCustomIndicators }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
    }

   const chart = createChart(containerRef.current, {
     layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#787b86', fontSize: 10 },
     attributionLogo: false,
     grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
      rightPriceScale: { borderColor: '#2a2e39' },
      timeScale: { visible: false },
      crosshair: {
        mode: 0,
        vertLine: { visible: false },
        horzLine: { color: '#787b86', width: 1, style: 2, labelBackgroundColor: '#787b86' },
      },
      width: containerRef.current.clientWidth,
      height: 140,
    });
    chartRef.current = chart;

    const colors = SUB_CHART_COLORS[indicator] ?? {};

    if (indicator === 'MACD') {
      const { dif, dea, histogram } = computeMACD(data);
      const difS = chart.addSeries(LineSeries, { color: colors.dif ?? '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const deaS = chart.addSeries(LineSeries, { color: colors.dea ?? '#ef5350', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const histS = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false });
      difS.setData(data.map((d, i) => ({ time: d.time as Time, value: dif[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      deaS.setData(data.map((d, i) => ({ time: d.time as Time, value: dea[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      histS.setData(data.map((d, i) => ({
        time: d.time as Time, value: histogram[i] ?? NaN,
       color: (histogram[i] ?? 0) >= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)',
      })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'RSI') {
      const rsiData = computeRSI(data);
      const rsiS = chart.addSeries(LineSeries, { color: colors.rsi ?? '#ab47bc', lineWidth: 1, priceLineVisible: false });
      rsiS.setData(data.map((d, i) => ({ time: d.time as Time, value: rsiData[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      // Add reference lines at 30 and 70
      chart.addSeries(LineSeries, { color: '#ef5350', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: 30 })));
      chart.addSeries(LineSeries, { color: '#26a69a', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: 70 })));
    } else if (indicator === 'KDJ') {
      const { k, d, j } = computeKDJ(data);
      const kS = chart.addSeries(LineSeries, { color: colors.k ?? '#2962ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const dS = chart.addSeries(LineSeries, { color: colors.d ?? '#ef5350', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const jS = chart.addSeries(LineSeries, { color: colors.j ?? '#26a69a', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      kS.setData(data.map((dd, i) => ({ time: dd.time as Time, value: k[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      dS.setData(data.map((dd, i) => ({ time: dd.time as Time, value: d[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      jS.setData(data.map((dd, i) => ({ time: dd.time as Time, value: j[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'STOCH') {
      const { k, d } = computeStochastic(data);
      const kS = chart.addSeries(LineSeries, { color: colors.k ?? '#2962ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const dS = chart.addSeries(LineSeries, { color: colors.d ?? '#ef5350', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      kS.setData(data.map((dd, i) => ({ time: dd.time as Time, value: k[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      dS.setData(data.map((dd, i) => ({ time: dd.time as Time, value: d[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'CCI') {
      const cciData = computeCCI(data);
      const cciS = chart.addSeries(LineSeries, { color: colors.cci ?? '#f59e0b', lineWidth: 1, priceLineVisible: false });
      cciS.setData(data.map((d, i) => ({ time: d.time as Time, value: cciData[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      chart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: 100 })));
      chart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: -100 })));
    } else if (indicator === 'OBV') {
      const obvData = computeOBV(data);
      const obvS = chart.addSeries(LineSeries, { color: colors.obv ?? '#29b6f6', lineWidth: 1, priceLineVisible: false });
      obvS.setData(data.map((d, i) => ({ time: d.time as Time, value: obvData[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'ATR') {
      const atrData = computeATR(data);
      const atrS = chart.addSeries(LineSeries, { color: colors.atr ?? '#ab47bc', lineWidth: 1, priceLineVisible: false });
      atrS.setData(data.map((d, i) => ({ time: d.time as Time, value: atrData[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'ADX') {
      const { adx, plusDI, minusDI } = computeADX(data);
      const adxS = chart.addSeries(LineSeries, { color: colors.adx ?? '#f59e0b', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      const plusDIS = chart.addSeries(LineSeries, { color: colors.plusDI ?? '#26a69a', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const minusDIS = chart.addSeries(LineSeries, { color: colors.minusDI ?? '#ef5350', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      adxS.setData(data.map((d, i) => ({ time: d.time as Time, value: adx[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      plusDIS.setData(data.map((d, i) => ({ time: d.time as Time, value: plusDI[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      minusDIS.setData(data.map((d, i) => ({ time: d.time as Time, value: minusDI[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    } else if (indicator === 'WR') {
      const wrData = computeWilliamsR(data);
      const wrS = chart.addSeries(LineSeries, { color: colors.wr ?? '#ab47bc', lineWidth: 1, priceLineVisible: false });
      wrS.setData(data.map((d, i) => ({ time: d.time as Time, value: wrData[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      chart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: -20 })));
      chart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
        .setData(data.map((d) => ({ time: d.time as Time, value: -80 })));
    }

    // Custom sub-chart indicator rendering
    // If the indicator prop matches a custom indicator id, render it
    const cindMatch = customIndicators.find((c) => c.id === indicator);
    if (cindMatch && cindMatch.mode === 'subchart') {
      const result = evalCustomIndicator(cindMatch, data);
      if (result) {
        for (const line of cindMatch.lines) {
          const vals = result[line.name];
          if (!vals) continue;
          const s = chart.addSeries(LineSeries, {
            color: line.color,
            lineWidth: (line.lineWidth ?? 1) as any,
            lineStyle: (line.lineStyle ?? 0) as any,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          s.setData(data.map((d, i) => ({ time: d.time as Time, value: vals[i] ?? NaN })).filter((d) => !isNaN(d.value)));
        }
      }
    }
    // Also render any other active custom sub indicators not already rendered above
    for (const id of activeCustomIndicators) {
      if (id === indicator) continue; // already handled above
      const cind = customIndicators.find((c) => c.id === id);
      if (!cind || cind.mode !== 'subchart') continue;
      const result = evalCustomIndicator(cind, data);
      if (!result) continue;
      for (const line of cind.lines) {
        const vals = result[line.name];
        if (!vals) continue;
        const s = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: (line.lineWidth ?? 1) as any,
          lineStyle: (line.lineStyle ?? 0) as any,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(data.map((d, i) => ({ time: d.time as Time, value: vals[i] ?? NaN })).filter((d) => !isNaN(d.value)));
      }
    }

    chart.timeScale().fitContent();

    if (syncFromChart) {
      const handler = (range: any) => {
        if (range && chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      };
      syncFromChart.timeScale().subscribeVisibleLogicalRangeChange(handler);

      // Also sync in reverse
      const reverseHandler = (range: any) => {
        if (range && syncFromChart) {
          syncFromChart.timeScale().setVisibleLogicalRange(range);
        }
      };
      chart.timeScale().subscribeVisibleLogicalRangeChange(reverseHandler);

      // Store cleanup
      chartRef.current.__subChartCleanup = () => {
        try {
          if (syncFromChart) syncFromChart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(reverseHandler);
        } catch {}
      };
    }

    return () => {
      const cleanup = (chartRef.current as any)?.__subChartCleanup;
      if (cleanup) cleanup();
      chart.remove();
      chartRef.current = null;
    };
  }, [indicator, data, syncFromChart, customIndicators, activeCustomIndicators]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (rect && chartRef.current) {
        chartRef.current.applyOptions({ width: rect.width });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="chart-sub" />
  );
};

export default SubChart;
