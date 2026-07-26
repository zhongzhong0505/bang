import type { CalendarEvent, CalendarEventType } from '../shared/types';
import { fetchCalendarEvents } from './ai-service';

// Mock calendar events — used as fallback when AI is not configured
function generateMockEvents(date: string): CalendarEvent[] {
  const d = date || new Date().toISOString().split('T')[0];

  const events: CalendarEvent[] = [
    // Earnings
    { id: 'e1', type: 'earnings', title: '腾讯控股 季报', code: 'HK.00700', name: '腾讯控股', date: d, time: '16:00', importance: 'high', country: 'HK', actual: '', forecast: '15.2', previous: '13.6' },
    { id: 'e2', type: 'earnings', title: '阿里巴巴 季报', code: 'HK.09988', name: '阿里巴巴-W', date: d, time: '09:00', importance: 'high', country: 'HK', actual: '', forecast: '6.8', previous: '5.2' },
    { id: 'e3', type: 'earnings', title: 'Apple Inc 季报', code: 'US.AAPL', name: 'Apple Inc', date: d, time: '16:30', importance: 'high', country: 'US', actual: '', forecast: '1.62', previous: '1.46' },
    { id: 'e4', type: 'earnings', title: 'NVIDIA 季报', code: 'US.NVDA', name: 'NVIDIA Corp', date: d, time: '16:20', importance: 'high', country: 'US', actual: '', forecast: '4.62', previous: '2.97' },

    // Dividends
    { id: 'd1', type: 'dividend', title: '汇丰控股 派息', code: 'HK.00005', name: '汇丰控股', date: d, importance: 'medium', country: 'HK', actual: '0.52', forecast: '0.52', previous: '0.48' },
    { id: 'd2', type: 'dividend', title: 'Apple Inc 派息', code: 'US.AAPL', name: 'Apple Inc', date: d, importance: 'medium', country: 'US', actual: '0.25', forecast: '0.25', previous: '0.24' },
    { id: 'd3', type: 'dividend', title: '贵州茅台 分红', code: 'SH.600519', name: '贵州茅台', date: d, importance: 'medium', country: 'CN', actual: '25.91', forecast: '25.91', previous: '21.91' },

    // Economic events
    { id: 'ec1', type: 'economic', title: '美国非农就业数据', date: d, time: '20:30', importance: 'high', country: 'US', actual: '', forecast: '180K', previous: '206K' },
    { id: 'ec2', type: 'economic', title: '美国CPI同比', date: d, time: '20:30', importance: 'high', country: 'US', actual: '', forecast: '3.1%', previous: '3.3%' },
    { id: 'ec3', type: 'economic', title: '中国PMI制造业', date: d, time: '09:30', importance: 'high', country: 'CN', actual: '', forecast: '50.4', previous: '50.1' },
    { id: 'ec4', type: 'economic', title: '美联储利率决议', date: d, time: '02:00', importance: 'high', country: 'US', actual: '', forecast: '5.25%', previous: '5.25%' },
    { id: 'ec5', type: 'economic', title: '香港失业率', date: d, time: '16:30', importance: 'medium', country: 'HK', actual: '', forecast: '3.0%', previous: '3.1%' },

    // IPO
    { id: 'ipo1', type: 'ipo', title: '新股上市 - 示例科技', date: d, time: '09:30', importance: 'low', country: 'HK', description: '示例科技公司港股上市，发行价12.8港元' },

    // Stock split
    { id: 's1', type: 'split', title: 'NVIDIA 拆股', code: 'US.NVDA', name: 'NVIDIA Corp', date: d, importance: 'medium', country: 'US', description: '10:1 拆股' },
  ];

  return events;
}

const VALID_TYPES = new Set<string>(['earnings', 'dividend', 'economic', 'ipo', 'split']);
const VALID_IMPORTANCE = new Set<string>(['high', 'medium', 'low']);

export async function getCalendarEvents(date?: string): Promise<{ events: CalendarEvent[]; source: 'ai' | 'mock' }> {
  const d = date || new Date().toISOString().split('T')[0];

  // Try AI first
  try {
    const aiResult = await fetchCalendarEvents(d);
    if (aiResult && aiResult.events.length > 0) {
      const events: CalendarEvent[] = aiResult.events
        .filter((e) => VALID_TYPES.has(e.type) && VALID_IMPORTANCE.has(e.importance))
        .map((e, i) => ({
          id: `ai-${i}`,
          type: e.type as CalendarEventType,
          title: e.title,
          code: e.code,
          name: e.name,
          date: e.date || d,
          time: e.time,
          importance: e.importance as 'high' | 'medium' | 'low',
          country: e.country,
          actual: e.actual ?? '',
          forecast: e.forecast ?? '',
          previous: e.previous ?? '',
          description: e.description,
        }));
      return { events, source: 'ai' };
    }
  } catch {
    // AI failed, fall through to mock
  }

  // Fallback to mock
  return { events: generateMockEvents(d), source: 'mock' };
}
