import React from 'react';
import { useStore } from '../../store';
import {
  List,
  ArrowUpRight,
  Brain,
  Bell,
  Receipt,
  UserCircle,
  Target,
  LineChart,
  CalendarDays,
  Search,
  Settings,
  Maximize2,
  Keyboard,
  LayoutGrid,
  Layers,
  TrendingUp,
} from 'lucide-react';
import './sidebar.css';

interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  action: () => void;
  active: boolean;
}

const Sidebar: React.FC = () => {
  const showWatchlist = useStore((s) => s.showWatchlist);
  const showOrderPanel = useStore((s) => s.showOrderPanel);
  const showDOM = useStore((s) => s.showDOM);
  const showQuantPanel = useStore((s) => s.showQuantPanel);
  const showScreener = useStore((s) => s.showScreener);
  const showAIChat = useStore((s) => s.showAIChat);
  const showAlertPanel = useStore((s) => s.showAlertPanel);
  const showTradeList = useStore((s) => s.showTradeList);
  const showAccountPanel = useStore((s) => s.showAccountPanel);
  const showWinRate = useStore((s) => s.showWinRate);
  const showFundamentals = useStore((s) => s.showFundamentals);
  const showCalendar = useStore((s) => s.showCalendar);
  const isFullscreen = useStore((s) => s.isFullscreen);

  const toggleWatchlist = useStore((s) => s.toggleWatchlist);
  const toggleOrderPanel = useStore((s) => s.toggleOrderPanel);
  const toggleDOM = useStore((s) => s.toggleDOM);
  const toggleQuantPanel = useStore((s) => s.toggleQuantPanel);
  const toggleScreener = useStore((s) => s.toggleScreener);
  const toggleAIChat = useStore((s) => s.toggleAIChat);
  const toggleAlertPanel = useStore((s) => s.toggleAlertPanel);
  const toggleTradeList = useStore((s) => s.toggleTradeList);
  const toggleAccountPanel = useStore((s) => s.toggleAccountPanel);
  const toggleWinRate = useStore((s) => s.toggleWinRate);
  const toggleFundamentals = useStore((s) => s.toggleFundamentals);
  const toggleCalendar = useStore((s) => s.toggleCalendar);
  const toggleShortcuts = useStore((s) => s.toggleShortcuts);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const setFullscreen = useStore((s) => s.setFullscreen);

  const topItems: NavItem[] = [
    { icon: List, label: '自选列表', action: toggleWatchlist, active: showWatchlist },
    { icon: ArrowUpRight, label: '下单交易', action: toggleOrderPanel, active: showOrderPanel },
    { icon: Layers, label: '盘口深度', action: toggleDOM, active: showDOM },
    { icon: LayoutGrid, label: '量化交易', action: toggleQuantPanel, active: showQuantPanel },
    { icon: Search, label: '条件选股', action: toggleScreener, active: showScreener },
    { icon: Brain, label: 'AI 分析', action: toggleAIChat, active: showAIChat },
    { icon: Bell, label: '价格预警', action: toggleAlertPanel, active: showAlertPanel },
    { icon: Receipt, label: '交易明细', action: toggleTradeList, active: showTradeList },
    { icon: UserCircle, label: '账户详情', action: toggleAccountPanel, active: showAccountPanel },
    { icon: Target, label: '胜率分析', action: toggleWinRate, active: showWinRate },
    { icon: LineChart, label: '基本面', action: toggleFundamentals, active: showFundamentals },
    { icon: CalendarDays, label: '财经日历', action: toggleCalendar, active: showCalendar },
  ];

  const handleFullscreen = () => {
    const api = window.bangAPI;
    if (api?.toggleFullscreen) {
      api.toggleFullscreen().then((fs: boolean) => setFullscreen(fs));
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <TrendingUp size={16} />
      </div>
      <nav className="sidebar-nav">
        {topItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`sidebar-btn${item.active ? ' sidebar-btn-active' : ''}`}
              onClick={item.action}
              title={item.label}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-btn" onClick={handleFullscreen} title={isFullscreen ? '退出全屏' : '全屏'}>
          <Maximize2 size={16} />
        </button>
        <button className="sidebar-btn" onClick={toggleShortcuts} title="快捷键">
          <Keyboard size={16} />
        </button>
        <button className="sidebar-btn" onClick={() => setActivePanel('settings')} title="设置">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
