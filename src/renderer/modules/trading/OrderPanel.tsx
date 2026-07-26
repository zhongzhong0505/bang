import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './order-panel.css';
import { useStore } from '../../store';
import { useTBatch, t } from '../../i18n';
import type { OrderSide, OrderType, TradeRecord, AIEvaluationResult, AIEvaluationContext } from '../../../shared/types';
import { getMarketFromCode, getCurrencyFromMarket } from '../../../shared/types';
import { calculateFees, calculateNetAmount } from '../../utils/fee-calculator';

const OrderPanel: React.FC = () => {
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const positions = useStore((s) => s.positions);
  const orders = useStore((s) => s.orders);
  const setPositions = useStore((s) => s.setPositions);
  const setOrders = useStore((s) => s.setOrders);
  const snapshots = useStore((s) => s.snapshots);
  const selectedProvider = useStore((s) => s.selectedProvider);
  const addTradeRecord = useStore((s) => s.addTradeRecord);
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const klineData = useStore((s) => s.klineData);
  const accountSummary = useStore((s) => s.accountSummary);
  const appSettings = useStore((s) => s.appSettings);
  const tradeFromChartPrice = useStore((s) => s.tradeFromChartPrice);

  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [activeTab, setActiveTab] = useState<'order' | 'positions' | 'history'>('order');

  // Bracket/OCO order fields
  const [showBracket, setShowBracket] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');

  // Modify order dialog
  const [modifyOrderId, setModifyOrderId] = useState<string | null>(null);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyQty, setModifyQty] = useState('');

  const L = useTBatch(['order.tabOrder', 'order.tabPositions', 'order.tabHistory', 'order.buy', 'order.sell', 'order.orderType', 'order.limitShort', 'order.marketShort', 'order.stopShort', 'order.stopLimitShort', 'order.price', 'order.quantity', 'order.quantityPlaceholder', 'order.bracketOrder', 'order.takeProfit', 'order.stopLoss', 'order.takeProfitPlaceholder', 'order.stopLossPlaceholder', 'order.aiAnalyzing', 'order.highRisk', 'order.mediumRisk', 'order.lowRisk', 'order.riskScore', 'order.reject', 'order.caution', 'order.proceed', 'order.suggestionLabel', 'order.evaluating', 'order.aiEvaluate', 'order.amount', 'order.payable', 'order.receivable', 'order.currentPrice', 'order.positionsList', 'order.ordersList', 'order.refresh', 'order.thSecurity', 'order.thPosition', 'order.thCost', 'order.thPnl', 'order.thSide', 'order.thPrice', 'order.thQty', 'order.thStatus', 'order.thAction', 'order.buyShort', 'order.sellShort', 'order.marketShort2', 'order.statusSubmitted', 'order.statusPending', 'order.statusPartial', 'order.statusPendingCancel', 'order.statusFilled', 'order.statusCancelled', 'order.statusRejected', 'order.modify', 'order.cancel', 'order.cancelling', 'order.modifyOrder', 'order.newPrice', 'order.newQty', 'order.confirmModify', 'order.aiEvalFailed', 'order.manualEval', 'common.cancel'] as any);

  // AI evaluation state
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState<AIEvaluationResult | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSnap = snapshots[currentCode];
  const connected = gatewayStatus.connected && gatewayStatus.loggedIn;

  // Sync price from chart click
  useEffect(() => {
    if (tradeFromChartPrice !== null) {
      setPrice(tradeFromChartPrice.toFixed(2));
    }
  }, [tradeFromChartPrice]);

  // Fee calculation
  const feePreview = useMemo(() => {
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (!p || !q || p <= 0 || q <= 0) return null;
    const market = getMarketFromCode(currentCode);
    const feeBreakdown = calculateFees(selectedProvider, market, side, p, q);
    const amount = p * q;
    const netAmount = calculateNetAmount(side, amount, feeBreakdown.totalFee);
    const currency = getCurrencyFromMarket(market);
    return { feeBreakdown, amount, netAmount, currency, market };
  }, [price, quantity, side, currentCode, selectedProvider]);

  const loadData = useCallback(async () => {
    const api = window.bangAPI;
    if (!api || !connected) return;
    try {
      const [pos, ord] = await Promise.all([api.getPositions(), api.getOrders()]);
      if (Array.isArray(pos)) setPositions(pos);
      if (Array.isArray(ord)) setOrders(ord);
    } catch { /* leave existing data */ }
  }, [connected, setPositions, setOrders]);

  useEffect(() => {
    loadData();
    if (connected) {
      refreshTimerRef.current = setInterval(loadData, 10000);
    }
    return () => { if (refreshTimerRef.current) { clearInterval(refreshTimerRef.current); refreshTimerRef.current = null; } };
  }, [connected, loadData]);

  useEffect(() => {
    if (currentSnap) setPrice(currentSnap.curPrice.toFixed(2));
  }, [currentCode, currentSnap]);

  const handleSubmit = useCallback(() => {
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (!p || !q || p <= 0 || q <= 0 || !feePreview) return;

    const api = window.bangAPI;
    if (api && connected) {
      api.placeOrder({ code: currentCode, side, type: orderType, price: p, quantity: q });
      // Submit bracket orders if enabled
      if (showBracket) {
        const tp = parseFloat(takeProfitPrice);
        const sl = parseFloat(stopLossPrice);
        if (tp > 0) {
          api.placeOrder({ code: currentCode, side: side === 'BUY' ? 'SELL' : 'BUY', type: 'LIMIT', price: tp, quantity: q });
        }
        if (sl > 0) {
          api.placeOrder({ code: currentCode, side: side === 'BUY' ? 'SELL' : 'BUY', type: 'STOP', price: sl, quantity: q });
        }
      }
    }

    const record: TradeRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: currentCode, name: currentName, market: feePreview.market, side,
      price: p, filledQty: q, amount: feePreview.amount, fee: feePreview.feeBreakdown,
      netAmount: feePreview.netAmount, provider: selectedProvider,
      time: Math.floor(Date.now() / 1000), currency: feePreview.currency,
    };
    addTradeRecord(record);
    // Reset bracket fields
    setShowBracket(false);
    setTakeProfitPrice('');
    setStopLossPrice('');
  }, [price, quantity, side, orderType, currentCode, currentName, feePreview, selectedProvider, addTradeRecord, connected, showBracket, takeProfitPrice, stopLossPrice]);

  const handleAIEvaluate = useCallback(async () => {
    const api = window.bangAPI;
    if (!api?.evaluateOrder || !feePreview) return;
    setAiEvaluating(true);
    setShowAIPanel(true);
    setAiResult(null);
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    const existingPos = positions.find((pos) => pos.code === currentCode);
    const ctx: AIEvaluationContext = {
      symbol: currentCode, name: currentName, side, orderType, price: p, quantity: q,
      amount: feePreview.amount, totalFee: feePreview.feeBreakdown.totalFee,
      netAmount: feePreview.netAmount, market: feePreview.market, currency: feePreview.currency,
      currentPrice: currentSnap?.curPrice ?? p, changeRate: currentSnap?.changeRate ?? 0,
      accountTotalAssets: accountSummary?.totalAssets ?? 0, accountCash: accountSummary?.cash ?? 0,
      accountBuyingPower: accountSummary?.buyingPower ?? 0, accountUnrealizedPnl: accountSummary?.unrealizedPnl ?? 0,
      existingPositionQty: existingPos?.qty ?? 0, existingPositionAvgPrice: existingPos?.avgPrice ?? 0,
      existingPositionPnl: existingPos?.pnl ?? 0, existingPositionPnlRatio: existingPos?.pnlRatio ?? 0,
      klineClose: klineData.map((k) => k.close), klineVolume: klineData.map((k) => k.volume),
      maxSingleOrderAmount: appSettings.maxSingleOrderAmount, dailyLossLimit: appSettings.dailyLossLimit,
    };
    try {
      const result = await api.evaluateOrder(ctx);
      setAiResult(result);
    } catch (err: any) {
      setAiResult({
        riskLevel: 'medium', riskScore: 50, positionRatio: 0,
       warnings: [`${t('order.aiEvalFailed' as any)}: ${err.message}`], suggestion: t('order.manualEval' as any),
        recommendation: 'caution', analysis: err.message,
      });
    }
    setAiEvaluating(false);
  }, [feePreview, price, quantity, side, orderType, currentCode, currentName, currentSnap, accountSummary, positions, klineData, appSettings]);

  const riskColor = aiResult?.riskLevel === 'high' ? 'var(--red)' : aiResult?.riskLevel === 'medium' ? '#f59e0b' : 'var(--green)';

  const handleModifyOrder = () => {
    const api = window.bangAPI;
    if (api?.modifyOrder && modifyOrderId) {
      api.modifyOrder({ orderId: modifyOrderId, price: parseFloat(modifyPrice), quantity: parseInt(modifyQty, 10) });
    }
    setModifyOrderId(null);
  };

  const handleCancelOrder = (orderId: string) => {
    const api = window.bangAPI;
    if (api?.cancelOrder) {
      api.cancelOrder(orderId);
    }
  };

  return (
    <div className="order-panel">
      <div className="order-tabs">
        {(['order', 'positions', 'history'] as const).map((tab) => (
          <button key={tab} className={`order-tab${activeTab === tab ? ' order-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'order' ? L['order.tabOrder'] : tab === 'positions' ? L['order.tabPositions'] : L['order.tabHistory']}
          </button>
        ))}
      </div>

      {activeTab === 'order' && (
        <div className="order-form">
          <div className="order-symbol-row">
            <span className="order-symbol-name">{currentName}</span>
            <span className="order-symbol-code">{currentCode}</span>
          </div>
          <div className="order-side-toggle">
            <button className={`order-side-btn${side === 'BUY' ? ' order-side-buy-active' : ''}`} onClick={() => setSide('BUY')}>{L['order.buy']}</button>
            <button className={`order-side-btn${side === 'SELL' ? ' order-side-sell-active' : ''}`} onClick={() => setSide('SELL')}>{L['order.sell']}</button>
          </div>
          <div className="order-field">
            <label className="order-label">{L['order.orderType']}</label>
            <select className="order-select" value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
              <option value="LIMIT">{L['order.limitShort']}</option>
              <option value="MARKET">{L['order.marketShort']}</option>
              <option value="STOP">{L['order.stopShort']}</option>
              <option value="STOP_LIMIT">{L['order.stopLimitShort']}</option>
            </select>
          </div>
          {orderType !== 'MARKET' && (
            <div className="order-field">
              <label className="order-label">{L['order.price']}</label>
              <input className="order-input" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          )}
          <div className="order-field">
            <label className="order-label">{L['order.quantity']}</label>
            <input className="order-input" type="number" step="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={L['order.quantityPlaceholder']} />
          </div>
          <div className="order-quick-qty">
            {[100, 200, 500, 1000].map((q) => (
              <button key={q} className="order-qty-btn" onClick={() => setQuantity(String(q))}>{q}</button>
            ))}
          </div>

          {/* Bracket / OCO order toggle */}
          <div className="order-bracket-toggle">
            <label className="order-bracket-label">
              <input type="checkbox" checked={showBracket} onChange={(e) => setShowBracket(e.target.checked)} />
              {L['order.bracketOrder']}
            </label>
          </div>
          {showBracket && (
            <div className="order-bracket-fields">
              <div className="order-field">
                <label className="order-label">{L['order.takeProfit']}</label>
                <input className="order-input" type="number" step="0.01" value={takeProfitPrice} onChange={(e) => setTakeProfitPrice(e.target.value)} placeholder={L['order.takeProfitPlaceholder']} />
              </div>
              <div className="order-field">
                <label className="order-label">{L['order.stopLoss']}</label>
                <input className="order-input" type="number" step="0.01" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} placeholder={L['order.stopLossPlaceholder']} />
              </div>
            </div>
          )}

          {/* AI Evaluation Panel */}
          {showAIPanel && (
            <div className="order-ai-panel">
              {aiEvaluating && (
                <div className="order-ai-loading">
                  <div className="order-ai-spinner" />
                  <span>{L['order.aiAnalyzing']}</span>
                </div>
              )}
              {aiResult && !aiEvaluating && (
                <>
                  <div className="order-ai-header">
                    <span className="order-ai-risk-badge" style={{ background: `${riskColor}22`, color: riskColor, borderColor: riskColor }}>
                      {aiResult.riskLevel === 'high' ? L['order.highRisk'] : aiResult.riskLevel === 'medium' ? L['order.mediumRisk'] : L['order.lowRisk']}
                    </span>
                    <span className="order-ai-score">{L['order.riskScore']}: {aiResult.riskScore}/100</span>
                    <span className="order-ai-recommendation" style={{ color: aiResult.recommendation === 'reject' ? 'var(--red)' : aiResult.recommendation === 'caution' ? '#f59e0b' : 'var(--green)' }}>
                      {aiResult.recommendation === 'reject' ? L['order.reject'] : aiResult.recommendation === 'caution' ? L['order.caution'] : L['order.proceed']}
                    </span>
                    <button className="order-ai-close" onClick={() => setShowAIPanel(false)}>x</button>
                  </div>
                  {aiResult.warnings.length > 0 && (
                    <div className="order-ai-warnings">
                      {aiResult.warnings.map((w, i) => (<div key={i} className="order-ai-warning-item">! {w}</div>))}
                    </div>
                  )}
                  {aiResult.suggestion && (
                    <div className="order-ai-suggestion">
                      <span className="order-ai-suggestion-label">{L['order.suggestionLabel']}</span>
                      <span className="order-ai-suggestion-text">{aiResult.suggestion}</span>
                    </div>
                  )}
                  {aiResult.analysis && (<div className="order-ai-analysis">{aiResult.analysis}</div>)}
                </>
              )}
            </div>
          )}

          <button className="order-ai-btn" onClick={handleAIEvaluate} disabled={!feePreview || aiEvaluating}>
            {aiEvaluating ? L['order.evaluating'] : L['order.aiEvaluate']}
          </button>

          <button className={`order-submit ${side === 'BUY' ? 'order-submit-buy' : 'order-submit-sell'}`} onClick={handleSubmit}>
            {side === 'BUY' ? L['order.buy'] : L['order.sell']} {currentName}
          </button>
          {feePreview && (
            <div className="order-fee-preview">
              <div className="order-fee-row">
                <span className="order-fee-label">{L['order.amount']}</span>
                <span className="order-fee-value">{feePreview.amount.toFixed(2)} {feePreview.currency}</span>
              </div>
              {feePreview.feeBreakdown.fees.map((f, i) => (
                <div key={i} className="order-fee-row">
                  <span className="order-fee-label">{f.name}</span>
                  <span className="order-fee-value">{f.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="order-fee-row order-fee-total">
                <span className="order-fee-label">{L['order.totalFee']}</span>
                <span className="order-fee-value">{feePreview.feeBreakdown.totalFee.toFixed(2)} {feePreview.currency}</span>
              </div>
              <div className="order-fee-row order-fee-net">
                <span className="order-fee-label">{side === 'BUY' ? L['order.payable'] : L['order.receivable']}</span>
                <span className="order-fee-value">{feePreview.netAmount.toFixed(2)} {feePreview.currency}</span>
              </div>
            </div>
          )}
          {currentSnap && (
            <div className="order-price-info">
              <span>{L['order.currentPrice']} <b className={currentSnap.changeVal >= 0 ? 'up' : 'down'}>{currentSnap.curPrice.toFixed(2)}</b></span>
              <span className={currentSnap.changeVal >= 0 ? 'up' : 'down'}>
                {currentSnap.changeVal >= 0 ? '+' : ''}{currentSnap.changeRate.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="order-table-container">
          <div className="order-table-header">
            <span>{L['order.positionsList']}</span>
            <button className="order-refresh-btn" onClick={loadData}>{L['order.refresh']}</button>
          </div>
          <table className="order-table">
            <thead>
              <tr><th className="order-th">{L['order.thSecurity']}</th><th className="order-th">{L['order.thPosition']}</th><th className="order-th">{L['order.thCost']}</th><th className="order-th">{L['order.thPnl']}</th></tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.code} className="order-tr">
                  <td className="order-td"><div>{p.name}</div><div className="text-muted-sm">{p.code}</div></td>
                  <td className="order-td">{p.qty}</td>
                  <td className="order-td">{p.avgPrice.toFixed(2)}</td>
                  <td className={`order-td ${p.pnl >= 0 ? 'up' : 'down'}`}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(0)}
                    <div className="text-muted-sm">{p.pnlRatio >= 0 ? '+' : ''}{p.pnlRatio.toFixed(2)}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="order-table-container">
          <div className="order-table-header">
            <span>{L['order.ordersList']}</span>
            <button className="order-refresh-btn" onClick={loadData}>{L['order.refresh']}</button>
          </div>
          <table className="order-table">
            <thead>
              <tr>
                <th className="order-th">{L['order.thSecurity']}</th><th className="order-th">{L['order.thSide']}</th>
                <th className="order-th">{L['order.thPrice']}</th><th className="order-th">{L['order.thQty']}</th>
                <th className="order-th">{L['order.thStatus']}</th><th className="order-th">{L['order.thAction']}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="order-tr">
                  <td className="order-td"><div>{o.name}</div><div className="text-muted-sm">{o.code}</div></td>
                  <td className={`order-td ${o.side === 'BUY' ? 'up' : 'down'}`}>{o.side === 'BUY' ? L['order.buyShort'] : L['order.sellShort']}</td>
                  <td className="order-td">{o.type === 'MARKET' ? L['order.marketShort2'] : o.price.toFixed(2)}</td>
                  <td className="order-td">{o.qty}</td>
                  <td className="order-td">
                    <span className={`order-status ${
                      o.status === 'FILLED' ? 'order-status-filled' :
                      o.status === 'CANCELLED' || o.status === 'REJECTED' ? 'order-status-other' :
                      o.status === 'PARTIAL' ? 'order-status-filled' :
                      'order-status-pending'
                    }`}>
                      {o.status === 'SUBMITTED' ? L['order.statusSubmitted'] :
                       o.status === 'PENDING' ? L['order.statusPending'] :
                       o.status === 'PARTIAL' ? L['order.statusPartial'] :
                       o.status === 'PENDING_CANCEL' ? L['order.statusPendingCancel'] :
                       o.status === 'FILLED' ? L['order.statusFilled'] :
                       o.status === 'CANCELLED' ? L['order.statusCancelled'] :
                       o.status === 'REJECTED' ? L['order.statusRejected'] : o.status}
                    </span>
                  </td>
                  <td className="order-td">
                    {(o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'PARTIAL') ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="order-action-btn order-action-modify"
                          onClick={() => { setModifyOrderId(o.id); setModifyPrice(o.price.toFixed(2)); setModifyQty(String(o.qty)); }}>{L['order.modify']}</button>
                        <button className="order-action-btn order-action-cancel" onClick={() => handleCancelOrder(o.id)}>{L['order.cancel']}</button>
                      </div>
                    ) : o.status === 'PENDING_CANCEL' ? (
                      <span className="text-muted-sm">{L['order.cancelling']}</span>
                    ) : (
                      <span className="text-muted-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {modifyOrderId && (
            <div className="order-modify-dialog">
              <div className="order-modify-title">{L['order.modifyOrder']} {modifyOrderId}</div>
              <div className="order-field">
                <label className="order-label">{L['order.newPrice']}</label>
                <input className="order-input" type="number" step="0.01" value={modifyPrice} onChange={(e) => setModifyPrice(e.target.value)} />
              </div>
              <div className="order-field">
                <label className="order-label">{L['order.newQty']}</label>
                <input className="order-input" type="number" step="100" value={modifyQty} onChange={(e) => setModifyQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="order-submit order-submit-buy" style={{ flex: 1 }} onClick={handleModifyOrder}>{L['order.confirmModify']}</button>
                <button className="order-submit" style={{ flex: 1, background: 'var(--bg-tertiary)' }} onClick={() => setModifyOrderId(null)}>{L['common.cancel']}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderPanel;
