import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { CustomIndicator, CustomIndicatorLine, CustomIndicatorMode } from '../../../shared/types';
import { evalCustomIndicator } from './custom-indicator-engine';
import CodeHighlight from './CodeHighlight';
import './custom-indicator-editor.css';

const LINE_COLORS = ['#2962ff', '#f59e0b', '#ef5350', '#26a69a', '#ab47bc', '#06b6d4', '#ff9800', '#8b5cf6'];

const DEFAULT_CODE = `// data: KlineData[] — each item has { time, open, high, low, close, volume, turnover }
// helpers: { ma, ema, stddev, ref, hhv, llv }
// Any params you defined are also available as variables.
//
// Return an object whose keys match your line names,
// each value being an array (same length as data).

const myLine = helpers.ma(data, 20);
return { MyLine: myLine };`;

const CustomIndicatorEditor: React.FC<{
  initial?: CustomIndicator;
  onClose: () => void;
}> = ({ initial, onClose }) => {
  const addCustomIndicator = useStore((s) => s.addCustomIndicator);
  const updateCustomIndicator = useStore((s) => s.updateCustomIndicator);
  const klineData = useStore((s) => s.klineData);

  const L = useTBatch([
    'customInd.editorTitle', 'customInd.name', 'customInd.mode', 'customInd.overlay',
    'customInd.subchart', 'customInd.lines', 'customInd.addLine', 'customInd.code',
    'customInd.params', 'customInd.save', 'customInd.cancel', 'customInd.test',
    'customInd.testOk', 'customInd.testFail', 'customInd.lineName', 'customInd.deleteLine',
  ] as any);

  const [name, setName] = useState(initial?.name ?? '');
  const [mode, setMode] = useState<CustomIndicatorMode>(initial?.mode ?? 'overlay');
  const [lines, setLines] = useState<CustomIndicatorLine[]>(initial?.lines ?? [{ name: 'MyLine', color: '#2962ff' }]);
  const [code, setCode] = useState(initial?.code ?? DEFAULT_CODE);
  const [params, setParams] = useState<Record<string, number>>(initial?.params ?? {});
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [testOutput, setTestOutput] = useState<string>('');

  const addParam = () => {
    const key = `p${Object.keys(params).length + 1}`;
    setParams((p) => ({ ...p, [key]: 14 }));
  };
  const removeParam = (key: string) => {
    const next = { ...params };
    delete next[key];
    setParams(next);
  };
  const updateParamKey = (oldKey: string, newKey: string) => {
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(params)) {
      next[k === oldKey ? newKey : k] = v;
    }
    setParams(next);
  };
  const updateParamValue = (key: string, val: number) => {
    setParams((p) => ({ ...p, [key]: val }));
  };

  const addLine = () => {
    const idx = lines.length;
    setLines((l) => [...l, { name: `Line${idx + 1}`, color: LINE_COLORS[idx % LINE_COLORS.length] }]);
  };

  const handleTest = useCallback(() => {
    const testData = klineData.length > 0 ? klineData : [];
    const id = initial?.id ?? 'test';
    const ind: CustomIndicator = { id, name, mode, code, lines, params };
    const result = evalCustomIndicator(ind, testData.length > 0 ? testData : generateDummyData());
    if (result) {
      const keys = Object.keys(result);
      const lens = keys.map((k) => `${k}: ${(result[k] as any[]).length}pts`);
      setTestResult('ok');
      setTestOutput(lens.join(', '));
    } else {
      setTestResult('fail');
      setTestOutput('');
    }
  }, [initial, name, mode, code, lines, params, klineData]);

  const handleSave = () => {
    const id = initial?.id ?? `custom-${Date.now()}`;
    const ind: CustomIndicator = { id, name, mode, code, lines, params };
    if (initial) {
      updateCustomIndicator(id, ind);
    } else {
      addCustomIndicator(ind);
    }
    onClose();
  };

  return (
    <div className="cie-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cie-panel">
        <div className="cie-header">
          <span className="cie-title">{L['customInd.editorTitle']}</span>
          <button className="cie-close" onClick={onClose}>✕</button>
        </div>

        <div className="cie-body">
          <label className="cie-label">{L['customInd.name']}
            <input className="cie-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MyMA" />
          </label>

          <label className="cie-label">{L['customInd.mode']}
            <div className="cie-mode-group">
              <button className={`cie-mode-btn${mode === 'overlay' ? ' cie-mode-btn-active' : ''}`} onClick={() => setMode('overlay')}>{L['customInd.overlay']}</button>
              <button className={`cie-mode-btn${mode === 'subchart' ? ' cie-mode-btn-active' : ''}`} onClick={() => setMode('subchart')}>{L['customInd.subchart']}</button>
            </div>
          </label>

          <div className="cie-section">
            <div className="cie-section-header">
              <span>{L['customInd.lines']}</span>
              <button className="cie-add-btn" onClick={addLine}>+ {L['customInd.addLine']}</button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="cie-line-row">
                <input className="cie-line-name" value={line.name} placeholder={L['customInd.lineName']}
                  onChange={(e) => setLines((l) => l.map((li, i) => i === idx ? { ...li, name: e.target.value } : li))} />
                <input type="color" className="cie-line-color" value={line.color}
                  onChange={(e) => setLines((l) => l.map((li, i) => i === idx ? { ...li, color: e.target.value } : li))} />
                {lines.length > 1 && <button className="cie-del-btn" onClick={() => setLines((l) => l.filter((_, i) => i !== idx))}>{L['customInd.deleteLine']}</button>}
              </div>
            ))}
          </div>

          <div className="cie-section">
            <div className="cie-section-header">
              <span>{L['customInd.params']}</span>
              <button className="cie-add-btn" onClick={addParam}>+ param</button>
            </div>
            {Object.entries(params).map(([key, val]) => (
              <div key={key} className="cie-param-row">
                <input className="cie-param-key" value={key} onChange={(e) => updateParamKey(key, e.target.value)} />
                <input type="number" className="cie-param-val" value={val} onChange={(e) => updateParamValue(key, +e.target.value)} />
                <button className="cie-del-btn" onClick={() => removeParam(key)}>✕</button>
              </div>
            ))}
          </div>

          <div className="cie-section cie-code-section">
            <div className="cie-section-header">
              <span>{L['customInd.code']}</span>
              <div className="cie-test-group">
                <button className="cie-test-btn" onClick={handleTest}>{L['customInd.test']}</button>
                {testResult === 'ok' && <span className="cie-test-ok">{L['customInd.testOk']} {testOutput}</span>}
                {testResult === 'fail' && <span className="cie-test-fail">{L['customInd.testFail']}</span>}
              </div>
            </div>
            <CodeHighlight value={code} onChange={setCode} minLines={18} className="cie-code" />
          </div>
        </div>

        <div className="cie-footer">
          <button className="cie-cancel-btn" onClick={onClose}>{L['customInd.cancel']}</button>
          <button className="cie-save-btn" onClick={handleSave} disabled={!name || !code}>{L['customInd.save']}</button>
        </div>
      </div>
    </div>
  );
};

/** Small dummy dataset for testing when no live data is available. */
function generateDummyData() {
  const out: { time: number; open: number; high: number; low: number; close: number; volume: number; turnover: number }[] = [];
  const now = Math.floor(Date.now() / 1000);
  let p = 100;
  for (let i = 100; i >= 0; i--) {
    const time = now - i * 86400;
    const o = p;
    const c = o + (Math.random() - 0.5) * 3;
    const h = Math.max(o, c) + Math.random();
    const l = Math.min(o, c) - Math.random();
    const vol = 50000 + Math.random() * 500000;
    out.push({ time, open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +c.toFixed(2), volume: Math.floor(vol), turnover: Math.floor(vol * c) });
    p = c;
  }
  return out;
}

export default CustomIndicatorEditor;
