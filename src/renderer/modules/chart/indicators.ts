import type { KlineData } from '../../../shared/types';

export function computeMA(data: KlineData[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    return +(sum / period).toFixed(2);
  });
}

export function computeEMA(data: KlineData[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  return data.map((d, i) => {
    if (i < period - 1) return null;
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      return +(sum / period).toFixed(2);
    }
    const prev = computeEMA(data.slice(0, i), period);
    const prevVal = prev[prev.length - 1] ?? data[i - 1].close;
    return +(d.close * k + prevVal * (1 - k)).toFixed(2);
  });
}

export function computeBollinger(data: KlineData[], period = 20, mult = 2): { upper: (number | null)[]; mid: (number | null)[]; lower: (number | null)[] } {
  const mid = computeMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  data.forEach((_, i) => {
    if (i < period - 1) { upper.push(null); lower.push(null); return; }
    let sumSq = 0;
    for (let j = 0; j < period; j++) sumSq += (data[i - j].close - (mid[i] ?? 0)) ** 2;
    const std = Math.sqrt(sumSq / period);
    upper.push(mid[i] !== null ? +(mid[i]! + mult * std).toFixed(2) : null);
    lower.push(mid[i] !== null ? +(mid[i]! - mult * std).toFixed(2) : null);
  });
  return { upper, mid, lower };
}

export function computeMACD(data: KlineData[], fast = 12, slow = 26, signal = 9) {
  const emaFast = computeEMA(data, fast);
  const emaSlow = computeEMA(data, slow);
  const dif = data.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return +(emaFast[i]! - emaSlow[i]!).toFixed(4);
  });
  const dea: (number | null)[] = data.map((_, i) => {
    if (i < slow + signal - 2) return null;
    let sum = 0;
    let count = 0;
    for (let j = 0; j < signal; j++) {
      const idx = i - j;
      if (idx >= 0 && dif[idx] !== null) { sum += dif[idx]!; count++; }
    }
    return count === signal ? +(sum / signal).toFixed(4) : null;
  });
  const histogram = data.map((_, i) => {
    if (dif[i] === null || dea[i] === null) return null;
    return +(dif[i]! - dea[i]!).toFixed(4);
  });
  return { dif, dea, histogram };
}

export function computeRSI(data: KlineData[], period = 14): (number | null)[] {
  return data.map((_, i) => {
    if (i < period) return null;
    let gain = 0, loss = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - data[i - j - 1].close;
      if (diff > 0) gain += diff; else loss -= diff;
    }
    const avgGain = gain / period;
    const avgLoss = loss / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return +(100 - 100 / (1 + rs)).toFixed(2);
  });
}

// ===== Additional indicators =====

export function computeStochastic(data: KlineData[], kPeriod = 9, dPeriod = 3): { k: (number | null)[]; d: (number | null)[] } {
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) { k.push(null); d.push(null); continue; }
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      const idx = i - j;
      if (data[idx].high > highestHigh) highestHigh = data[idx].high;
      if (data[idx].low < lowestLow) lowestLow = data[idx].low;
    }
    const rsv = highestHigh === lowestLow ? 50 : ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
    k.push(+rsv.toFixed(2));
    if (i >= kPeriod + dPeriod - 2) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < dPeriod; j++) {
        const kVal = k[i - j];
        if (kVal !== null) { sum += kVal; count++; }
      }
      d.push(count === dPeriod ? +(sum / dPeriod).toFixed(2) : null);
    } else {
      d.push(null);
    }
  }
  return { k, d };
}

export function computeOBV(data: KlineData[]): (number | null)[] {
  const obv: (number | null)[] = [0];
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv.push((obv[i - 1] ?? 0) + data[i].volume);
    } else if (data[i].close < data[i - 1].close) {
      obv.push((obv[i - 1] ?? 0) - data[i].volume);
    } else {
      obv.push(obv[i - 1] ?? 0);
    }
  }
  return obv;
}

export function computeATR(data: KlineData[], period = 14): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr.push(data[i].high - data[i].low);
    } else {
      const hl = data[i].high - data[i].low;
      const hc = Math.abs(data[i].high - data[i - 1].close);
      const lc = Math.abs(data[i].low - data[i - 1].close);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  const atr: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { atr.push(null); continue; }
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += tr[i - j];
      atr.push(+(sum / period).toFixed(2));
    } else {
      const prev = atr[i - 1] ?? 0;
      atr.push(+((prev * (period - 1) + tr[i]) / period).toFixed(2));
    }
  }
  return atr;
}

export function computeCCI(data: KlineData[], period = 20): (number | null)[] {
  const result: (number | null)[] = [];
  const tp: number[] = data.map((d) => (d.high + d.low + d.close) / 3);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sumTP = 0;
    for (let j = 0; j < period; j++) sumTP += tp[i - j];
    const meanTP = sumTP / period;
    let meanDev = 0;
    for (let j = 0; j < period; j++) meanDev += Math.abs(tp[i - j] - meanTP);
    meanDev /= period;
    if (meanDev === 0) { result.push(0); continue; }
    const cci = (tp[i] - meanTP) / (0.015 * meanDev);
    result.push(+cci.toFixed(2));
  }
  return result;
}

export function computeADX(data: KlineData[], period = 14): { adx: (number | null)[]; plusDI: (number | null)[]; minusDI: (number | null)[] } {
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    const upMove = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }
  const plusDI: (number | null)[] = [];
  const minusDI: (number | null)[] = [];
  const adx: (number | null)[] = [];
  const dxValues: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) { plusDI.push(null); minusDI.push(null); adx.push(null); continue; }
    let trSum = 0, pdmSum = 0, mdmSum = 0;
    for (let j = 0; j < period; j++) { trSum += tr[i - j]; pdmSum += plusDM[i - j]; mdmSum += minusDM[i - j]; }
    const pdi = trSum > 0 ? (pdmSum / trSum) * 100 : 0;
    const mdi = trSum > 0 ? (mdmSum / trSum) * 100 : 0;
    plusDI.push(+pdi.toFixed(2));
    minusDI.push(+mdi.toFixed(2));
    const dx = pdi + mdi > 0 ? (Math.abs(pdi - mdi) / (pdi + mdi)) * 100 : 0;
    dxValues.push(dx);
    if (dxValues.length >= period) {
      const startIdx = dxValues.length - period;
      let adxSum = 0;
      for (let j = startIdx; j < dxValues.length; j++) adxSum += dxValues[j];
      adx.push(+(adxSum / period).toFixed(2));
    } else {
      adx.push(null);
    }
  }
  return { adx, plusDI, minusDI };
}

export function computeWilliamsR(data: KlineData[], period = 14): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < period; j++) {
      const idx = i - j;
      if (data[idx].high > highestHigh) highestHigh = data[idx].high;
      if (data[idx].low < lowestLow) lowestLow = data[idx].low;
    }
    if (highestHigh === lowestLow) return -50;
    return +(((highestHigh - data[i].close) / (highestHigh - lowestLow)) * -100).toFixed(2);
  });
}

export function computeKDJ(data: KlineData[], kPeriod = 9, dPeriod = 3): { k: (number | null)[]; d: (number | null)[]; j: (number | null)[] } {
  const { k, d } = computeStochastic(data, kPeriod, dPeriod);
  const j: (number | null)[] = k.map((kVal, i) => {
    if (kVal === null || d[i] === null) return null;
    return +(3 * kVal - 2 * d[i]!).toFixed(2);
  });
  return { k, d, j };
}

export function computeWR(data: KlineData[], period = 14): (number | null)[] {
  return computeWilliamsR(data, period);
}

export function computeSAR(data: KlineData[], step = 0.02, maxStep = 0.2): (number | null)[] {
  if (data.length === 0) return [];
  const result: (number | null)[] = [];
  let isUp = data[0].close <= data[0].open;
  let af = step;
  let ep = isUp ? data[0].high : data[0].low;
  let sar = isUp ? data[0].low : data[0].high;
  result.push(sar);
  for (let i = 1; i < data.length; i++) {
    sar = sar + af * (ep - sar);
    if (isUp) {
      if (data[i].low < sar) {
        isUp = false;
        sar = ep;
        ep = data[i].low;
        af = step;
      } else {
        if (data[i].high > ep) { ep = data[i].high; af = Math.min(af + step, maxStep); }
      }
    } else {
      if (data[i].high > sar) {
        isUp = true;
        sar = ep;
        ep = data[i].high;
        af = step;
      } else {
        if (data[i].low < ep) { ep = data[i].low; af = Math.min(af + step, maxStep); }
      }
    }
    result.push(+sar.toFixed(2));
  }
  return result;
}

export function computeVWAP(data: KlineData[]): (number | null)[] {
  let cumPV = 0;
  let cumVol = 0;
  return data.map((d) => {
    const typicalPrice = (d.high + d.low + d.close) / 3;
    cumPV += typicalPrice * d.volume;
    cumVol += d.volume;
    return cumVol > 0 ? +(cumPV / cumVol).toFixed(2) : null;
  });
}
