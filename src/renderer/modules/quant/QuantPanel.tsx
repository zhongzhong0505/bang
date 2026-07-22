import React, { useState } from 'react';
import './quant-panel.css';
import { useStore } from '../../store';
import { runBacktest, buildIndicatorContext, generateSignals } from './backtest';
import { generateMockKline } from '../../mock';
import type { Strategy, StrategyCondition, ConditionType, BacktestResult, RiskConfig, SignalRecord, StrategyRuntime } from '../../../shared/types';
import { DEFAULT_RISK } from '../../../shared/types';

const CONDITION_LABELS: Record<ConditionType, string> = {
  ma_cross: 'MA均线交叉',
  rsi_oversold: 'RSI超卖',
  rsi_overbought: 'RSI超买',
  macd_cross: 'MACD交叉',
  boll_break: '布林突破',
  price_cross: '价格穿越',
  volume_surge: '放量突破',
};

const genId = () => 'strat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const QuantPanel: React.FC = () => {
  const activeTab = useStore((s) => s.activeQuantTab);
  const setActiveTab = useStore((s) => s.setActiveQuantTab);
  const strategies = useStore((s) => s.strategies);
  const addStrategy = useStore((s) => s.addStrategy);
  const updateStrategy = useStore((s) => s.updateStrategy);
  const removeStrategy = useStore((s) => s.removeStrategy);
  const backtestResults = useStore((s) => s.backtestResults);
  const setBacktestResult = useStore((s) => s.setBacktestResult);
  const signals = useStore((s) => s.signals);
  const addSignal = useStore((s) => s.addSignal);
  const clearSignals = useStore((s) => s.clearSignals);
  const strategyRuntimes = useStore((s) => s.strategyRuntimes);
  const setStrategyRuntime = useStore((s) => s.setStrategyRuntime);
  const removeStrategyRuntime = useStore((s) => s.removeStrategyRuntime);
  const currentCode = useStore((s) => s.currentCode);

  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [backtesting, setBacktesting] = useState<string | null>(null);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'strategies', label: '策略' },
    { key: 'backtest', label: '回测' },
    { key: 'signals', label: '信号' },
    { key: 'monitor', label: '监控' },
  ];

  const handleCreateStrategy = () => {
    const newStrat: Strategy = {
      id: genId(),
      name: '新策略',
      description: '',
      enabled: false,
      symbol: currentCode,
      conditions: [{ type: 'ma_cross', action: 'BUY', params: { fast: 5, slow: 20 } }],
      risk: { ...DEFAULT_RISK },
      initialCapital: 100000,
      createdAt: Date.now(),
    };
    addStrategy(newStrat);
    setEditingStrategy(newStrat);
    setActiveTab('strategies');
  };

  const handleRunBacktest = (strat: Strategy) => {
    setBacktesting(strat.id);
    setTimeout(() => {
      const mockData = generateMockKline(500, 350);
      const result = runBacktest(strat, mockData);
      setBacktestResult(strat.id, result);
      setBacktesting(null);
    }, 50);
  };

  const handleToggleRun = (strat: Strategy) => {
    const rt = strategyRuntimes[strat.id];
    if (rt && rt.status === 'running') {
      removeStrategyRuntime(strat.id);
    } else {
      setStrategyRuntime(strat.id, {
        strategyId: strat.id,
        status: 'running',
        lastSignalTime: 0,
        position: 0,
        entryPrice: 0,
        realizedPnl: 0,
        signalCount: 0,
        startTime: Date.now(),
      });
    }
  };

  return (
    <div className="quant-panel">
      <div className="quant-header">
        <div className="quant-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`quant-tab${activeTab === t.key ? " quant-tab-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.key === 'signals' && signals.length > 0 && (
                <span className="quant-badge">{signals.length}</span>
              )}
            </button>
          ))}
        </div>
        <button className="quant-close" onClick={() => useStore.getState().toggleQuantPanel()}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
      </div>

      <div className="quant-content">
        {activeTab === 'strategies' && (
          <StrategiesTab
            strategies={strategies}
            editingStrategy={editingStrategy}
            setEditingStrategy={setEditingStrategy}
            onCreate={handleCreateStrategy}
            onUpdate={updateStrategy}
            onRemove={removeStrategy}
            onBacktest={handleRunBacktest}
            onToggleRun={handleToggleRun}
            backtesting={backtesting}
            runtimes={strategyRuntimes}
          />
        )}
        {activeTab === 'backtest' && (
          <BacktestTab strategies={strategies} results={backtestResults} onBacktest={handleRunBacktest} backtesting={backtesting} />
        )}
        {activeTab === 'signals' && (
          <SignalsTab signals={signals} onClear={clearSignals} onTest={(strat) => {
            const data = generateMockKline(500, 350);
            const ctx = buildIndicatorContext(data);
            const sig = generateSignals(strat, data, ctx);
            if (sig) {
              addSignal({
                id: 'sig-' + Date.now(),
                strategyId: strat.id,
                strategyName: strat.name,
                symbol: strat.symbol,
                action: sig.action,
                price: data[data.length - 1].close,
                time: Date.now(),
                reason: sig.reason,
                executed: false,
              });
            }
          }} strategies={strategies} />
        )}
        {activeTab === 'monitor' && (
          <MonitorTab strategies={strategies} runtimes={strategyRuntimes} onToggleRun={handleToggleRun} />
        )}
      </div>
    </div>
  );
};

// ===== Strategies Tab =====
interface StrategiesTabProps {
  strategies: Strategy[];
  editingStrategy: Strategy | null;
  setEditingStrategy: (s: Strategy | null) => void;
  onCreate: () => void;
  onUpdate: (id: string, partial: Partial<Strategy>) => void;
  onRemove: (id: string) => void;
  onBacktest: (s: Strategy) => void;
  onToggleRun: (s: Strategy) => void;
  backtesting: string | null;
  runtimes: Record<string, any>;
}

const StrategiesTab: React.FC<StrategiesTabProps> = ({
  strategies, editingStrategy, setEditingStrategy, onCreate, onUpdate, onRemove, onBacktest, onToggleRun, backtesting, runtimes,
}) => {
  if (editingStrategy) {
    return (
      <StrategyEditor
        strategy={editingStrategy}
        onSave={(updated) => {
          onUpdate(editingStrategy.id, updated);
          setEditingStrategy(null);
        }}
        onCancel={() => setEditingStrategy(null)}
      />
    );
  }

  return (
    <div className="quant-tab-content">
      <button className="quant-primary-btn" onClick={onCreate}>+ 新建策略</button>
      <div className="quant-list">
        {strategies.map((s) => {
          const rt = runtimes[s.id];
          const isRunning = rt?.status === 'running';
          return (
            <div key={s.id} className="quant-card">
              <div className="quant-card-header">
                <div className="quant-card-title-row">
                  <span className="quant-card-title">{s.name}</span>
                  {isRunning && <span className="quant-running-dot" />}
                </div>
                <div className="quant-card-actions">
                  <button className="quant-mini-btn" onClick={() => onBacktest(s)} disabled={backtesting === s.id}>
                    {backtesting === s.id ? '回测中...' : '回测'}
                  </button>
                  <button
                    className={`quant-mini-btn ${isRunning ? 'quant-mini-btn-red' : 'quant-mini-btn-green'}`}
                    onClick={() => onToggleRun(s)}
                  >
                    {isRunning ? '停止' : '运行'}
                  </button>
                  <button className="quant-mini-btn" onClick={() => setEditingStrategy(s)}>编辑</button>
                  <button className="quant-mini-btn quant-mini-btn-red" onClick={() => onRemove(s.id)}>删除</button>
                </div>
              </div>
              <div className="quant-card-desc">{s.description || '无描述'}</div>
              <div className="quant-card-meta">
                <span>标的: {s.symbol}</span>
                <span>条件: {s.conditions.length}</span>
                <span>资金: ¥{s.initialCapital.toLocaleString()}</span>
              </div>
              <div className="quant-card-conditions">
                {s.conditions.map((c, i) => (
                  <span key={i} className={`quant-cond-tag ${c.action === 'BUY' ? 'quant-cond-tag-buy' : 'quant-cond-tag-sell'}`}>
                    {CONDITION_LABELS[c.type]}→{c.action === 'BUY' ? '买' : '卖'}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== Strategy Editor =====
interface StrategyEditorProps {
  strategy: Strategy;
  onSave: (partial: Partial<Strategy>) => void;
  onCancel: () => void;
}

const StrategyEditor: React.FC<StrategyEditorProps> = ({ strategy, onSave, onCancel }) => {
  const [draft, setDraft] = useState<Strategy>({ ...strategy });

  const update = (partial: Partial<Strategy>) => setDraft((d) => ({ ...d, ...partial }));

  const updateCondition = (idx: number, partial: Partial<StrategyCondition>) => {
    const conditions = draft.conditions.map((c, i) => i === idx ? { ...c, ...partial } : c);
    update({ conditions });
  };

  const addCondition = () => {
    update({ conditions: [...draft.conditions, { type: 'ma_cross', action: 'BUY', params: { fast: 5, slow: 20 } }] });
  };

  const removeCondition = (idx: number) => {
    update({ conditions: draft.conditions.filter((_, i) => i !== idx) });
  };

  const updateRisk = (partial: Partial<RiskConfig>) => {
    update({ risk: { ...draft.risk, ...partial } });
  };

  return (
    <div className="quant-editor">
      <div className="quant-editor-header">
        <span className="quant-editor-title">编辑策略</span>
        <div className="quant-editor-actions">
          <button className="quant-primary-btn" onClick={() => onSave(draft)}>保存</button>
          <button className="quant-cancel-btn" onClick={onCancel}>取消</button>
        </div>
      </div>

      <div className="quant-editor-body">
        <div className="quant-form-row">
          <label className="quant-form-label">策略名称</label>
          <input className="quant-form-input" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">描述</label>
          <input className="quant-form-input" value={draft.description} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">标的代码</label>
          <input className="quant-form-input" value={draft.symbol} onChange={(e) => update({ symbol: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">初始资金</label>
          <input className="quant-form-input" type="number" value={draft.initialCapital} onChange={(e) => update({ initialCapital: +e.target.value })} />
        </div>

        <div className="quant-section-label">交易条件</div>
        {draft.conditions.map((cond, i) => (
          <div key={i} className="quant-cond-editor">
            <select className="quant-cond-select" value={cond.type} onChange={(e) => updateCondition(i, { type: e.target.value as ConditionType })}>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select className="quant-cond-select" value={cond.action} onChange={(e) => updateCondition(i, { action: e.target.value as 'BUY' | 'SELL' })}>
              <option value="BUY">买入</option>
              <option value="SELL">卖出</option>
            </select>
            {cond.type === 'ma_cross' && (
              <>
                <input className="quant-cond-input" type="number" value={cond.params.fast ?? 5} onChange={(e) => updateCondition(i, { params: { ...cond.params, fast: +e.target.value } })} title="快线周期" />
                <input className="quant-cond-input" type="number" value={cond.params.slow ?? 20} onChange={(e) => updateCondition(i, { params: { ...cond.params, slow: +e.target.value } })} title="慢线周期" />
              </>
            )}
            {(cond.type === 'rsi_oversold' || cond.type === 'rsi_overbought') && (
              <input className="quant-cond-input" type="number" value={cond.params.threshold ?? 30} onChange={(e) => updateCondition(i, { params: { ...cond.params, threshold: +e.target.value } })} title="RSI阈值" />
            )}
            {cond.type === 'boll_break' && <span className="quant-cond-hint">布林带默认20,2</span>}
            {cond.type === 'price_cross' && (
              <input className="quant-cond-input" type="number" value={cond.params.price ?? 0} onChange={(e) => updateCondition(i, { params: { ...cond.params, price: +e.target.value } })} title="目标价格" />
            )}
            {cond.type === 'volume_surge' && (
              <input className="quant-cond-input" type="number" value={cond.params.mult ?? 2} onChange={(e) => updateCondition(i, { params: { ...cond.params, mult: +e.target.value } })} title="放量倍数" />
            )}
            <button className="quant-mini-btn quant-mini-btn-red" onClick={() => removeCondition(i)}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
          </div>
        ))}
        <button className="quant-add-cond-btn" onClick={addCondition}>+ 添加条件</button>

        <div className="quant-section-label">风控设置</div>
        <div className="quant-risk-grid">
          <div className="quant-risk-item">
            <label className="quant-form-label">止损 (%)</label>
            <input className="quant-form-input" type="number" value={draft.risk.stopLossPct} onChange={(e) => updateRisk({ stopLossPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">止盈 (%)</label>
            <input className="quant-form-input" type="number" value={draft.risk.takeProfitPct} onChange={(e) => updateRisk({ takeProfitPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">最大仓位 (%)</label>
            <input className="quant-form-input" type="number" value={draft.risk.maxPositionPct} onChange={(e) => updateRisk({ maxPositionPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">最大持仓周期</label>
            <input className="quant-form-input" type="number" value={draft.risk.maxHoldingBars} onChange={(e) => updateRisk({ maxHoldingBars: +e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Backtest Tab =====
interface BacktestTabProps {
  strategies: Strategy[];
  results: Record<string, BacktestResult>;
  onBacktest: (s: Strategy) => void;
  backtesting: string | null;
}

const BacktestTab: React.FC<BacktestTabProps> = ({ strategies, results, onBacktest, backtesting }) => {
  return (
    <div className="quant-tab-content">
      {strategies.map((s) => {
        const result = results[s.id];
        return (
          <div key={s.id} className="quant-card">
            <div className="quant-card-header">
              <span className="quant-card-title">{s.name}</span>
              <button className="quant-primary-btn" onClick={() => onBacktest(s)} disabled={backtesting === s.id}>
                {backtesting === s.id ? '回测中...' : '运行回测'}
              </button>
            </div>
            {result ? (
              <div className="quant-result-grid">
                <div className="quant-result-item">
                  <span className="quant-result-label">总收益率</span>
                  <span className={`quant-result-value ${result.totalReturnPct >= 0 ? 'quant-result-value-up' : 'quant-result-value-down'}`}>
                    {result.totalReturnPct >= 0 ? '+' : ''}{result.totalReturnPct.toFixed(2)}%
                  </span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">总回报</span>
                  <span className={`quant-result-value ${result.totalReturn >= 0 ? 'quant-result-value-up' : 'quant-result-value-down'}`}>
                    ¥{result.totalReturn.toFixed(0)}
                  </span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">胜率</span>
                  <span className="quant-result-value">{result.winRate.toFixed(1)}%</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">总交易</span>
                  <span className="quant-result-value">{result.totalTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">盈利交易</span>
                  <span className="quant-result-value quant-result-value-up">{result.winTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">亏损交易</span>
                  <span className="quant-result-value quant-result-value-down">{result.lossTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">最大回撤</span>
                  <span className="quant-result-value quant-result-value-down">{result.maxDrawdownPct.toFixed(2)}%</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">夏普比率</span>
                  <span className="quant-result-value">{result.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">盈亏比</span>
                  <span className="quant-result-value">{result.profitFactor.toFixed(2)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">平均盈利</span>
                  <span className="quant-result-value quant-result-value-up">¥{result.avgWin.toFixed(0)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">平均亏损</span>
                  <span className="quant-result-value quant-result-value-down">¥{result.avgLoss.toFixed(0)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">期末资金</span>
                  <span className="quant-result-value">¥{result.finalCapital.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <div className="quant-empty-hint">点击"运行回测"查看结果</div>
            )}
            {result && result.trades.length > 0 && (
              <div className="quant-trades-section">
                <div className="quant-section-label">交易明细 (最近5条)</div>
                <table className="quant-trade-table">
                  <thead>
                    <tr>
                      <th className="quant-trade-th">方向</th>
                      <th className="quant-trade-th">入场价</th>
                      <th className="quant-trade-th">出场价</th>
                      <th className="quant-trade-th">盈亏</th>
                      <th className="quant-trade-th">原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(-5).reverse().map((t, i) => (
                      <tr key={i}>
                        <td className={`quant-trade-td ${t.side === 'BUY' ? 'quant-trade-td-up' : 'quant-trade-td-down'}`}>{t.side === 'BUY' ? '买' : '卖'}</td>
                        <td className="quant-trade-td">{t.entryPrice.toFixed(2)}</td>
                        <td className="quant-trade-td">{t.exitPrice.toFixed(2)}</td>
                        <td className={`quant-trade-td ${t.pnl >= 0 ? 'quant-trade-td-up' : 'quant-trade-td-down'}`}>{t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%</td>
                        <td className="quant-trade-td">{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      {strategies.length === 0 && <div className="quant-empty-hint">请先在"策略"标签创建策略</div>}
    </div>
  );
};

// ===== Signals Tab =====
interface SignalsTabProps {
  signals: SignalRecord[];
  onClear: () => void;
  onTest: (s: Strategy) => void;
  strategies: Strategy[];
}

const SignalsTab: React.FC<SignalsTabProps> = ({ signals, onClear, onTest, strategies }) => {
  return (
    <div className="quant-tab-content">
      <div className="quant-signals-header">
        <span className="quant-section-label">实时信号</span>
        <div className="quant-signal-actions">
          {strategies.filter((s) => s.enabled).map((s) => (
            <button key={s.id} className="quant-primary-btn" onClick={() => onTest(s)}>测试 {s.name}</button>
          ))}
          {signals.length > 0 && <button className="quant-cancel-btn" onClick={onClear}>清空</button>}
        </div>
      </div>
      {signals.length === 0 ? (
        <div className="quant-empty-hint">暂无信号。运行策略后信号将自动生成。</div>
      ) : (
        <div className="quant-signal-list">
          {signals.map((sig) => (
            <div key={sig.id} className="quant-signal-card">
              <div className="quant-signal-left">
                <span className={`quant-signal-action ${sig.action === 'BUY' ? 'quant-signal-action-buy' : 'quant-signal-action-sell'}`}>
                  {sig.action === 'BUY' ? '买入' : '卖出'}
                </span>
                <span className="quant-signal-symbol">{sig.symbol}</span>
                <span className="quant-signal-price">¥{sig.price.toFixed(2)}</span>
              </div>
              <div className="quant-signal-right">
                <span className="quant-signal-reason">{sig.reason}</span>
                <span className="quant-signal-time">{new Date(sig.time).toLocaleTimeString()}</span>
                <span className="quant-signal-strategy">{sig.strategyName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Monitor Tab =====
interface MonitorTabProps {
  strategies: Strategy[];
  runtimes: Record<string, StrategyRuntime>;
  onToggleRun: (s: Strategy) => void;
}

const MonitorTab: React.FC<MonitorTabProps> = ({ strategies, runtimes, onToggleRun }) => {
  const runningStrategies = strategies.filter((s) => runtimes[s.id]?.status === 'running');

  return (
    <div className="quant-tab-content">
      <div className="quant-section-label">运行中的策略</div>
      {runningStrategies.length === 0 ? (
        <div className="quant-empty-hint">暂无运行中的策略。在"策略"标签中点击"运行"启动策略。</div>
      ) : (
        runningStrategies.map((s) => {
          const rt = runtimes[s.id];
          return (
            <div key={s.id} className="quant-monitor-card">
              <div className="quant-monitor-header">
                <span className="quant-monitor-dot" />
                <span className="quant-card-title">{s.name}</span>
                <button className="quant-mini-btn quant-mini-btn-red" onClick={() => onToggleRun(s)}>停止</button>
              </div>
              <div className="quant-monitor-grid">
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">标的</span>
                  <span className="quant-monitor-value">{s.symbol}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">运行时长</span>
                  <span className="quant-monitor-value">{formatDuration(rt.startTime)}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">信号数</span>
                  <span className="quant-monitor-value">{rt.signalCount}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">持仓</span>
                  <span className="quant-monitor-value">{rt.position > 0 ? `${rt.position}@${rt.entryPrice.toFixed(2)}` : '无持仓'}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">已实现盈亏</span>
                  <span className={`quant-monitor-value ${rt.realizedPnl >= 0 ? 'quant-monitor-value-up' : 'quant-monitor-value-down'}`}>
                    ¥{rt.realizedPnl.toFixed(0)}
                  </span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">状态</span>
                  <span className="quant-monitor-value quant-monitor-value-running">运行中</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

function formatDuration(startTime: number): string {
  const diff = Date.now() - startTime;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时${mins % 60}分钟`;
  return `${Math.floor(hours / 24)}天`;
}

export default QuantPanel;
