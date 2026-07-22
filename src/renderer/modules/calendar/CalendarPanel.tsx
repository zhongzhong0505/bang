import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import type { CalendarEvent, CalendarEventType } from '../../../shared/types';
import './calendar.css';

const EVENT_TYPES: { label: string; value: CalendarEventType | 'all' }[] = [
  { label: '全部', value: 'all' }, { label: '财报', value: 'earnings' },
  { label: '分红', value: 'dividend' }, { label: '经济数据', value: 'economic' },
  { label: 'IPO', value: 'ipo' }, { label: '拆股', value: 'split' },
];

const TYPE_LABELS: Record<CalendarEventType, string> = {
  earnings: '财报', dividend: '分红', economic: '经济', ipo: 'IPO', split: '拆股',
};

const CalendarPanel: React.FC = () => {
  const toggleCalendar = useStore((s) => s.toggleCalendar);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const setCalendarEvents = useStore((s) => s.setCalendarEvents);

  const [activeTab, setActiveTab] = useState<CalendarEventType | 'all'>('all');

  useEffect(() => {
    const api = window.bangAPI as any;
    if (!api?.getCalendar) return;
    api.getCalendar().then((events: CalendarEvent[]) => {
      if (events) setCalendarEvents(events);
    }).catch(() => {});
  }, [setCalendarEvents]);

  const filtered = activeTab === 'all' ? calendarEvents : calendarEvents.filter((e) => e.type === activeTab);

  return (
    <div className="calendar-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleCalendar(); }}>
      <div className="calendar-panel">
        <div className="calendar-header">
          <span>财经日历</span>
          <button className="calendar-close" onClick={toggleCalendar}>x</button>
        </div>
        <div className="calendar-tabs">
          {EVENT_TYPES.map((t) => (
            <button key={t.value} className={`calendar-tab${activeTab === t.value ? ' calendar-tab-active' : ''}`} onClick={() => setActiveTab(t.value)}>{t.label}</button>
          ))}
        </div>
        <div className="calendar-events">
          {filtered.map((ev) => (
            <div key={ev.id} className="calendar-event">
              <span className="calendar-event-time">{ev.time || '--:--'}</span>
              <span className={`calendar-event-badge calendar-badge-${ev.type}`}>{TYPE_LABELS[ev.type]}</span>
              <div className="calendar-event-info">
                <span className="calendar-event-title">{ev.title}</span>
                {(ev.actual || ev.forecast || ev.previous) && (
                  <div className="calendar-event-values">
                    {ev.actual && <span className="calendar-event-actual">实际: {ev.actual}</span>}
                    {ev.forecast && <span className="calendar-event-forecast">预期: {ev.forecast}</span>}
                    {ev.previous && <span className="calendar-event-previous">前值: {ev.previous}</span>}
                  </div>
                )}
                {ev.description && <span className="calendar-event-detail">{ev.description}</span>}
              </div>
              <span className={`calendar-event-importance calendar-imp-${ev.importance}`}>
                {ev.importance === 'high' ? '!' : ev.importance === 'medium' ? '·' : ''}
              </span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20, fontSize: 12 }}>暂无数据</div>}
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
