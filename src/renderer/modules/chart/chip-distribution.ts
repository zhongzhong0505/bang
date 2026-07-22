import type { KlineData } from '../../../shared/types';

export interface ChipBucket {
  price: number;
  volume: number;
  ratio: number;
  profit: boolean;
}

export function computeChipDistribution(
  data: KlineData[],
  bucketCount = 80,
  decayFactor = 0.98,
): ChipBucket[] {
  if (data.length === 0) return [];

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const d of data) {
    if (d.low < minPrice) minPrice = d.low;
    if (d.high > maxPrice) maxPrice = d.high;
  }
  const range = maxPrice - minPrice;
  if (range <= 0) return [];
  const step = range / bucketCount;

  const buckets = new Float64Array(bucketCount);
  const totalBars = data.length;

  for (let i = 0; i < totalBars; i++) {
    const d = data[i];
    const age = totalBars - 1 - i;
    const weight = Math.pow(decayFactor, age);
    const barRange = d.high - d.low;

    if (barRange <= 0) {
      const idx = Math.floor((d.close - minPrice) / step);
      if (idx >= 0 && idx < bucketCount) buckets[idx] += d.volume * weight;
      continue;
    }

    const startIdx = Math.max(0, Math.floor((d.low - minPrice) / step));
    const endIdx = Math.min(bucketCount - 1, Math.floor((d.high - minPrice) / step));
    const volPerBucket = (d.volume * weight) / (endIdx - startIdx + 1);
    for (let b = startIdx; b <= endIdx; b++) {
      buckets[b] += volPerBucket;
    }
  }

  const currentPrice = data[data.length - 1].close;
  const totalVolume = buckets.reduce((s, v) => s + v, 0);

  return Array.from(buckets, (vol, i) => ({
    price: +(minPrice + (i + 0.5) * step).toFixed(2),
    volume: vol,
    ratio: totalVolume > 0 ? +(vol / totalVolume * 100).toFixed(2) : 0,
    profit: (minPrice + (i + 0.5) * step) <= currentPrice,
  }));
}

export function computeProfitRatio(buckets: ChipBucket[]): number {
  if (buckets.length === 0) return 0;
  const profitVol = buckets.filter((b) => b.profit).reduce((s, b) => s + b.volume, 0);
  const totalVol = buckets.reduce((s, b) => s + b.volume, 0);
  return totalVol > 0 ? +(profitVol / totalVol * 100).toFixed(1) : 0;
}

export function findChipPeak(buckets: ChipBucket[]): { price: number; ratio: number } | null {
  if (buckets.length === 0) return null;
  let maxIdx = 0;
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i].ratio > buckets[maxIdx].ratio) maxIdx = i;
  }
  return { price: buckets[maxIdx].price, ratio: buckets[maxIdx].ratio };
}
