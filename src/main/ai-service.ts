/**
 * AI Service — main-process module for multi-provider AI API calls.
 *
 * Supported providers:
 *  - OpenAI (Bearer auth, /v1/chat/completions)
 *  - GLM / 智谱 (Bearer auth, OpenAI-compatible)
 *  - Kimi / 月之暗面 (Bearer auth, OpenAI-compatible)
*  - DeepSeek (Bearer auth, OpenAI-compatible)
 *  - Tencent TokenHub / MaaS (Bearer auth, OpenAI-compatible)
*  - Claude / Anthropic (x-api-key, /v1/messages)
 *  - Tencent Hunyuan TokenPlan (TC3-HMAC-SHA256 signature)
 *
 * Used for:
 *  - Pre-order risk evaluation (returns structured AIEvaluationResult)
 *  - Streaming chat for real-time market analysis
 */
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { AISettings, AIEvaluationContext, AIEvaluationResult, AIChatMessage, AIProvider, AIProviderPreset } from '../shared/types';
import { DEFAULT_AI_SETTINGS, AI_PROVIDER_PRESETS } from '../shared/types';
import { buildSkillPrompt } from './ai-skills';

const AI_CONFIG_FILE = path.join(app.getPath('userData'), 'ai-config.json');

let cachedSettings: AISettings | null = null;

export function loadAISettings(): AISettings {
  if (cachedSettings) return cachedSettings;
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const data = fs.readFileSync(AI_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      cachedSettings = {
        ...DEFAULT_AI_SETTINGS,
        ...parsed,
        tencentTokenPlan: { ...DEFAULT_AI_SETTINGS.tencentTokenPlan, ...(parsed.tencentTokenPlan ?? {}) },
        skills: { ...DEFAULT_AI_SKILLS, ...(parsed.skills ?? {}) },
        customSkills: Array.isArray(parsed.customSkills) ? parsed.customSkills : [],
        skillhubUrl: parsed.skillhubUrl ?? '',
      };
      return cachedSettings;
    }
  } catch {
    // ignore
  }
  cachedSettings = { ...DEFAULT_AI_SETTINGS };
  return cachedSettings;
}

export function saveAISettings(settings: Partial<AISettings>): AISettings {
  const current = loadAISettings();
  const merged: AISettings = {
    ...current,
    ...settings,
    tencentTokenPlan: { ...current.tencentTokenPlan, ...(settings.tencentTokenPlan ?? {}) },
    skills: { ...current.skills, ...(settings.skills ?? {}) },
    customSkills: settings.customSkills ?? current.customSkills ?? [],
    skillhubUrl: settings.skillhubUrl ?? current.skillhubUrl ?? '',
  };
  cachedSettings = merged;
  try {
    const dir = path.dirname(AI_CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch {
    // ignore
  }
  return merged;
}

// ===== HTTP helpers =====

function httpPostJSON(
  url: string,
  body: Record<string, any>,
  settings: AISettings,
  signal?: { aborted: boolean },
): Promise<any> {
  const preset = AI_PROVIDER_PRESETS.find((p) => p.provider === settings.provider);
  if (!preset) throw new Error(`Unknown AI provider: ${settings.provider}`);

  const parsed = new URL(url);
  const isHttps = parsed.protocol === 'https:';
  const postData = JSON.stringify(body);

  const headers = buildHeaders(settings, preset, parsed, postData);
  headers['Content-Length'] = String(Buffer.byteLength(postData));

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers,
    };
    const req = (isHttps ? https : http).request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        if (signal?.aborted) { req.destroy(); return; }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const dataStr = Buffer.concat(chunks).toString('utf-8');
        try {
          const json = JSON.parse(dataStr);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(json.error?.message ?? json.Response?.Error?.Message ?? `HTTP ${res.statusCode}: ${dataStr.slice(0, 200)}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${dataStr.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpStreamPostJSON(
  url: string,
  body: Record<string, any>,
  settings: AISettings,
  onChunk: (text: string) => void,
  signal?: { aborted: boolean },
): Promise<void> {
  const preset = AI_PROVIDER_PRESETS.find((p) => p.provider === settings.provider);
  if (!preset) throw new Error(`Unknown AI provider: ${settings.provider}`);

  const parsed = new URL(url);
  const isHttps = parsed.protocol === 'https:';
  const postData = JSON.stringify(body);

  const headers = buildHeaders(settings, preset, parsed, postData);
  headers['Content-Length'] = String(Buffer.byteLength(postData));

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers,
    };
    const req = (isHttps ? https : http).request(options, (res) => {
      let buffer = '';
      res.on('data', (chunk: Buffer) => {
        if (signal?.aborted) { req.destroy(); return; }
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') { resolve(); return; }
          try {
            const json = JSON.parse(payload);
            // OpenAI-compatible: choices[0].delta.content
            let delta = json.choices?.[0]?.delta?.content;
            // Claude streaming: delta.text
            if (!delta && json.delta?.text) delta = json.delta.text;
            // Tencent Hunyuan streaming: Choices[0].Delta.Content
            if (!delta && json.Choices?.[0]?.Delta?.Content) delta = json.Choices[0].Delta.Content;
            if (delta) onChunk(delta);
          } catch {
            // skip
          }
        }
      });
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ===== Provider-specific headers =====

/**
 * Build request headers for the configured AI provider.
 */
function buildHeaders(
  settings: AISettings,
  preset: AIProviderPreset,
  parsedUrl: URL,
  postData: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (preset.authType === 'x-api-key') {
    // Claude / Anthropic
    headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (preset.authType === 'tc3-hmac-sha256') {
    // Tencent Cloud Hunyuan
    Object.assign(headers, buildTencentHeaders(settings, parsedUrl, postData));
  } else {
    // Bearer token (OpenAI, GLM, Kimi, DeepSeek, Tencent TokenHub)
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  return headers;
}

/**
 * Tencent Cloud V3 API signature (TC3-HMAC-SHA256).
 * Reference: https://cloud.tencent.com/document/api/1729/105437
 */
function buildTencentHeaders(
  settings: AISettings,
  parsedUrl: URL,
  postData: string,
): Record<string, string> {
  const { secretId, secretKey } = settings.tencentTokenPlan;
  const service = 'hunyuan';
  const host = parsedUrl.hostname;
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  // Canonical request
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-tc-action:chatcompletions\n`;
  const signedHeaders = 'content-type;host;x-tc-action';
  const hashedRequestPayload = crypto.createHash('sha256').update(postData).digest('hex');
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

  // String to sign
  const algorithm = 'TC3-HMAC-SHA256';
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${timestamp}\n${date}/${service}/tc3_request\n${hashedCanonicalRequest}`;

  // Signature
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  const authorization = `${algorithm} Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Authorization': authorization,
    'X-TC-Action': 'ChatCompletions',
    'X-TC-Version': '2023-09-01',
    'X-TC-Timestamp': String(timestamp),
    'X-TC-Region': settings.tencentTokenPlan.region || 'ap-guangzhou',
    'Host': host,
  };
}

// ===== Request body builders =====

interface ChatOpts {
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
  stream?: boolean;
}

/**
 * Build the request body and URL for the configured provider.
 * Claude and Tencent use different request/response formats.
 */
function buildChatRequest(
  settings: AISettings,
  messages: AIChatMessage[],
  opts: ChatOpts,
): { url: string; body: Record<string, any> } {
  const preset = AI_PROVIDER_PRESETS.find((p) => p.provider === settings.provider)!;
  const baseUrl = settings.baseUrl || preset.baseUrl;

  if (settings.provider === 'claude') {
    // Claude: system is a top-level field, not a message role; endpoint is /v1/messages
    const systemContent = messages.find((m) => m.role === 'system')?.content ?? buildSystemPrompt(settings);
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    return {
      url: `${baseUrl}/messages`,
      body: {
        model: settings.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        system: systemContent,
        messages: chatMessages,
        ...(opts.stream ? { stream: true } : {}),
      },
    };
  }

  if (settings.provider === 'tencent') {
    // Hunyuan: PascalCase fields, different message format
    const chatMessages = messages.map((m) => ({
      Role: m.role,
      Content: m.content,
    }));

    return {
      url: baseUrl,
      body: {
        Model: settings.model,
        Messages: chatMessages,
        Temperature: opts.temperature,
        ...(opts.stream ? { Stream: true } : {}),
      },
    };
  }

  // OpenAI-compatible (OpenAI, GLM, Kimi, DeepSeek, Tencent TokenHub)
  return {
    url: `${baseUrl}/chat/completions`,
    body: {
      model: settings.model,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      ...(opts.stream ? { stream: true } : {}),
    },
  };
}

/**
 * Extract text content from a provider's response (non-streaming).
 */
function extractContent(response: any, provider: AIProvider): string {
  if (provider === 'claude') {
    return response.content?.map((c: any) => c.text ?? '').join('') ?? '';
  }
  if (provider === 'tencent') {
    return response.Choices?.[0]?.Message?.Content
      ?? response.Response?.Choices?.[0]?.Message?.Content
      ?? '';
  }
  return response.choices?.[0]?.message?.content ?? '';
}

// ===== Evaluation prompt =====

function buildEvaluationPrompt(ctx: AIEvaluationContext): string {
  const positionRatio = ctx.accountTotalAssets > 0
    ? ((ctx.amount / ctx.accountTotalAssets) * 100).toFixed(2)
    : '0';

  const recentPrices = ctx.klineClose.slice(-30);
  const recentVolumes = ctx.klineVolume.slice(-30);

  const ma5 = recentPrices.length >= 5
    ? (recentPrices.slice(-5).reduce((a, b) => a + b, 0) / 5).toFixed(2)
    : 'N/A';
  const ma20 = recentPrices.length >= 20
    ? (recentPrices.slice(-20).reduce((a, b) => a + b, 0) / 20).toFixed(2)
    : 'N/A';
  const avgVolume = recentVolumes.length > 0
    ? Math.round(recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length).toString()
    : 'N/A';
  const lastVolume = recentVolumes[recentVolumes.length - 1] ?? 0;
  const volumeRatio = avgVolume !== 'N/A' && avgVolume !== '0'
    ? (lastVolume / parseInt(avgVolume)).toFixed(2)
    : 'N/A';

  let volatility = 'N/A';
  if (recentPrices.length >= 20) {
    const slice = recentPrices.slice(-20);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
    volatility = (Math.sqrt(variance) / mean * 100).toFixed(2);
  }

  return `请分析以下交易订单的风险，并以 JSON 格式返回评估结果。

## 订单信息
- 标的: ${ctx.name} (${ctx.symbol})
- 市场: ${ctx.market}
- 方向: ${ctx.side === 'BUY' ? '买入' : '卖出'}
- 类型: ${ctx.orderType}
- 价格: ${ctx.price} ${ctx.currency}
- 数量: ${ctx.quantity}
- 金额: ${ctx.amount.toFixed(2)} ${ctx.currency}
- 手续费: ${ctx.totalFee.toFixed(2)} ${ctx.currency}
- 净额: ${ctx.netAmount.toFixed(2)} ${ctx.currency}

## 当前行情
- 现价: ${ctx.currentPrice} ${ctx.currency}
- 涨跌幅: ${ctx.changeRate}%
- MA5: ${ma5}
- MA20: ${ma20}
- 成交量比: ${volumeRatio} (相对均量)
- 波动率(20日): ${volatility}%

## 账户信息
- 总资产: ${ctx.accountTotalAssets.toFixed(2)} ${ctx.currency}
- 可用现金: ${ctx.accountCash.toFixed(2)} ${ctx.currency}
- 购买力: ${ctx.accountBuyingPower.toFixed(2)} ${ctx.currency}
- 浮动盈亏: ${ctx.accountUnrealizedPnl.toFixed(2)} ${ctx.currency}
- 本单占资产比: ${positionRatio}%

## 现有持仓
- 持仓数量: ${ctx.existingPositionQty}
- 成本价: ${ctx.existingPositionAvgPrice}
- 持仓盈亏: ${ctx.existingPositionPnl.toFixed(2)}
- 持仓盈亏率: ${ctx.existingPositionPnlRatio.toFixed(2)}%

## 风控限制
- 单笔最大金额: ${ctx.maxSingleOrderAmount > 0 ? ctx.maxSingleOrderAmount + ' ' + ctx.currency : '无限制'}
- 日亏损限制: ${ctx.dailyLossLimit > 0 ? ctx.dailyLossLimit + ' ' + ctx.currency : '无限制'}

## 返回格式（必须为合法 JSON）
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": 0-100,
  "positionRatio": ${parseFloat(positionRatio)},
  "warnings": ["风险提示1", "风险提示2"],
  "suggestion": "操作建议",
  "recommendation": "proceed" | "caution" | "reject",
  "analysis": "详细分析"
}

请根据订单信息、行情数据、账户状态和风控限制进行综合分析，重点关注仓位集中度、资金占用、市场波动和持仓风险。`;
}

// ===== Public API =====

function isConfigured(settings: AISettings): boolean {
  if (settings.provider === 'tencent') {
    return !!(settings.tencentTokenPlan.secretId && settings.tencentTokenPlan.secretKey);
  }
  return !!settings.apiKey;
}


/** Build the full system prompt by combining the base prompt with enabled skill context. */
function buildSystemPrompt(settings: AISettings): string {
  const parts: string[] = [settings.systemPrompt];
  const skillPrompt = buildSkillPrompt(settings.skills ?? {}, settings.customSkills ?? []);
  if (skillPrompt) {
    parts.push("\n\n# Enabled AI Skills\n", skillPrompt);
  }
  return parts.join("");
}

export async function evaluateOrder(ctx: AIEvaluationContext): Promise<AIEvaluationResult> {
  const settings = loadAISettings();
  if (!settings.enabled || !isConfigured(settings)) {
    return {
      riskLevel: 'low',
      riskScore: 0,
      positionRatio: ctx.accountTotalAssets > 0 ? ctx.amount / ctx.accountTotalAssets : 0,
      warnings: ['AI 评估未启用，请在设置中配置 AI 并开启评估功能'],
      suggestion: '请先在设置 > AI 分析中配置并启用 AI 评估',
      recommendation: 'proceed',
      analysis: 'AI 评估功能未启用，无法进行智能分析。建议在设置中配置后使用。',
    };
  }

  const prompt = buildEvaluationPrompt(ctx);
  const messages: AIChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(settings) },
    { role: 'user', content: prompt },
  ];

  try {
    const { url, body } = buildChatRequest(settings, messages, {
      temperature: 0.3,
      maxTokens: 1500,
      jsonMode: true,
    });

    const response = await httpPostJSON(url, body, settings);
    const content = extractContent(response, settings.provider) ?? '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return {
      riskLevel: parsed.riskLevel ?? 'medium',
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 50,
      positionRatio: ctx.accountTotalAssets > 0 ? ctx.amount / ctx.accountTotalAssets : 0,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      suggestion: parsed.suggestion ?? '',
      recommendation: parsed.recommendation ?? 'caution',
      analysis: parsed.analysis ?? content,
    };
  } catch (err: any) {
    return {
      riskLevel: 'medium',
      riskScore: 50,
      positionRatio: ctx.accountTotalAssets > 0 ? ctx.amount / ctx.accountTotalAssets : 0,
      warnings: [`AI 评估失败: ${err.message}`],
      suggestion: '建议手动评估风险后再操作',
      recommendation: 'caution',
      analysis: `AI API 调用失败: ${err.message}`,
    };
  }
}

export async function streamChat(
  messages: AIChatMessage[],
  win: BrowserWindow | null,
  signal?: { aborted: boolean },
): Promise<string> {
  const settings = loadAISettings();
  if (!settings.enabled || !isConfigured(settings)) {
    throw new Error('AI 未启用或未配置 API Key');
  }

  const fullMessages: AIChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(settings) },
    ...messages,
  ];

  const { url, body } = buildChatRequest(settings, fullMessages, {
    temperature: 0.7,
    maxTokens: 2000,
    stream: true,
  });

  let fullText = '';
  await httpStreamPostJSON(
    url,
    body,
    settings,
    (delta) => {
      fullText += delta;
      if (win && !win.isDestroyed()) {
        win.webContents.send('ai:stream:chunk', { delta, done: false });
      }
    },
    signal,
  );

  if (win && !win.isDestroyed()) {
    win.webContents.send('ai:stream:chunk', { delta: '', done: true });
  }

  return fullText;
}

// ===== Calendar =====

export interface AICalendarResult {
  events: Array<{
    type: string;
    title: string;
    code?: string;
    name?: string;
    date: string;
    time?: string;
    importance: string;
    country?: string;
    actual?: string;
    forecast?: string;
    previous?: string;
    description?: string;
  }>;
}

export async function fetchCalendarEvents(date: string): Promise<AICalendarResult | null> {
  const settings = loadAISettings();
  if (!settings.enabled || !isConfigured(settings)) {
    return null;
  }

  const prompt = `You are a financial calendar data assistant. Return today's major financial events for ${date} as a JSON array.

Include: earnings reports, dividend ex-dates, key economic data releases, IPOs, and stock splits.
Focus on US, HK, and CN markets. Prioritize high-impact events.

Each event must have:
- type: one of "earnings", "dividend", "economic", "ipo", "split"
- title: event description (in the market's language — Chinese for HK/CN, English for US)
- code: stock code if applicable (e.g. "US.AAPL", "HK.00700", "SH.600519")
- name: company/indicator name
- date: "${date}" (YYYY-MM-DD)
- time: scheduled time in HH:MM format (use market timezone: US=ET, HK=HKT, CN=CST)
- importance: "high", "medium", or "low"
- country: "US", "HK", or "CN"
- actual: actual value if released (empty string if not yet released)
- forecast: consensus forecast/estimate
- previous: previous period value
- description: brief note (optional)

Return ONLY a JSON object with a single key "events" containing the array. No markdown, no commentary.
Example: {"events": [{"type":"economic","title":"US Nonfarm Payrolls","date":"${date}","time":"08:30","importance":"high","country":"US","actual":"","forecast":"180K","previous":"206K"}]}`;

  const messages: AIChatMessage[] = [
    { role: 'system', content: 'You are a precise financial data API. Return only valid JSON. No explanations.' },
    { role: 'user', content: prompt },
  ];

  try {
    const { url, body } = buildChatRequest(settings, messages, {
      temperature: 0.1,
      maxTokens: 4000,
      jsonMode: true,
    });

    const response = await httpPostJSON(url, body, settings);
    const content = extractContent(response, settings.provider) ?? '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (parsed && Array.isArray(parsed.events)) {
      return parsed as AICalendarResult;
    }
    return null;
  } catch {
    return null;
  }
}
