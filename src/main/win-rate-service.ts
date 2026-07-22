/**
 * Win Rate Analysis Service.
 *
 * Matches historical buy/sell deals per stock using strict FIFO,
 * with **lot-by-lot correspondence**: when a sell consumes from
 * multiple buy lots, each consumed segment becomes its own
 * MatchedTrade (same buy price, same sell price, qty = portion).
 *
 * Fees are split per-unit so each matched pair carries its own
 * buyFee / sellFee / totalFee, and netPnl = grossPnl - totalFee.
 */
import type {
  HistoryDeal, MatchedTrade, StockWinRate, OverallWinRate,
} from '../shared/types';

/** FIFO queue entry for an open buy lot */
interface BuyLot {
  price: number;
  qty: number;
  time: number;
  fee: number;
}

/**
 * Match buy/sell deals for a single stock using strict FIFO.
 * Each consumed buy-lot segment produces its own MatchedTrade
 * so that "手数一一对应" — every buy lot maps 1-to-1 to a sell segment.
 */
function matchDealsForStock(deals: HistoryDeal[]): MatchedTrade[] {
  const trades: MatchedTrade[] = [];
  const buyQueue: BuyLot[] = [];
  let code = '';
  let name = '';

  const sorted = [...deals].sort((a, b) => a.time - b.time);

  for (const deal of sorted) {
    code = deal.code;
    name = deal.name;

    if (deal.side === 'BUY') {
      buyQueue.push({
        price: deal.price,
        qty: deal.qty,
        time: deal.time,
        fee: deal.fee,
      });
    } else if (deal.side === 'SELL') {
      let remaining = deal.qty;
      // Prorate sell fee per unit of quantity
      const sellFeePerUnit = deal.qty > 0 ? deal.fee / deal.qty : 0;

      while (remaining > 0 && buyQueue.length > 0) {
        const lot = buyQueue[0];
        const consumed = Math.min(remaining, lot.qty);
        // Prorate buy fee per unit of this lot
        const buyFeePerUnit = lot.qty > 0 ? lot.fee / lot.qty : 0;

        const buyAmount = consumed * lot.price;
        const sellAmount = consumed * deal.price;
        const grossPnl = sellAmount - buyAmount;
        const buyFee = buyFeePerUnit * consumed;
        const sellFee = sellFeePerUnit * consumed;
        const totalFee = buyFee + sellFee;
        const netPnl = grossPnl - totalFee;
        const pnlPct = buyAmount > 0 ? (grossPnl / buyAmount) * 100 : 0;

        trades.push({
          code,
          name,
          side: 'BUY_THEN_SELL',
          buyPrice: lot.price,
          buyQty: consumed,
          buyTime: lot.time,
          buyFee,
          sellPrice: deal.price,
          sellQty: consumed,
          sellTime: deal.time,
          sellFee,
          totalFee,
          pnl: grossPnl,
          pnlPct,
          netPnl,
          holdSeconds: deal.time - lot.time,
        });

        lot.qty -= consumed;
        lot.fee -= buyFee; // reduce remaining fee in the lot
        remaining -= consumed;

        if (lot.qty <= 0) {
          buyQueue.shift();
        }
      }
    }
  }

  return trades;
}

/** Compute per-stock win rate stats from matched trades */
function computeStockWinRate(code: string, name: string, trades: MatchedTrade[]): StockWinRate {
  const totalTrades = trades.length;
  const winTrades = trades.filter((t) => t.netPnl > 0).length;
  const lossTrades = trades.filter((t) => t.netPnl < 0).length;
  const evenTrades = totalTrades - winTrades - lossTrades;

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const totalNetPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const totalFee = trades.reduce((s, t) => s + t.totalFee, 0);
  const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const avgPnlPct = totalTrades > 0 ? trades.reduce((s, t) => s + t.pnlPct, 0) / totalTrades : 0;
  const avgNetPnl = totalTrades > 0 ? totalNetPnl / totalTrades : 0;
  const avgHoldSeconds = totalTrades > 0 ? trades.reduce((s, t) => s + t.holdSeconds, 0) / totalTrades : 0;

  const pnls = trades.map((t) => t.netPnl);
  const maxWin = pnls.length > 0 ? Math.max(...pnls) : 0;
  const maxLoss = pnls.length > 0 ? Math.min(...pnls) : 0;

  return {
    code,
    name,
    totalTrades,
    winTrades,
    lossTrades,
    evenTrades,
    winRate: totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0,
    avgPnl,
    avgPnlPct,
    avgNetPnl,
    totalPnl,
    totalNetPnl,
    totalFee,
    avgHoldSeconds,
    maxWin,
    maxLoss,
    trades,
  };
}

/**
 * Main analysis function: given all history deals, compute overall win rate.
 */
export function analyzeWinRates(deals: HistoryDeal[]): OverallWinRate {
  if (deals.length === 0) {
    return {
      totalTrades: 0, winTrades: 0, lossTrades: 0, evenTrades: 0,
      winRate: 0, avgPnl: 0, avgPnlPct: 0, avgNetPnl: 0,
      totalPnl: 0, totalNetPnl: 0, totalFee: 0,
      profitFactor: 0,
      bestStock: '', worstStock: '',
      stockRates: [],
      startDate: 0, endDate: 0,
    };
  }

  // Group deals by stock code
  const byCode = new Map<string, HistoryDeal[]>();
  for (const d of deals) {
    const list = byCode.get(d.code) ?? [];
    list.push(d);
    byCode.set(d.code, list);
  }

  // Match and compute per-stock
  const stockRates: StockWinRate[] = [];
  for (const [code, stockDeals] of byCode) {
    const matched = matchDealsForStock(stockDeals);
    if (matched.length > 0) {
      const name = stockDeals[0]?.name ?? '';
      stockRates.push(computeStockWinRate(code, name, matched));
    }
  }

  // Sort by total trades descending
  stockRates.sort((a, b) => b.totalTrades - a.totalTrades);

  // Compute overall stats
  const allTrades = stockRates.flatMap((s) => s.trades);
  const totalTrades = allTrades.length;
  const winTrades = allTrades.filter((t) => t.netPnl > 0).length;
  const lossTrades = allTrades.filter((t) => t.netPnl < 0).length;
  const evenTrades = totalTrades - winTrades - lossTrades;

  const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
  const totalNetPnl = allTrades.reduce((s, t) => s + t.netPnl, 0);
  const totalFee = allTrades.reduce((s, t) => s + t.totalFee, 0);
  const sumWins = allTrades.filter((t) => t.netPnl > 0).reduce((s, t) => s + t.netPnl, 0);
  const sumLosses = allTrades.filter((t) => t.netPnl < 0).reduce((s, t) => s + Math.abs(t.netPnl), 0);

  const bestStock = stockRates.length > 0
    ? [...stockRates].sort((a, b) => b.totalNetPnl - a.totalNetPnl)[0]?.code ?? ''
    : '';
  const worstStock = stockRates.length > 0
    ? [...stockRates].sort((a, b) => a.totalNetPnl - b.totalNetPnl)[0]?.code ?? ''
    : '';

  const times = deals.map((d) => d.time);
  const startDate = Math.min(...times);
  const endDate = Math.max(...times);

  return {
    totalTrades,
    winTrades,
    lossTrades,
    evenTrades,
    winRate: totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0,
    avgPnl: totalTrades > 0 ? totalPnl / totalTrades : 0,
    avgPnlPct: totalTrades > 0 ? allTrades.reduce((s, t) => s + t.pnlPct, 0) / totalTrades : 0,
    avgNetPnl: totalTrades > 0 ? totalNetPnl / totalTrades : 0,
    totalPnl,
    totalNetPnl,
    totalFee,
    profitFactor: sumLosses > 0 ? sumWins / sumLosses : (sumWins > 0 ? Infinity : 0),
    bestStock,
    worstStock,
    stockRates,
    startDate,
    endDate,
  };
}
