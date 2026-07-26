import React, { useMemo, useState } from 'react';
import './trade-list.css';
import { useTBatch } from '../../i18n';
import { useStore } from '../../store';
import type { TradeRecord, Market } from '../../../shared/types';

type FilterMarket = 'ALL' | Market;
type FilterSide = 'ALL' | 'BUY' | 'SELL';

const MARKET_KEYS: Record<string, string> = {
  HK: 'tradeList.marketHK', US: 'tradeList.marketUS', SH: 'tradeList.marketSH', SZ: 'tradeList.marketSZ', SG: 'tradeList.marketSG', JP: 'tradeList.marketJP',
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

  const tr = useTBatch([
    'tradeList.title', 'tradeList.count', 'tradeList.clear', 'tradeList.totalFee',
    'tradeList.buyAmount', 'tradeList.sellAmount', 'tradeList.tradeCount',
    'tradeList.allMarkets', 'tradeList.allSides', 'tradeList.buy', 'tradeList.sell',
    'tradeList.empty', 'tradeList.thTime', 'tradeList.thSecurity', 'tradeList.thMarket',
    'tradeList.thSide', 'tradeList.thPrice', 'tradeList.thQty', 'tradeList.thAmount',
    'tradeList.thFee', 'tradeList.thNet', 'tradeList.feeDetail', 'tradeList.feeTotal',
    'tradeList.tradeInfo', 'tradeList.provider', 'tradeList.providerFutu', 'tradeList.providerTiger',
    'tradeList.currency', 'tradeList.orderId', 'tradeList.unitPrice', 'tradeList.quantity',
    'tradeList.feeRatio', 'tradeList.total',
  ] + Object.values(MARKET_KEYS) as any);

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
            <h2 className="trade-list-title">{tr['tradeList.title']}</h2>
            <span className="trade-list-count">{filtered.length} 笔</span>
          </div>
          <div className="trade-list-actions">
            <button className="trade-list-btn" onClick={clearTradeRecords}>{tr['tradeList.clear']}</button>
            <button className="trade-list-btn trade-list-close" onClick={toggleTradeList}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="trade-list-summary">
          <div className="trade-summary-card">
            <div className="trade-summary-label">{tr['tradeList.totalFee']}</div>
            <div className="trade-summary-value trade-summary-fee">
              {summary.totalFees.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">{tr['tradeList.buyAmount']}</div>
            <div className="trade-summary-value up">
              {summary.buyAmount.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">{tr['tradeList.sellAmount']}</div>
            <div className="trade-summary-value down">
              {summary.sellAmount.toFixed(2)}
            </div>
          </div>
          <div className="trade-summary-card">
            <div className="trade-summary-label">{tr['tradeList.tradeCount']}</div>
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
                {m === 'ALL' ? tr['tradeList.allMarkets'] : tr[MARKET_KEYS[m] as any]}
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
                {s === 'ALL' ? tr['tradeList.allSides'] : s === 'BUY' ? tr['tradeList.buy'] : tr['tradeList.sell']}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="trade-list-body">
          {filtered.length === 0 ? (
            <div className="trade-list-empty">{tr['tradeList.empty']}</div>
          ) : (
            <table className="trade-table">
              <thead>
                <tr>
                  <th className="trade-th">{tr['tradeList.thTime']}</th>
                  <th className="trade-th">{tr['tradeList.thSecurity']}</th>
                  <th className="trade-th">{tr['tradeList.thMarket']}</th>
                  <th className="trade-th">{tr['tradeList.thSide']}</th>
                  <th className="trade-th trade-th-right">{tr['tradeList.thPrice']}</th>
                  <th className="trade-th trade-th-right">{tr['tradeList.thQty']}</th>
                  <th className="trade-th trade-th-right">{tr['tradeList.thAmount']}</th>
                  <th className="trade-th trade-th-right">{tr['tradeList.totalFee']}</th>
                  <th className="trade-th trade-th-right">{tr['tradeList.thNet']}</th>
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
                        <span className="trade-market-tag">{tr[MARKET_KEYS[t.market] as any] ?? t.market}</span>
                      </td>
                      <td className="trade-td">
                        <span className={`trade-side-tag ${t.side === 'BUY' ? 'trade-side-buy' : 'trade-side-sell'}`}>
                          {t.side === 'BUY' ? tr['tradeList.buy'] : tr['tradeList.sell']}
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
                              <div className="trade-detail-title">{tr['tradeList.feeDetail']}</div>
                              <div className="trade-fee-items">
                                {t.fee.fees.map((f, i) => (
                                  <div key={i} className="trade-fee-item">
                                    <span className="trade-fee-name">{f.name}</span>
                                    <span className="trade-fee-amount">{f.amount.toFixed(2)} {t.currency}</span>
                                  </div>
                                ))}
                                <div className="trade-fee-item trade-fee-total">
                                  <span className="trade-fee-name">{tr['tradeList.feeTotal']}</span>
                                  <span className="trade-fee-amount">{t.fee.totalFee.toFixed(2)} {t.currency}</span>
                                </div>
                              </div>
                            </div>
                            <div className="trade-detail-section">
                              <div className="trade-detail-title">{tr['tradeList.tradeInfo']}</div>
                              <div className="trade-info-grid">
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.provider']}</span>
                                  <span className="trade-info-value">{t.provider === 'futu' ? tr['tradeList.providerFutu'] : tr['tradeList.providerTiger']}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.currency']}</span>
                                  <span className="trade-info-value">{t.currency}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.orderId']}</span>
                                  <span className="trade-info-value">{t.orderId ?? t.id}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.unitPrice']}</span>
                                  <span className="trade-info-value">{t.price.toFixed(2)} {t.currency}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.thQty']}</span>
                                  <span className="trade-info-value">{t.filledQty}</span>
                                </div>
                                <div className="trade-info-item">
                                  <span className="trade-info-label">{tr['tradeList.feeRatio']}</span>
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
                  <td className="trade-td" colSpan={6}>{tr['tradeList.feeTotal']}</td>
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
