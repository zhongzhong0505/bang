import React, { useEffect, useState, useCallback } from 'react';
import './account-panel.css';
import { useStore } from '../../store';
import type { AccountSummary } from '../../../shared/types';

const MARKET_LABELS: Record<string, string> = {
  HK: '港股', US: '美股', SH: '沪A', SZ: '深A', SG: '新加坡', JP: '日本',
};

function fmt(n: number, decimals = 2): string {
  if (isNaN(n) || !isFinite(n)) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '--';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fmtTime(ts: number): string {
  if (!ts) return '--';
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const AccountPanel: React.FC = () => {
  const toggleAccountPanel = useStore((s) => s.toggleAccountPanel);
  const accountSummary = useStore((s) => s.accountSummary);
  const setAccountSummary = useStore((s) => s.setAccountSummary);
  const gatewayStatus = useStore((s) => s.gatewayStatus);
  const [loading, setLoading] = useState(false);

  const fetchAccount = useCallback(async () => {
    const api = window.bangAPI;
    if (!api?.getAccountSummary) return;
    setLoading(true);
    try {
      const result = await api.getAccountSummary();
      if (result) setAccountSummary(result as AccountSummary);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [setAccountSummary]);

  useEffect(() => {
    fetchAccount();
    const api = window.bangAPI;
    if (api?.onAccountSummary) {
      const unsub = api.onAccountSummary((data: AccountSummary) => {
        setAccountSummary(data);
        setLoading(false);
      });
      return unsub;
    }
  }, [fetchAccount, setAccountSummary]);

  const connected = gatewayStatus.connected && gatewayStatus.loggedIn;
  const s = accountSummary;

  return (
    <div className="account-overlay" onClick={toggleAccountPanel}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-header">
          <div className="account-title-row">
            <h2 className="account-title">账户详情</h2>
            {s && (
              <span className="account-provider-tag">
                {s.provider === 'futu' ? '富途' : '老虎'}
              </span>
            )}
          </div>
          <div className="account-actions">
            <button className="account-btn" onClick={fetchAccount} disabled={loading || !connected} title="刷新">
              <svg width="14" height="14" viewBox="0 0 14 14" className={loading ? 'account-refresh-spin' : ''}>
                <path d="M7 2a5 5 0 1 0 4.33 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M7 1l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="account-btn account-close" onClick={toggleAccountPanel}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {!connected && (
          <div className="account-disconnected">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <path d="M16 6a8 8 0 0 1 8 8" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 26a8 8 0 0 1-8-8" fill="none" stroke="#787b86" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 12l8 8M20 12l-8 8" stroke="#787b86" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className="account-disconnected-text">未连接券商网关</div>
            <div className="account-disconnected-hint">请先在设置中连接富途或老虎 OpenAPI</div>
          </div>
        )}

        {connected && !s && loading && (
          <div className="account-loading">加载账户数据中...</div>
        )}

        {connected && s && (
          <div className="account-body">
            <div className="account-summary-cards">
              <div className="account-summary-card account-card-primary">
                <div className="account-card-label">总资产</div>
                <div className="account-card-value">{fmt(s.totalAssets)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">可用现金</div>
                <div className="account-card-value">{fmt(s.cash)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">持仓市值</div>
                <div className="account-card-value">{fmt(s.marketValue)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">买入能力</div>
                <div className="account-card-value">{fmt(s.buyingPower)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
            </div>

            <div className="account-section">
              <div className="account-section-title">盈亏概览</div>
              <div className="account-pnl-grid">
                <div className="account-pnl-item">
                  <span className="account-pnl-label">浮动盈亏</span>
                  <span className={`account-pnl-value ${s.unrealizedPnl >= 0 ? 'up' : 'down'}`}>
                    {s.unrealizedPnl >= 0 ? '+' : ''}{fmt(s.unrealizedPnl)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">浮动盈亏比</span>
                  <span className={`account-pnl-value ${s.unrealizedPnlRatio >= 0 ? 'up' : 'down'}`}>
                    {fmtPct(s.unrealizedPnlRatio)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">已实现盈亏</span>
                  <span className={`account-pnl-value ${s.realizedPnl >= 0 ? 'up' : 'down'}`}>
                    {s.realizedPnl >= 0 ? '+' : ''}{fmt(s.realizedPnl)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">冻结资金</span>
                  <span className="account-pnl-value">{fmt(s.frozenCash)}</span>
                </div>
              </div>
            </div>

            <div className="account-section">
              <div className="account-section-title">资金与保证金</div>
              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <span className="account-detail-label">可取资金</span>
                  <span className="account-detail-value">{fmt(s.withdrawableCash)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">冻结资金</span>
                  <span className="account-detail-value">{fmt(s.frozenCash)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">初始保证金</span>
                  <span className="account-detail-value">{fmt(s.initialMargin)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">维持保证金</span>
                  <span className="account-detail-value">{fmt(s.maintenanceMargin)} {s.currency}</span>
                </div>
              </div>
            </div>

            {s.markets.length > 0 && (
              <div className="account-section">
                <div className="account-section-title">分市场明细</div>
                <table className="account-market-table">
                  <thead>
                    <tr>
                      <th className="account-th">市场</th>
                      <th className="account-th account-th-right">总资产</th>
                      <th className="account-th account-th-right">现金</th>
                      <th className="account-th account-th-right">持仓市值</th>
                      <th className="account-th account-th-right">浮盈亏</th>
                      <th className="account-th account-th-right">买入能力</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.markets.map((m, i) => (
                      <tr key={i} className="account-market-tr">
                        <td className="account-td">
                          <span className="account-market-tag">{MARKET_LABELS[m.market] ?? m.market}</span>
                          <span className="account-market-currency">{m.currency}</span>
                        </td>
                        <td className="account-td account-td-right">{fmt(m.totalAssets)}</td>
                        <td className="account-td account-td-right">{fmt(m.cash)}</td>
                        <td className="account-td account-td-right">{fmt(m.marketValue)}</td>
                        <td className={`account-td account-td-right ${m.unrealizedPnl >= 0 ? 'up' : 'down'}`}>
                          {m.unrealizedPnl >= 0 ? '+' : ''}{fmt(m.unrealizedPnl)}
                        </td>
                        <td className="account-td account-td-right">{fmt(m.buyingPower)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="account-footer">
              <span className="account-update-time">更新时间: {fmtTime(s.updateTime)}</span>
              {s.accountId && <span className="account-id">账户: {s.accountId}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;
