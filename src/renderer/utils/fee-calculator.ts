/**
 * Trading fee calculator for Futu and Tiger, per-market.
 *
 * Rate references:
 *   Futu: https://www.futunn.com/fee/pricing
 *   Tiger: https://www.tigersecurities.com/fees
 *
 * Key rules:
 *   HK stocks:
 *     Commission (min HKD 3 per order)
 *     SFC levy + HKEX trading fee + Settlement fee
 *     Stamp duty 0.13% on sell (rounded up to nearest dollar)
 *   US stocks:
 *     Commission (min USD 1 per order)
 *     SEC fee 0.0000278 on sell (rounded to cent)
 *     FINRA TAF 0.0000139 per share on sell (min $0.01)
 *   A-shares (SH/SZ):
 *     Commission (min CNY 5 per order)
 *     Stamp duty 0.05% on sell
 *     Transfer fee 0.001% on both sides
 */

import type { Market, OrderSide, GatewayProvider, FeeItem, FeeBreakdown } from '../../../shared/types';

// ===== Rate tables =====

interface CommissionRates {
  rate: number;            // as fraction, e.g. 0.0003 = 0.03%
  minCommission: number;   // minimum commission per order
}

const FUTU_COMMISSION: Record<Market, CommissionRates> = {
  HK:  { rate: 0.0003,  minCommission: 3 },      // 0.03%, min HKD 3
  US:  { rate: 0.0049,  minCommission: 0.99 },    // USD 0.0049/share, min USD 0.99
  SH:  { rate: 0.0003,  minCommission: 5 },       // 0.03%, min CNY 5 (A-share)
  SZ:  { rate: 0.0003,  minCommission: 5 },
  SG:  { rate: 0.0003,  minCommission: 3 },
  JP:  { rate: 0.0003,  minCommission: 3 },
};

const TIGER_COMMISSION: Record<Market, CommissionRates> = {
  HK:  { rate: 0.0003,  minCommission: 3 },      // 0.03%, min HKD 3
  US:  { rate: 0.005,   minCommission: 1 },       // USD 0.005/share, min USD 1
  SH:  { rate: 0.0003,  minCommission: 5 },       // 0.03%, min CNY 5
  SZ:  { rate: 0.0003,  minCommission: 5 },
  SG:  { rate: 0.00025, minCommission: 2.5 },
  JP:  { rate: 0.00025, minCommission: 2.5 },
};

// HK exchange/government fees (same for both brokers)
const HK_SFC_LEVY_RATE    = 0.00002;   // 0.002% on both sides
const HK_HKEX_TRADE_RATE = 0.00005;   // 0.005% on both sides
const HK_SETTLEMENT_RATE = 0.00002;   // 0.002% on both sides (HKSCC)
const HK_STAMP_DUTY_RATE = 0.0013;    // 0.13% on sell only

// A-share fees
const CN_STAMP_DUTY_RATE = 0.0005;    // 0.05% on sell (reduced from 0.1% in 2023)
const CN_TRANSFER_RATE   = 0.00001;   // 0.001% on both sides (过户费)
const CN_REGULATORY_RATE = 0.00002;   // 0.002% on both sides (证管费)

// US fees
const US_SEC_FEE_RATE    = 0.0000278; // SEC fee on sell
const US_FINRA_TAF_RATE  = 0.0000139; // FINRA TAF per share on sell

// ===== Helpers =====

function roundUp(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.ceil(value * factor) / factor;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ===== Public API =====

/**
 * Calculate trading fees for a given order.
 *
 * @param provider  - 'futu' or 'tiger'
 * @param market   - 'HK', 'US', 'SH', 'SZ', etc.
 * @param side     - 'BUY' or 'SELL'
 * @param price    - execution price per share
 * @param qty      - number of shares
 * @returns FeeBreakdown with itemized fees and total
 */
export function calculateFees(
  provider: GatewayProvider,
  market: Market,
  side: OrderSide,
  price: number,
  qty: number,
): FeeBreakdown {
  const amount = price * qty;
  const isSell = side === 'SELL';
  const fees: FeeItem[] = [];

  // === Commission ===
  const commissionRates = provider === 'futu'
    ? FUTU_COMMISSION[market]
    : TIGER_COMMISSION[market];

  let commission: number;

  if (market === 'US') {
    // US: per-share commission
    commission = Math.max(commissionRates.rate * qty, commissionRates.minCommission);
  } else {
    // HK / A-share / others: percentage of amount
    commission = Math.max(commissionRates.rate * amount, commissionRates.minCommission);
  }
  fees.push({ type: 'commission', name: '佣金', amount: round2(commission) });

  // === Market-specific fees ===
  switch (market) {
    case 'HK': {
      // SFC levy (Securities and Futures Commission transaction levy)
      const sfcLevy = round2(HK_SFC_LEVY_RATE * amount);
      fees.push({ type: 'other', name: '证监会交易征费', amount: sfcLevy });

      // HKEX trading fee
      const hkexFee = round2(HK_HKEX_TRADE_RATE * amount);
      fees.push({ type: 'settlement', name: '联交所交易费', amount: hkexFee });

      // Settlement fee (HKSCC)
      const settleFee = round2(HK_SETTLEMENT_RATE * amount);
      fees.push({ type: 'settlement', name: '中央结算系统交收费', amount: settleFee });

      // Stamp duty (sell only) — rounded up to nearest HKD
      if (isSell) {
        const stampDuty = roundUp(HK_STAMP_DUTY_RATE * amount, 0);
        fees.push({ type: 'stamp_duty', name: '印花税', amount: stampDuty });
      }

      // Platform fee (Futu charges HKD 15 per order platform fee for some accounts)
      if (provider === 'futu') {
        fees.push({ type: 'platform_fee', name: '平台费', amount: 15 });
      }

      break;
    }

    case 'US': {
      // SEC fee (sell only, on sell amount)
      if (isSell) {
        const secFee = round2(US_SEC_FEE_RATE * amount);
        fees.push({ type: 'sec_fee', name: 'SEC 费', amount: secFee });

        // FINRA TAF (Trading Activity Fee) — per share on sell
        const finraFee = Math.max(round2(US_FINRA_TAF_RATE * qty), 0.01);
        fees.push({ type: 'finra_fee', name: 'FINRA TAF', amount: finraFee });
      }

      // Platform fee
      if (provider === 'tiger') {
        fees.push({ type: 'platform_fee', name: '平台费', amount: 0 });
      }

      break;
    }

    case 'SH':
    case 'SZ': {
      // Transfer fee (过户费) — both sides
      const transferFee = round2(CN_TRANSFER_RATE * amount);
      fees.push({ type: 'transfer_fee', name: '过户费', amount: transferFee });

      // Regulatory fee (证管费) — both sides
      const regFee = round2(CN_REGULATORY_RATE * amount);
      fees.push({ type: 'other', name: '证管费', amount: regFee });

      // Stamp duty (sell only)
      if (isSell) {
        const stampDuty = round2(CN_STAMP_DUTY_RATE * amount);
        fees.push({ type: 'stamp_duty', name: '印花税', amount: stampDuty });
      }

      break;
    }

    default:
      // SG, JP — minimal fees, just commission
      break;
  }

  const totalFee = round2(fees.reduce((sum, f) => sum + f.amount, 0));

  return { fees, totalFee };
}

/**
 * Calculate net amount after fees.
 * Buy:  net = amount + totalFee (you pay more)
 * Sell: net = amount - totalFee (you receive less)
 */
export function calculateNetAmount(
  side: OrderSide,
  amount: number,
  totalFee: number,
): number {
  return side === 'BUY'
    ? round2(amount + totalFee)
    : round2(amount - totalFee);
}

/**
 * Get a summary string for fee display.
 */
export function formatFeeSummary(fee: FeeBreakdown): string {
  return `费用合计: ${fee.totalFee.toFixed(2)}`;
}
