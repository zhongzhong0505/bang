import type { KlineData, Strategy, BacktestResult, BacktestTrade, StrategyCondition } from '../../../shared/types';
import { computeMA, computeEMA, computeRSI, computeMACD, computeBollinger } from '../chart/indicators';

export interface IndicatorContext {
  ma: Record<number, (number | null)[]>;
  ema: Record<number, (number | null)[]>;
  rsi: (number | null)[];
  macd: { dif: (number | null)[]; dea: (number | null)[]; histogram: (number | null)[] };
  boll: { upper: (number | null)[]; mid: (number | null)[]; lower: (number | null)[] };
}

export function buildIndicatorContext(data: KlineData[]): IndicatorContext {
  return {
    ma: {
      5: computeMA(data, 5),
      10: computeMA(data, 10),
      20: computeMA(data, 20),
      60: computeMA(data, 60),
    },
    ema: {
      12: computeEMA(data, 12),
      26: computeEMA(data, 26),
    },
    rsi: computeRSI(data, 14),
    macd: computeMACD(data),
    boll: computeBollinger(data),
  };
}

interface EvalResult {
  action: 'BUY' | 'SELL' | null;
  reason: string;
}

function evalCondition(
  cond: StrategyCondition,
  i: number,
  data: KlineData[],
  ctx: IndicatorContext,
): EvalResult {
  const candle = data[i];
  const prevCandle = i > 0 ? data[i - 1] : null;

  switch (cond.type) {
    case 'ma_cross': {
      const fast = cond.params.fast ?? 5;
      const slow = cond.params.slow ?? 20;
      const fastMA = ctx.ma[fast];
      const slowMA = ctx.ma[slow];
      if (!fastMA || !slowMA || i < slow) return { action: null, reason: '' };
      const f = fastMA[i];
      const fPrev = fastMA[i - 1];
      const s = slowMA[i];
      const sPrev = slowMA[i - 1];
      if (f === null || s === null || fPrev === null || sPrev === null) return { action: null, reason: '' };
      if (cond.action === 'BUY' && fPrev <= sPrev && f > s) {
        return { action: 'BUY', reason: `MA${fast}上穿MA${slow}` };
      }
      if (cond.action === 'SELL' && fPrev >= sPrev && f < s) {
        return { action: 'SELL', reason: `MA${fast}下穿MA${slow}` };
      }
      return { action: null, reason: '' };
    }

    case 'rsi_oversold': {
      if (i < 14) return { action: null, reason: '' };
      const threshold = cond.params.threshold ?? 30;
      const rsi = ctx.rsi[i];
      if (rsi === null) return { action: null, reason: '' };
      const prevRsi = ctx.rsi[i - 1];
      if (cond.action === 'BUY' && prevRsi !== null && prevRsi <= threshold && rsi > threshold) {
        return { action: 'BUY', reason: `RSI超卖回升(${rsi.toFixed(1)})` };
      }
      return { action: null, reason: '' };
    }

    case 'rsi_overbought': {
      if (i < 14) return { action: null, reason: '' };
      const threshold = cond.params.threshold ?? 70;
      const rsi = ctx.rsi[i];
      if (rsi === null) return { action: null, reason: '' };
      const prevRsi = ctx.rsi[i - 1];
      if (cond.action === 'SELL' && prevRsi !== null && prevRsi >= threshold && rsi < threshold) {
        return { action: 'SELL', reason: `RSI超买卖回落(${rsi.toFixed(1)})` };
      }
      return { action: null, reason: '' };
    }

    case 'macd_cross': {
      if (i < 35) return { action: null, reason: '' };
      const { dif, dea } = ctx.macd;
      const d = dif[i];
      const dPrev = dif[i - 1];
      const e = dea[i];
      const ePrev = dea[i - 1];
      if (d === null || e === null || dPrev === null || ePrev === null) return { action: null, reason: '' };
      if (cond.action === 'BUY' && dPrev <= ePrev && d > e) {
        return { action: 'BUY', reason: 'MACD金叉' };
      }
      if (cond.action === 'SELL' && dPrev >= ePrev && d < e) {
        return { action: 'SELL', reason: 'MACD死叉' };
      }
      return { action: null, reason: '' };
    }

    case 'boll_break': {
      if (i < 20) return { action: null, reason: '' };
      const upper = ctx.boll.upper[i];
      const lower = ctx.boll.lower[i];
      const prevClose = prevCandle?.close ?? 0;
      if (upper === null || lower === null) return { action: null, reason: '' };
      if (cond.action === 'BUY' && prevClose <= lower && candle.close > lower) {
        return { action: 'BUY', reason: '触及布林下轨' };
      }
      if (cond.action === 'SELL' && prevClose >= upper && candle.close < upper) {
        return { action: 'SELL', reason: '触及布林上轨' };
      }
      return { action: null, reason: '' };
    }

    case 'price_cross': {
      const target = cond.params.price ?? 0;
      if (target <= 0 || !prevCandle) return { action: null, reason: '' };
      if (cond.action === 'BUY' && prevCandle.close <= target && candle.close > target) {
        return { action: 'BUY', reason: `价格上穿${target}` };
      }
      if (cond.action === 'SELL' && prevCandle.close >= target && candle.close < target) {
        return { action: 'SELL', reason: `价格下穿${target}` };
      }
      return { action: null, reason: '' };
    }

    case 'volume_surge': {
      if (i < 5 || !prevCandle) return { action: null, reason: '' };
      const mult = cond.params.mult ?? 2;
      let avgVol = 0;
      for (let j = 1; j <= 5; j++) avgVol += data[i - j].volume;
      avgVol /= 5;
      if (avgVol <= 0) return { action: null, reason: '' };
      if (candle.volume > avgVol * mult) {
        if (cond.action === 'BUY' && candle.close >= candle.open) {
          return { action: 'BUY', reason: `放量上涨(${(candle.volume / avgVol).toFixed(1)}x)` };
        }
        if (cond.action === 'SELL' && candle.close < candle.open) {
          return { action: 'SELL', reason: `放量下跌(${(candle.volume / avgVol).toFixed(1)}x)` };
        }
      }
      return { action: null, reason: '' };
    }

    default:
      return { action: null, reason: '' };
  }
}

export function runBacktest(strategy: Strategy, data: KlineData[]): BacktestResult {
  const ctx = buildIndicatorContext(data);
  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; equity: number }[] = [];

  let capital = strategy.initialCapital;
  let position = 0;
  let entryPrice = 0;
  let entryTime = 0;
  let entryBar = 0;
  let peakEquity = capital;
  let maxDrawdown = 0;

  const startIdx = 60;

  for (let i = startIdx; i < data.length; i++) {
    const candle = data[i];

    // Check stop loss / take profit if holding
    if (position > 0) {
      const pnlPct = ((candle.close - entryPrice) / entryPrice) * 100;
      const barsHeld = i - entryBar;

      let shouldExit = false;
      let exitReason = '';

      if (pnlPct <= -strategy.risk.stopLossPct) {
        shouldExit = true;
        exitReason = 'stop_loss';
      } else if (pnlPct >= strategy.risk.takeProfitPct) {
        shouldExit = true;
        exitReason = 'take_profit';
      } else if (barsHeld >= strategy.risk.maxHoldingBars) {
        shouldExit = true;
        exitReason = 'timeout';
      }

      if (shouldExit) {
        const pnl = (candle.close - entryPrice) * position;
        capital += pnl;
        trades.push({
          entryTime,
          entryPrice,
          exitTime: candle.time,
          exitPrice: candle.close,
          side: 'BUY',
          qty: position,
          pnl: +pnl.toFixed(2),
          pnlPct: +pnlPct.toFixed(2),
          reason: exitReason,
        });
        position = 0;
        entryPrice = 0;
        entryTime = 0;
      }
    }

    // Evaluate strategy conditions
    if (position === 0) {
      for (const cond of strategy.conditions) {
        if (cond.action !== 'BUY') continue;
        const result = evalCondition(cond, i, data, ctx);
        if (result.action === 'BUY') {
          const maxCapital = capital * (strategy.risk.maxPositionPct / 100);
          const qty = Math.floor(maxCapital / candle.close);
          if (qty > 0) {
            position = qty;
            entryPrice = candle.close;
            entryTime = candle.time;
            entryBar = i;
          }
          break;
        }
      }
    } else {
      // Check sell signals
      for (const cond of strategy.conditions) {
        if (cond.action !== 'SELL') continue;
        const result = evalCondition(cond, i, data, ctx);
        if (result.action === 'SELL') {
          const pnl = (candle.close - entryPrice) * position;
          const pnlPct = ((candle.close - entryPrice) / entryPrice) * 100;
          capital += pnl;
          trades.push({
            entryTime,
            entryPrice,
            exitTime: candle.time,
            exitPrice: candle.close,
            side: 'BUY',
            qty: position,
            pnl: +pnl.toFixed(2),
            pnlPct: +pnlPct.toFixed(2),
            reason: 'signal',
          });
          position = 0;
          entryPrice = 0;
          entryTime = 0;
          break;
        }
      }
    }

    // Track equity and drawdown
    const currentEquity = capital + position * candle.close;
    equityCurve.push({ time: candle.time, equity: +currentEquity.toFixed(2) });
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const drawdown = peakEquity - currentEquity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Close any remaining position at the last close
  if (position > 0 && data.length > 0) {
    const lastCandle = data[data.length - 1];
    const pnl = (lastCandle.close - entryPrice) * position;
    const pnlPct = ((lastCandle.close - entryPrice) / entryPrice) * 100;
    capital += pnl;
    trades.push({
      entryTime,
      entryPrice,
      exitTime: lastCandle.time,
      exitPrice: lastCandle.close,
      side: 'BUY',
      qty: position,
      pnl: +pnl.toFixed(2),
      pnlPct: +pnlPct.toFixed(2),
      reason: 'timeout',
    });
    position = 0;
  }

  const finalCapital = capital;
  const totalReturn = finalCapital - strategy.initialCapital;
  const totalReturnPct = (totalReturn / strategy.initialCapital) * 100;

  const winTrades = trades.filter((t) => t.pnl > 0);
  const lossTrades = trades.filter((t) => t.pnl <= 0);
  const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;

  const grossProfit = winTrades.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;

  const maxDrawdownPct = peakEquity > 0 ? (maxDrawdown / peakEquity) * 100 : 0;

  // Sharpe ratio (simplified, using equity curve returns)
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const cur = equityCurve[i].equity;
    if (prev > 0) returns.push((cur - prev) / prev);
  }
  const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1))
    : 0;
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    strategyId: strategy.id,
    totalReturn: +totalReturn.toFixed(2),
    totalReturnPct: +totalReturnPct.toFixed(2),
    winRate: +winRate.toFixed(1),
    totalTrades: trades.length,
    winTrades: winTrades.length,
    lossTrades: lossTrades.length,
    maxDrawdown: +maxDrawdown.toFixed(2),
    maxDrawdownPct: +maxDrawdownPct.toFixed(2),
    sharpeRatio: +sharpeRatio.toFixed(2),
    profitFactor: isFinite(profitFactor) ? +profitFactor.toFixed(2) : 0,
    avgWin: +avgWin.toFixed(2),
    avgLoss: +avgLoss.toFixed(2),
    finalCapital: +finalCapital.toFixed(2),
    trades,
    equityCurve,
  };
}

// Generate real-time signals from the latest candle data
export function generateSignals(
  strategy: Strategy,
  data: KlineData[],
  ctx: IndicatorContext,
): { action: 'BUY' | 'SELL'; reason: string } | null {
  if (data.length < 60) return null;
  const i = data.length - 1;
  for (const cond of strategy.conditions) {
    const result = evalCondition(cond, i, data, ctx);
    if (result.action) return result;
  }
  return null;
}
