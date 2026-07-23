import React, { useState } from 'react';
import './quant-panel.css';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { TranslationKey } from '../../i18n';
import { runBacktest, buildIndicatorContext, generateSignals } from './backtest';
import { generateMockKline } from '../../mock';
import type { Strategy, StrategyCondition, ConditionType, BacktestResult, RiskConfig, SignalRecord, StrategyRuntime } from '../../../shared/types';
import { DEFAULT_RISK } from '../../../shared/types';

type TLabel = Record<TranslationKey, string>;

function buildConditionLabels(L: TLabel): Record<ConditionType, string> {
  return {
    ma_cross: L['quant.cond.ma_cross'],
    rsi_oversold: L['quant.cond.rsi_oversold'],
    rsi_overbought: L['quant.cond.rsi_overbought'],
    macd_cross: L['quant.cond.macd_cross'],
    boll_break: L['quant.cond.boll_break'],
    price_cross: L['quant.cond.price_cross'],
    volume_surge: L['quant.cond.volume_surge'],
  };
}

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

  const L = useTBatch(['quant.strategies', 'quant.backtest', 'quant.signals', 'quant.monitor', 'quant.newStrategy', 'quant.newStrategyName', 'quant.cond.ma_cross', 'quant.cond.rsi_oversold', 'quant.cond.rsi_overbought', 'quant.cond.macd_cross', 'quant.cond.boll_break', 'quant.cond.price_cross', 'quant.cond.volume_surge', 'quant.backtesting', 'quant.stop', 'quant.run', 'quant.noDescription', 'quant.symbol', 'quant.conditions', 'quant.capital', 'quant.editStrategy', 'quant.strategyName', 'quant.description', 'quant.symbolCode', 'quant.initialCapital', 'quant.tradeConditions', 'quant.addCondition', 'quant.riskSettings', 'quant.stopLossPct', 'quant.takeProfitPct', 'quant.maxPositionPct', 'quant.maxHoldingBars', 'quant.runBacktest', 'quant.totalReturnPct', 'quant.totalReturn', 'quant.winRate', 'quant.totalTrades', 'quant.winTrades', 'quant.lossTrades', 'quant.maxDrawdown', 'quant.sharpeRatio', 'quant.profitFactor', 'quant.avgWin', 'quant.avgLoss', 'quant.finalCapital', 'quant.tradeDetails', 'quant.thSide', 'quant.thEntry', 'quant.thExit', 'quant.thPnl', 'quant.thReason', 'quant.backtestHint', 'quant.createStrategyHint', 'quant.realtimeSignals', 'quant.test', 'quant.clear', 'quant.noSignals', 'quant.runningStrategies', 'quant.noRunningStrategies', 'quant.runtime', 'quant.signalCount', 'quant.position', 'quant.noPosition', 'quant.realizedPnl', 'quant.status', 'quant.running', 'quant.buyShort', 'quant.sellShort', 'quant.durationMin', 'quant.durationHour', 'quant.durationDay', 'common.save', 'common.cancel', 'common.delete', 'common.edit', 'order.buy', 'order.sell'] as any);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'strategies', label: L['quant.strategies'] },
    { key: 'backtest', label: L['quant.backtest'] },
    { key: 'signals', label: L['quant.signals'] },
    { key: 'monitor', label: L['quant.monitor'] },
  ];

  const handleCreateStrategy = () => {
    const newStrat: Strategy = {
      id: genId(),
      name: L['quant.newStrategyName'],
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
            L={L}
          />
        )}
        {activeTab === 'backtest' && (
          <BacktestTab strategies={strategies} results={backtestResults} onBacktest={handleRunBacktest} backtesting={backtesting} L={L} />
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
          }} strategies={strategies} L={L} />
        )}
        {activeTab === 'monitor' && (
          <MonitorTab strategies={strategies} runtimes={strategyRuntimes} onToggleRun={handleToggleRun} L={L} />
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
  L: TLabel;
}

const StrategiesTab: React.FC<StrategiesTabProps> = ({
  strategies, editingStrategy, setEditingStrategy, onCreate, onUpdate, onRemove, onBacktest, onToggleRun, backtesting, runtimes, L,
}) => {
  const CONDITION_LABELS = buildConditionLabels(L);

  if (editingStrategy) {
    return (
      <StrategyEditor
        strategy={editingStrategy}
        onSave={(updated) => {
          onUpdate(editingStrategy.id, updated);
          setEditingStrategy(null);
        }}
        onCancel={() => setEditingStrategy(null)}
        L={L}
      />
    );
  }

  return (
    <div className="quant-tab-content">
      <button className="quant-primary-btn" onClick={onCreate}>{L['quant.newStrategy']}</button>
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
                    {backtesting === s.id ? L['quant.backtesting'] : L['quant.backtest']}
                  </button>
                  <button
                    className={`quant-mini-btn ${isRunning ? 'quant-mini-btn-red' : 'quant-mini-btn-green'}`}
                    onClick={() => onToggleRun(s)}
                  >
                    {isRunning ? L['quant.stop'] : L['quant.run']}
                  </button>
                  <button className="quant-mini-btn" onClick={() => setEditingStrategy(s)}>{L['common.edit']}</button>
                  <button className="quant-mini-btn quant-mini-btn-red" onClick={() => onRemove(s.id)}>{L['common.delete']}</button>
                </div>
              </div>
              <div className="quant-card-desc">{s.description || L['quant.noDescription']}</div>
              <div className="quant-card-meta">
                <span>{L['quant.symbol']}: {s.symbol}</span>
                <span>{L['quant.conditions']}: {s.conditions.length}</span>
                <span>{L['quant.capital']}: ¥{s.initialCapital.toLocaleString()}</span>
              </div>
              <div className="quant-card-conditions">
                {s.conditions.map((c, i) => (
                  <span key={i} className={`quant-cond-tag ${c.action === 'BUY' ? 'quant-cond-tag-buy' : 'quant-cond-tag-sell'}`}>
                    {CONDITION_LABELS[c.type]}→{c.action === 'BUY' ? L['quant.buyShort'] : L['quant.sellShort']}
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
  L: TLabel;
}

const StrategyEditor: React.FC<StrategyEditorProps> = ({ strategy, onSave, onCancel, L }) => {
  const [draft, setDraft] = useState<Strategy>({ ...strategy });
  const CONDITION_LABELS = buildConditionLabels(L);

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
        <span className="quant-editor-title">{L['quant.editStrategy']}</span>
        <div className="quant-editor-actions">
          <button className="quant-primary-btn" onClick={() => onSave(draft)}>{L['common.save']}</button>
          <button className="quant-cancel-btn" onClick={onCancel}>{L['common.cancel']}</button>
        </div>
      </div>

      <div className="quant-editor-body">
        <div className="quant-form-row">
          <label className="quant-form-label">{L['quant.strategyName']}</label>
          <input className="quant-form-input" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">{L['quant.description']}</label>
          <input className="quant-form-input" value={draft.description} onChange={(e) => update({ description: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">{L['quant.symbolCode']}</label>
          <input className="quant-form-input" value={draft.symbol} onChange={(e) => update({ symbol: e.target.value })} />
        </div>
        <div className="quant-form-row">
          <label className="quant-form-label">{L['quant.initialCapital']}</label>
          <input className="quant-form-input" type="number" value={draft.initialCapital} onChange={(e) => update({ initialCapital: +e.target.value })} />
        </div>

        <div className="quant-section-label">{L['quant.tradeConditions']}</div>
        {draft.conditions.map((cond, i) => (
          <div key={i} className="quant-cond-editor">
            <select className="quant-cond-select" value={cond.type} onChange={(e) => updateCondition(i, { type: e.target.value as ConditionType })}>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select className="quant-cond-select" value={cond.action} onChange={(e) => updateCondition(i, { action: e.target.value as 'BUY' | 'SELL' })}>
              <option value="BUY">{L['order.buy']}</option>
              <option value="SELL">{L['order.sell']}</option>
            </select>
            {cond.type === 'ma_cross' && (
              <>
                <input className="quant-cond-input" type="number" value={cond.params.fast ?? 5} onChange={(e) => updateCondition(i, { params: { ...cond.params, fast: +e.target.value } })} title="Fast" />
                <input className="quant-cond-input" type="number" value={cond.params.slow ?? 20} onChange={(e) => updateCondition(i, { params: { ...cond.params, slow: +e.target.value } })} title="Slow" />
              </>
            )}
            {(cond.type === 'rsi_oversold' || cond.type === 'rsi_overbought') && (
              <input className="quant-cond-input" type="number" value={cond.params.threshold ?? 30} onChange={(e) => updateCondition(i, { params: { ...cond.params, threshold: +e.target.value } })} title="RSI" />
            )}
            {cond.type === 'boll_break' && <span className="quant-cond-hint">BOLL 20,2</span>}
            {cond.type === 'price_cross' && (
              <input className="quant-cond-input" type="number" value={cond.params.price ?? 0} onChange={(e) => updateCondition(i, { params: { ...cond.params, price: +e.target.value } })} title="Price" />
            )}
            {cond.type === 'volume_surge' && (
              <input className="quant-cond-input" type="number" value={cond.params.mult ?? 2} onChange={(e) => updateCondition(i, { params: { ...cond.params, mult: +e.target.value } })} title="Mult" />
            )}
            <button className="quant-mini-btn quant-mini-btn-red" onClick={() => removeCondition(i)}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
          </div>
        ))}
        <button className="quant-add-cond-btn" onClick={addCondition}>{L['quant.addCondition']}</button>

        <div className="quant-section-label">{L['quant.riskSettings']}</div>
        <div className="quant-risk-grid">
          <div className="quant-risk-item">
            <label className="quant-form-label">{L['quant.stopLossPct']}</label>
            <input className="quant-form-input" type="number" value={draft.risk.stopLossPct} onChange={(e) => updateRisk({ stopLossPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">{L['quant.takeProfitPct']}</label>
            <input className="quant-form-input" type="number" value={draft.risk.takeProfitPct} onChange={(e) => updateRisk({ takeProfitPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">{L['quant.maxPositionPct']}</label>
            <input className="quant-form-input" type="number" value={draft.risk.maxPositionPct} onChange={(e) => updateRisk({ maxPositionPct: +e.target.value })} />
          </div>
          <div className="quant-risk-item">
            <label className="quant-form-label">{L['quant.maxHoldingBars']}</label>
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
  L: TLabel;
}

const BacktestTab: React.FC<BacktestTabProps> = ({ strategies, results, onBacktest, backtesting, L }) => {
  return (
    <div className="quant-tab-content">
      {strategies.map((s) => {
        const result = results[s.id];
        return (
          <div key={s.id} className="quant-card">
            <div className="quant-card-header">
              <span className="quant-card-title">{s.name}</span>
              <button className="quant-primary-btn" onClick={() => onBacktest(s)} disabled={backtesting === s.id}>
                {backtesting === s.id ? L['quant.backtesting'] : L['quant.runBacktest']}
              </button>
            </div>
            {result ? (
              <div className="quant-result-grid">
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.totalReturnPct']}</span>
                  <span className={`quant-result-value ${result.totalReturnPct >= 0 ? 'quant-result-value-up' : 'quant-result-value-down'}`}>
                    {result.totalReturnPct >= 0 ? '+' : ''}{result.totalReturnPct.toFixed(2)}%
                  </span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.totalReturn']}</span>
                  <span className={`quant-result-value ${result.totalReturn >= 0 ? 'quant-result-value-up' : 'quant-result-value-down'}`}>
                    ¥{result.totalReturn.toFixed(0)}
                  </span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.winRate']}</span>
                  <span className="quant-result-value">{result.winRate.toFixed(1)}%</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.totalTrades']}</span>
                  <span className="quant-result-value">{result.totalTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.winTrades']}</span>
                  <span className="quant-result-value quant-result-value-up">{result.winTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.lossTrades']}</span>
                  <span className="quant-result-value quant-result-value-down">{result.lossTrades}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.maxDrawdown']}</span>
                  <span className="quant-result-value quant-result-value-down">{result.maxDrawdownPct.toFixed(2)}%</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.sharpeRatio']}</span>
                  <span className="quant-result-value">{result.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.profitFactor']}</span>
                  <span className="quant-result-value">{result.profitFactor.toFixed(2)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.avgWin']}</span>
                  <span className="quant-result-value quant-result-value-up">¥{result.avgWin.toFixed(0)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.avgLoss']}</span>
                  <span className="quant-result-value quant-result-value-down">¥{result.avgLoss.toFixed(0)}</span>
                </div>
                <div className="quant-result-item">
                  <span className="quant-result-label">{L['quant.finalCapital']}</span>
                  <span className="quant-result-value">¥{result.finalCapital.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <div className="quant-empty-hint">{L['quant.backtestHint']}</div>
            )}
            {result && result.trades.length > 0 && (
              <div className="quant-trades-section">
                <div className="quant-section-label">{L['quant.tradeDetails']}</div>
                <table className="quant-trade-table">
                  <thead>
                    <tr>
                      <th className="quant-trade-th">{L['quant.thSide']}</th>
                      <th className="quant-trade-th">{L['quant.thEntry']}</th>
                      <th className="quant-trade-th">{L['quant.thExit']}</th>
                      <th className="quant-trade-th">{L['quant.thPnl']}</th>
                      <th className="quant-trade-th">{L['quant.thReason']}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(-5).reverse().map((t, i) => (
                      <tr key={i}>
                        <td className={`quant-trade-td ${t.side === 'BUY' ? 'quant-trade-td-up' : 'quant-trade-td-down'}`}>{t.side === 'BUY' ? L['quant.buyShort'] : L['quant.sellShort']}</td>
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
      {strategies.length === 0 && <div className="quant-empty-hint">{L['quant.createStrategyHint']}</div>}
    </div>
  );
};

// ===== Signals Tab =====
interface SignalsTabProps {
  signals: SignalRecord[];
  onClear: () => void;
  onTest: (s: Strategy) => void;
  strategies: Strategy[];
  L: TLabel;
}

const SignalsTab: React.FC<SignalsTabProps> = ({ signals, onClear, onTest, strategies, L }) => {
  return (
    <div className="quant-tab-content">
      <div className="quant-signals-header">
        <span className="quant-section-label">{L['quant.realtimeSignals']}</span>
        <div className="quant-signal-actions">
          {strategies.filter((s) => s.enabled).map((s) => (
            <button key={s.id} className="quant-primary-btn" onClick={() => onTest(s)}>{L['quant.test']} {s.name}</button>
          ))}
          {signals.length > 0 && <button className="quant-cancel-btn" onClick={onClear}>{L['quant.clear']}</button>}
        </div>
      </div>
      {signals.length === 0 ? (
        <div className="quant-empty-hint">{L['quant.noSignals']}</div>
      ) : (
        <div className="quant-signal-list">
          {signals.map((sig) => (
            <div key={sig.id} className="quant-signal-card">
              <div className="quant-signal-left">
                <span className={`quant-signal-action ${sig.action === 'BUY' ? 'quant-signal-action-buy' : 'quant-signal-action-sell'}`}>
                  {sig.action === 'BUY' ? L['order.buy'] : L['order.sell']}
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
  L: TLabel;
}

const MonitorTab: React.FC<MonitorTabProps> = ({ strategies, runtimes, onToggleRun, L }) => {
  const runningStrategies = strategies.filter((s) => runtimes[s.id]?.status === 'running');

  return (
    <div className="quant-tab-content">
      <div className="quant-section-label">{L['quant.runningStrategies']}</div>
      {runningStrategies.length === 0 ? (
        <div className="quant-empty-hint">{L['quant.noRunningStrategies']}</div>
      ) : (
        runningStrategies.map((s) => {
          const rt = runtimes[s.id];
          return (
            <div key={s.id} className="quant-monitor-card">
              <div className="quant-monitor-header">
                <span className="quant-monitor-dot" />
                <span className="quant-card-title">{s.name}</span>
                <button className="quant-mini-btn quant-mini-btn-red" onClick={() => onToggleRun(s)}>{L['quant.stop']}</button>
              </div>
              <div className="quant-monitor-grid">
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.symbol']}</span>
                  <span className="quant-monitor-value">{s.symbol}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.runtime']}</span>
                  <span className="quant-monitor-value">{formatDuration(rt.startTime, L)}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.signalCount']}</span>
                  <span className="quant-monitor-value">{rt.signalCount}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.position']}</span>
                  <span className="quant-monitor-value">{rt.position > 0 ? `${rt.position}@${rt.entryPrice.toFixed(2)}` : L['quant.noPosition']}</span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.realizedPnl']}</span>
                  <span className={`quant-monitor-value ${rt.realizedPnl >= 0 ? 'quant-monitor-value-up' : 'quant-monitor-value-down'}`}>
                    ¥{rt.realizedPnl.toFixed(0)}
                  </span>
                </div>
                <div className="quant-monitor-item">
                  <span className="quant-monitor-label">{L['quant.status']}</span>
                  <span className="quant-monitor-value quant-monitor-value-running">{L['quant.running']}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

function formatDuration(startTime: number, L: TLabel): string {
  const diff = Date.now() - startTime;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}${L['quant.durationMin']}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${L['quant.durationHour']}${mins % 60}${L['quant.durationMin']}`;
  return `${Math.floor(hours / 24)}${L['quant.durationDay']}`;
}

export default QuantPanel;
