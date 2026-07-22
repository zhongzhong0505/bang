import React, { useState, useRef, useEffect } from 'react';
import './date-picker.css';

interface DatePickerProps {
  value: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; month: number; year: number; dim: boolean }[] = [];
  // Previous month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: viewMonth - 1, year: viewYear, dim: true });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, dim: false });
  }
  // Next month head (fill to 42 = 6 rows)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: viewMonth + 1, year: viewYear, dim: true });
  }

  const normalize = (c: { day: number; month: number; year: number }) => {
    let m = c.month;
    let y = c.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    return { day: c.day, month: m, year: y };
  };

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };
  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const selectDay = (c: { day: number; month: number; year: number }) => {
    const n = normalize(c);
    onChange(toDateStr(n.year, n.month, n.day));
    setOpen(false);
  };

  const display = value || placeholder || '';

  return (
    <div className="dp-wrapper" ref={ref}>
      <button className="dp-trigger" onClick={() => setOpen(!open)} type="button">
        <svg className="dp-trigger-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.1" />
          <path d="M4 1v2.5M10 1v2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <span className={`dp-trigger-text${value ? '' : ' dp-placeholder'}`}>{display}</span>
      </button>

      {open && (
        <div className="dp-panel">
          <div className="dp-header">
            <button className="dp-nav-btn" onClick={prevMonth} type="button">
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M7.5 2.5L4 6l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="dp-title">{viewYear}年 {MONTHS[viewMonth]}</span>
            <button className="dp-nav-btn" onClick={nextMonth} type="button">
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4.5 2.5L8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="dp-weekdays">
            {WEEKDAYS.map((w) => <span key={w} className="dp-weekday">{w}</span>)}
          </div>
          <div className="dp-grid">
            {cells.map((c, i) => {
              const n = normalize(c);
              const ds = toDateStr(n.year, n.month, n.day);
              const isToday = ds === todayStr;
              const isSelected = ds === value;
              return (
                <button
                  key={i}
                  className={`dp-day${c.dim ? ' dp-day-dim' : ''}${isSelected ? ' dp-day-selected' : ''}${isToday ? ' dp-day-today' : ''}`}
                  onClick={() => selectDay(c)}
                  type="button"
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
