**English** | [简体中文](README.zh-CN.md)

# Bang — Desktop Trading Terminal

## Overview

Bang is a desktop-grade trading terminal built with Electron + React + TypeScript, modeled after TradingView. It integrates market data display, technical analysis, quantitative backtesting, order execution, and fee calculation into a full-chain workflow. The backend connects to two broker gateways — Futu OpenD and Tiger OpenAPI (official TypeScript SDK) — for real-time quotes and trade execution. The frontend uses lightweight-charts for professional candlestick rendering. On launch it auto-connects to the configured gateway, keeping quotes and chart data in sync.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop framework | Electron | 43.x (stable) |
| Bundler | Rspack | 2.x |
| Language | TypeScript | 7.x |
| Frontend framework | React | 19.x |
| State management | Zustand | 5.x |
| Charting library | lightweight-charts | 5.x |
| Icon library | lucide-react | 1.x |
| Main↔Renderer IPC | Electron IPC + contextBridge | — |
| Tiger SDK | @tigeropenapi/tigeropen | 0.5.x |
| WebSocket | ws (main process) | 8.x |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Futu Gateway │  │ Tiger Gateway │  │  Gateway Router   │ │
│  │  (WebSocket)  │  │  (REST + WS)  │  │  (provider switch)│ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘ │
│         │                  │                    │            │
│  ┌──────┴──────────────────┴────────────────────┴──────┐   │
│  │              Adapters (data-format mapping)          │   │
│  │  futu-adapter.ts  ·  tiger-adapter.ts               │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│  ┌──────┴──────┐  ┌──────────┐  ┌──────────┐              │
│  │ IPC Handlers │  │ Config   │  │ Protocol │              │
│  │ (ipcMain)    │  │ Store    │  │ app://   │              │
│  └──────────────┘  └──────────┘  └──────────┘              │
└────────────────────────┬────────────────────────────────────┘
                         │  contextBridge (preload)
┌────────────────────────┴────────────────────────────────────┐
│                    Renderer Process (React)                 │
│                                                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Toolbar │ │ Watchlist│ │ ChartView│ │ OrderPanel     │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Quant   │ │ Alerts   │ │ Settings │ │ Account Panel  │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ DOM     │ │ TradeList│ │ Search   │ │ StatusBar      │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                                                             │
│  Zustand Store (global state)                               │
└─────────────────────────────────────────────────────────────┘
```

### Main Process

- `gateway.ts` — Futu OpenD WebSocket client. Implements binary protocol encoding/decoding (16-byte header + JSON body), supports ProtoID 1001/3001/3002/5001/5003/2212/2215/2222/2223/2225
- `tiger-gateway.ts` — Tiger OpenAPI client (SDK-based). Built on the official `@tigeropenapi/tigeropen` TypeScript SDK, communicates via Protobuf. The SDK handles RSA signing, domain resolution, and real-time push (TCP+TLS+Protobuf). Full-chain support for QuoteClient / TradeClient / PushClient
- `gateway-router.ts` — Gateway router that switches between Futu and Tiger based on `activeProvider`
- `adapters/futu-adapter.ts` — Futu raw-data parser. Converts ProtoID responses into unified internal types
- `adapters/tiger-adapter.ts` — Tiger SDK data adapter. Maps strongly-typed SDK objects (Brief/Kline/Position/Order/Asset/Transaction) into unified internal types
- `ai-service.ts` — AI service (multi-provider, evaluateOrder, streamChat, fetchCalendarEvents)
- `ai-skills.ts` — AI skills module (built-in skill prompt content, skill context injection into system prompts)
- `calendar-service.ts` — Financial calendar service (AI-first with mock fallback)
- `fundamentals-service.ts` — Fundamentals data service
- `screener-service.ts` — Stock screener service
- `win-rate-service.ts` — Win rate analysis service
- `store.ts` — Local configuration persistence
- `index.ts` — Electron entry point, IPC handler registration, `app://` custom protocol

### Preload

`preload/index.ts` — Safely exposes `window.bangAPI` via `contextBridge`, including gateway configuration, market-data requests, order placement, account queries, and all IPC methods and event listeners.

### Renderer

Organized by feature under `modules/`, each module with its own CSS file:

| Module | Directory | Function |
|--------|-----------|----------|
| Chart | `modules/chart/` | Main candlestick chart + sub-chart indicators + chip distribution + volume profile + drawing tools + data window + K-line replay |
| Watchlist | `modules/watchlist/` | Watchlist with real-time quote snapshots |
| Trading | `modules/trading/` | Order panel + market depth + trade details + fee calculation |
| Quant | `modules/quant/` | Strategy management + backtesting engine + live signals + run monitoring |
| Search | `modules/search/` | Stock code search |
| Alerts | `modules/alerts/` | Price alert setup and triggers |
| Settings | `modules/settings/` | General settings + chart settings + trading settings + Futu/Tiger gateway config + AI provider settings + AI skills configuration |
| Account | `modules/account/` | Account asset details (total assets / cash / market value / margin / per-market breakdown) |
| Calendar | `modules/calendar/` | AI-powered financial calendar with date picker, loading states, and data-source badge |
| Fundamentals | `modules/fundamentals/` | Fundamentals panel (financial data overview) |
| Analytics | `modules/analytics/` | Win rate analysis and performance breakdown |
| Screener | `modules/screener/` | Stock screener with multi-condition filtering |
| Shortcuts | `modules/shortcuts/` | Keyboard shortcuts overlay |
| AI Chat | `modules/ai/` | Conversational AI assistant with streaming output |
| Sidebar | `modules/sidebar/` | Left sidebar navigation with icon + tooltip |
| Toolbar | `modules/toolbar/` | Top toolbar — period switch / chart type / indicators / comparison / more tools |
| Status bar | `modules/statusbar/` | Bottom status bar |

## Feature Checklist

### Market Data & Charts
- Chart types: candle / hollow / bullish / bar / line / area (six types)
- Periods: 1m / 5m / 15m / 30m / 1h / daily / weekly / monthly
- Main-chart indicators: MA5/10/20/60, EMA12/26, BOLL Bollinger Bands, SAR Parabolic, VWAP
- Sub-chart indicators: MACD, KDJ, RSI, STOCH Stochastic, WR Williams %R, CCI, OBV, ATR, ADX
- Chip distribution: volume-decay-weighted calculation based on historical turnover, side-by-side with the candlestick chart
- Volume Profile: per-price-band volume statistics
- Drawing tools: trend lines, horizontal lines, rectangles, etc.
- Data Window: OHLCV panel shown on crosshair hover
- K-line Replay: step through historical market data by time
- Multi-symbol comparison: overlay multiple stocks on a single chart
- Themes: dark / light / system, switched in real time via CSS variables
- Font size: small / standard / large / extra-large, globally scaled via the `--app-zoom` CSS variable
- Date/time format: configurable date/time display for the chart axis and crosshair

### Trading
- Order panel: limit / market / stop / stop-limit orders, buy/sell toggle
- Trade fee calculation: based on real Futu and Tiger fee schedules
  - HK stocks: commission (0.03% min HKD 3) + SFC levy + exchange trading fee + settlement fee + stamp duty (sell 0.13%) + platform fee
  - US stocks: commission (Futu $0.0049/share min $0.99 / Tiger $0.005/share min $1) + SEC fee (sell) + FINRA TAF (sell)
  - A-shares: commission (0.03% min ¥5) + stamp duty (sell 0.05%) + transfer fee + regulator fee
- Real-time fee preview: enter price and quantity to instantly see the fee breakdown
- Trade details page: complete trade record list with market/direction filters, expandable fee details, and summary cards
- Position management: position list display
- Order management: today's order list (pending / submitted / partial / cancel-pending / filled / cancelled / rejected)
- Market depth (DOM): bid/ask level display

### Quantitative Trading
- Strategy management: create / edit / delete / start-stop strategies
- Condition system: MA golden/death cross, RSI overbought/oversold, MACD golden/death cross, Bollinger breakout, price crossover, volume breakout
- Backtesting engine: full backtest producing return rate / win rate / max drawdown / Sharpe ratio / profit-loss ratio / equity curve
- Risk control: stop-loss / take-profit / max position ratio / max holding period
- Live signals: strategy runtime monitoring with auto-generated buy/sell signals on condition triggers

### Account
- Account asset overview: total assets, available cash, position market value, purchasing power
- P&L overview: floating P&L, floating P&L ratio, realized P&L, frozen funds
- Margin info: withdrawable funds, frozen funds, initial margin, maintenance margin
- Per-market breakdown: asset distribution across HK / US / A-share markets

### System Settings
- Appearance: dark / light / system (with SVG mini-chart preview)
- Language: Simplified Chinese / Traditional Chinese / English, full i18n integration with `useT()` / `useTBatch()` / `useLocale()` hooks, real-time language switching across all components
- Date/time format: 6 date formats + 4 time formats
- Chart settings: color scheme, default chart type, default period
- Trading settings: order confirmation, default quantity, per-order limit, daily loss limit
- Gateway config: Futu OpenD (host/port/wsPort/wsAuthKey/SSL) and Tiger OpenAPI (tigerId/account/privateKey/licenses/token/serverUrl). Auto-connects to the saved gateway on launch
- System behavior: minimize to tray, launch at startup, alert sounds

### Broker Adaptation

#### Futu OpenD

| ProtoID | Function | Adapter function |
|---------|----------|-----------------|
| 1001 | InitConnect | Main-process internal |
| 3001 | Subscribe | `buildFutuSubscribeRequest` |
| 3002 | StockUpdate | `parseFutuStockUpdate` |
| 5001 | HistoryKLines | `parseFutuKline` / `buildFutuKlineRequest` |
| 5003 | MarketSnapshot | `parseFutuSnapshot` / `buildFutuSnapshotRequest` |
| 2212 | PlaceOrder | `parseFutuPlaceOrder` / `buildFutuPlaceOrderRequest` |
| 2215 | CancelOrder | Main-process internal |
| 2222 | OrderList | `parseFutuOrders` |
| 2223 | PositionList | `parseFutuPositions` |
| 2225 | AccInfo | `parseFutuAccountSummary` / `buildFutuAccInfoRequest` |

#### Tiger OpenAPI (SDK-based)

Built on the official `@tigeropenapi/tigeropen` v0.5+ TypeScript SDK, communicating via Protobuf.

| SDK method | Function | Adapter function |
|------------|----------|-----------------|
| QuoteClient.getKline | K-line data | `mapSdkKline` |
| QuoteClient.getRealTimeQuote | Real-time quotes | `mapSdkBrief` |
| QuoteClient.getSymbolNames | Stock search | `fromTigerSymbol` |
| TradeClient.getPositions | Position list | `mapSdkPosition` |
| TradeClient.getOrders | Order list | `mapSdkOrder` |
| TradeClient.getAssets | Account assets | `mapSdkAsset` |
| TradeClient.placeOrder | Place order | `marketOrder` / `limitOrder` / `stopOrder` |
| TradeClient.cancelOrder | Cancel order | Main-process internal |
| TradeClient.modifyOrder | Modify order | Main-process internal |
| TradeClient.getOrderTransactions | Historical trades | `mapSdkTransaction` |
| PushClient (TCP+TLS) | Real-time push | onQuote / onKline / onOrder / onPosition / onAsset |

Each quote license (TBUS/TBHK/TBSG...) gets an independent QuoteClient, with the SDK auto-routing to the optimal quote server. Trading and push use the first license.

## Directory Structure

```
bang/
├── package.json
├── rspack.config.ts          # Three build configs (main / preload / renderer)
├── tsconfig.json
├── src/
│   ├── shared/
│   │   └── types.ts           # Global type definitions + IPC channel constants + defaults
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # Entry point + IPC handlers
│   │   ├── gateway.ts         # Futu OpenD WebSocket client
│   │   ├── tiger-gateway.ts   # Tiger OpenAPI REST + WS client
│   │   ├── gateway-router.ts  # Gateway router
│   │   ├── ai-service.ts      # AI service (multi-provider, evaluate, chat, calendar)
│   │   ├── ai-skills.ts       # AI skills (built-in skill prompts + context injection)
│   │   ├── calendar-service.ts # Financial calendar (AI-first, mock fallback)
│   │   ├── fundamentals-service.ts # Fundamentals data service
│   │   ├── screener-service.ts # Stock screener service
│   │   ├── win-rate-service.ts # Win rate analysis service
│   │   ├── store.ts           # Config persistence
│   │   └── adapters/
│   │       ├── futu-adapter.ts   # Futu data-format adapter
│   │       └── tiger-adapter.ts  # Tiger data-format adapter
│   ├── preload/
│   │   └── index.ts           # contextBridge bridging
│   └── renderer/              # React renderer process
│       ├── index.tsx          # React entry
│       ├── App.tsx            # Root component + routing + ErrorBoundary
│       ├── mock.ts            # Mock data generation
│       ├── store/
│       │   └── index.ts       # Zustand global state
│       ├── i18n/
│       │   ├── en.ts          # English translations
│       │   ├── zh.ts          # Chinese translations
│       │   └── index.ts       # i18n hooks (useT, useTBatch, useLocale)
│       ├── utils/
│       │   ├── format.ts      # Date/time formatting
│       │   ├── fee-calculator.ts  # Trade fee calculation engine
│       │   └── export.ts      # Data export utility
│       ├── components/
│       │   └── DatePicker.tsx # Shared date picker component
│       ├── styles/
│       │   └── global.css     # Global styles + CSS variables
│       └── modules/
│           ├── chart/         # Chart module
│           ├── watchlist/     # Watchlist
│           ├── trading/       # Trading (orders / depth / details)
│           ├── quant/         # Quant (strategy / backtest / signals)
│           ├── account/       # Account details
│           ├── calendar/      # AI-powered financial calendar
│           ├── fundamentals/  # Fundamentals panel
│           ├── analytics/     # Win rate analysis
│           ├── screener/      # Stock screener
│           ├── ai/            # AI chat panel
│           ├── shortcuts/     # Keyboard shortcuts overlay
│           ├── sidebar/       # Sidebar navigation
│           ├── settings/      # Settings panel
│           ├── search/        # Stock search
│           ├── alerts/        # Price alerts
│           ├── toolbar/       # Top toolbar
│           └── statusbar/     # Bottom status bar
└── dist/                      # Build output
```

## Build & Run

```bash
# Install dependencies
npm install

# Build (main + preload + renderer)
npm run build

# Build and launch Electron
npm run dev

# Watch mode (for development)
npm run dev:watch

# Production build
npm run build:prod

# Clean build artifacts
npm run clean
```

---

## AI Market Analysis Integration

The project already has a complete market-data pipeline and quantitative framework, but all analysis logic is rule-based. Introducing AI enables a leap from "rule-driven" to "intelligence-driven." Below are concrete integration paths.

### Overall Approach

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Real-time    │     │  AI Analysis     │     │  Results        │
│  Market Data  │────▶│  Engine Layer    │────▶│  Display Layer  │
│  (K-line/     │     │  (LLM + local    │     │  (Chart / panel │
│   snapshot)   │     │   indicators)    │     │   / notification)│
└──────────────┘     └──────────────────┘     └─────────────────┘
        │                     │                        │
        ▼                     ▼                        ▼
  Existing store data   OpenAI API call          Annotate on chart
  Existing IPC channels Local indicator context  AI chat panel
                        Historical data window   Real-time push
```

### Layer 1: Real-time AI Market Interpretation

**Goal**: When the user switches to a stock, the AI automatically reads the current K-line data and technical indicators, then generates a brief market interpretation.

**Implementation**:

1. Add an `modules/ai/AIInsight.tsx` component in the renderer, as an extension of the DataWindow
2. On stock or period switch, extract the latest N candles + all indicator snapshots from the store
3. Compress the data into a structured prompt and call the OpenAI API (GPT-4o or o-series reasoning model)
4. Prompt template example:
   ```
   You are a professional trading analyst. Here is the recent market data for {stockName}({code}):
   - Current price: {close}, change: {changeRate}%
   - MA5={ma5}, MA20={ma20}, MACD: DIF={dif} DEA={dea}
   - RSI(14)={rsi}, KDJ: K={k} D={d} J={j}
   - BOLL: upper={upper} mid={mid} lower={lower}
   - 5-day volume ratio: {volRatio}
   - Chip concentration: {chipConcentration}

   Please provide in 3-5 sentences:
   1. Current technical pattern assessment
   2. Key support/resistance levels
   3. Short-term trading recommendation
   ```
5. Display the result in an AI panel on the right or bottom of the chart, with streaming output

**Data source**: Extracted directly from the Zustand store's `klineData`, `indicators`, and `ChipDistribution` calculation results — no new IPC channels needed.

### Layer 2: AI-Driven Anomaly Detection & Real-time Push

**Goal**: Continuously monitor the watchlist in the background; when the AI detects anomaly signals, proactively push notifications.

**Implementation**:

1. Add `src/main/ai-monitor.ts` in the main process, periodically (every 30s-1min) fetching watchlist snapshots
2. Send snapshot data to the AI model using structured output (JSON mode):
   ```json
   {
     "alerts": [
       {
         "code": "HK.00700",
         "type": "volume_anomaly",
         "severity": "high",
         "description": "Volume spiked 3.2x while price broke above the 20-day MA",
         "suggestion": "Watch for breakout validity; consider a small position"
       }
     ]
   }
   ```
3. Push to the renderer via IPC; show a red dot on the status bar; click to expand the anomaly list
4. Integrate with the existing `AlertPanel` module to unify AI alerts with traditional price alerts

**Optimization**: Use batch requests to reduce API calls — send the entire watchlist snapshot in one request.

### Layer 3: Natural-Language Strategy Generation

**Goal**: Users describe trading intent in natural language; the AI auto-generates executable quant strategies.

**Implementation**:

1. Add an "AI Strategy Generation" entry in QuantPanel
2. User input: `"Buy when MACD golden cross and RSI below 35, stop-loss 5%, take-profit 15%"`
3. AI parses into structured `StrategyCondition[]` + `RiskConfig`:
   ```json
   {
     "conditions": [
       { "type": "macd_cross", "action": "BUY" },
       { "type": "rsi_oversold", "action": "BUY", "params": { "threshold": 35 } }
     ],
     "risk": { "stopLossPct": 5, "takeProfitPct": 15 }
   }
   ```
4. The generated strategy feeds directly into the existing backtesting engine; users see backtest results immediately
5. Users can follow up with "change stop-loss to 3%" and the AI incrementally modifies strategy parameters

**Key point**: The AI output format must strictly match the existing `ConditionType` enum and `RiskConfig` interface, enforced via JSON Schema.

### Layer 4: AI-Assisted Trading Decisions ✅ Implemented

**Goal**: Before placing an order, the AI provides risk assessment based on current positions, account status, and market environment.

**Implementation**:

1. Add an "AI Evaluate" button next to the order button in OrderPanel
2. On click, send the following context to the AI:
   - Current order info (direction / price / quantity / estimated fees)
   - Account status (total assets / available funds / current positions / purchasing power)
   - Current stock technicals (indicator snapshot) and fundamentals (if available)
   - Recent trade history and P&L
3. AI returns a structured assessment:
   ```json
   {
     "risk_level": "medium",
     "position_ratio": "This order will use 23% of total assets",
     "warnings": ["RSI overbought (78.5)", "Stock rose 12% in the last 5 days"],
     "suggestion": "Consider scaling in to reduce per-order size"
   }
   ```
4. Display the assessment as an overlay above the order panel

### Layer 5: Conversational Market Assistant

**Goal**: Users can ask questions in natural language at any time; the AI answers using real-time data.

**Implementation**:

1. Add an `modules/ai/AIChat.tsx` component — as a collapsible sidebar or popup
2. The conversation context auto-injects the current stock info, so users don't need to specify:
   - User: "Is this stock still a buy?" → AI automatically knows the current stock is HK.00700
   - User: "Which stock in my watchlist is most worth watching?" → AI analyzes the entire watchlist
   - User: "If I buy 1000 shares at 350, what are the approximate fees?" → AI calls fee-calculator
3. AI can call local tool functions (Function Calling):
   - `getKlineData(code, period)` — fetch K-line data
   - `getIndicatorSnapshot(code)` — fetch indicator snapshot
   - `calculateFees(provider, market, side, price, qty)` — calculate fees
   - `getAccountSummary()` — fetch account info
   - `getPositions()` — fetch positions
   - `runBacktest(strategy)` — run a backtest

### AI Skills Configuration ✅ Implemented

Users can enable/disable AI skills that inject domain-specific knowledge into AI prompts. Each enabled skill appends a detailed knowledge block to the system message, giving the AI model specialized context for better analysis.

| Skill | Category | Default | Description |
|-------|----------|---------|-------------|
| Technical Analysis | Analysis | On | MA, RSI, MACD, Bollinger, KDJ, OBV, volume analysis for order evaluation |
| Market Knowledge | Market | On | HK/US/CN market rules, trading hours, settlement, fee structures, lot sizes |
| Risk Assessment | Risk | On | Position sizing, drawdown control, concentration risk, VaR, liquidity risk |
| Trading Strategies | Strategy | Off | Momentum, mean reversion, breakout, trend following, scalping, swing strategies |
| Fee Calculation | Fee | Off | Commission, stamp duty, SEC/FINRA fees for HK/US/CN markets with examples |
| Pattern Recognition | Pattern | Off | Support/resistance, H&S, triangles, flags, candlestick patterns |

**How it works**:

1. Skill definitions live in `src/shared/types.ts` (`AI_SKILL_PRESETS`, `DEFAULT_AI_SKILLS`)
2. Detailed prompt content for each skill is in `src/main/ai-skills.ts` (`buildSkillPrompt()` combines enabled built-in + custom skills)
3. `src/main/ai-service.ts` uses `buildSystemPrompt()` to merge the user's base system prompt with enabled skill content before every AI call (evaluateOrder, streamChat, Claude fallback)
4. The Settings panel (`AISettings.tsx`) provides toggle cards for each skill, persisted alongside the AI config in `ai-config.json`

#### Custom Skills

Users can create their own skills with custom prompt content:
- Click **"Add Skill"** in the Custom Skills section of AI Settings
- Fill in name, description, category, and the prompt text
- Custom skills appear alongside built-in skills with enable/disable toggles
- Edit (pencil icon) or delete (x icon) custom skills at any time

#### SkillHub Marketplace

Browse and install community-contributed skills from SkillHub:
- Configure a custom SkillHub URL in the SkillHub section (or leave empty for default)
+- Click **"Browse Skills"** to fetch and display available skills
- The app fetches the registry from a configurable URL (default: `https://zhongzhong0505.github.io/bang-skillhub/registry.json`), with local fallback to `skillhub/registry.json`
- Each SkillHub skill shows name, author, description, and download count
- Click **"Install"** to add a SkillHub skill to your custom skills list
- Installed skills show a green **"Installed"** badge
+- A **source indicator** shows whether data came from remote (green) or local fallback (yellow)
+- **Refresh** button re-fetches from the configured URL

Built-in SkillHub skills include: Macro Economic Analysis, Sector Rotation Analysis, Options & Greeks Interpretation, Crypto Market Correlation, Behavioral Finance Biases

**Architecture**:
- `CustomSkill` and `SkillHubItem` types defined in `src/shared/types.ts`
- Custom skills stored in `ai-config.json` under `customSkills: CustomSkill[]`
- SkillHub fetch via IPC (`skillhub:fetch`) with remote + local fallback
- `buildSkillPrompt()` in `src/main/ai-skills.ts` merges both built-in and custom enabled skills


### Technical Implementation Notes

#### API Call Architecture

```
src/
├── main/
│   └── ai-service.ts          # Main-process AI service, manages API key and requests
├── renderer/
│   ├── modules/ai/
│   │   ├── AIInsight.tsx      # Market interpretation panel
│   │   ├── AIChat.tsx         # Conversational assistant
│   │   ├── AIBacktest.tsx     # AI strategy generation
│   │   └── ai.css
│   └── utils/
│       └── ai-prompt.ts       # Prompt template management
└── shared/
    └── ai-types.ts            # AI-related type definitions
```

AI requests run in the main process to avoid exposing the API key to the renderer. Exposed via IPC:

```typescript
// shared/types.ts addition
export const IPC = {
  // ... existing channels
  AI_CHAT: 'ai:chat',
  AI_INSIGHT: 'ai:insight',
  AI_GENERATE_STRATEGY: 'ai:generate:strategy',
  AI_EVALUATE_ORDER: 'ai:evaluate:order',
  AI_ANALYZE_WATCHLIST: 'ai:analyze:watchlist',
  AI_STREAM_CHUNK: 'ai:stream:chunk',  // streaming output push
} as const;
```

#### Prompt Engineering Notes

1. **Data compression**: Only pass the OHLCV summary of the latest 20-60 candles, not the full array. Pass only the latest indicator values, not the full series.
2. **Context window management**: Maintain a rolling window, keeping only the last 5 conversation turns; older turns are auto-summarized.
3. **Market awareness**: Inject current trading-session info (e.g. HK 9:30-16:00) into the prompt so the AI knows whether the market is open.
4. **Risk disclaimer**: All AI outputs automatically append "The above analysis is for reference only and does not constitute investment advice."

#### Local Indicators + AI Synergy

The indicators computed by the existing `indicators.ts` are the best input for AI analysis. There's no need for the LLM to compute RSI or MACD itself — pass the pre-computed results as structured data, letting the AI focus on interpretation and judgment:

```typescript
interface MarketContext {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  indicators: {
    ma: { ma5: number; ma10: number; ma20: number; ma60: number };
    macd: { dif: number; dea: number; histogram: number };
    rsi: number;
    kdj: { k: number; d: number; j: number };
    boll: { upper: number; mid: number; lower: number };
    atr: number;
    volumeRatio: number;
  };
  chipDistribution: {
    concentration: number;
    supportLevel: number;
    resistanceLevel: number;
  };
  recentCandles: KlineData[];
}
```

#### Streaming Output

Use the OpenAI-compatible streaming API for a real-time typing effect. The main process pushes chunks to the renderer via IPC.

#### Supported AI Providers

| Provider | Auth | Base URL | Models |
|----------|------|----------|--------|
| OpenAI | Bearer Token | `https://api.openai.com/v1` | GPT-5, GPT-5.2, o3, o4-mini, etc. |
| Zhipu GLM | Bearer Token | `https://open.bigmodel.cn/api/paas/v4` | GLM-5, GLM-5.1, GLM-5.2, etc. |
| Kimi (Moonshot) | Bearer Token | `https://api.moonshot.cn/v1` | moonshot-v1-auto, etc. |
| DeepSeek | Bearer Token | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner |
| Claude | x-api-key | `https://api.anthropic.com/v1` | claude-sonnet-4, etc. |
| Tencent Hunyuan Cloud API | TC3-HMAC-SHA256 | `https://hunyuan.tencentcloudapi.com` | hunyuan-turbos, hunyuan-pro, etc. |
| Tencent Token Plan (Personal) | Bearer Token | `https://api.lkeap.cloud.tencent.com/plan/v1` | tc-code-latest, deepseek-v4-flash/pro, glm-5, hy3-preview, etc. |

**Tencent Token Plan (Personal)** uses a single API key (shared across General and Hy plans), OpenAI-compatible protocol. Obtain the API key from the [Token Plan console](https://cloud.tencent.com/document/product/1823/130060).

#### Security & Privacy

- API keys are stored in the main process's local config; the renderer cannot access them directly
- Users can opt in/out of AI features (new "AI Analysis" category in settings)
- K-line data is public market data with no privacy concerns and can be safely sent to APIs
- Account position info is sensitive data; only send it after explicit user authorization

### Implementation Priority

| Priority | Feature | Rationale |
|----------|---------|----------|
| P0 | ✅ Real-time AI market interpretation | Implemented, AI risk assessment before ordering |
| P0 | ✅ AI settings panel | Implemented, multi-provider switching + model selection + connection test |
| P0 | ✅ AI skills configuration | Implemented, built-in skill toggles with domain knowledge injection |
| P1 | ✅ Conversational market assistant | Implemented, streaming real-time push |
| P1 | AI anomaly detection push | Background run, needs scheduled tasks and notification system |
| P2 | Natural-language strategy generation | Needs strict output format constraints, backtest engine integration |
| P2 | ✅ AI-assisted trading decisions | Implemented, order risk assessment with multi-context |

### Fit with Existing Architecture

Bang's modular design is naturally suited for AI integration:

- `indicators.ts` already has 15+ technical indicator calculation functions — direct data source for AI
- `chip-distribution.ts` results can be quantified as chip concentration for AI support/resistance judgment
- `backtest.ts` strategy condition system can seamlessly connect with AI-generated strategies
- `fee-calculator.ts` can serve as an AI Function Calling tool function
- Zustand store's `klineData`, `positions`, `accountSummary` are ready-made context data
- The IPC channel architecture is mature; adding AI-related channels won't affect existing features
- The theme system already has dark/light switching; AI panels can auto-adapt

In short, Bang doesn't need major architecture changes to integrate AI. The core work is prompt engineering and UI panel design — the underlying data pipeline, indicator calculation, and trade execution chain are all ready.

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
