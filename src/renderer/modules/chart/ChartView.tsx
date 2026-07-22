import React, { useEffect, useRef, useMemo, useState, Component } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  ColorType,
  type Time,
  TickMarkType,
} from 'lightweight-charts';
import { useStore } from '../../store';
import { generateMockKlineBySubType } from '../../mock';
import type { GatewayStatus } from '../../../shared/types';
import {
  computeMA, computeEMA, computeBollinger, computeMACD, computeRSI,
  computeStochastic, computeOBV, computeATR, computeCCI, computeADX,
  computeWilliamsR, computeKDJ, computeSAR, computeVWAP,
} from './indicators';
import SubChart from './SubChart';
import ChipDistribution from './ChipDistribution';
import VolumeProfile from './VolumeProfile';
import DrawingTools from './DrawingTools';
import DataWindow from './DataWindow';
import ReplayControls from './ReplayControls';
import { formatTickMark, formatCrosshairTime, isDailySubType } from '../../utils/format';
import type { FormatOptions } from '../../utils/format';
import type { KlineData } from '../../../shared/types';
import './chart.css';

const STOCK_BASE_PRICES: Record<string, number> = {
  'HK.00700': 380, 'HK.09988': 85, 'HK.03690': 155,
  'US.AAPL': 195, 'US.TSLA': 245, 'US.NVDA': 125,
  'SH.600519': 1520, 'SZ.000858': 145,
};

const INDICATOR_COLORS: Record<string, string> = {
  MA5: '#f59e0b', MA10: '#29b6f6', MA20: '#ab47bc', MA60: '#ef5350',
  EMA12: '#26a69a', EMA26: '#2962ff',
  BOLL: '#f59e0b',
  SAR: '#2962ff',
  VWAP: '#29b6f6',
};

// Error boundary for SubChart to prevent crash propagation
interface SubChartEBProps { indicator: string; data: KlineData[]; syncFromChart: IChartApi | null }
interface SubChartEBState { hasError: boolean }
class SubChartEB extends Component<SubChartEBProps, SubChartEBState> {
  state: SubChartEBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div className="chart-sub chart-sub-error">副图加载失败</div>;
    }
    return <SubChart indicator={this.props.indicator} data={this.props.data} syncFromChart={this.props.syncFromChart} />;
  }
}

const ChartView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [hoverData, setHoverData] = useState<{ time: number; open: number; high: number; low: number; close: number; volume: number } | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [priceLines, setPriceLines] = useState<number[]>([]);
  const [drawings, setDrawings] = useState<import("../../../shared/types").Drawing[]>([]);

  const currentCode = useStore((s) => s.currentCode);
  const subType = useStore((s) => s.subType);
  const chartType = useStore((s) => s.chartType);
  const chartStyle = useStore((s) => s.chartStyle);
  const indicators = useStore((s) => s.indicators);
  const appSettings = useStore((s) => s.appSettings);
  const showChipDistribution = useStore((s) => s.showChipDistribution);
  const showVolumeProfile = useStore((s) => s.showVolumeProfile);
  const replayMode = useStore((s) => s.replayMode);
  const comparisonSymbols = useStore((s) => s.comparisonSymbols);
  const orders = useStore((s) => s.orders);
  const setKlineData = useStore((s) => s.setKlineData);
  const checkAlerts = useStore((s) => s.checkAlerts);
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const [realtimeKline, setRealtimeKline] = useState<KlineData[] | null>(null);
  const [useRealtime, setUseRealtime] = useState(false);

  const hasSubChart = indicators.some((i) => ['MACD', 'RSI', 'KDJ', 'STOCH', 'CCI', 'OBV', 'ATR', 'ADX', 'WR'].includes(i));
  const subIndicator = useMemo(() => {
    for (const i of indicators) {
      if (['MACD', 'RSI', 'KDJ', 'STOCH', 'CCI', 'OBV', 'ATR', 'ADX', 'WR'].includes(i)) return i;
    }
    return null;
  }, [indicators]);
  const isDaily = isDailySubType(subType);

  const fullMockData = useMemo(() => {
    const basePrice = STOCK_BASE_PRICES[currentCode] ?? 100;
    const count = subType === '1' ? 500 : isDaily ? 200 : 300;
    return generateMockKlineBySubType(count, basePrice, subType);
  }, [currentCode, subType]);

  // Fetch real K-line data when gateway is connected
  useEffect(() => {
    const api = window.bangAPI;
    if (!api?.requestKline) return;
    const connected = gatewayStatus.connected && gatewayStatus.loggedIn;
    if (!connected) {
      setRealtimeKline(null);
      setUseRealtime(false);
      return;
    }
    let cancelled = false;
    const count = subType === '1' ? 500 : isDaily ? 200 : 300;
    api.requestKline(currentCode, subType, count).then((data: KlineData[]) => {
      if (!cancelled && data && data.length > 0) {
        setRealtimeKline(data);
        setUseRealtime(true);
      }
    }).catch(() => {
      if (!cancelled) { setRealtimeKline(null); setUseRealtime(false); }
    });
    return () => { cancelled = true; };
  }, [currentCode, subType, gatewayStatus.connected, gatewayStatus.loggedIn, isDaily]);

  // Subscribe to real-time K-line push
  useEffect(() => {
    const api = window.bangAPI;
    if (!api?.subscribe || !api?.onKlineData) return;
    if (!useRealtime) return;
    // Subscribe for push updates
    api.subscribe(currentCode, [subType]);
    const unsub = api.onKlineData((d: any) => {
      if (d.code !== currentCode) return;
      setRealtimeKline((prev) => {
        if (!prev) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && d.data) {
          if (updated[lastIdx].time === d.data.time) {
            updated[lastIdx] = { ...updated[lastIdx], ...d.data };
          } else if (d.data.time > updated[lastIdx]?.time) {
            updated.push(d.data);
          }
        }
        return updated;
      });
    });
    // Also listen for quote push to update the last bar's close in real time
    let unsubQuote: (() => void) | undefined;
    if (api.onSubscribeData) {
      unsubQuote = api.onSubscribeData((d: any) => {
        if (!d?.code || d.code !== currentCode || d.curPrice === undefined) return;
        const livePrice = d.curPrice;
        setRealtimeKline((prev) => {
          if (!prev || prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          const last = updated[lastIdx];
          updated[lastIdx] = {
            ...last,
            close: livePrice,
            high: Math.max(last.high, livePrice),
            low: Math.min(last.low, livePrice),
          };
          return updated;
        });
      });
    }
    return () => { unsub(); unsubQuote?.(); };
  }, [currentCode, subType, useRealtime]);

  const mockData = useMemo(() => {
    if (!replayMode && useRealtime && realtimeKline) return realtimeKline;
    if (!replayMode) return fullMockData;
    const idx = useStore.getState().replayIndex;
    return fullMockData.slice(0, Math.max(idx, 60));
  }, [fullMockData, replayMode, useRealtime, realtimeKline]);

  const heikinData = useMemo(() => {
    if (chartType !== 'heikin') return mockData;
    const result: KlineData[] = [];
    for (let i = 0; i < mockData.length; i++) {
      if (i === 0) {
        result.push({ ...mockData[i], close: (mockData[i].open + mockData[i].high + mockData[i].low + mockData[i].close) / 4 });
        continue;
      }
      const prevClose = result[i - 1].close;
      const haClose = (mockData[i].open + mockData[i].high + mockData[i].low + mockData[i].close) / 4;
      const haOpen = (prevClose + result[i - 1].open) / 2;
      const haHigh = Math.max(mockData[i].high, haOpen, haClose);
      const haLow = Math.min(mockData[i].low, haOpen, haClose);
      result.push({
        time: mockData[i].time, open: +haOpen.toFixed(2), high: +haHigh.toFixed(2),
        low: +haLow.toFixed(2), close: +haClose.toFixed(2),
        volume: mockData[i].volume, turnover: mockData[i].turnover,
      });
    }
    return result;
  }, [mockData, chartType]);

  const displayData = chartType === 'heikin' ? heikinData : mockData;

  const [comparisonDataMap, setComparisonDataMap] = useState<Record<string, KlineData[]>>({});

  // Fetch real K-line for comparison symbols when gateway is connected
  useEffect(() => {
    if (comparisonSymbols.length === 0) { setComparisonDataMap({}); return; }
    const api = window.bangAPI;
    const connected = gatewayStatus.connected && gatewayStatus.loggedIn;
    const count = subType === '1' ? 500 : isDaily ? 200 : 300;
    const fetches: Promise<void>[] = [];
    const resultMap: Record<string, KlineData[]> = {};

    for (const comp of comparisonSymbols) {
      if (connected && api?.requestKline) {
        fetches.push(
          api.requestKline(comp.code, subType, count).then((data: KlineData[]) => {
            if (data && data.length > 0) resultMap[comp.code] = data;
            else {
              const basePrice = STOCK_BASE_PRICES[comp.code] ?? 100;
              resultMap[comp.code] = generateMockKlineBySubType(count, basePrice, subType);
            }
          }).catch(() => {
            const basePrice = STOCK_BASE_PRICES[comp.code] ?? 100;
            resultMap[comp.code] = generateMockKlineBySubType(count, basePrice, subType);
          })
        );
      } else {
        const basePrice = STOCK_BASE_PRICES[comp.code] ?? 100;
        resultMap[comp.code] = generateMockKlineBySubType(count, basePrice, subType);
      }
    }

    // Show mock immediately, then replace with real data
    const mockMap: Record<string, KlineData[]> = {};
    for (const comp of comparisonSymbols) {
      const basePrice = STOCK_BASE_PRICES[comp.code] ?? 100;
      mockMap[comp.code] = generateMockKlineBySubType(count, basePrice, subType);
    }
    setComparisonDataMap(mockMap);

    if (fetches.length > 0) {
      Promise.all(fetches).then(() => setComparisonDataMap({ ...resultMap }));
    }
  }, [comparisonSymbols, subType, gatewayStatus.connected, gatewayStatus.loggedIn, isDaily]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      const store = useStore.getState();
      switch (e.key) {
        case '1': store.setSubType('1'); break;
        case '5': store.setSubType('5'); break;
        case 'd': store.setSubType('DAY'); break;
        case 'w': store.setSubType('WEEK'); break;
        case 'm': store.setSubType('MONTH'); break;
        case 'c': store.setChartType('candle'); break;
        case 'l': store.setChartType('line'); break;
        case 'a': store.setChartType('area'); break;
        case 'Escape':
          if (store.showSymbolSearch) store.toggleSymbolSearch();
          if (store.showAlertPanel) store.toggleAlertPanel();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Main chart effect
  useEffect(() => {
    if (!containerRef.current || displayData.length === 0) return;

    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
    }

    const chartHeight = hasSubChart ? containerRef.current.clientHeight - 140 : containerRef.current.clientHeight;

   const chart = createChart(containerRef.current, {
     layout: {
       background: { type: ColorType.Solid, color: chartStyle.backgroundColor },
       textColor: chartStyle.textColor,
       fontSize: 11,
     },
     attributionLogo: false,
     grid: chartStyle.showGrid ? {
       vertLines: { color: chartStyle.gridColor },
       horzLines: { color: chartStyle.gridColor },
     } : { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: {
        mode: 0,
        vertLine: { color: chartStyle.crosshairColor, width: 1, style: 2, labelBackgroundColor: chartStyle.crosshairColor },
        horzLine: { color: chartStyle.crosshairColor, width: 1, style: 2, labelBackgroundColor: chartStyle.crosshairColor },
      },
      rightPriceScale: {
        borderColor: chartStyle.gridColor,
        scaleMargins: { top: chartStyle.scaleMarginsTop, bottom: chartStyle.scaleMarginsBottom },
      },
      timeScale: {
        borderColor: chartStyle.gridColor,
        timeVisible: !isDaily,
        secondsVisible: false,
       tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
          const fmtOpts: FormatOptions = {
            dateFormat: appSettings.dateFormat,
            timeFormat: appSettings.timeFormat,
            showSecondsInCrosshair: appSettings.showSecondsInCrosshair,
          };
          return formatTickMark(time as number, tickMarkType, isDaily, fmtOpts) ?? '';
        },
      },
      localization: {
        locale: 'zh-CN',
        dateFormat: 'yyyy-MM-dd',
        timeFormatter: (time: Time) => {
          const fmtOpts: FormatOptions = {
            dateFormat: appSettings.dateFormat,
            timeFormat: appSettings.timeFormat,
            showSecondsInCrosshair: appSettings.showSecondsInCrosshair,
          };
          return formatCrosshairTime(time as number, isDaily, fmtOpts);
        },
      },
      width: containerRef.current.clientWidth,
      height: chartHeight,
    });
    chartRef.current = chart;

    const data = displayData;
    setKlineData(data);

    // Main series
    let mainSeries: ISeriesApi<SeriesType>;
    if (chartType === 'candle' || chartType === 'heikin' || chartType === 'hollow') {
      const options: any = {
        upColor: chartStyle.upColor, downColor: chartStyle.downColor,
        borderUpColor: chartStyle.upColor, borderDownColor: chartStyle.downColor,
        wickUpColor: chartStyle.upColor, wickDownColor: chartStyle.downColor,
      };
      if (chartType === 'hollow') {
        options.upColor = 'transparent';
        options.borderUpColor = chartStyle.upColor;
        options.wickUpColor = chartStyle.upColor;
      }
      mainSeries = chart.addSeries(CandlestickSeries, options);
      mainSeries.setData(data.map((d) => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close })));
      const orderMarkers = orders
        .filter((o) => o.status === 'FILLED' && o.code === currentCode)
        .map((o) => ({
          time: Math.floor(o.time / 1000) as Time,
          position: o.side === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
          color: o.side === 'BUY' ? '#26a69a' : '#ef5350',
          shape: o.side === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
          text: o.side === 'BUY' ? 'B' : 'S',
        }));
      if (orderMarkers.length > 0) {
        try { createSeriesMarkers(mainSeries, orderMarkers); } catch {}
      }
    } else if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, { color: '#2962ff', lineWidth: 2 });
      mainSeries.setData(data.map((d) => ({ time: d.time as Time, value: d.close })));
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(41,98,255,0.4)', bottomColor: 'rgba(41,98,255,0.02)',
        lineColor: '#2962ff', lineWidth: 2,
      });
      mainSeries.setData(data.map((d) => ({ time: d.time as Time, value: d.close })));
    } else {
      mainSeries = chart.addSeries(LineSeries, { color: '#787b86', lineWidth: 1, lineStyle: 0 });
      mainSeries.setData(data.map((d) => ({ time: d.time as Time, value: d.close })));
    }

    // Price lines from user
    for (const price of priceLines) {
      try {
        mainSeries.createPriceLine({
          price,
          color: '#2962ff',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: price.toFixed(2),
        });
      } catch {}
    }

    // Volume
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volSeries.setData(data.map((d) => ({
      time: d.time as Time, value: d.volume,
      color: d.close >= d.open ? 'rgba(38,166,154,0.4)' : 'rgba(239,83,80,0.4)',
    })));

    // Overlay indicator helper
    const addLine = (values: (number | null)[], color: string, style: number = 0) => {
      const series = chart.addSeries(LineSeries, {
        color, lineWidth: 1, lineStyle: style as any,
        priceLineVisible: false, lastValueVisible: false,
      });
      series.setData(data.map((d, i) => ({ time: d.time as Time, value: values[i] ?? NaN })).filter((d) => !isNaN(d.value)));
    };

    for (const ind of indicators) {
      if (ind.startsWith('MA')) {
        const period = parseInt(ind.slice(2));
        addLine(computeMA(data, period), INDICATOR_COLORS[ind] ?? '#8b95a5');
      }
      if (ind.startsWith('EMA')) {
        const period = parseInt(ind.slice(3));
        addLine(computeEMA(data, period), INDICATOR_COLORS[ind] ?? '#8b95a5');
      }
    }

    if (indicators.includes('BOLL')) {
      const boll = computeBollinger(data);
      addLine(boll.upper, '#f59e0b');
      addLine(boll.mid, '#f59e0b', 2);
      addLine(boll.lower, '#f59e0b');
    }

    if (indicators.includes('SAR')) {
      addLine(computeSAR(data), '#3b82f6');
    }

    if (indicators.includes('VWAP')) {
      addLine(computeVWAP(data), '#06b6d4');
    }

    // Comparison overlay
    for (const comp of comparisonSymbols) {
      const compData = comparisonDataMap[comp.code];
      if (!compData || compData.length === 0) continue;
      const baseRef = compData[0].close;
      const mainBaseRef = data[0].close;
      const compSeries = chart.addSeries(LineSeries, {
        color: comp.color, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false,
        priceScaleId: 'comparison',
      });
      chart.priceScale('comparison').applyOptions({
        scaleMargins: { top: chartStyle.scaleMarginsTop, bottom: chartStyle.scaleMarginsBottom },
        visible: false,
      });
      compSeries.setData(data.map((d, i) => {
        const compBar = compData[Math.min(i, compData.length - 1)];
        const pctChange = (compBar.close - baseRef) / baseRef;
        const normalizedPrice = mainBaseRef * (1 + pctChange);
        return { time: d.time as Time, value: normalizedPrice };
      }));
    }

    try { chart.timeScale().fitContent(); } catch {}

    // Crosshair handler
    const crosshairHandler = (param: any) => {
      if (!param.time || !param.point) {
        setHoverData(null);
        return;
      }
      const bar = data.find((d) => d.time === (param.time as number));
      if (bar) {
        setHoverData(bar);
        try { checkAlerts(bar.close, currentCode); } catch {}
      }
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    // Context menu
    const ctxHandler = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.offsetX, y: e.offsetY });
    };
    containerRef.current.addEventListener('contextmenu', ctxHandler);

    // Resize observer
    const observer = new ResizeObserver(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && chartRef.current) {
        try { chartRef.current.applyOptions({ width: rect.width, height: hasSubChart ? rect.height - 140 : rect.height }); } catch {}
      }
    });
    observer.observe(containerRef.current);

    setChartApi(chart);

    return () => {
      observer.disconnect();
      setChartApi(null);
      try { chart.unsubscribeCrosshairMove(crosshairHandler); } catch {}
      try { chart.remove(); } catch {}
      chartRef.current = null;
      containerRef.current?.removeEventListener('contextmenu', ctxHandler);
    };
  }, [currentCode, subType, chartType, chartStyle, indicators, hasSubChart, displayData, setKlineData, checkAlerts, comparisonSymbols, priceLines]);

  return (
    <div className="chart-container">
      <div className="chart-area">
        {drawingMode && chartApi && (
          <DrawingTools chart={chartApi} data={displayData} mode={drawingMode} onModeChange={setDrawingMode} drawings={drawings} onDrawingsChange={setDrawings} />
        )}
        <div ref={containerRef} className="chart-main" />
        {contextMenu && (
          <div className="chart-context-overlay" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}>
            <div className="chart-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
              <div className="chart-context-item" onClick={() => { try { chartApi?.timeScale().scrollToRealTime(); } catch {} setContextMenu(null); }}>回到最新</div>
              <div className="chart-context-item" onClick={() => { try { chartApi?.timeScale().fitContent(); } catch {} setContextMenu(null); }}>重置缩放</div>
              <div className="chart-context-item" onClick={() => {
                const lastClose = displayData[displayData.length - 1]?.close;
                if (lastClose) setPriceLines((prev) => [...prev, lastClose]);
                setContextMenu(null);
              }}>添加价格线</div>
              {priceLines.length > 0 && (
                <div className="chart-context-item" onClick={() => { setPriceLines([]); setContextMenu(null); }}>清除所有价格线</div>
              )}
              <div className="chart-context-divider" />
              <div className="chart-context-item" onClick={() => { setDrawingMode('trend_line'); setContextMenu(null); }}>趋势线</div>
              <div className="chart-context-item" onClick={() => { setDrawingMode('horizontal_line'); setContextMenu(null); }}>水平线</div>
              <div className="chart-context-divider" />
              <div className="chart-context-item" onClick={() => {
                if (!chartRef.current) { setContextMenu(null); return; }
                try {
                  const url = chartRef.current.takeScreenshot().toDataURL('image/png');
                  const a = document.createElement('a');
                  a.href = url; a.download = currentCode + '_' + Date.now() + '.png'; a.click();
                } catch {}
                setContextMenu(null);
              }}>截图保存</div>
            </div>
          </div>
        )}
        {chartApi && (
          <div className="chart-nav-buttons">
            <button className="chart-nav-btn" title="回到最新" onClick={() => { try { chartApi.timeScale().scrollToRealTime(); } catch {} }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2l5 5-5 5M7 2v10" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button className="chart-nav-btn" title="重置缩放" onClick={() => { try { chartApi.timeScale().fitContent(); } catch {} }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7L6 4M3 7l3 3M3 7h8M11 4v6" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>
        )}
        {chartApi && (
          <button className="chart-screenshot-btn" title="截图" onClick={() => {
            if (!chartRef.current) return;
            try {
              const url = chartRef.current.takeScreenshot().toDataURL('image/png');
              const a = document.createElement('a');
              a.href = url; a.download = currentCode + '_' + Date.now() + '.png'; a.click();
            } catch {}
            setScreenshotFlash(true);
            setTimeout(() => setScreenshotFlash(false), 300);
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v8M4 6l3 3 3-3M2 11v2h10v-2" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
          </button>
        )}
        {screenshotFlash && <div className="chart-screenshot-flash" />}
        {hoverData && (
          <DataWindow data={hoverData} indicators={indicators} chartData={displayData} />
        )}
        {showChipDistribution && chartApi && (
          <ChipDistribution data={displayData} mainChart={chartApi} />
        )}
        {showVolumeProfile && chartApi && (
          <VolumeProfile data={displayData} mainChart={chartApi} />
        )}
        {comparisonSymbols.length > 0 && chartApi && (
          <ComparisonLabels symbols={comparisonSymbols} data={displayData} compDataMap={comparisonDataMap} />
        )}
      </div>
      {subIndicator && (
        <SubChartEB indicator={subIndicator} data={displayData} syncFromChart={chartApi} />
      )}
      {replayMode && (
        <ReplayControls data={fullMockData} />
      )}
    </div>
  );
};

// Comparison label overlay
const ComparisonLabels: React.FC<{
  symbols: { code: string; name: string; color: string }[];
  data: KlineData[];
  compDataMap: Record<string, KlineData[]>;
}> = ({ symbols, data, compDataMap }) => {
  return (
    <div className="comparison-labels-container">
      {symbols.map((s) => {
        const compData = compDataMap[s.code];
        if (!compData || compData.length === 0 || data.length === 0) return null;
        const baseRef = compData[0].close;
        const lastComp = compData[Math.min(compData.length - 1, data.length - 1)];
        const pctChange = ((lastComp.close - baseRef) / baseRef) * 100;
        return (
          <span key={s.code} className="comparison-label" style={{ color: s.color }}>
            {s.name} {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
        );
      })}
    </div>
  );
};

export default ChartView;
