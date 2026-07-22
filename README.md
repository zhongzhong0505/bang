# Bang — 桌面级交易终端

## 项目简介

Bang 是一个基于 Electron + React + TypeScript 构建的桌面级交易终端，以 TradingView 为参照目标，集成了行情展示、技术分析、量化回测、交易下单、费用计算等全链路能力。底层通过富途 OpenD 和老虎 OpenAPI（官方 TypeScript SDK）两种券商网关获取实时行情和执行交易指令，前端使用 lightweight-charts 渲染专业 K 线图。启动时自动连接已配置网关，行情与图表数据保持同步。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 43.x (stable) |
| 构建工具 | Rspack | 2.x |
| 语言 | TypeScript | 7.x |
| 前端框架 | React | 19.x |
| 状态管理 | Zustand | 5.x |
| 图表库 | lightweight-charts | 5.x |
| 图标库 | lucide-react | 1.x |
| 主进程通信 | Electron IPC + contextBridge | - |
| Tiger SDK | @tigeropenapi/tigeropen | 0.5.x |
| WebSocket | ws (主进程) | 8.x |

## 架构概览

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
│  │              Adapters (数据格式适配)                  │   │
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
│  Zustand Store (全局状态)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 主进程 (Main)

- `gateway.ts` — 富途 OpenD WebSocket 客户端，实现二进制协议编解码（16 字节包头 + JSON body），支持 ProtoID 1001/3001/3002/5001/5003/2212/2215/2222/2223/2225
- `tiger-gateway.ts` — 老虎 OpenAPI 客户端（SDK-based），基于 `@tigeropenapi/tigeropen` 官方 TypeScript SDK，通过 Protobuf 协议通信，SDK 自动处理 RSA 签名、域名解析和实时推送（TCP+TLS+Protobuf），支持 QuoteClient/TradeClient/PushClient 全链路
- `gateway-router.ts` — 网关路由器，根据 `activeProvider` 在富途和老虎之间切换
- `adapters/futu-adapter.ts` — 富途原始数据解析器，将 ProtoID 响应转换为统一内部类型
- `adapters/tiger-adapter.ts` — 老虎 SDK 数据适配器，将 SDK 强类型对象（Brief/Kline/Position/Order/Asset/Transaction）映射为内部统一类型
- `store.ts` — 本地配置持久化
- `index.ts` — Electron 入口，IPC handler 注册，`app://` 自定义协议

### 预加载 (Preload)

`preload/index.ts` — 通过 `contextBridge` 安全地暴露 `window.bangAPI`，包含网关配置、行情请求、交易下单、账户查询等全部 IPC 方法和事件监听器。

### 渲染进程 (Renderer)

按功能模块组织在 `modules/` 下，每个模块自带独立 CSS 文件：

| 模块 | 目录 | 功能 |
|------|------|------|
| 图表 | `modules/chart/` | K 线主图 + 副图指标 + 筹码分布 + 成交量分布 + 画线工具 + 数据窗口 + K 线回放 |
| 自选 | `modules/watchlist/` | 自选股列表，实时行情快照 |
| 交易 | `modules/trading/` | 下单面板 + 盘口深度 + 交易明细 + 费用计算 |
| 量化 | `modules/quant/` | 策略管理 + 回测引擎 + 实时信号 + 运行监控 |
| 搜索 | `modules/search/` | 股票代码搜索 |
| 预警 | `modules/alerts/` | 价格预警设置与触发 |
| 设置 | `modules/settings/` | 基础设置 + 图表设置 + 交易设置 + 富途/老虎网关配置 |
| 账户 | `modules/account/` | 账户资产详情（总资产/现金/市值/保证金/分市场明细） |
| 工具栏 | `modules/toolbar/` | 顶部工具栏，周期切换/图表类型/指标/对比/更多工具 |
| 状态栏 | `modules/statusbar/` | 底部状态栏 |

## 已实现功能清单

### 行情与图表
- K 线图：蜡烛/空心/阳线/柱状/折线/面积 六种图表类型
- 周期：1m / 5m / 15m / 30m / 1h / 日K / 周K / 月K
- 主图指标：MA5/10/20/60、EMA12/26、BOLL 布林带、SAR 抛物线、VWAP
- 副图指标：MACD、KDJ、RSI、STOCH 随机指标、WR 威廉指标、CCI、OBV、ATR、ADX
- 筹码分布：基于历史成交量衰减加权计算，与 K 线图并排对照
- 成交量分布 (Volume Profile)：按价格区间的成交量统计
- 画线工具：趋势线、水平线、矩形等
- 数据窗口 (Data Window)：十字准线悬浮时的 OHLCV 数据面板
- K 线回放 (Replay)：按时间步进回放历史行情
- 多股对比：叠加多只股票走势在同一图表
- 主题：暗色/亮色/跟随系统，通过 CSS 变量实时切换
- 字体大小：小/标准/大/特大，通过 `--app-zoom` CSS 变量全局缩放
- 日期时间格式：可配置 K 线时间轴和十字准线的日期/时间显示格式

### 交易
- 下单面板：限价单/市价单/止损单/止损限价单，买入/卖出切换
- 交易费用计算：按富途和老虎的真实费率计算
  - 港股：佣金(0.03% min HKD3) + SFC征费 + 联交所交易费 + 结算费 + 印花税(卖0.13%) + 平台费
  - 美股：佣金(富途$0.0049/股 min $0.99 / 老虎$0.005/股 min $1) + SEC费(卖) + FINRA TAF(卖)
  - A股：佣金(0.03% min ¥5) + 印花税(卖0.05%) + 过户费 + 证管费
- 费用实时预览：输入价格和数量后即时显示费用明细
- 交易明细页：完整交易记录列表，支持市场/方向筛选，可展开费用明细，汇总卡片
- 持仓管理：持仓列表展示
- 委托管理：今日委托列表（待报/已报/部成/待撤/已成/已撤/废单）
- 盘口深度 (DOM)：买卖盘档位展示

### 量化交易
- 策略管理：创建/编辑/删除/启停策略
- 条件系统：MA 金叉/死叉、RSI 超买/超卖、MACD 金叉/死叉、布林带突破、价格穿越、放量突破
- 回测引擎：完整回测，输出收益率/胜率/最大回撤/夏普比率/盈亏比/资金曲线
- 风控配置：止损/止盈/最大仓位比例/最大持仓周期
- 实时信号：策略运行时监控，条件触发自动生成买卖信号

### 账户
- 账户资产总览：总资产、可用现金、持仓市值、买入能力
- 盈亏概览：浮动盈亏、浮动盈亏比、已实现盈亏、冻结资金
- 保证金信息：可取资金、冻结资金、初始保证金、维持保证金
- 分市场明细：港股/美股/A股等各市场的资产分布

### 系统设置
- 外观：暗色/亮色/跟随系统（带 SVG 迷你 K 线图预览）
- 语言：简体中文/繁体中文/English
- 日期时间格式：6 种日期格式 + 4 种时间格式
- 图表设置：配色方案、默认图表类型、默认周期
- 交易设置：下单确认、默认数量、单笔限额、每日亏损限额
- 网关配置：富途 OpenD（host/port/wsPort/wsAuthKey/SSL）和老虎 OpenAPI（tigerId/account/privateKey/licenses/token/serverUrl），启动时自动连接已保存配置的网关
- 系统行为：最小化到托盘、开机自启、预警提示音

### 券商适配

#### 富途 OpenD

| ProtoID | 功能 | 适配器函数 |
|---------|------|-----------|
| 1001 | InitConnect | 主进程内部 |
| 3001 | Subscribe | `buildFutuSubscribeRequest` |
| 3002 | StockUpdate | `parseFutuStockUpdate` |
| 5001 | HistoryKLines | `parseFutuKline` / `buildFutuKlineRequest` |
| 5003 | MarketSnapshot | `parseFutuSnapshot` / `buildFutuSnapshotRequest` |
| 2212 | PlaceOrder | `parseFutuPlaceOrder` / `buildFutuPlaceOrderRequest` |
| 2215 | CancelOrder | 主进程内部 |
| 2222 | OrderList | `parseFutuOrders` |
| 2223 | PositionList | `parseFutuPositions` |
| 2225 | AccInfo | `parseFutuAccountSummary` / `buildFutuAccInfoRequest` |

#### 老虎 OpenAPI（SDK-based）

基于 `@tigeropenapi/tigeropen` v0.5+ 官方 TypeScript SDK，通过 Protobuf 协议通信。

| SDK 方法 | 功能 | 适配器函数 |
|----------|------|-----------|
| QuoteClient.getKline | K 线数据 | `mapSdkKline` |
| QuoteClient.getRealTimeQuote | 实时报价 | `mapSdkBrief` |
| QuoteClient.getSymbolNames | 股票搜索 | `fromTigerSymbol` |
| TradeClient.getPositions | 持仓列表 | `mapSdkPosition` |
| TradeClient.getOrders | 委托列表 | `mapSdkOrder` |
| TradeClient.getAssets | 账户资产 | `mapSdkAsset` |
| TradeClient.placeOrder | 下单 | `marketOrder` / `limitOrder` / `stopOrder` |
| TradeClient.cancelOrder | 撤单 | 主进程内部 |
| TradeClient.modifyOrder | 改单 | 主进程内部 |
| TradeClient.getOrderTransactions | 历史成交 | `mapSdkTransaction` |
| PushClient (TCP+TLS) | 实时推送 | onQuote / onKline / onOrder / onPosition / onAsset |

每个行情牌照（TBUS/TBHK/TBSG…）对应独立的 QuoteClient，SDK 自动路由到最优行情服务器。交易和推送使用首个牌照。

## 目录结构

```
bang/
├── package.json
├── rspack.config.ts          # 三套构建配置 (main / preload / renderer)
├── tsconfig.json
├── src/
│   ├── shared/
│   │   └── types.ts           # 全局类型定义 + IPC 通道常量 + 默认配置
│   ├── main/                  # Electron 主进程
│   │   ├── index.ts           # 入口 + IPC handler
│   │   ├── gateway.ts         # 富途 OpenD WebSocket 客户端
│   │   ├── tiger-gateway.ts   # 老虎 OpenAPI REST + WS 客户端
│   │   ├── gateway-router.ts  # 网关路由器
│   │   ├── store.ts           # 配置持久化
│   │   └── adapters/
│   │       ├── futu-adapter.ts   # 富途数据格式适配
│   │       └── tiger-adapter.ts  # 老虎数据格式适配
│   ├── preload/
│   │   └── index.ts           # contextBridge 桥接
│   └── renderer/              # React 渲染进程
│       ├── index.tsx          # React 入口
│       ├── App.tsx            # 根组件 + 路由 + ErrorBoundary
│       ├── mock.ts            # Mock 数据生成
│       ├── store/
│       │   └── index.ts       # Zustand 全局状态
│       ├── utils/
│       │   ├── format.ts      # 日期时间格式化
│       │   └── fee-calculator.ts  # 交易费用计算引擎
│       ├── styles/
│       │   └── global.css     # 全局样式 + CSS 变量
│       └── modules/
│           ├── chart/         # 图表模块
│           ├── watchlist/     # 自选股
│           ├── trading/       # 交易（下单/盘口/明细）
│           ├── quant/         # 量化（策略/回测/信号）
│           ├── account/       # 账户详情
│           ├── settings/      # 设置面板
│           ├── search/        # 股票搜索
│           ├── alerts/        # 价格预警
│           ├── toolbar/       # 顶部工具栏
│           └── statusbar/     # 底部状态栏
└── dist/                      # 构建输出
```

## 构建与运行

```bash
# 安装依赖
npm install

# 构建 (main + preload + renderer)
npm run build

# 构建并启动 Electron
npm run dev

# 监听模式构建 (开发用)
npm run dev:watch

# 生产构建
npm run build:prod

# 清理构建产物
npm run clean
```

---

## AI 行情分析集成方案

当前项目已具备完整的行情数据管线和量化框架，但所有分析逻辑都是基于规则的。引入 AI 可以实现从"规则驱动"到"智能驱动"的跨越，以下是具体的集成路径。

### 整体思路

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  实时行情数据  │────▶│  AI 分析引擎层    │────▶│  分析结果展示层  │
│  (K线/快照)   │     │  (LLM + 本地指标) │     │  (图表/面板/通知) │
└──────────────┘     └──────────────────┘     └─────────────────┘
        │                     │                        │
        ▼                     ▼                        ▼
  现有 store 数据       OpenAI API 调用           标注在 K 线图上
  现有 IPC 通道         本地指标上下文             AI 对话面板
                        历史数据窗口              实时推送通知
```

### 第一层：实时 AI 行情解读

**目标**：当用户切换到某只股票时，AI 自动读取当前 K 线数据和技术指标，生成一段简短的市场解读。

**实现方式**：

1. 在渲染进程中新增 `modules/ai/AIInsight.tsx` 组件，作为 DataWindow 的延伸
2. 用户切换股票或周期时，从 store 中提取最近 N 根 K 线 + 全部技术指标快照
3. 将数据压缩为结构化 prompt，调用 OpenAI API（GPT-4o 或 o-series 推理模型）
4. prompt 模板示例：
   ```
   你是专业交易分析师。以下是 {股票名称}({代码}) 的近期行情：
   - 当前价格: {close}, 涨跌幅: {changeRate}%
   - MA5={ma5}, MA20={ma20}, MACD: DIF={dif} DEA={dea}
   - RSI(14)={rsi}, KDJ: K={k} D={d} J={j}
   - BOLL: 上轨={upper} 中轨={mid} 下轨={lower}
   - 近5日量比: {volRatio}
   - 筹码集中度: {chipConcentration}
   
   请用 3-5 句话给出：
   1. 当前技术形态判断
   2. 关键支撑/压力位
   3. 短期操作建议
   ```
5. 结果展示在 K 线图右侧或底部的 AI 面板中，支持流式输出

**数据来源**：直接从 Zustand store 的 `klineData`、`indicators` 和 `ChipDistribution` 计算结果中提取，无需新增 IPC 通道。

### 第二层：AI 驱动的异常检测与实时推送

**目标**：在后台持续监控自选股池，当 AI 识别到异动信号时主动推送通知。

**实现方式**：

1. 主进程新增 `src/main/ai-monitor.ts`，定时（每 30s-1min）拉取自选股快照
2. 将快照数据发送给 AI 模型，使用结构化输出（JSON mode）：
   ```json
   {
     "alerts": [
       {
         "code": "HK.00700",
         "type": "volume_anomaly",
         "severity": "high",
         "description": "成交量突然放大 3.2 倍，同时价格突破 20 日均线",
         "suggestion": "关注放量突破有效性，可考虑轻仓跟进"
       }
     ]
   }
   ```
3. 通过 IPC 推送到渲染进程，在状态栏显示红点，点击展开异动列表
4. 结合现有的 `AlertPanel` 模块，将 AI 预警与传统价格预警统一管理

**优化**：使用批量请求减少 API 调用次数，一次请求传入整个自选股池的快照数据。

### 第三层：自然语言策略生成

**目标**：用户用自然语言描述交易意图，AI 自动生成可执行的量化策略。

**实现方式**：

1. 在 QuantPanel 中新增"AI 策略生成"入口
2. 用户输入：`"当 MACD 金叉且 RSI 低于 35 时买入，止损 5%，止盈 15%"`
3. AI 解析为结构化的 `StrategyCondition[]` + `RiskConfig`：
   ```json
   {
     "conditions": [
       { "type": "macd_cross", "action": "BUY" },
       { "type": "rsi_oversold", "action": "BUY", "params": { "threshold": 35 } }
     ],
     "risk": { "stopLossPct": 5, "takeProfitPct": 15 }
   }
   ```
4. 生成的策略直接灌入现有的回测引擎，用户可立即看到回测结果
5. 用户可以追问 "把止损改成 3%"，AI 增量修改策略参数

**关键点**：AI 输出的策略格式必须严格匹配现有的 `ConditionType` 枚举和 `RiskConfig` 接口，通过 JSON Schema 约束输出。

### 第四层：AI 辅助交易决策 ✅ 已实现

**目标**：在下单前，AI 结合当前持仓、账户状态和市场环境给出风险提示。

**实现方式**：

1. OrderPanel 的下单按钮旁新增"AI 评估"按钮
2. 点击后，将以下上下文一并发送给 AI：
   - 当前订单信息（方向/价格/数量/预估费用）
   - 账户状态（总资产/可用资金/现有持仓/买入能力）
   - 当前股票的技术面（指标快照）和基本面（如有）
   - 最近的交易记录和盈亏情况
3. AI 返回结构化评估：
   ```json
   {
     "risk_level": "medium",
     "position_ratio": "本次下单将占用总资产的 23%",
     "warnings": ["当前 RSI 超买(78.5)", "该股近 5 日已上涨 12%"],
     "suggestion": "可考虑分批建仓，降低单笔仓位"
   }
   ```
4. 评估结果以浮层形式展示在订单面板上方

### 第五层：对话式行情助手

**目标**：用户可以随时用自然语言提问，AI 结合实时数据回答。

**实现方式**：

1. 新增 `modules/ai/AIChat.tsx` 组件，可折叠侧边栏或弹窗形式
2. 对话上下文自动注入当前股票信息，用户无需手动指定：
   - 用户："这只股票还能买吗？" → AI 自动知道当前在看 HK.00700
   - 用户："帮我看看自选股里哪个最值得关注" → AI 分析整个 watchlist
   - 用户："如果我在 350 买入 1000 股，费用大概多少？" → AI 调用 fee-calculator
3. AI 可以调用本地工具函数（Function Calling）：
   - `getKlineData(code, period)` — 获取 K 线数据
   - `getIndicatorSnapshot(code)` — 获取指标快照
   - `calculateFees(provider, market, side, price, qty)` — 计算费用
   - `getAccountSummary()` — 获取账户信息
   - `getPositions()` — 获取持仓
   - `runBacktest(strategy)` — 执行回测

### 技术实现要点

#### API 调用架构

```
src/
├── main/
│   └── ai-service.ts          # 主进程 AI 服务，管理 API key 和请求
├── renderer/
│   ├── modules/ai/
│   │   ├── AIInsight.tsx      # 行情解读面板
│   │   ├── AIChat.tsx         # 对话式助手
│   │   ├── AIBacktest.tsx     # AI 策略生成
│   │   └── ai.css
│   └── utils/
│       └── ai-prompt.ts       # prompt 模板管理
└── shared/
    └── ai-types.ts            # AI 相关类型定义
```

AI 请求放在主进程执行，避免渲染进程直接持有 API key，通过 IPC 暴露：

```typescript
// shared/types.ts 新增
export const IPC = {
  // ... existing channels
  AI_CHAT: 'ai:chat',
  AI_INSIGHT: 'ai:insight',
  AI_GENERATE_STRATEGY: 'ai:generate:strategy',
  AI_EVALUATE_ORDER: 'ai:evaluate:order',
  AI_ANALYZE_WATCHLIST: 'ai:analyze:watchlist',
  AI_STREAM_CHUNK: 'ai:stream:chunk',  // 流式输出推送
} as const;
```

#### Prompt 工程要点

1. **数据压缩**：K 线数据只传最近 20-60 根的 OHLCV 摘要，不传完整数组。指标只传最新值而非完整序列。
2. **上下文窗口管理**：维护滚动窗口，只保留最近 5 轮对话，超出部分自动摘要。
3. **市场感知**：prompt 中注入当前交易时段信息（港股 9:30-16:00 等），让 AI 知道是否在盘中。
4. **风险声明**：所有 AI 输出末尾自动附加"以上分析仅供参考，不构成投资建议"。

#### 本地指标与 AI 的协同

项目已有的 `indicators.ts` 计算的指标是 AI 分析的最佳输入。不需要让 LLM 自己算 RSI 或 MACD，而是把计算好的结果作为结构化数据传入，让 AI 专注于解读和判断：

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
    volumeRatio: number;  // 量比
  };
  chipDistribution: {
    concentration: number;  // 筹码集中度
    supportLevel: number;   // 支撑位
    resistanceLevel: number; // 压力位
  };
  recentCandles: KlineData[]; // 最近 20 根 K 线
}
```

#### 流式输出

使用 OpenAI-compatible 的 streaming API 实现实时打字效果。主进程通过 IPC 逐 chunk 推送给渲染进程。

#### 支持的 AI 提供商

| 提供商 | 认证方式 | Base URL | 模型 |
|--------|----------|----------|------|
| OpenAI | Bearer Token | `https://api.openai.com/v1` | GPT-5, GPT-5.2, o3, o4-mini 等 |
| 智谱 GLM | Bearer Token | `https://open.bigmodel.cn/api/paas/v4` | GLM-5, GLM-5.1, GLM-5.2 等 |
| Kimi 月之暗面 | Bearer Token | `https://api.moonshot.cn/v1` | moonshot-v1-auto 等 |
| DeepSeek | Bearer Token | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner |
| Claude | x-api-key | `https://api.anthropic.com/v1` | claude-sonnet-4 等 |
| 腾讯混元 Cloud API | TC3-HMAC-SHA256 | `https://hunyuan.tencentcloudapi.com` | hunyuan-turbos, hunyuan-pro 等 |
| 腾讯 Token Plan 个人版 | Bearer Token | `https://api.lkeap.cloud.tencent.com/plan/v1` | tc-code-latest, deepseek-v4-flash/pro, glm-5, hy3-preview 等 |

**腾讯 Token Plan 个人版**使用单一 API Key（通用与 Hy 套餐共用），OpenAI 兼容协议，在 [Token Plan 控制台](https://cloud.tencent.com/document/product/1823/130060) 获取 API Key。

#### 安全与隐私

- API key 存储在主进程的本地配置中，渲染进程无法直接访问
- 用户可选择是否启用 AI 功能（设置面板新增"AI 分析"分类）
- K 线数据是公开市场数据，不涉及隐私问题，可以安全发送给 API
- 账户持仓信息属于敏感数据，应在用户明确授权后才发送

### 落地优先级建议

| 优先级 | 功能 | 理由 |
|--------|------|------|
| P0 | ✅ 实时 AI 行情解读 | 已实现，下单前 AI 风险评估 |
| P0 | ✅ AI 设置面板 | 已实现，多提供商切换 + 模型选择 + 连接测试 |
| P1 | ✅ 对话式行情助手 | 已实现，流式输出实时推送 |
| P1 | AI 异常检测推送 | 后台运行，需要定时任务和通知系统 |
| P2 | 自然语言策略生成 | 需要严格约束输出格式，与回测引擎对接 |
| P2 | AI 辅助交易决策 | 需要整合订单/账户/持仓多重上下文 |

### 与现有架构的契合度

Bang 的模块化设计天然适合 AI 集成：

- `indicators.ts` 已有 15+ 种技术指标的计算函数，直接作为 AI 的数据源
- `chip-distribution.ts` 的筹码分布计算结果可以量化为筹码集中度，供 AI 判断支撑压力
- `backtest.ts` 的策略条件系统可以与 AI 生成的策略无缝对接
- `fee-calculator.ts` 可以作为 AI Function Calling 的工具函数
- Zustand store 中的 `klineData`、`positions`、`accountSummary` 都是现成的上下文数据
- IPC 通道架构成熟，新增 AI 相关通道不影响现有功能
- 主题系统已有暗色/亮色切换，AI 面板可以自动适配

简而言之，Bang 不需要大改架构就能接入 AI。核心工作量在于 prompt 工程和 UI 面板设计，底层的数据管线、指标计算和交易执行链路都已经就绪。
