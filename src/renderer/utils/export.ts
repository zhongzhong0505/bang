import type { KlineData, TradeRecord, ExportFormat } from '../../shared/types';

export async function exportKlineData(
  data: KlineData[],
  code: string,
  format: ExportFormat,
): Promise<{ success: boolean; path?: string; error?: string }> {
  const api = window.bangAPI;
  if (!api?.exportData) {
    return { success: false, error: '导出功能不可用' };
  }

  const exportData = data.map((d) => ({
    time: new Date(d.time * 1000).toISOString().split('T')[0],
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
    turnover: d.turnover,
  }));

  const filename = `${code.replace('.', '_')}_kline.${format}`;
  return api.exportData({ format, filename, data: exportData });
}

export async function exportTradeRecords(
  records: TradeRecord[],
  format: ExportFormat,
): Promise<{ success: boolean; path?: string; error?: string }> {
  const api = window.bangAPI;
  if (!api?.exportData) {
    return { success: false, error: '导出功能不可用' };
  }

  const exportData = records.map((r) => ({
    time: new Date(r.time * 1000).toISOString(),
    code: r.code,
    name: r.name,
    side: r.side,
    price: r.price,
    qty: r.filledQty,
    amount: r.amount,
    totalFee: r.fee.totalFee,
    netAmount: r.netAmount,
    currency: r.currency,
  }));

  const filename = `trade_records.${format}`;
  return api.exportData({ format, filename, data: exportData });
}
