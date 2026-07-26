import React from 'react';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { TranslationKey } from '../../i18n';
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
  labelKey: TranslationKey;
  action: () => void;
  active: boolean;
}

const Sidebar: React.FC = () => {
  const lang = useStore((s) => s.appSettings.language);
  const L = useTBatch([
    'sidebar.watchlist', 'sidebar.order', 'sidebar.dom', 'sidebar.quant',
    'sidebar.screener', 'sidebar.ai', 'sidebar.alerts', 'sidebar.trades',
    'sidebar.account', 'sidebar.winrate', 'sidebar.fundamentals', 'sidebar.calendar',
    'sidebar.fullscreen', 'sidebar.exitFullscreen', 'sidebar.shortcuts', 'sidebar.settings',
  ]);

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
    { icon: List, labelKey: 'sidebar.watchlist', action: toggleWatchlist, active: showWatchlist },
    { icon: ArrowUpRight, labelKey: 'sidebar.order', action: toggleOrderPanel, active: showOrderPanel },
    { icon: Layers, labelKey: 'sidebar.dom', action: toggleDOM, active: showDOM },
    { icon: LayoutGrid, labelKey: 'sidebar.quant', action: toggleQuantPanel, active: showQuantPanel },
    { icon: Search, labelKey: 'sidebar.screener', action: toggleScreener, active: showScreener },
    { icon: Brain, labelKey: 'sidebar.ai', action: toggleAIChat, active: showAIChat },
    { icon: Bell, labelKey: 'sidebar.alerts', action: toggleAlertPanel, active: showAlertPanel },
    { icon: Receipt, labelKey: 'sidebar.trades', action: toggleTradeList, active: showTradeList },
    { icon: UserCircle, labelKey: 'sidebar.account', action: toggleAccountPanel, active: showAccountPanel },
    { icon: Target, labelKey: 'sidebar.winrate', action: toggleWinRate, active: showWinRate },
    { icon: LineChart, labelKey: 'sidebar.fundamentals', action: toggleFundamentals, active: showFundamentals },
    { icon: CalendarDays, labelKey: 'sidebar.calendar', action: toggleCalendar, active: showCalendar },
  ];

  const handleFullscreen = () => {
    const api = window.bangAPI;
    if (api?.toggleFullscreen) {
      api.toggleFullscreen().then((fs: boolean) => setFullscreen(fs));
    }
  };
  void lang;

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
              key={item.labelKey}
              className={`sidebar-btn${item.active ? ' sidebar-btn-active' : ''}`}
              onClick={item.action}
              data-tooltip={L[item.labelKey]}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-btn" onClick={handleFullscreen} data-tooltip={isFullscreen ? L['sidebar.exitFullscreen'] : L['sidebar.fullscreen']}>
          <Maximize2 size={16} />
        </button>
        <button className="sidebar-btn" onClick={toggleShortcuts} data-tooltip={L['sidebar.shortcuts']}>
          <Keyboard size={16} />
        </button>
        <button className="sidebar-btn" onClick={() => setActivePanel('settings')} data-tooltip={L['sidebar.settings']}>
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
