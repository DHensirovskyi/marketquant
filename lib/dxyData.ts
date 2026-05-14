// lib/dxyData.ts
import type { Bar } from '@/utils/quantMath';

const KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;

interface RawTwelveData {
  status: 'ok' | 'error';
  message?: string;
  values?: Array<{
    datetime: string;
    open: string; high: string; low: string; close: string;
  }>;
}

export interface DXYResult {
  bars: Bar[];
  error: string | null;
}

/**
 * Fetch DXY (US Dollar Index) 15-min bars.
 * DXY торгуется только в рабочие часы CME, поэтому покрытие меньше чем у EUR/USD.
 * Это нормально — если для конкретного дня DXY не покрывает Азию, фильтр просто не применится.
 */
export async function fetchDXY(outputsize = 500): Promise<DXYResult> {
  if (!KEY) return { bars: [], error: 'NO_API_KEY' };
  try {
    const url =
      `https://api.twelvedata.com/time_series` +
      `?symbol=DXY` +
      `&interval=15min` +
      `&outputsize=${outputsize}` +
      `&timezone=UTC` +
      `&format=JSON` +
      `&apikey=${KEY}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { bars: [], error: `HTTP_${res.status}` };
    const data = (await res.json()) as RawTwelveData;
    if (data.status !== 'ok' || !data.values) {
      return { bars: [], error: data.message ?? 'API_ERROR' };
    }
    const bars: Bar[] = data.values
      .map(v => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: 0,
      }))
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log(`[DXY] OK · ${bars.length} bars · ${bars[0]?.datetime} → ${bars[bars.length - 1]?.datetime}`);
    return { bars, error: null };
  } catch (e) {
    return { bars: [], error: (e as Error).message };
  }
}