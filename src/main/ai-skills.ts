/**
 * AI Skills — prompt content for each built-in skill.
 * When a skill is enabled, its prompt is injected into the AI system message
 * so the model has domain-specific knowledge available.
 */
import type { CustomSkill } from '../shared/types';

/** Map of skill id → prompt text (English, since AI models work best in English) */
const SKILL_PROMPTS: Record<string, string> = {
  technical_analysis: `## Technical Analysis Skill
You have deep expertise in technical analysis for trading:
- **Moving Averages**: Interpret MA5/MA10/MA20/MA60 crossovers (golden cross, death cross), EMA vs SMA differences, and multi-timeframe MA alignment.
- **RSI**: Relative Strength Index — overbought (>70) and oversold (<30) zones, RSI divergence as reversal signals, RSI trendline breaks.
- **MACD**: DIF/DEA crossover signals, MACD histogram expansion/contraction, zero-line transitions indicating trend shifts.
- **Bollinger Bands**: Price touching upper/lower bands, band width narrowing (squeeze) before breakout, %B indicator for position within bands.
- **OBV**: On-Balance Volume for confirming price trends, divergence between OBV and price.
- **KDJ**: Stochastic oscillator — J-line extremes (>100 or <0) as overbought/oversold, K/D crossovers.
- **Volume Analysis**: Volume-price divergence, volume breakouts, accumulation/distribution patterns.
When analyzing orders, use these indicators if kline data is available in the context.`,

  market_knowledge: `## Market Knowledge Skill
You have comprehensive knowledge of major financial markets:
- **Hong Kong Stock Market**: Trading hours 09:30-12:00, 13:00-16:00 HKT. T+0 settlement. No price limits for most stocks (except first 5 trading days after IPO with cooling-off period). Stamp duty 0.13% on sell side (reduced from 0.26% since Nov 2023). SFC transaction levy 0.00278%, SFC trading fee 0.005%. Lot sizes vary (most 100, some 500, blue chips like 00700 = 100). Short selling allowed for designated securities.
- **US Stock Market**: Trading hours 09:30-16:00 ET (pre-market 04:00, after-hours 20:00). T+1 settlement (since May 2024). No price limits. SEC fee 0.0000278% on sell, FINRA TAF $0.000166 per share on sell. Fractional shares available at some brokers. PDT rule: < $25K account limits day trades to 3 per 5 rolling days.
- **China A-Share Market**: Trading hours 09:30-11:30, 13:00-15:00 CST. T+1 settlement (buy today, sell tomorrow). Price limit ±10% (±20% for ChiNext/STAR, ±5% for ST stocks). Stamp duty 0.05% on sell side. Transfer fee 0.001% (Shanghai) or 0.001% (Shenzhen). Commission typically 0.025%-0.03% min ¥5. Lot size 100 shares.
- **Currency**: HKD, USD, CNY — be mindful of exchange rate risk when cross-market positions exist.
- **Market Holidays**: Each market has different holidays; check if near a holiday which may affect liquidity.`,

  risk_assessment: `## Risk Assessment Skill
You are expert at quantitative risk management:
- **Position Sizing**: Use Kelly criterion or fixed-fractional methods. Never risk > 2% of total capital on a single trade. Calculate optimal position size: size = (risk_per_trade × account_equity) / (entry_price - stop_loss_price).
- **Drawdown Control**: Monitor max drawdown; if > 15% reduce position sizes; if > 25% halt new trades until recovery. Track equity curve for prolonged drawdown periods.
- **Concentration Risk**: No single stock should exceed 20% of total portfolio value. No single sector should exceed 40%. Calculate Herfindahl index for portfolio concentration.
- **Correlation Risk**: High correlation between positions amplifies systematic risk. Diversify across sectors, markets, and asset classes.
- **Leverage Risk**: Account for margin requirements and maintenance margins. Buying power ≠ free cash when using margin.
- **VaR (Value at Risk)**: Estimate 1-day 95% VaR for the position using historical volatility. Flag if single-trade VaR > 5% of portfolio.
- **Liquidity Risk**: Check average daily volume; avoid taking > 5% of average daily volume in a single order to minimize market impact.
- **Order Risk Checks**: Compare order amount vs max single order limit; compare daily P&L vs daily loss limit; check if account has sufficient buying power including fees.`,

  trading_strategy: `## Trading Strategy Skill
You understand common trading strategies and their characteristics:
- **Momentum Trading**: Buy breakouts above resistance with above-average volume. Use trailing stops (ATR-based). Works best in trending markets. Risk: whipsaws in range-bound markets.
- **Mean Reversion**: Buy oversold, sell overbought (RSI < 30 buy, RSI > 70 sell). Use Bollinger Band extremes as entry signals. Works best in range-bound markets. Risk: trend continuation causes large losses.
- **Breakout Trading**: Enter on volume-confirmed breakouts from consolidation patterns (triangles, flags, rectangles). Target measured move equal to pattern height.
- **Trend Following**: Use MA crossover systems (e.g., MA5/MA20) or Donchian channels. Pyramid on wins, cut losses quickly. Low win rate (~30-40%) but high reward/risk ratio (3:1+).
- **Scalping**: Very short timeframes (1-5 min), small targets (0.1-0.5%), high frequency. Requires tight spreads and fast execution. Not suitable for high-commission markets.
- **Swing Trading**: Hold 2-5 days, target 2-5% moves. Use daily charts with RSI/MACD confirmation. Place stop-loss below recent swing low (buy) or above swing high (sell).
- **Risk/Reward Analysis**: Always define entry, target, and stop before trading. Minimum 1:2 risk/reward ratio. Calculate expected value = (win_rate × avg_win) - (loss_rate × avg_loss).`,

  fee_calculation: `## Fee Calculation Skill
You can calculate and explain trading fees for major markets:
- **HK Stock Fees (buy/sell)**:
  - Commission: typically 0.03% min HKD 3 (varies by broker, some 0.01% min HKD 1)
  - Stamp duty: 0.13% on SELL side only (reduced from Nov 2023)
  - SFC transaction levy: 0.00278% both sides
  - HKEX trading fee: 0.005% both sides
  - CCASS settlement fee: 0.005% min HKD 5.5, max HKD 200 (per trade value)
  - Example: Buy HKD 100,000 → total fee ≈ HKD 44.78 (0.045%); Sell → ≈ HKD 175.78 (0.176%)
- **US Stock Fees**:
  - Commission: varies (many brokers now $0 commission for online trades)
  - SEC fee: 0.0000278% of sell amount (sell side only)
  - FINRA TAF: $0.000166 per share sold (sell side only)
  - Platform fee: varies by broker (e.g., $0.005/share or flat $1/trade)
  - Example: Sell 100 shares AAPL at $180 → SEC $0.50, FINRA $0.017, total ≈ $0.52
- **China A-Share Fees**:
  - Commission: typically 0.025%-0.03% min CNY 5 (both sides)
  - Stamp duty: 0.05% on SELL side only
  - Transfer fee: 0.001% both sides (Shanghai), 0.001% both sides (Shenzhen)
  - Example: Buy CNY 100,000 → total fee ≈ CNY 30; Sell → ≈ CNY 80
Always factor fees into risk/reward calculations. Small trades get penalized by minimum commissions.`,

  pattern_recognition: `## Pattern Recognition Skill
You can identify and interpret chart patterns:
- **Support & Resistance**: Horizontal levels from multiple touches, psychological levels (round numbers), volume-confirmed breaks. False breakouts (whipsaws) are common — wait for close above/below.
- **Head & Shoulders**: Reversal pattern. Measure target = neckline - (head - neckline). Inverse for bottom.
- **Double Top/Bottom**: Reversal pattern. Target = height of the pattern from the breakout level.
- **Triangles**: Ascending (bullish continuation), descending (bearish continuation), symmetric (breakout either way). Measure rule: target = widest part of triangle measured from breakout.
- **Flags & Pennants**: Strong continuation patterns after sharp moves. Typically resolve in 5-20 bars. Target = flagpole height from breakout.
- **Cup & Handle**: Bullish continuation. Target = cup depth measured from breakout. Handle depth should be 1/3 to 1/2 of cup.
- **Candlestick Patterns**: Doji (indecision), Engulfing (reversal), Hammer/Hanging Man (reversal with confirmation), Morning/Evening Star (3-bar reversal), Three White Soldiers/Black Crows (strong trend).
- **Volume Patterns**: Volume confirms price — breakout on high volume is reliable, breakout on low volume is suspect. Volume climax often marks reversal. Shrinking volume in consolidation is normal.
Use pattern context to enhance risk assessment and trade recommendations.`,
};

/**
 * Build the combined skill prompt for all enabled skills.
 * Returns a string to append to the AI system message.
 */
export function buildSkillPrompt(enabledSkills: Record<string, boolean>, customSkills: CustomSkill[] = []): string {
  const parts: string[] = [];
  // Built-in skills
  for (const [id, enabled] of Object.entries(enabledSkills)) {
    if (enabled && SKILL_PROMPTS[id]) {
      parts.push(SKILL_PROMPTS[id]);
    }
  }
  // Custom / SkillHub-installed skills
  for (const skill of customSkills) {
    if (enabledSkills[skill.id] && skill.promptContent) {
      parts.push(`## ${skill.name}\n${skill.promptContent}`);
    }
  }
  return parts.join('\n\n');
}

/** Get all available skill IDs */
export function getSkillIds(): string[] {
  return Object.keys(SKILL_PROMPTS);
}
