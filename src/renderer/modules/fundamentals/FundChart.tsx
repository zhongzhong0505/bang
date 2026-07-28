import React, { useMemo } from 'react';

/**
 * Lightweight SVG chart components for financial data visualization.
 * No external dependencies - pure SVG rendering.
 */

// ---- Bar Chart ----

export interface BarSeries {
  name: string;
  color: string;
  values: number[];
}

interface BarChartProps {
  labels: string[];
  series: BarSeries[];
  height?: number;
  formatValue?: (n: number) => string;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  series,
  height = 200,
  formatValue = (n) => n.toFixed(2),
  horizontal = false,
}) => {
  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(...allValues, 0);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const padTop = 20;
  const padBottom = 24;
  const padLeft = 8;
  const padRight = 8;
  const chartH = height - padTop - padBottom;

  if (horizontal) {
    // Horizontal bar chart - for indicator comparison
    const barH = 14;
    const gap = 6;
    const labelW = 80;
    const totalH = labels.length * (barH + gap) + padTop;
    const chartW = 100; // percentage-based, viewBox handles scaling

    return (
      <svg className="fund-svg-chart" viewBox={`0 0 360 ${totalH}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: totalH }}>
        {/* Zero axis line */}
        {minVal < 0 && (
          <line
            x1={labelW + (chartW * (-minVal / range))}
            y1={padTop - 4}
            x2={labelW + (chartW * (-minVal / range))}
            y2={totalH - 4}
            stroke="var(--border-light)"
            strokeWidth="1"
          />
        )}
        {labels.map((label, i) => {
          const val = series[0]?.values[i] ?? 0;
          const barW = Math.abs(val / range) * chartW;
          const baseX = labelW + (minVal < 0 ? chartW * (-minVal / range) : 0);
          const isNeg = val < 0;
          const x = isNeg ? baseX - barW : baseX;
          const y = padTop + i * (barH + gap);
          const color = isNeg ? 'var(--red)' : series[0]?.color ?? 'var(--accent)';
          return (
            <g key={i}>
              <text x={labelW - 6} y={y + barH * 0.72} textAnchor="end" className="fund-chart-label">
                {label}
              </text>
              <rect x={x} y={y} width={barW} height={barH} rx="1" fill={color} opacity="0.85" />
              <text x={isNeg ? x - 4 : x + barW + 4} y={y + barH * 0.72} textAnchor={isNeg ? 'end' : 'start'} className="fund-chart-value">
                {formatValue(val)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Vertical grouped bar chart
  const groupCount = labels.length;
  const seriesCount = series.length;
  const barW = 8;
  const groupGap = 16;
  const groupW = seriesCount * barW + (seriesCount - 1) * 2;
  const totalW = padLeft + groupCount * groupW + (groupCount - 1) * groupGap + padRight;

  const zeroY = padTop + chartH * (maxVal / range);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="fund-svg-chart" viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height }}>
      {/* Grid lines */}
      {gridLines.map((g, i) => {
        const y = padTop + chartH * g;
        const val = maxVal - range * g;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3" />
            <text x={totalW - padRight} y={y - 3} textAnchor="end" className="fund-chart-axis">
              {formatValue(val)}
            </text>
          </g>
        );
      })}
      {/* Zero line */}
      {minVal < 0 && (
        <line x1={padLeft} y1={zeroY} x2={totalW - padRight} y2={zeroY} stroke="var(--border-light)" strokeWidth="1" />
      )}
      {/* Bars */}
      {labels.map((label, gi) => {
        const groupX = padLeft + gi * (groupW + groupGap);
        return (
          <g key={gi}>
            {series.map((s, si) => {
              const val = s.values[gi] ?? 0;
              const barH = Math.abs(val / range) * chartH;
              const x = groupX + si * (barW + 2);
              const y = val >= 0 ? zeroY - barH : zeroY;
              return (
                <g key={si}>
                  <rect x={x} y={y} width={barW} height={barH} rx="1" fill={s.color} opacity="0.85" />
                  <title>{s.name}: {formatValue(val)}</title>
                </g>
              );
            })}
            <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle" className="fund-chart-label">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---- Line Chart ----

interface LineChartProps {
  labels: string[];
  series: BarSeries[];
  height?: number;
  formatValue?: (n: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  labels,
  series,
  height = 180,
  formatValue = (n) => n.toFixed(2),
}) => {
  const padTop = 20;
  const padBottom = 24;
  const padLeft = 8;
  const padRight = 36;
  const chartH = height - padTop - padBottom;

  const allValues = series.flatMap((s) => s.values).filter((v) => isFinite(v));
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;

  const pointCount = labels.length;
  const totalW = padLeft + padRight + (pointCount > 1 ? (pointCount - 1) * 60 : 60);
  const chartW = totalW - padLeft - padRight;

  const xFor = (i: number) => padLeft + (pointCount > 1 ? (i / (pointCount - 1)) * chartW : chartW / 2);
  const yFor = (v: number) => padTop + chartH * (1 - (v - minVal) / range);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="fund-svg-chart" viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height }}>
      {/* Grid lines */}
      {gridLines.map((g, i) => {
        const y = padTop + chartH * g;
        const val = maxVal - range * g;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3" />
            <text x={totalW - padRight + 2} y={y + 3} textAnchor="start" className="fund-chart-axis">
              {formatValue(val)}
            </text>
          </g>
        );
      })}
      {/* Lines + points */}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => ({ x: xFor(i), y: yFor(v), v }));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <g key={si}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.9" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="2.5" fill={s.color} />
                <title>{s.name}: {formatValue(p.v)}</title>
              </g>
            ))}
          </g>
        );
      })}
      {/* X labels */}
      {labels.map((label, i) => (
        <text key={i} x={xFor(i)} y={height - 6} textAnchor="middle" className="fund-chart-label">
          {label}
        </text>
      ))}
    </svg>
  );
};

// ---- Combined Bar + Line Chart ----

interface ComboChartProps {
  labels: string[];
  barSeries: BarSeries[];
  lineSeries: BarSeries[];
  height?: number;
  formatBarValue?: (n: number) => string;
  formatLineValue?: (n: number) => string;
}

export const ComboChart: React.FC<ComboChartProps> = ({
  labels,
  barSeries,
  lineSeries,
  height = 220,
  formatBarValue = (n) => n.toFixed(2),
  formatLineValue = (n) => n.toFixed(2),
}) => {
  const padTop = 20;
  const padBottom = 24;
  const padLeft = 8;
  const padRight = 44;
  const chartH = height - padTop - padBottom;

  // Bar values determine left scale, line values determine right scale
  const barVals = barSeries.flatMap((s) => s.values).filter((v) => isFinite(v));
  const lineVals = lineSeries.flatMap((s) => s.values).filter((v) => isFinite(v));
  const barMax = Math.max(...barVals, 0);
  const barMin = Math.min(...barVals, 0);
  const barRange = barMax - barMin || 1;
  const lineMax = Math.max(...lineVals);
  const lineMin = Math.min(...lineVals);
  const lineRange = lineMax - lineMin || 1;

  const zeroY = padTop + chartH * (barMax / barRange);

  const groupCount = labels.length;
  const seriesCount = barSeries.length;
  const barW = 10;
  const groupGap = 20;
  const groupW = seriesCount * barW + (seriesCount - 1) * 3;
  const totalW = padLeft + groupCount * groupW + (groupCount - 1) * groupGap + padRight;
  const chartW = totalW - padLeft - padRight;

  const xForLine = (i: number) => padLeft + (groupCount > 1 ? (i / (groupCount - 1)) * chartW : chartW / 2) + groupW / 2;
  const yForBar = (v: number) => zeroY - (v / barRange) * chartH;
  const yForLine = (v: number) => padTop + chartH * (1 - (v - lineMin) / lineRange);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="fund-svg-chart" viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height }}>
      {/* Left grid + axis (bar scale) */}
      {gridLines.map((g, i) => {
        const y = padTop + chartH * g;
        const barVal = barMax - barRange * g;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={totalW - padRight} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,3" />
            <text x={padLeft} y={y - 3} textAnchor="start" className="fund-chart-axis">
              {formatBarValue(barVal)}
            </text>
          </g>
        );
      })}
      {/* Right axis (line scale) */}
      {gridLines.map((g, i) => {
        const y = padTop + chartH * g;
        const lineVal = lineMax - lineRange * g;
        return (
          <text key={i} x={totalW - padRight + 2} y={y + 3} textAnchor="start" className="fund-chart-axis fund-chart-axis-right">
            {formatLineValue(lineVal)}
          </text>
        );
      })}
      {/* Zero line */}
      {barMin < 0 && (
        <line x1={padLeft} y1={zeroY} x2={totalW - padRight} y2={zeroY} stroke="var(--border-light)" strokeWidth="1" />
      )}
      {/* Bars */}
      {labels.map((label, gi) => {
        const groupX = padLeft + gi * (groupW + groupGap);
        return (
          <g key={gi}>
            {barSeries.map((s, si) => {
              const val = s.values[gi] ?? 0;
              const barH = Math.abs(val / barRange) * chartH;
              const x = groupX + si * (barW + 3);
              const y = val >= 0 ? yForBar(val) : zeroY;
              return (
                <rect key={si} x={x} y={y} width={barW} height={barH} rx="1" fill={s.color} opacity="0.7">
                  <title>{s.name}: {formatBarValue(val)}</title>
                </rect>
              );
            })}
            <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle" className="fund-chart-label">
              {label}
            </text>
          </g>
        );
      })}
      {/* Line overlay */}
      {lineSeries.map((s, si) => {
        const pts = s.values.map((v, i) => ({ x: xForLine(i), y: yForLine(v), v }));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <g key={si}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.95" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={s.color}>
                <title>{s.name}: {formatLineValue(p.v)}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
};
