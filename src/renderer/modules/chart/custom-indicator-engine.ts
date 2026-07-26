/**
 * Custom indicator engine.
 *
 * Safely evaluates user-authored indicator code inside a `Function`
 * sandbox (no access to DOM, window, or Node globals). The user function
 * receives the K-line data array plus a small set of helper math utilities
 * and returns an object mapping line names to numeric arrays.
 */
import type { KlineData, CustomIndicator } from '../../../shared/types';

export interface IndicatorResult {
  /** keyed by line name → array of numbers (same length as data) */
  [lineName: string]: (number | null)[];
}

export interface IndicatorHelpers {
  /** Simple Moving Average over a field (defaults to close) */
  ma: (data: KlineData[], period: number, field?: keyof KlineData) => (number | null)[];
  /** Exponential Moving Average */
  ema: (data: KlineData[], period: number, field?: keyof KlineData) => (number | null)[];
  /** Standard deviation */
  stddev: (data: KlineData[], period: number, field?: keyof KlineData) => (number | null)[];
  /** Shift a series by n bars (positive = look back) */
  ref: (arr: (number | null)[], offset: number) => (number | null)[];
  /** Highest value over period */
  hhv: (data: KlineData[], period: number, field?: keyof KlineData) => (number | null)[];
  /** Lowest value over period */
  llv: (data: KlineData[], period: number, field?: keyof KlineData) => (number | null)[];
}

const helpers: IndicatorHelpers = {
  ma(data, period, field = 'close') {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j][field] as number;
      return +(sum / period).toFixed(4);
    });
  },
  ema(data, period, field = 'close') {
    const k = 2 / (period + 1);
    const result: (number | null)[] = [];
    let prev: number | null = null;
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { result.push(null); continue; }
      if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j][field] as number;
        prev = sum / period;
        result.push(+prev.toFixed(4));
        continue;
      }
      prev = (data[i][field] as number) * k + prev! * (1 - k);
      result.push(+prev.toFixed(4));
    }
    return result;
  },
  stddev(data, period, field = 'close') {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const vals = data.slice(i - period + 1, i + 1).map((d) => d[field] as number);
      const mean = vals.reduce((a, b) => a + b, 0) / period;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
      return +Math.sqrt(variance).toFixed(4);
    });
  },
  ref(arr, offset) {
    return arr.map((_, i) => (i - offset >= 0 ? arr[i - offset] : null));
  },
  hhv(data, period, field = 'high') {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      let max = -Infinity;
      for (let j = 0; j < period; j++) max = Math.max(max, data[i - j][field] as number);
      return +max.toFixed(4);
    });
  },
  llv(data, period, field = 'low') {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      let min = Infinity;
      for (let j = 0; j < period; j++) min = Math.min(min, data[i - j][field] as number);
      return +min.toFixed(4);
    });
  },
};

/**
 * Evaluate a custom indicator definition against K-line data.
 * Returns null if the code throws or returns an invalid shape.
 */
export function evalCustomIndicator(
  indicator: CustomIndicator,
  data: KlineData[],
): IndicatorResult | null {
  if (!data || data.length === 0) return null;
  try {
    // Build a function with only the helpers and params exposed.
    // The user code is the function body; `data` and `helpers` are args.
    const paramNames = indicator.params ? Object.keys(indicator.params) : [];
    const paramValues = indicator.params ? Object.values(indicator.params) : [];

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      'data',
      'helpers',
      ...paramNames,
      `"use strict";\n${indicator.code}`,
    );

    const result = fn(data, helpers, ...paramValues) as IndicatorResult;

    if (!result || typeof result !== 'object') return null;

    // Validate: each declared line should exist as an array
    for (const line of indicator.lines) {
      if (!(line.name in result)) {
        // If the line isn't present, fill with nulls
        result[line.name] = data.map(() => null);
      }
      if (!Array.isArray(result[line.name])) return null;
    }

    return result;
  } catch (err) {
    console.error(`[CustomIndicator] "${indicator.name}" error:`, err);
    return null;
  }
}

/** Default indicator presets shipped with the app */
export const DEFAULT_CUSTOM_PRESETS: CustomIndicator[] = [
  {
    id: 'preset-dmi',
    name: 'DMI',
    mode: 'subchart',
    params: { period: 14 },
    lines: [
      { name: 'PDI', color: '#26a69a', lineWidth: 1 },
      { name: 'MDI', color: '#ef5350', lineWidth: 1 },
      { name: 'ADX', color: '#f59e0b', lineWidth: 2 },
    ],
    code: `// DMI (Directional Movement Index)
// params: period (default 14)
const p = period;
const tr = [], plusDM = [], minusDM = [];
for (let i = 0; i < data.length; i++) {
  if (i === 0) { tr.push(data[i].high - data[i].low); plusDM.push(0); minusDM.push(0); continue; }
  const hl = data[i].high - data[i].low;
  const hc = Math.abs(data[i].high - data[i-1].close);
  const lc = Math.abs(data[i].low - data[i-1].close);
  tr.push(Math.max(hl, hc, lc));
  const up = data[i].high - data[i-1].high;
  const down = data[i-1].low - data[i].low;
  plusDM.push(up > down && up > 0 ? up : 0);
  minusDM.push(down > up && down > 0 ? down : 0);
}
const PDI = [], MDI = [], dxArr = [];
for (let i = 0; i < data.length; i++) {
  if (i < p) { PDI.push(NaN); MDI.push(NaN); dxArr.push(NaN); continue; }
  let trS = 0, pS = 0, mS = 0;
  for (let j = 0; j < p; j++) { trS += tr[i-j]; pS += plusDM[i-j]; mS += minusDM[i-j]; }
  const pdi = trS > 0 ? (pS / trS) * 100 : 0;
  const mdi = trS > 0 ? (mS / trS) * 100 : 0;
  PDI.push(+pdi.toFixed(2));
  MDI.push(+mdi.toFixed(2));
  const dx = pdi + mdi > 0 ? Math.abs(pdi - mdi) / (pdi + mdi) * 100 : 0;
  dxArr.push(dx);
}
const ADX = [];
for (let i = 0; i < data.length; i++) {
  if (i < p * 2 - 1) { ADX.push(NaN); continue; }
  const start = i - p + 1;
  let sum = 0;
  for (let j = 0; j < p; j++) sum += dxArr[start + j];
  ADX.push(+(sum / p).toFixed(2));
}
return { PDI, MDI, ADX };`,
  },
  {
    id: 'preset-env',
    name: 'ENV',
    mode: 'overlay',
    params: { period: 20, mult: 0.05 },
    lines: [
      { name: 'Upper', color: '#f59e0b', lineStyle: 2 },
      { name: 'Mid', color: '#787b86', lineStyle: 2 },
      { name: 'Lower', color: '#f59e0b', lineStyle: 2 },
    ],
    code: `// Envelope (ENV) — price bands at +/- mult around MA
const ma = helpers.ma(data, period);
const Upper = [], Mid = [], Lower = [];
for (let i = 0; i < data.length; i++) {
  if (ma[i] === null) { Upper.push(NaN); Mid.push(NaN); Lower.push(NaN); continue; }
  Upper.push(+(ma[i] * (1 + mult)).toFixed(2));
  Mid.push(+ma[i].toFixed(2));
  Lower.push(+(ma[i] * (1 - mult)).toFixed(2));
}
return { Upper, Mid, Lower };`,
  },
  {
    id: 'preset-mi',
    name: 'MI',
    mode: 'subchart',
    params: { period: 12 },
    lines: [{ name: 'MI', color: '#ab47bc', lineWidth: 1 }],
    code: `// MI (Mass Index) — detects range expansions
const p = period;
const ema1 = helpers.ema(data, 9);
const ema2 = helpers.ema(data.map((d, i) => ({ ...d, close: ema1[i] ?? 0 })), 9);
const mi = data.map((d, i) => {
  if (ema2[i] === null || ema2[i] === 0) return NaN;
  return +(((ema1[i] ?? 0) - (ema2[i] ?? 0)) / (ema2[i] ?? 1) * 100).toFixed(2);
});
const MI = [];
for (let i = 0; i < data.length; i++) {
  if (i < p - 1) { MI.push(NaN); continue; }
  let sum = 0;
  for (let j = 0; j < p; j++) sum += mi[i - j] || 0;
  MI.push(+sum.toFixed(2));
}
return { MI };`,
  },
];
