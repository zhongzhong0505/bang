import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import type { KlineData } from '../../../shared/types';

interface Props {
  data: KlineData[];
  mainChart: IChartApi;
}

const VolumeProfile: React.FC<Props> = ({ data, mainChart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [revision, setRevision] = useState(0);

  const buckets = useMemo(() => {
    if (data.length === 0) return [];
    let minPrice = Infinity, maxPrice = -Infinity;
    for (const d of data) {
      if (d.low < minPrice) minPrice = d.low;
      if (d.high > maxPrice) maxPrice = d.high;
    }
    const range = maxPrice - minPrice;
    if (range <= 0) return [];
    const bucketCount = 60;
    const step = range / bucketCount;
    const volumes = new Float64Array(bucketCount);
    const upVolumes = new Float64Array(bucketCount);
    for (const d of data) {
      const startIdx = Math.max(0, Math.floor((d.low - minPrice) / step));
      const endIdx = Math.min(bucketCount - 1, Math.floor((d.high - minPrice) / step));
      const volPerBucket = d.volume / (endIdx - startIdx + 1);
      for (let b = startIdx; b <= endIdx; b++) {
        volumes[b] += volPerBucket;
        if (d.close >= d.open) upVolumes[b] += volPerBucket;
      }
    }
    return Array.from(volumes, (vol, i) => ({
      price: +(minPrice + (i + 0.5) * step).toFixed(2),
      volume: vol,
      upVolume: upVolumes[i],
      downVolume: vol - upVolumes[i],
    }));
  }, [data]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || buckets.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const h = rect.height;
    const w = rect.width;
    if (h <= 0 || w <= 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    let minPrice = Infinity, maxPrice = -Infinity;
    try {
      const range = mainChart.priceScale('right').getVisiblePriceRange();
      if (range) { minPrice = range.from; maxPrice = range.to; }
    } catch {}
    if (!isFinite(minPrice) || !isFinite(maxPrice)) {
      for (const d of data) {
        if (d.low < minPrice) minPrice = d.low;
        if (d.high > maxPrice) maxPrice = d.high;
      }
    }
    const priceRange = maxPrice - minPrice;
    if (priceRange <= 0) return;

    let maxVol = 0;
    for (const b of buckets) if (b.volume > maxVol) maxVol = b.volume;
    if (maxVol === 0) return;

    const barMaxWidth = w - 4;
    const bucketStep = (buckets[buckets.length - 1].price - buckets[0].price) / buckets.length;
    const barH = Math.max(1, (h / priceRange) * bucketStep);

    for (const b of buckets) {
      if (b.price < minPrice || b.price > maxPrice) continue;
      const y = h - ((b.price - minPrice) / priceRange) * h;

      // Up volume (green, drawn to the right)
      const upW = (b.upVolume / maxVol) * barMaxWidth;
      ctx.fillStyle = 'rgba(38, 166, 154, 0.35)';
      ctx.fillRect(0, y - barH / 2, upW, barH);

      // Down volume (red, drawn to the left of up volume)
      const downW = (b.downVolume / maxVol) * barMaxWidth;
      ctx.fillStyle = 'rgba(239, 83, 80, 0.35)';
      ctx.fillRect(upW, y - barH / 2, downW, barH);
    }
  }, [buckets, data, mainChart]);

  useEffect(() => { draw(); }, [draw, revision]);

  useEffect(() => {
    if (!mainChart) return;
    const handler = () => {
      requestAnimationFrame(() => setRevision((r) => r + 1));
    };
    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    return () => { mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handler); };
  }, [mainChart]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => setRevision((r) => r + 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="volume-profile">
      <canvas ref={canvasRef} className="volume-profile-canvas" />
    </div>
  );
};

export default VolumeProfile;
