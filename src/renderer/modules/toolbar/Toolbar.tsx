import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import './toolbar.css';
import type { SubType, ChartLayout } from '../../../shared/types';

const SUB_TYPES: { label: string; value: SubType }[] = [
  { label: '1m', value: '1' }, { label: '5m', value: '5' },
  { label: '15m', value: '15' }, { label: '30m', value: '30' }, { label: '1h', value: '60' },
  { label: '日K', value: 'DAY' }, { label: '周K', value: 'WEEK' }, { label: '月K', value: 'MONTH' },
];

const CHART_TYPES = [
  { label: 'K线', value: 'candle' }, { label: '空心K', value: 'hollow' },
  { label: '阳线K', value: 'heikin' }, { label: '柱状', value: 'bar' },
  { label: '折线', value: 'line' }, { label: '面积', value: 'area' },
];

const INDICATORS_MAIN = ['MA5', 'MA10', 'MA20', 'MA60', 'EMA12', 'EMA26', 'BOLL', 'SAR', 'VWAP'];
const INDICATORS_SUB = ['MACD', 'KDJ', 'RSI', 'STOCH', 'WR', 'CCI', 'OBV', 'ATR', 'ADX'];

const CHART_LAYOUTS: { label: string; value: ChartLayout }[] = [
  { label: '单图', value: 'single' }, { label: '2×1', value: '2x1' },
  { label: '1×2', value: '1x2' }, { label: '2×2', value: '2x2' },
];

const Dropdown: React.FC<{
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
}> = ({ trigger, children, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMenuPos(align === 'right' ? { top: rect.bottom + 2, left: rect.right } : { top: rect.bottom + 2, left: rect.left });
  }, [open, align]);
  return (
    <div className="tb-dropdown" ref={ref}>
      <div className="tb-dropdown-trigger" onClick={() => setOpen(!open)}>{trigger}</div>
      {open && menuPos && (
        <div
          className={`tb-dropdown-menu${align === 'right' ? ' tb-dropdown-right' : ''}`}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, right: align === 'right' ? (window.innerWidth - menuPos.left) : undefined }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

const Toolbar: React.FC = () => {
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const subType = useStore((s) => s.subType);
  const chartType = useStore((s) => s.chartType);
  const indicators = useStore((s) => s.indicators);
  const showChipDistribution = useStore((s) => s.showChipDistribution);
  const showVolumeProfile = useStore((s) => s.showVolumeProfile);
  const setSubType = useStore((s) => s.setSubType);
  const setChartType = useStore((s) => s.setChartType);
  const toggleIndicator = useStore((s) => s.toggleIndicator);
  const toggleChipDistribution = useStore((s) => s.toggleChipDistribution);
  const toggleReplayMode = useStore((s) => s.toggleReplayMode);
  const toggleVolumeProfile = useStore((s) => s.toggleVolumeProfile);
  const comparisonSymbols = useStore((s) => s.comparisonSymbols);
  const addComparison = useStore((s) => s.addComparison);
  const removeComparison = useStore((s) => s.removeComparison);
  const replayMode = useStore((s) => s.replayMode);
  const toggleSymbolSearch = useStore((s) => s.toggleSymbolSearch);
  const chartLayout = useStore((s) => s.chartLayout);
  const setChartLayout = useStore((s) => s.setChartLayout);

  const currentChartLabel = CHART_TYPES.find((ct) => ct.value === chartType)?.label ?? chartType;
  const activeIndicatorCount = indicators.length;

  const QUICK_COMPARE = [
    { code: 'HK.09988', name: '阿里巴巴' }, { code: 'HK.03690', name: '美团' },
    { code: 'US.AAPL', name: 'Apple' }, { code: 'US.TSLA', name: 'Tesla' },
    { code: 'SH.600519', name: '贵州茅台' },
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-symbol-btn" onClick={toggleSymbolSearch} title="搜索股票">
          <span className="toolbar-symbol">{currentName}</span>
          <span className="toolbar-code">{currentCode}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className="toolbar-caret"><path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
        </button>
        <div className="toolbar-divider" />
        <div className="tb-period-group">
          {SUB_TYPES.slice(0, 5).map((t) => (
            <button key={t.value} className={`toolbar-btn${subType === t.value ? ' toolbar-btn-active' : ''}`} onClick={() => setSubType(t.value)}>{t.label}</button>
          ))}
          <Dropdown trigger={<button className="toolbar-btn toolbar-btn-icon" title="更多周期"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg></button>}>
            {(close) => SUB_TYPES.slice(5).map((t) => (
              <div key={t.value} className={`tb-menu-item${subType === t.value ? ' tb-menu-item-active' : ''}`} onClick={() => { setSubType(t.value); close(); }}>{t.label}</div>
            ))}
          </Dropdown>
        </div>
        <div className="toolbar-divider" />
        <Dropdown trigger={<button className="toolbar-btn"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="6" width="2" height="4" fill="#26a69a" rx="0.5"/><rect x="4" y="4" width="2" height="6" fill="#26a69a" rx="0.5"/><rect x="7" y="7" width="2" height="3" fill="#ef5350" rx="0.5"/><rect x="10" y="5" width="2" height="5" fill="#ef5350" rx="0.5"/></svg>{currentChartLabel}</button>}>
          {(close) => CHART_TYPES.map((ct) => (
            <div key={ct.value} className={`tb-menu-item${chartType === ct.value ? ' tb-menu-item-active' : ''}`} onClick={() => { setChartType(ct.value as any); close(); }}>{ct.label}</div>
          ))}
        </Dropdown>
        <Dropdown trigger={<button className="toolbar-btn"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 8 Q4 2, 6 6 T11 2" fill="none" stroke="#2962ff" strokeWidth="1.2"/><circle cx="11" cy="2" r="1.2" fill="#2962ff"/></svg>指标{activeIndicatorCount > 0 ? ` (${activeIndicatorCount})` : ''}</button>}>
          {(close) => (
            <>
              <div className="tb-menu-section">主图指标</div>
              {INDICATORS_MAIN.map((ind) => (<div key={ind} className={`tb-menu-item${indicators.includes(ind) ? ' tb-menu-item-active' : ''}`} onClick={() => toggleIndicator(ind)}><span className="tb-menu-check">{indicators.includes(ind) ? '\u2713' : ''}</span>{ind}</div>))}
              <div className="tb-menu-section">副图指标</div>
              {INDICATORS_SUB.map((ind) => (<div key={ind} className={`tb-menu-item${indicators.includes(ind) ? ' tb-menu-item-active' : ''}`} onClick={() => toggleIndicator(ind)}><span className="tb-menu-check">{indicators.includes(ind) ? '\u2713' : ''}</span>{ind}</div>))}
            </>
          )}
        </Dropdown>
        <Dropdown trigger={<button className="toolbar-btn"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 9 Q4 3, 7 7 T11 3" fill="none" stroke="#2962ff" strokeWidth="1.2"/><path d="M1 7 Q4 5, 7 5 T11 1" fill="none" stroke="#f59e0b" strokeWidth="1.2"/></svg>对比{comparisonSymbols.length > 0 ? ` (${comparisonSymbols.length})` : ''}</button>}>
          {(close) => (
            <>
              <div className="tb-menu-section">添加对比</div>
              {QUICK_COMPARE.filter((q) => !comparisonSymbols.find((c) => c.code === q.code) && q.code !== currentCode).map((q) => (
                <div key={q.code} className="tb-menu-item" onClick={() => addComparison(q.code, q.name)}><span className="tb-menu-check">+</span>{q.name}</div>
              ))}
              {comparisonSymbols.length > 0 && (<><div className="tb-menu-section">已添加对比</div>{comparisonSymbols.map((c) => (
                <div key={c.code} className="tb-menu-item" onClick={() => removeComparison(c.code)}><span className="tb-menu-check" style={{ color: c.color }}>●</span>{c.name}<span className="tb-menu-check" style={{ marginLeft: 'auto', color: '#ef5350' }}>✕</span></div>
              ))}</>)}
            </>
          )}
        </Dropdown>
        <Dropdown trigger={<button className="toolbar-btn toolbar-btn-icon" title="布局"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1"/><rect x="7" y="1" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1"/><rect x="1" y="7" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1"/><rect x="7" y="7" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1"/></svg></button>}>
          {(close) => CHART_LAYOUTS.map((l) => (
            <div key={l.value} className={`tb-menu-item${chartLayout === l.value ? ' tb-menu-item-active' : ''}`} onClick={() => { setChartLayout(l.value); close(); }}>{l.label}</div>
          ))}
        </Dropdown>
        <Dropdown trigger={<button className="toolbar-btn toolbar-btn-icon" title="图表工具"><svg width="12" height="12" viewBox="0 0 12 12"><circle cx="2" cy="6" r="1.2" fill="currentColor"/><circle cx="6" cy="6" r="1.2" fill="currentColor"/><circle cx="10" cy="6" r="1.2" fill="currentColor"/></svg></button>}>
          {(close) => (
            <>
              <div className={`tb-menu-item${showChipDistribution ? ' tb-menu-item-active' : ''}`} onClick={() => { toggleChipDistribution(); close(); }}>筹码分布</div>
              <div className={`tb-menu-item${showVolumeProfile ? ' tb-menu-item-active' : ''}`} onClick={() => { toggleVolumeProfile(); close(); }}>量分布</div>
              <div className={`tb-menu-item${replayMode ? ' tb-menu-item-active' : ''}`} onClick={() => { toggleReplayMode(); close(); }}>K线回放</div>
            </>
          )}
        </Dropdown>
      </div>
    </div>
  );
};

export default Toolbar;
