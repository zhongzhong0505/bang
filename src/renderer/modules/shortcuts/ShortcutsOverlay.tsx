import React from 'react';
import { useStore } from '../../store';
import './shortcuts.css';
import { useTBatch } from '../../i18n';

const getShortcuts = (tr: Record<string, string>) => [
  {
    group: tr['shortcuts.periodGroup'],
    items: [
      { key: '1', desc: tr['shortcuts.period1m'] },
      { key: '5', desc: tr['shortcuts.period5m'] },
      { key: 'D', desc: tr['shortcuts.periodDay'] },
      { key: 'W', desc: tr['shortcuts.periodWeek'] },
      { key: 'M', desc: tr['shortcuts.periodMonth'] },
    ],
  },
  {
    group: tr['shortcuts.chartTypeGroup'],
    items: [
      { key: 'C', desc: tr['shortcuts.chartCandle'] },
      { key: 'L', desc: tr['shortcuts.chartLine'] },
      { key: 'A', desc: tr['shortcuts.chartArea'] },
    ],
  },
  {
    group: tr['shortcuts.viewGroup'],
    items: [
      { key: 'F11', desc: tr['shortcuts.fullscreen'] },
      { key: 'Ctrl+K', desc: tr['shortcuts.search'] },
      { key: 'Ctrl+S', desc: tr['shortcuts.screenshot'] },
      { key: 'Ctrl+/', desc: tr['shortcuts.help'] },
      { key: 'Esc', desc: tr['shortcuts.close'] },
    ],
  },
  {
    group: tr['shortcuts.zoomGroup'],
    items: [
      { key: '鼠标滚轮', desc: tr['shortcuts.zoomKline'] },
      { key: '←/→', desc: tr['shortcuts.scroll'] },
      { key: 'Home', desc: tr['shortcuts.jumpLatest'] },
    ],
  },
  {
    group: tr['shortcuts.tradeGroup'],
    items: [
      { key: 'Ctrl+B', desc: tr['shortcuts.buy'] },
      { key: 'Ctrl+E', desc: tr['shortcuts.sell'] },
    ],
  },
];

const ShortcutsOverlay: React.FC = () => {
  const toggleShortcuts = useStore((s) => s.toggleShortcuts);

  const tr = useTBatch([
    'shortcuts.title', 'shortcuts.periodGroup', 'shortcuts.period1m', 'shortcuts.period5m',
    'shortcuts.periodDay', 'shortcuts.periodWeek', 'shortcuts.periodMonth',
    'shortcuts.chartTypeGroup', 'shortcuts.chartCandle', 'shortcuts.chartLine', 'shortcuts.chartArea',
    'shortcuts.viewGroup', 'shortcuts.fullscreen', 'shortcuts.search', 'shortcuts.screenshot',
    'shortcuts.help', 'shortcuts.close', 'shortcuts.zoomGroup', 'shortcuts.zoomKline',
    'shortcuts.scroll', 'shortcuts.jumpLatest', 'shortcuts.tradeGroup', 'shortcuts.buy', 'shortcuts.sell',
  ]);

  const SHORTCUTS = getShortcuts(tr);

  return (
    <div className="shortcuts-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleShortcuts(); }}>
      <div className="shortcuts-panel">
        <div className="shortcuts-title">{tr['shortcuts.title']}</div>
        {SHORTCUTS.map((g) => (
          <div key={g.group} className="shortcuts-group">
            <div className="shortcuts-group-title">{g.group}</div>
            {g.items.map((item) => (
              <div key={item.key} className="shortcuts-row">
                <span className="shortcuts-desc">{item.desc}</span>
                <span className="shortcuts-key">{item.key}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortcutsOverlay;
