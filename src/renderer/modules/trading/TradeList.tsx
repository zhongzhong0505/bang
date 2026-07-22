import React, { useMemo, useState } from 'react';
import './trade-list.css';
import { useStore } from '../../store';
import type { TradeRecord, Market } from '../../../shared/types';

type FilterMarket = 'ALL' | Market;
type FilterSide = 'ALL' | 'BUY' | 'SELL';

const MARKET_LABELS: Record<string, string> = {
  HK: '港股', US: '美股', SH: '沪A', SZ: '深A', SG: '新加坡', JP: '日本',
};

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

const TradeList: React.FC = () => {
  const tradeRecords = useStore((s) => s.tradeRecords);
  const toggleTradeList = useStore((s) => s.toggleTradeList);
  const clearTradeRecords = useStore((s) => s.clearTradeRecords);

  const [filterMarket, setFilterMarket] = useState<FilterMarket>('ALL');
  const [filterSide, setFilterSide] = useState<FilterSide>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tradeRecords.filter((t) => {
      if (filterMarket !== 'ALL' && t.market !== filterMarket) return false;
      if (filterSide !== 'ALL' && t.side !== filterSide) return false;
      return true;
    });
  }, [tradeRecords, filterMarket, filterSide]);

  const summary = useMemo(() => {
    const totalFees = filtered.reduce((sum, t) => sum + t.fee.totalFee, 0);
    const buyAmount = filtered.filter((t) => t.side === 'BUY').reduce((s, t) => s + t.amount, 0);
    const sellAmount = filtered.filter((t) => t.side === 'SELL').reduce((s, t) => s + t.amount, 0);
    const totalTrades = filtered.length;
    return { totalFees, buyAmount, sellAmount, totalTrades };
  }, [filtered]);

  return (
    <div className="trade-list-overlay" onClick={toggleTradeList}>
      <div className="trade-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trade-list-header">
          <div className="trade-list-title-row">
            <h2 className="trade-list-title">交易明细</h2>
            <span className="trade-list-count">{filtered.length} 笔</span>
          </div>
          <div className="trade-list-actions">
            <button className="trade-list-btn" onClick={clearTradeRecords}>清空</button>
            <button className="trade-list-btn trade-list-close" onClick={toggleTradeList}>✕</button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="trade-list-summary">
          <div className="trade-summary-card">
            <div className="trade-summary-label">总费用</div>
            <div className="trade-summary-value trade-summary-fee">
              {summary.totalFees.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">买入金额</div>
            <div className="trade-summary-value up">
              {summary.buyAmount.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">卖出金额</div>
            <div className="trade-summary-value down">
              {summary.sellAmount.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">成交笔数</div>
            <div className="trade-summary-value">
              {summary.totalTrades}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="trade-list-filters">
          <div className="trade-filter-group">
            {(['ALL', 'HK', 'US', 'SH', 'SZ'] as FilterMarket[]).map((m) => (
              <button
                key={m}
                className={`trade-filter-btn${filterMarket === m ? ' trade-filter-active' : ''}`}
                onClick={() => setFilterMarket(m)}
              >
                {m === 'ALL' ? '全部市场' : MARKET_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="trade-filter-group">
            {(['ALL', 'BUY', 'SELL'] as FilterSide[]).map((s) => (
              <button
                key={s}
                className={`trade-filter-btn${filterSide === s ? ' trade-filter-active' : ''}`}
                onClick={() => setFilterSide(s)}
              >
                {s === 'ALL' ? '全部' : s === 'BUY' ? '买入' : '卖出'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="trade-list-body">
          {filtered.length === 0 ? (
            <div className="trade-list-empty">暂无交易记录</div>
          ) : (
            <table className="trade-table">
              <thead>
                <tr>
                  <th className="trade-th">时间</th>
                  <th className="trade-th">证券</th>
                  <th className="trade-th">市场</th>
                  <th className="trade-th">方向</th>
                  <th className="trade-th trade-th-right">价格</th>
                  <th className="trade-th trade-th-right">数量</th>
                  <th className="trade-th trade-th-right">成交金额</th>
                  <th className="trade-th trade-th-right">总费用</th>
                  <th className="trade-th trade-th-right">净额</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`trade-tr${expandedId === t.id ? ' trade-tr-expanded' : ''}`}
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      <td className="trade-td trade-td-time">{formatTime(t.time)}</td>
                      <td className="trade-td">
                        <div className="trade-td-name">{t.name}</div>
                        <div className="trade-td-code">{t.code}</div>
                      </td>
                      <td className="trade-td">
                        <span className="trade-market-tag">{MARKET_LABELS[t.market] ?? t.market}</span>
                      </td>
                      <td className="trade-td">
                        <span className={`trade-side-tag ${t.side === 'BUY' ? 'trade-side-buy' : 'trade-side-sell'}`}>
                          {t.side === 'BUY' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="trade-td trade-td-right">{t.price.toFixed(2)}</td>
                      <td className="trade-td trade-td-right">{t.filledQty}</td>
                      <td className="trade-td trade-td-right">{t.amount.toFixed(2)}</td>
                      <td className="trade-td trade-td-right trade-td-fee">{t.fee.totalFee.toFixed(2)}</td>
                      <td className="trade-td trade-td-right trade-td-net">{t.netAmount.toFixed(2)}</td>
                    </tr>
                    {expandedId === t.id && (
                      <tr className="trade-detail-row">
                        <td colSpan={9}>
                          <div className="trade-detail-content">
                            <div className="trade-detail-section">
                              <div className="trade-detail-title">费用明细</div>
                              <div className="trade-fee-items">
                                {t.fee.fees.map((f, i) => (
                                  <div key={i} className="trade-fee-item">
                                    <span className="trade-fee-name">{f.name}</span>
                                    <span className="trade-fee-amount">{f.amount.toFixed(2)} {t.currency}</span>
                                  </div>
                                ))}
                                <div className="trade-fee-item trade-fee-total">
                                  <span className="trade-fee-name">合计</span>
                                  <span className="trade-fee-amount">{t.fee.totalFee.toFixed(2)} {t.currency}</span>
                                </div>
                              </div>
                            </div>
                            <div className="trade-detail-section">
                              <div className="trade-detail-title">交易信息</div>
                              <div className="trade-info-grid">
                                <div className="trade-info-item">
                                  <span className="trade-info-label">券商</span>
                                  <span className="trade-info-value">{t.provider === 'futu' ? '富途' : '老虎'}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">币种</span>
                                  <span className="trade-info-value">{t.currency}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">订单号</span>
                                  <span className="trade-info-value">{t.orderId ?? t.id}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">单价</span>
                                  <span className="trade-info-value">{t.price.toFixed(2)} {t.currency}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">数量</span>
                                  <span className="trade-info-value">{t.filledQty}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">费率占比</span>
                                  <span className="trade-info-value">
                                    {t.amount > 0 ? (t.fee.totalFee / t.amount * 100).toFixed(4) : '0'}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="trade-tfoot">
                  <td className="trade-td" colSpan={6}>合计</td>
                  <td className="trade-td trade-td-right">{filtered.reduce((s, t) => s + t.amount, 0).toFixed(2)}</td>
                  <td className="trade-td trade-td-right trade-td-fee">{summary.totalFees.toFixed(2)}</td>
                  <td className="trade-td trade-td-right"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeList;
