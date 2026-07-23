// Gateway provider type
export type GatewayProvider = 'futu' | 'tiger';

// Futu OpenD gateway configuration
export interface FutuGatewayConfig {
  provider: 'futu';
  host: string;
  port: number;
  wsPort: number;
  wsAuthKey: string;
  sslCert?: string;
  sslKey?: string;
  rsaPrivateKey?: string;
}

// Tiger OpenAPI gateway configuration
export interface TigerGatewayConfig {
  provider: 'tiger';
  tigerId: string;
  account: string;
  privateKey: string;
  licenses: string[];
  token?: string;
  serverUrl?: string;
}

// Union type for gateway config
export type GatewayConfig = FutuGatewayConfig | TigerGatewayConfig;

export interface GatewayStatus {
  connected: boolean;
  loggedIn: boolean;
  provider: GatewayProvider;
  host?: string;
  port?: number;
  error?: string;
}

// Market data types
export type SubType = '1' | '5' | '15' | '30' | '60' | 'DAY' | 'WEEK' | 'MONTH';

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface StockSnapshot {
  code: string;
  name: string;
  curPrice: number;
  changeVal: number;
  changeRate: number;
  volume: number;
  turnover: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface StockInfo {
  code: string;
  name: string;
  market: number;
  lotSize: number;
  stockType: string;
}

export type Market = 'HK' | 'US' | 'SH' | 'SZ' | 'SG' | 'JP';

export interface WatchlistItem {
  code: string;
  name: string;
  market: Market;
}

// Order types
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

export interface OrderRequest {
  code: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
}

export interface Position {
  code: string;
  name: string;
  qty: number;
  avgPrice: number;
  marketPrice: number;
  pnl: number;
  pnlRatio: number;
}

export interface OrderRecord {
  id: string;
  code: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  qty: number;
  filledQty: number;
  status: 'PENDING' | 'SUBMITTED' | 'PARTIAL' | 'PENDING_CANCEL' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  time: number;
}

// ===== AI Types =====

export type AIProvider = 'openai' | 'glm' | 'kimi' | 'deepseek' | 'claude' | 'tencent' | 'tencent-tokenhub';

export interface TencentTokenPlanConfig {
  secretId: string;
  secretKey: string;
  region: string;
}

export interface AIProviderPreset {
  provider: AIProvider;
  name: string;
  label: string;
  baseUrl: string;
  models: { value: string; label: string; desc: string }[];
  authType: 'bearer' | 'x-api-key' | 'tc3-hmac-sha256';
}

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    provider: 'openai',
    name: 'OpenAI',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { value: 'gpt-5', label: 'GPT-5', desc: '最新旗舰模型' },
      { value: 'gpt-5.2', label: 'GPT-5.2', desc: '增强版旗舰' },
      { value: 'gpt-5.4', label: 'GPT-5.4', desc: '超旗舰模型' },
      { value: 'o3', label: 'o3', desc: '最强推理模型' },
      { value: 'o4-mini', label: 'o4-mini', desc: '推理优化，性价比高' },
      { value: 'gpt-oss-120b', label: 'GPT-OSS 120B', desc: '开源120B参数' },
      { value: 'gpt-oss-20b', label: 'GPT-OSS 20B', desc: '开源20B轻量版' },
    ],
    authType: 'bearer',
  },
  {
    provider: 'glm',
    name: '智谱 GLM',
    label: 'GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { value: 'glm-5', label: 'GLM-5', desc: '最新旗舰模型' },
      { value: 'glm-5.1', label: 'GLM-5.1', desc: '增强版旗舰' },
      { value: 'glm-5.2', label: 'GLM-5.2', desc: '超旗舰模型' },
      { value: 'glm-5-turbo', label: 'GLM-5 Turbo', desc: '极速旗舰版' },
      { value: 'glm-5v-turbo', label: 'GLM-5V Turbo', desc: '极速多模态' },
      { value: 'glm-4.7', label: 'GLM-4.7', desc: '高性能模型' },
      { value: 'glm-4.7-flash', label: 'GLM-4.7 Flash', desc: '高性能极速版' },
      { value: 'glm-4.6', label: 'GLM-4.6', desc: '均衡模型' },
      { value: 'glm-4.6v', label: 'GLM-4.6V', desc: '多模态模型' },
      { value: 'glm-4.5', label: 'GLM-4.5', desc: '经典模型' },
    ],
    authType: 'bearer',
  },
  {
    provider: 'kimi',
    name: 'Kimi 月之暗面',
    label: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { value: 'kimi-k3', label: 'Kimi K3', desc: '最新推理模型（推荐）' },
      { value: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', desc: '代码专精模型' },
      { value: 'kimi-k2.6', label: 'Kimi K2.6', desc: '高性能模型' },
      { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: '均衡模型' },
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K', desc: '超长上下文' },
      { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K', desc: '长上下文' },
      { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K', desc: '标准上下文' },
    ],
    authType: 'bearer',
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', desc: '最新旗舰模型' },
      { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: '极速版' },
      { value: 'deepseek-chat', label: 'DeepSeek Chat', desc: '通用对话模型' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', desc: '深度推理模型' },
    ],
    authType: 'bearer',
  },
  {
    provider: 'claude',
    name: 'Claude Anthropic',
    label: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { value: 'claude-opus-4-8', label: 'Claude Opus 4.8', desc: '最新最强推理' },
      { value: 'claude-opus-4-7', label: 'Claude Opus 4.7', desc: '高阶推理' },
      { value: 'claude-opus-4-5', label: 'Claude Opus 4.5', desc: '高性能推理' },
      { value: 'claude-sonnet-5', label: 'Claude Sonnet 5', desc: '最新均衡旗舰' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: '高性价比均衡' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', desc: '极速轻量' },
    ],
    authType: 'x-api-key',
  },
  {
    provider: 'tencent',
    name: '腾讯混元 API',
    label: '混元',
    baseUrl: 'https://hunyuan.tencentcloudapi.com',
    models: [
      { value: 'hunyuan-turbos-latest', label: '混元 Turbos Latest', desc: '最新极速（推荐）' },
      { value: 'hunyuan-t1', label: '混元 T1', desc: '深度推理模型' },
      { value: 'hunyuan-t1-vision', label: '混元 T1 Vision', desc: '推理+视觉' },
      { value: 'hunyuan-pro', label: '混元 Pro', desc: '高性能模型' },
      { value: 'hunyuan-standard', label: '混元 Standard', desc: '标准模型' },
      { value: 'hunyuan-lite', label: '混元 Lite', desc: '轻量快速' },
      { value: 'hunyuan-vision', label: '混元 Vision', desc: '多模态视觉' },
      { value: 'hunyuan-role-latest', label: '混元 Role Latest', desc: '角色扮演' },
      { value: 'hunyuan-functioncall', label: '混元 FunctionCall', desc: '函数调用' },
    ],
    authType: 'tc3-hmac-sha256',
  },
  {
    provider: 'tencent-tokenhub',
    name: '腾讯 Token Plan 个人版',
    label: 'TokenPlan',
    baseUrl: 'https://api.lkeap.cloud.tencent.com/plan/v1',
    models: [
      { value: 'tc-code-latest', label: 'tc-code-latest', desc: 'Auto 智能路由（推荐）' },
      { value: 'deepseek-v4-flash-202605', label: 'DeepSeek V4 Flash', desc: 'DeepSeek 极速' },
      { value: 'deepseek-v4-pro-202606', label: 'DeepSeek V4 Pro', desc: 'DeepSeek 旗舰' },
      { value: 'minimax-m2.7', label: 'MiniMax M2.7', desc: 'MiniMax 最新' },
      { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: '月之暗面' },
      { value: 'glm-5', label: 'GLM-5', desc: '智谱旗舰' },
      { value: 'glm-5.1', label: 'GLM-5.1', desc: '智谱增强' },
      { value: 'hy3-preview', label: 'Hy3 Preview', desc: '混元 Agent 模型' },
    ],
    authType: 'bearer',
  },
];

export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  systemPrompt: string;
 tencentTokenPlan: TencentTokenPlanConfig;
 skills: Record<string, boolean>;
  customSkills: CustomSkill[];
  /** Custom SkillHub registry URL (overrides default) */
  skillhubUrl?: string;
}


export type AISkillCategory = 'analysis' | 'market' | 'risk' | 'strategy' | 'fee' | 'pattern' | 'custom';

export interface AISkillPreset {
  id: string;
  category: AISkillCategory;
  /** i18n key suffix for the skill name */
  nameKey: string;
  /** i18n key suffix for the skill description */
  descKey: string;
  defaultEnabled: boolean;
}

export const AI_SKILL_PRESETS: AISkillPreset[] = [
  {
    id: 'technical_analysis',
    category: 'analysis',
    nameKey: 'skill.techAnalysis',
    descKey: 'skill.techAnalysisDesc',
    defaultEnabled: true,
  },
  {
    id: 'market_knowledge',
    category: 'market',
    nameKey: 'skill.marketKnowledge',
    descKey: 'skill.marketKnowledgeDesc',
    defaultEnabled: true,
  },
  {
    id: 'risk_assessment',
    category: 'risk',
    nameKey: 'skill.riskAssessment',
    descKey: 'skill.riskAssessmentDesc',
    defaultEnabled: true,
  },
  {
    id: 'trading_strategy',
    category: 'strategy',
    nameKey: 'skill.tradingStrategy',
    descKey: 'skill.tradingStrategyDesc',
    defaultEnabled: false,
  },
  {
    id: 'fee_calculation',
    category: 'fee',
    nameKey: 'skill.feeCalc',
    descKey: 'skill.feeCalcDesc',
    defaultEnabled: false,
  },
  {
    id: 'pattern_recognition',
    category: 'pattern',
    nameKey: 'skill.patternRecognition',
    descKey: 'skill.patternRecognitionDesc',
    defaultEnabled: false,
  },
];

export const DEFAULT_AI_SKILLS: Record<string, boolean> = AI_SKILL_PRESETS.reduce(
  (acc, s) => { acc[s.id] = s.defaultEnabled; return acc; },
  {} as Record<string, boolean>,
);

// User-defined custom skill (created locally or installed from SkillHub)
export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  category: AISkillCategory;
  /** Full prompt text injected into the AI system message when enabled */
  promptContent: string;
  /** Author name (for SkillHub-installed skills) */
  author?: string;
  /** Version string (for SkillHub updates) */
  version?: string;
  /** Source: where this skill came from */
  source: 'builtin' | 'custom' | 'skillhub';
  createdAt: number;
  updatedAt: number;
}

// SkillHub registry item (what the user sees when browsing the marketplace)
export interface SkillHubItem {
  id: string;
  name: string;
  description: string;
  category: AISkillCategory;
  promptContent: string;
  author: string;
  version: string;
  tags?: string[];
  downloads?: number;
}

export interface AIEvaluationContext {
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  price: number;
  quantity: number;
  amount: number;
  totalFee: number;
  netAmount: number;
  market: string;
  currency: string;
  currentPrice: number;
  changeRate: number;
  accountTotalAssets: number;
  accountCash: number;
  accountBuyingPower: number;
  accountUnrealizedPnl: number;
  existingPositionQty: number;
  existingPositionAvgPrice: number;
  existingPositionPnl: number;
  existingPositionPnlRatio: number;
  klineClose: number[];
  klineVolume: number[];
  maxSingleOrderAmount: number;
  dailyLossLimit: number;
}

export interface AIEvaluationResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  positionRatio: number;
  warnings: string[];
  suggestion: string;
  recommendation: 'proceed' | 'caution' | 'reject';
  analysis: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  context?: {
    symbol?: string;
    klineData?: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  };
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  provider: 'openai',
  apiKey: '',
  model: 'gpt-5',
  baseUrl: 'https://api.openai.com/v1',
  systemPrompt: 'You are a professional trading analyst. Analyze the given order context and provide risk assessment in Chinese.',
  tencentTokenPlan: { secretId: '', secretKey: '', region: 'ap-guangzhou' },
 skills: { ...DEFAULT_AI_SKILLS },
  customSkills: [],
};

// IPC channels
export const IPC = {
  GATEWAY_CONFIG_GET: 'gateway:config:get',
  GATEWAY_CONFIG_SET: 'gateway:config:set',
  GATEWAY_CONNECT: 'gateway:connect',
  GATEWAY_DISCONNECT: 'gateway:disconnect',
  GATEWAY_STATUS: 'gateway:status',
  GATEWAY_STATUS_UPDATE: 'gateway:status:update',
  KLINE_REQUEST: 'kline:request',
  KLINE_DATA: 'kline:data',
  SNAPSHOT_REQUEST: 'snapshot:request',
  SNAPSHOT_DATA: 'snapshot:data',
  SUBSCRIBE: 'subscribe:request',
  SUBSCRIBE_DATA: 'subscribe:data',
  ORDER_PLACE: 'order:place',
  ORDER_CANCEL: 'order:cancel',
  ORDER_LIST: 'order:list',
  POSITIONS: 'positions',
  STOCK_SEARCH: 'stock:search',
  ACCOUNT_SUMMARY: 'account:summary',
  AI_EVALUATE_ORDER: 'ai:evaluate:order',
  AI_CHAT: 'ai:chat',
  AI_CONFIG_GET: 'ai:config:get',
  AI_CONFIG_SET: 'ai:config:set',
  AI_STREAM_CHUNK: 'ai:stream:chunk',
  APP_SETTINGS_GET: 'app:settings:get',
  APP_SETTINGS_SET: 'app:settings:set',
  ORDER_MODIFY: 'order:modify',
  SCREENER_SEARCH: 'screener:search',
  EXPORT_DATA: 'data:export',
  MODIFY_ORDER_GATEWAY: 'gateway:order:modify',
  HISTORY_DEALS_GET: 'history:deals:get',
 WIN_RATE_ANALYSIS: 'winrate:analyze',
 SKILLHUB_FETCH: 'skillhub:fetch',
 SKILLHUB_FETCH_URL: 'skillhub:fetch:url',
  SKILL_IMPORT_ZIP: 'skill:import:zip',
} as const;

// Default configs
export const DEFAULT_FUTU_CONFIG: FutuGatewayConfig = {
  provider: 'futu',
  host: '127.0.0.1',
  port: 33333,
  wsPort: 33333,
  wsAuthKey: '',
  sslCert: '',
  sslKey: '',
  rsaPrivateKey: '',
};

export const DEFAULT_TIGER_CONFIG: TigerGatewayConfig = {
  provider: 'tiger',
  tigerId: '',
  account: '',
  privateKey: '',
  licenses: ['TBUS', 'TBHK'],
  token: '',
  serverUrl: '',
};

// ===== Quantitative Trading Types =====

// Strategy condition types
export type ConditionType =
  | 'ma_cross'      // MA crossover (golden/death cross)
  | 'rsi_oversold'  // RSI below threshold
  | 'rsi_overbought' // RSI above threshold
  | 'macd_cross'    // MACD DIF/DEA crossover
  | 'boll_break'    // Bollinger band breakout/breakdown
  | 'price_cross'   // Price crosses above/below a value
  | 'volume_surge'; // Volume spike

export type ConditionAction = 'BUY' | 'SELL';

export interface StrategyCondition {
  type: ConditionType;
  action: ConditionAction;
  params: Record<string, number>;
}

// Risk management config
export interface RiskConfig {
  stopLossPct: number;    // stop loss percentage (e.g. 5 means 5%)
  takeProfitPct: number;  // take profit percentage
  maxPositionPct: number; // max position as % of capital
  maxHoldingBars: number; // max bars to hold before force-close
}

// Strategy definition
export interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  symbol: string;
  conditions: StrategyCondition[];
  risk: RiskConfig;
  initialCapital: number;
  createdAt: number;
}

// Backtest trade record
export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  side: 'BUY' | 'SELL';
  qty: number;
  pnl: number;
  pnlPct: number;
  reason: string; // 'signal' | 'stop_loss' | 'take_profit' | 'timeout'
}

// Backtest result
export interface BacktestResult {
  strategyId: string;
  totalReturn: number;
  totalReturnPct: number;
  winRate: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  finalCapital: number;
  trades: BacktestTrade[];
  equityCurve: { time: number; equity: number }[];
}

// Real-time signal
export interface SignalRecord {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  time: number;
  reason: string;
  executed: boolean;
}

// Strategy runtime state for live monitoring
export interface StrategyRuntime {
  strategyId: string;
  status: 'running' | 'stopped' | 'error';
  lastSignalTime: number;
  position: number;       // current position qty
  entryPrice: number;     // avg entry price if holding
  realizedPnl: number;
  signalCount: number;
  startTime: number;
}

export const DEFAULT_RISK: RiskConfig = {
  stopLossPct: 5,
  takeProfitPct: 10,
  maxPositionPct: 80,
  maxHoldingBars: 100,
};

export const DEFAULT_STRATEGY: Strategy = {
  id: 'strat-default',
  name: 'MA金叉策略',
  description: 'MA5上穿MA20买入，MA5下穿MA20卖出',
  enabled: false,
  symbol: 'HK.00700',
  conditions: [
    { type: 'ma_cross', action: 'BUY', params: { fast: 5, slow: 20 } },
    { type: 'ma_cross', action: 'SELL', params: { fast: 5, slow: 20 } },
  ],
  risk: { ...DEFAULT_RISK },
  initialCapital: 100000,
  createdAt: Date.now(),
};

// ===== Additional TradingView feature types =====

// Alert types
export interface Alert {
  id: string;
  code: string;
  name: string;
  condition: 'above' | 'below';
  price: number;
  message: string;
  createdAt: number;
  triggered: boolean;
}

// Chart style settings
export interface ChartStyle {
  upColor: string;
  downColor: string;
  gridColor: string;
  textColor: string;
  backgroundColor: string;
  showGrid: boolean;
  priceScalePosition: 'left' | 'right';
  scaleMarginsTop: number;
  scaleMarginsBottom: number;
  lineWidth: number;
  crosshairColor: string;
}

export const DEFAULT_CHART_STYLE: ChartStyle = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  gridColor: '#2a2e39',
  textColor: '#787b86',
  backgroundColor: '#131722',
  showGrid: true,
  priceScalePosition: 'right',
  scaleMarginsTop: 0.05,
  scaleMarginsBottom: 0.25,
  lineWidth: 1,
  crosshairColor: '#787b86',
};

 // ===== App Settings Types =====

 export type ThemeMode = 'dark' | 'light' | 'system';
 export type DateFormat = 'yyyy-MM-dd' | 'MM/dd' | 'dd/MM' | 'yyyy/MM/dd' | 'MMM dd' | 'dd MMM';
 export type TimeFormat = 'HH:mm' | 'HH:mm:ss' | 'hh:mm A' | 'hh:mm:ss A';
 export type Language = 'zh-CN' | 'en-US' | 'zh-TW';

 export interface AppSettings {
   theme: ThemeMode;
   dateFormat: DateFormat;
   timeFormat: TimeFormat;
   language: Language;
   showSecondsInCrosshair: boolean;
   defaultSubType: SubType;
   defaultChartType: 'candle' | 'line' | 'area';
   confirmBeforeOrder: boolean;
  defaultOrderQty: number;
  maxSingleOrderAmount: number;
  dailyLossLimit: number;
  enableSoundAlerts: boolean;
  minimizeToTray: boolean;
  autoStart: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'xlarge';
}

 export const DEFAULT_APP_SETTINGS: AppSettings = {
   theme: 'dark',
   dateFormat: 'MM/dd',
   timeFormat: 'HH:mm',
   language: 'zh-CN',
   showSecondsInCrosshair: false,
   defaultSubType: 'DAY',
   defaultChartType: 'candle',
   confirmBeforeOrder: true,
  defaultOrderQty: 100,
  maxSingleOrderAmount: 0,
  dailyLossLimit: 0,
  enableSoundAlerts: true,
  minimizeToTray: false,
  autoStart: false,
  fontSize: 'normal',
};

 // Theme color palettes
 export interface ThemeColors {
   bgPrimary: string;
   bgSecondary: string;
   bgTertiary: string;
   bgHover: string;
   bgActive: string;
   border: string;
   borderLight: string;
   textPrimary: string;
   textSecondary: string;
   textMuted: string;
   accent: string;
   green: string;
   red: string;
   gridColor: string;
   chartBg: string;
   crosshairColor: string;
 }

 export const DARK_COLORS: ThemeColors = {
   bgPrimary: '#131722',
   bgSecondary: '#1e222d',
   bgTertiary: '#2a2e39',
   bgHover: '#2a2e39',
   bgActive: '#363a45',
   border: '#2a2e39',
   borderLight: '#363c4e',
   textPrimary: '#d1d4dc',
   textSecondary: '#787b86',
   textMuted: '#434651',
   accent: '#2962ff',
   green: '#26a69a',
   red: '#ef5350',
   gridColor: '#2a2e39',
   chartBg: '#131722',
   crosshairColor: '#787b86',
 };

 export const LIGHT_COLORS: ThemeColors = {
   bgPrimary: '#ffffff',
   bgSecondary: '#f8f9fa',
   bgTertiary: '#e0e3eb',
   bgHover: '#e0e3eb',
   bgActive: '#d6d8e0',
   border: '#e0e3eb',
   borderLight: '#d6d8e0',
   textPrimary: '#131722',
   textSecondary: '#787b86',
   textMuted: '#a3a6af',
   accent: '#2962ff',
   green: '#26a69a',
   red: '#ef5350',
   gridColor: '#e0e3eb',
   chartBg: '#ffffff',
   crosshairColor: '#787b86',
 };

// Drawing tool types
export type DrawingType = 'trend_line' | 'horizontal_line' | 'ray' | 'fibonacci' | 'rectangle' | 'text';

export interface Drawing {
  id: string;
  type: DrawingType;
  points: { time: number; price: number }[];
  color: string;
  text?: string;
}

// Symbol search result
export interface SymbolSearchResult {
  code: string;
  name: string;
  market: Market;
  type: string;
}

// Comparison overlay
export interface ComparisonItem {
  code: string;
  name: string;
  color: string;
}

export const COMPARISON_STOCK_LIST: SymbolSearchResult[] = [
  { code: 'HK.00700', name: '腾讯控股', market: 'HK', type: '股票' },
  { code: 'HK.09988', name: '阿里巴巴-W', market: 'HK', type: '股票' },
  { code: 'HK.03690', name: '美团-W', market: 'HK', type: '股票' },
  { code: 'HK.02318', name: '中国平安', market: 'HK', type: '股票' },
  { code: 'HK.00939', name: '建设银行', market: 'HK', type: '股票' },
  { code: 'HK.01299', name: '友邦保险', market: 'HK', type: '股票' },
  { code: 'HK.00388', name: '港交所', market: 'HK', type: '股票' },
  { code: 'HK.00941', name: '中国移动', market: 'HK', type: '股票' },
  { code: 'HK.01109', name: '华润置地', market: 'HK', type: '股票' },
  { code: 'HK.01024', name: '快手-W', market: 'HK', type: '股票' },
  { code: 'HK.09618', name: '京东健康', market: 'HK', type: '股票' },
  { code: 'HK.06618', name: '京东健康', market: 'HK', type: '股票' },
  { code: 'HK.03328', name: '交通银行', market: 'HK', type: '股票' },
  { code: 'HK.01398', name: '工商银行', market: 'HK', type: '股票' },
  { code: 'HK.06862', name: '海底捞', market: 'HK', type: '股票' },
  { code: 'HK.01810', name: '小米集团-W', market: 'HK', type: '股票' },
  { code: 'HK.09999', name: '网易-S', market: 'HK', type: '股票' },
  { code: 'US.AAPL', name: 'Apple Inc', market: 'US', type: '股票' },
  { code: 'US.TSLA', name: 'Tesla Inc', market: 'US', type: '股票' },
  { code: 'US.NVDA', name: 'NVIDIA Corp', market: 'US', type: '股票' },
  { code: 'US.MSFT', name: 'Microsoft Corp', market: 'US', type: '股票' },
  { code: 'US.AMZN', name: 'Amazon.com Inc', market: 'US', type: '股票' },
  { code: 'US.GOOG', name: 'Alphabet Inc', market: 'US', type: '股票' },
  { code: 'US.META', name: 'Meta Platforms', market: 'US', type: '股票' },
  { code: 'US.NFLX', name: 'Netflix Inc', market: 'US', type: '股票' },
  { code: 'US.AMD', name: 'AMD Inc', market: 'US', type: '股票' },
  { code: 'US.INTEL', name: 'Intel Corp', market: 'US', type: '股票' },
  { code: 'US.BABA', name: '阿里巴巴 ADR', market: 'US', type: '股票' },
  { code: 'US.JD', name: '京东 ADR', market: 'US', type: '股票' },
  { code: 'US.PDD', name: '拼多多 ADR', market: 'US', type: '股票' },
  { code: 'SH.600519', name: '贵州茅台', market: 'SH', type: '股票' },
  { code: 'SH.600036', name: '招商银行', market: 'SH', type: '股票' },
  { code: 'SH.601318', name: '中国平安', market: 'SH', type: '股票' },
  { code: 'SH.600276', name: '恒瑞医药', market: 'SH', type: '股票' },
  { code: 'SH.601012', name: '隆基绿能', market: 'SH', type: '股票' },
  { code: 'SH.601398', name: '工商银行', market: 'SH', type: '股票' },
  { code: 'SH.600028', name: '中国石化', market: 'SH', type: '股票' },
  { code: 'SZ.000858', name: '五粮液', market: 'SZ', type: '股票' },
  { code: 'SZ.000001', name: '平安银行', market: 'SZ', type: '股票' },
  { code: 'SZ.002594', name: '比亚迪', market: 'SZ', type: '股票' },
  { code: 'SZ.300750', name: '宁德时代', market: 'SZ', type: '股票' },
  { code: 'SZ.000651', name: '格力电器', market: 'SZ', type: '股票' },
  { code: 'SZ.002415', name: '海康威视', market: 'SZ', type: '股票' },
];

// ===== Trading Fee Types =====

export type FeeType =
  | 'commission'    // 佣金
  | 'stamp_duty'    // 印花税 (HK only)
  | 'transfer_fee'  // 过户费 (HK stock / A-share)
  | 'settlement'    // 交易费 (HK exchange)
  | 'sec_fee'       // SEC fee (US sell)
  | 'finra_fee'     // FINRA TAF (US sell)
  | 'platform_fee'  // 平台费
  | 'other';        // 其他

export interface FeeItem {
  type: FeeType;
  name: string;
  amount: number;
}

export interface FeeBreakdown {
  fees: FeeItem[];
 totalFee: number;
}

export interface TradeRecord {
  id: string;
  orderId?: string;
  code: string;
  name: string;
  market: Market;
  side: OrderSide;
  price: number;
  filledQty: number;
  amount: number;          // = price * filledQty
  fee: FeeBreakdown;
  netAmount: number;       // amount + totalFee (buy) or amount - totalFee (sell)
  provider: GatewayProvider;
  time: number;            // fill timestamp (unix seconds)
  currency: string;        // HKD / USD / CNY
}

export function getMarketFromCode(code: string): Market {
  if (code.startsWith('HK.')) return 'HK';
  if (code.startsWith('US.')) return 'US';
  if (code.startsWith('SH.')) return 'SH';
  if (code.startsWith('SZ.')) return 'SZ';
  if (code.startsWith('SG.')) return 'SG';
  if (code.startsWith('JP.')) return 'JP';
  return 'HK';
}

export function getCurrencyFromMarket(market: Market): string {
  switch (market) {
    case 'HK': return 'HKD';
    case 'US': return 'USD';
    case 'SH':
    case 'SZ': return 'CNY';
    case 'SG': return 'SGD';
    case 'JP': return 'JPY';
    default: return 'HKD';
  }
}

// ===== Screener Types =====

export interface ScreenerFilter {
  market: Market | 'ALL';
  sector: string;
  minPrice: number;
  maxPrice: number;
  minChangeRate: number;
  maxChangeRate: number;
  minVolume: number;
  maxVolume: number;
  minTurnover: number;
  sortBy: 'changeRate' | 'volume' | 'turnover' | 'price';
  sortDir: 'asc' | 'desc';
}

export const DEFAULT_SCREENER_FILTER: ScreenerFilter = {
  market: 'ALL',
  sector: '',
  minPrice: 0,
  maxPrice: 0,
  minChangeRate: 0,
  maxChangeRate: 0,
  minVolume: 0,
  maxVolume: 0,
  minTurnover: 0,
  sortBy: 'changeRate',
  sortDir: 'desc',
};

export interface ScreenerResult {
  code: string;
  name: string;
  market: Market;
 price: number;
 changeRate: number;
 volume: number;
 turnover: number;
 peRatio: number;
 marketCap: number;
}

// ===== Fundamentals Types =====

export interface Fundamentals {
  code: string;
  name: string;
  market: Market;
  peRatio: number;
  pbRatio: number;
  marketCap: number;
  eps: number;
 dividendYield: number;
 revenue: number;
 netIncome: number;
 totalShares: number;
 floatShares: number;
 beta: number;
 high52Week: number;
 low52Week: number;
 sector: string;
 industry: string;
 description: string;
 updateTime: number;
}

// ===== Economic Calendar Types =====

export type CalendarEventType = 'earnings' | 'dividend' | 'economic' | 'ipo' | 'split';

export interface CalendarEvent {
  id: string;
 type: CalendarEventType;
 title: string;
 code?: string;
 name?: string;
 date: string;
 time?: string;
 importance: 'high' | 'medium' | 'low';
 country?: string;
 actual?: string;
 forecast?: string;
 previous?: string;
 description?: string;
}

// ===== Order Modification =====

export interface ModifyOrderRequest {
  orderId: string;
 price?: number;
 quantity?: number;
}

// ===== Bracket / OCO Order =====

export interface BracketOrder {
  entryOrder: OrderRequest;
  takeProfitPrice: number;
  stopLossPrice: number;
}

// ===== Layout Persistence =====

export interface PanelLayout {
  showWatchlist: boolean;
  showOrderPanel: boolean;
  showDOM: boolean;
  showQuantPanel: boolean;
  chartLayout: 'single' | '2x1' | '1x2' | '2x2';
  watchlistWidth: number;
  rightPanelWidth: number;
}

export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  showWatchlist: true,
  showOrderPanel: true,
  showDOM: false,
  showQuantPanel: false,
  chartLayout: 'single',
  watchlistWidth: 240,
  rightPanelWidth: 300,
};

// ===== Export Types =====

export type ExportFormat = 'csv' | 'json';

export interface ExportRequest {
  format: ExportFormat;
 filename: string;
  data: any;
}

// ===== Multi-Chart Layout =====

export type ChartLayout = 'single' | '2x1' | '1x2' | '2x2';

export interface ChartSlot {
  id: number;
  code: string;
  name: string;
}

// ===== Account Summary =====

export interface AccountSummary {
  provider: GatewayProvider;
  accountId: string;
  /** Total net asset value across all markets */
  totalAssets: number;
  /** Available cash balance */
  cash: number;
  /** Market value of all holdings */
  marketValue: number;
  /** Unrealized P&L across all positions */
  unrealizedPnl: number;
  /** Unrealized P&L ratio */
  unrealizedPnlRatio: number;
  /** Realized P&L (today) */
  realizedPnl: number;
  /** Buying power / max purchasable amount */
  buyingPower: number;
  /** Cash available for withdrawal */
  withdrawableCash: number;
  /** Total frozen / locked amount */
  frozenCash: number;
  /** Initial margin requirement */
  initialMargin: number;
  /** Maintenance margin requirement */
  maintenanceMargin: number;
  /** Currency of the account */
  currency: string;
  /** Per-market breakdown */
  markets: AccountMarketDetail[];
  /** Last update timestamp (unix seconds) */
  updateTime: number;
}

export interface AccountMarketDetail {
  market: Market;
  totalAssets: number;
  cash: number;
  marketValue: number;
  unrealizedPnl: number;
  buyingPower: number;
  currency: string;
}

// ===== Historical Deal & Win Rate Analysis Types =====

/** A single filled trade (buy or sell) from broker history */
export interface HistoryDeal {
  id: string;
  code: string;
  name: string;
  side: OrderSide;
  price: number;
  qty: number;
  amount: number;
  fee: number;
  time: number;
  provider: GatewayProvider;
}

/** A matched buy-sell trade pair (FIFO matching) */
export interface MatchedTrade {
  code: string;
  name: string;
  side: 'BUY_THEN_SELL';
  buyPrice: number;
  buyQty: number;
  buyTime: number;
  buyFee: number;
  sellPrice: number;
  sellQty: number;
  sellTime: number;
  sellFee: number;
  /** buyFee + sellFee, total transaction cost for this matched pair */
  totalFee: number;
  pnl: number;
  pnlPct: number;
  /** net profit after deducting totalFee */
  netPnl: number;
  holdSeconds: number;
}

/** Per-stock win rate statistics */
export interface StockWinRate {
  code: string;
  name: string;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  evenTrades: number;
  winRate: number;
  avgPnl: number;
  avgPnlPct: number;
  avgNetPnl: number;
  totalPnl: number;
  totalNetPnl: number;
  totalFee: number;
  avgHoldSeconds: number;
  maxWin: number;
  maxLoss: number;
  trades: MatchedTrade[];
}

/** Overall win rate statistics across all stocks */
export interface OverallWinRate {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  evenTrades: number;
  winRate: number;
  avgPnl: number;
  avgPnlPct: number;
  avgNetPnl: number;
  totalPnl: number;
  totalNetPnl: number;
  totalFee: number;
  profitFactor: number;
  bestStock: string;
  worstStock: string;
  stockRates: StockWinRate[];
  startDate: number;
  endDate: number;
}

/** Win rate analysis request params */
export interface WinRateRequest {
  startTime?: number;
  endTime?: number;
}
