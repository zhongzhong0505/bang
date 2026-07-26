import React, { useEffect, useState, useCallback } from 'react';
import './account-panel.css';
import { useT, useTBatch } from '../../i18n';
import { useStore } from '../../store';
import type { AccountSummary } from '../../../shared/types';

const MARKET_KEYS: Record<string, string> = {
  HK: 'account.marketHK', US: 'account.marketUS', SH: 'account.marketSH', SZ: 'account.marketSZ', SG: 'account.marketSG', JP: 'account.marketJP',
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

  const tr = useTBatch([
    'account.title', 'account.providerFutu', 'account.providerTiger', 'account.providerLocal', 'account.refresh',
    'account.disconnected', 'account.disconnectedHint', 'account.loading',
    'account.totalAssets', 'account.cash', 'account.marketValue', 'account.buyingPower',
    'account.pnlOverview', 'account.unrealizedPnl', 'account.unrealizedPnlRatio',
    'account.realizedPnl', 'account.frozenCash', 'account.marginSection',
    'account.withdrawableCash', 'account.initialMargin', 'account.maintenanceMargin',
    'account.marketBreakdown', 'account.thMarket', 'account.thTotalAssets', 'account.thCash',
    'account.thMarketValue', 'account.thUnrealizedPnl', 'account.thBuyingPower',
    'account.updateTime', 'account.accountId',
  ] + Object.values(MARKET_KEYS) as any);

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
            <h2 className="account-title">{tr['account.title']}</h2>
            {s && (
            <span className="account-provider-tag">
                {s.provider === 'futu' ? tr['account.providerFutu'] : s.provider === 'tiger' ? tr['account.providerTiger'] : tr['account.providerLocal']}
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
            <div className="account-disconnected-text">{tr['account.disconnected']}</div>
            <div className="account-disconnected-hint">{tr['account.disconnectedHint']}</div>
          </div>
        )}

        {connected && !s && loading && (
          <div className="account-loading">{tr['account.loading']}</div>
        )}

        {connected && s && (
          <div className="account-body">
            <div className="account-summary-cards">
              <div className="account-summary-card account-card-primary">
                <div className="account-card-label">{tr['account.totalAssets']}</div>
                <div className="account-card-value">{fmt(s.totalAssets)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">{tr['account.cash']}</div>
                <div className="account-card-value">{fmt(s.cash)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">{tr['account.marketValue']}</div>
                <div className="account-card-value">{fmt(s.marketValue)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
              <div className="account-summary-card">
                <div className="account-card-label">{tr['account.buyingPower']}</div>
                <div className="account-card-value">{fmt(s.buyingPower)}</div>
                <div className="account-card-sub">{s.currency}</div>
              </div>
            </div>

            <div className="account-section">
              <div className="account-section-title">{tr['account.pnlOverview']}</div>
              <div className="account-pnl-grid">
                <div className="account-pnl-item">
                  <span className="account-pnl-label">{tr['account.unrealizedPnl']}</span>
                  <span className={`account-pnl-value ${s.unrealizedPnl >= 0 ? 'up' : 'down'}`}>
                    {s.unrealizedPnl >= 0 ? '+' : ''}{fmt(s.unrealizedPnl)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">{tr['account.unrealizedPnlRatio']}</span>
                  <span className={`account-pnl-value ${s.unrealizedPnlRatio >= 0 ? 'up' : 'down'}`}>
                    {fmtPct(s.unrealizedPnlRatio)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">{tr['account.realizedPnl']}</span>
                  <span className={`account-pnl-value ${s.realizedPnl >= 0 ? 'up' : 'down'}`}>
                    {s.realizedPnl >= 0 ? '+' : ''}{fmt(s.realizedPnl)}
                  </span>
                </div>
                <div className="account-pnl-item">
                  <span className="account-pnl-label">{tr['account.frozenCash']}</span>
                  <span className="account-pnl-value">{fmt(s.frozenCash)}</span>
                </div>
              </div>
            </div>

            <div className="account-section">
              <div className="account-section-title">{tr['account.marginSection']}</div>
              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <span className="account-detail-label">{tr['account.withdrawableCash']}</span>
                  <span className="account-detail-value">{fmt(s.withdrawableCash)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">冻结资金</span>
                  <span className="account-detail-value">{fmt(s.frozenCash)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">{tr['account.initialMargin']}</span>
                  <span className="account-detail-value">{fmt(s.initialMargin)} {s.currency}</span>
                </div>
                <div className="account-detail-item">
                  <span className="account-detail-label">{tr['account.maintenanceMargin']}</span>
                  <span className="account-detail-value">{fmt(s.maintenanceMargin)} {s.currency}</span>
                </div>
              </div>
            </div>

            {s.markets.length > 0 && (
              <div className="account-section">
                <div className="account-section-title">{tr['account.marketBreakdown']}</div>
                <table className="account-market-table">
                  <thead>
                    <tr>
                      <th className="account-th">{tr['account.thMarket']}</th>
                      <th className="account-th account-th-right">{tr['account.thTotalAssets']}</th>
                      <th className="account-th account-th-right">{tr['account.thCash']}</th>
                      <th className="account-th account-th-right">{tr['account.thMarketValue']}</th>
                      <th className="account-th account-th-right">{tr['account.thUnrealizedPnl']}</th>
                      <th className="account-th account-th-right">{tr['account.thBuyingPower']}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.markets.map((m, i) => (
                      <tr key={i} className="account-market-tr">
                        <td className="account-td">
                          <span className="account-market-tag">{tr[MARKET_KEYS[m.market] as any] ?? m.market}</span>
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
              <span className="account-update-time">{tr['account.updateTime']}: {fmtTime(s.updateTime)}</span>
              {s.accountId && <span className="account-id">{tr['account.accountId']}: {s.accountId}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;
