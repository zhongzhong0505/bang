import React from 'react';
import { useStore } from '../../store';
import './shortcuts.css';

const SHORTCUTS = [
  {
    group: '周期切换',
    items: [
      { key: '1', desc: '1分钟K线' },
      { key: '5', desc: '5分钟K线' },
      { key: 'D', desc: '日K线' },
      { key: 'W', desc: '周K线' },
      { key: 'M', desc: '月K线' },
    ],
  },
  {
    group: '图表类型',
    items: [
      { key: 'C', desc: 'K线图' },
      { key: 'L', desc: '折线图' },
      { key: 'A', desc: '面积图' },
    ],
  },
  {
    group: '视图控制',
    items: [
      { key: 'F11', desc: '全屏切换' },
      { key: 'Ctrl+K', desc: '股票搜索' },
      { key: 'Ctrl+S', desc: '截图保存' },
      { key: 'Ctrl+/', desc: '快捷键帮助' },
      { key: 'Esc', desc: '关闭弹窗/退出全屏' },
    ],
  },
  {
    group: '缩放与滚动',
    items: [
      { key: '鼠标滚轮', desc: '缩放K线' },
      { key: '←/→', desc: '左/右滚动' },
      { key: 'Home', desc: '跳到最新数据' },
    ],
  },
  {
    group: '交易操作',
    items: [
      { key: 'Ctrl+B', desc: '买入' },
      { key: 'Ctrl+E', desc: '卖出' },
    ],
  },
];

const ShortcutsOverlay: React.FC = () => {
  const toggleShortcuts = useStore((s) => s.toggleShortcuts);

  return (
    <div className="shortcuts-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleShortcuts(); }}>
      <div className="shortcuts-panel">
        <div className="shortcuts-title">键盘快捷键</div>
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
