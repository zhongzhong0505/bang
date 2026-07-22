/**
 * Format date/time for TradingView-style display.
 * Daily:  "7月22" or "2026年7月" or "2026"
 * Intraday: "09:30" with date context "07/22 09:30"
 */

const MONTHS_CN = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export interface FormatOptions {
  dateFormat: 'yyyy-MM-dd' | 'MM/dd' | 'dd/MM' | 'yyyy/MM/dd' | 'MMM dd' | 'dd MMM';
  timeFormat: 'HH:mm' | 'HH:mm:ss' | 'hh:mm A' | 'hh:mm:ss A';
  showSecondsInCrosshair: boolean;
}

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  dateFormat: 'MM/dd',
  timeFormat: 'HH:mm',
  showSecondsInCrosshair: false,
};

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function formatDatePart(d: Date, fmt: string): string {
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const Y = d.getFullYear();
  switch (fmt) {
    case 'yyyy-MM-dd': return `${Y}-${pad2(M)}-${pad2(D)}`;
    case 'MM/dd': return `${pad2(M)}/${pad2(D)}`;
    case 'dd/MM': return `${pad2(D)}/${pad2(M)}`;
    case 'yyyy/MM/dd': return `${Y}/${pad2(M)}/${pad2(D)}`;
    case 'MMM dd': return `${MONTHS_CN[d.getMonth()]}${D}`;
    case 'dd MMM': return `${D}${MONTHS_CN[d.getMonth()]}`;
    default: return `${pad2(M)}/${pad2(D)}`;
  }
}

function formatTimePart(d: Date, fmt: string): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  switch (fmt) {
    case 'HH:mm': return `${pad2(h)}:${pad2(m)}`;
    case 'HH:mm:ss': return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    case 'hh:mm A': {
      const isPM = h >= 12;
      const hh = h % 12 || 12;
      return `${pad2(hh)}:${pad2(m)} ${isPM ? 'PM' : 'AM'}`;
    }
    case 'hh:mm:ss A': {
      const isPM = h >= 12;
      const hh = h % 12 || 12;
      return `${pad2(hh)}:${pad2(m)}:${pad2(s)} ${isPM ? 'PM' : 'AM'}`;
    }
    default: return `${pad2(h)}:${pad2(m)}`;
  }
}

export function formatTickMark(time: number, tickType: number, isDaily: boolean, opts?: FormatOptions): string | null {
  const o = opts ?? DEFAULT_FORMAT_OPTIONS;
  const d = new Date(time * 1000);
  switch (tickType) {
    case 0: // Year
      return String(d.getFullYear());
    case 1: // Month
      return isDaily
        ? `${d.getFullYear()} ${MONTHS_CN[d.getMonth()]}`
        : MONTHS_CN[d.getMonth()];
    case 2: // DayOfMonth
      return formatDatePart(d, o.dateFormat);
    case 3: // Time (without seconds)
      return formatTimePart(d, o.timeFormat);
    case 4: // TimeWithSeconds
      return formatTimePart(d, o.timeFormat === 'HH:mm' ? 'HH:mm:ss' : o.timeFormat);
    default:
      return null;
  }
}

export function formatCrosshairTime(time: number, isDaily: boolean, opts?: FormatOptions): string {
  const o = opts ?? DEFAULT_FORMAT_OPTIONS;
  const d = new Date(time * 1000);
  if (isDaily) {
    return formatDatePart(d, 'yyyy-MM-dd');
  }
  const dateStr = formatDatePart(d, o.dateFormat);
  const timeStr = o.showSecondsInCrosshair
    ? formatTimePart(d, o.timeFormat === 'HH:mm' ? 'HH:mm:ss' : o.timeFormat)
    : formatTimePart(d, o.timeFormat);
  return `${dateStr} ${timeStr}`;
}

export function isDailySubType(subType: string): boolean {
  return subType === 'DAY' || subType === 'WEEK' || subType === 'MONTH';
}

export function formatVolume(vol: number): string {
  if (vol >= 1e8) return (vol / 1e8).toFixed(2) + '亿';
  if (vol >= 1e4) return (vol / 1e4).toFixed(0) + '万';
  return String(vol);
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}
