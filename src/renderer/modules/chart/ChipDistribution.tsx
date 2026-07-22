import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';
import type { KlineData } from '../../../shared/types';
import { computeChipDistribution, computeProfitRatio, findChipPeak } from './chip-distribution';
import './chart.css';

interface Props {
  data: KlineData[];
  mainChart: IChartApi | null;
}

const ChipDistribution: React.FC<Props> = ({ data, mainChart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [revision, setRevision] = useState(0);

  const buckets = useMemo(() => computeChipDistribution(data), [data]);
  const profitRatio = useMemo(() => computeProfitRatio(buckets), [buckets]);
  const peak = useMemo(() => findChipPeak(buckets), [buckets]);

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
    const priceScale = mainChart?.priceScale('right');
    if (priceScale) {
      try {
        const range = priceScale.getVisiblePriceRange();
        if (range) { minPrice = range.from; maxPrice = range.to; }
      } catch {}
    }
    if (!isFinite(minPrice) || !isFinite(maxPrice)) {
      for (const d of data) {
        if (d.low < minPrice) minPrice = d.low;
        if (d.high > maxPrice) maxPrice = d.high;
      }
    }
    const priceRange = maxPrice - minPrice;
    if (priceRange <= 0) return;

    let maxVol = 0;
    for (const b of buckets) { if (b.volume > maxVol) maxVol = b.volume; }
    if (maxVol === 0) return;

    const barMaxWidth = w - 8;
    const currentPrice = data[data.length - 1].close;
    const bucketStep = (buckets[buckets.length - 1].price - buckets[0].price) / buckets.length;
    const barH = Math.max(1, (h / priceRange) * bucketStep);

    for (const b of buckets) {
      if (b.price < minPrice || b.price > maxPrice) continue;
      const y = h - ((b.price - minPrice) / priceRange) * h;
      const barW = (b.volume / maxVol) * barMaxWidth;

      if (b.profit) {
        const grad = ctx.createLinearGradient(4, 0, 4 + barW, 0);
        grad.addColorStop(0, 'rgba(38, 166, 154, 0.08)');
        grad.addColorStop(1, 'rgba(38, 166, 154, 0.55)');
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createLinearGradient(4, 0, 4 + barW, 0);
        grad.addColorStop(0, 'rgba(239, 83, 80, 0.08)');
        grad.addColorStop(1, 'rgba(239, 83, 80, 0.55)');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(4, y - barH / 2, barW, barH);
    }

    const curY = h - ((currentPrice - minPrice) / priceRange) * h;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(w, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2962ff';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(2), w / 2, curY - 4);

    ctx.fillStyle = profitRatio >= 50 ? '#26a69a' : '#ef5350';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText(`获利 ${profitRatio}%`, w / 2, 16);

    if (peak) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText(`峰 ${peak.price}`, w / 2, 30);
    }
  }, [buckets, data, mainChart, profitRatio, peak]);

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
    <div ref={containerRef} className="chip-dist">
      <canvas ref={canvasRef} className="chip-dist-canvas" />
    </div>
  );
};

export default ChipDistribution;
