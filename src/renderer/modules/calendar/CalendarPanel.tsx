import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { useTBatch } from '../../i18n';
import type { CalendarEvent, CalendarEventType } from '../../../shared/types';
import './calendar.css';

const CalendarPanel: React.FC = () => {
  const toggleCalendar = useStore((s) => s.toggleCalendar);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const setCalendarEvents = useStore((s) => s.setCalendarEvents);

  const L = useTBatch([
    'calendar.title', 'calendar.all', 'calendar.earnings', 'calendar.dividend',
    'calendar.economic', 'calendar.ipo', 'calendar.split',
    'calendar.typeEarnings', 'calendar.typeDividend', 'calendar.typeEconomic',
    'calendar.typeIpo', 'calendar.typeSplit',
    'calendar.noData', 'calendar.loading', 'calendar.fallback',
    'calendar.sourceAi', 'calendar.sourceMock',
    'calendar.actual', 'calendar.forecast', 'calendar.previous',
    'calendar.refresh', 'calendar.dateLabel',
  ] as any);

  const [activeTab, setActiveTab] = useState<CalendarEventType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'ai' | 'mock' | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const EVENT_TYPES: { label: string; value: CalendarEventType | 'all' }[] = [
    { label: L['calendar.all'], value: 'all' },
    { label: L['calendar.earnings'], value: 'earnings' },
    { label: L['calendar.dividend'], value: 'dividend' },
    { label: L['calendar.economic'], value: 'economic' },
    { label: L['calendar.ipo'], value: 'ipo' },
    { label: L['calendar.split'], value: 'split' },
  ];

  const TYPE_LABELS: Record<CalendarEventType, string> = {
    earnings: L['calendar.typeEarnings'],
    dividend: L['calendar.typeDividend'],
    economic: L['calendar.typeEconomic'],
    ipo: L['calendar.typeIpo'],
    split: L['calendar.typeSplit'],
  };

  const fetchData = useCallback(async (date: string) => {
    const api = window.bangAPI as any;
    if (!api?.getCalendar) return;
    setLoading(true);
    try {
      const result = await api.getCalendar(date);
      if (result?.events) {
        setCalendarEvents(result.events);
        setDataSource(result.source ?? 'mock');
      }
    } catch {
      setDataSource('mock');
    } finally {
      setLoading(false);
    }
  }, [setCalendarEvents]);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const filtered = activeTab === 'all' ? calendarEvents : calendarEvents.filter((e) => e.type === activeTab);

  return (
    <div className="calendar-overlay" onClick={(e) => { if (e.target === e.currentTarget) toggleCalendar(); }}>
      <div className="calendar-panel">
        <div className="calendar-header">
          <span>{L['calendar.title']}</span>
          <div className="calendar-header-right">
            {dataSource && (
              <span className={`calendar-source calendar-source-${dataSource}`}>
                {dataSource === 'ai' ? L['calendar.sourceAi'] : L['calendar.sourceMock']}
              </span>
            )}
            <div className="calendar-date-picker">
              <label className="calendar-date-label">{L['calendar.dateLabel']}</label>
              <input
                type="date"
                className="calendar-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="calendar-refresh" onClick={() => fetchData(selectedDate)} disabled={loading} title={L['calendar.refresh']}>
              <svg width="12" height="12" viewBox="0 0 12 12" className={loading ? 'calendar-spin' : ''}>
                <path d="M6 1a5 5 0 1 1-4.33 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M1 1l.67 2.5L4.17 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="calendar-close" onClick={toggleCalendar}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        {dataSource === 'mock' && !loading && (
          <div className="calendar-fallback-hint">{L['calendar.fallback']}</div>
        )}
        <div className="calendar-tabs">
          {EVENT_TYPES.map((t) => (
            <button key={t.value} className={`calendar-tab${activeTab === t.value ? ' calendar-tab-active' : ''}`} onClick={() => setActiveTab(t.value)}>{t.label}</button>
          ))}
        </div>
        <div className="calendar-events">
          {loading ? (
            <div className="calendar-loading">
              <div className="calendar-loading-spinner" />
              <span>{L['calendar.loading']}</span>
            </div>
          ) : (
            <>
              {filtered.map((ev) => (
                <div key={ev.id} className="calendar-event">
                  <span className="calendar-event-time">{ev.time || '--:--'}</span>
                  <span className={`calendar-event-badge calendar-badge-${ev.type}`}>{TYPE_LABELS[ev.type]}</span>
                  <div className="calendar-event-info">
                    <span className="calendar-event-title">{ev.title}</span>
                    {(ev.actual || ev.forecast || ev.previous) && (
                      <div className="calendar-event-values">
                        {ev.actual && <span className="calendar-event-actual">{L['calendar.actual']}: {ev.actual}</span>}
                        {ev.forecast && <span className="calendar-event-forecast">{L['calendar.forecast']}: {ev.forecast}</span>}
                        {ev.previous && <span className="calendar-event-previous">{L['calendar.previous']}: {ev.previous}</span>}
                      </div>
                    )}
                    {ev.description && <span className="calendar-event-detail">{ev.description}</span>}
                  </div>
                  <span className={`calendar-event-importance calendar-imp-${ev.importance}`}>
                    {ev.importance === 'high' ? '!' : ev.importance === 'medium' ? '·' : ''}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && <div className="calendar-empty">{L['calendar.noData']}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPanel;
