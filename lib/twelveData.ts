// lib/twelveData.ts
import type { Bar } from '@/utils/quantMath';

const KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;

interface RawTwelveData {
  status: 'ok' | 'error';
  message?: string;
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>;
}

export interface TwelveDataResult {
  bars: Bar[];
  error: string | null;
  rawCount: number;
  symbol: string;
  fetchedAt: string;
}

export async function fetchTwelveData(
  symbol = 'EUR/USD',
  interval = '15min',
  outputsize = 500
): Promise<TwelveDataResult> {
  const fetchedAt = new Date().toISOString();
  if (!KEY) {
    return { bars: [], error: 'NO_API_KEY', rawCount: 0, symbol, fetchedAt };
  }
  try {
    const url =
      `https://api.twelvedata.com/time_series` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${interval}` +
      `&outputsize=${outputsize}` +
      `&timezone=UTC` +   
      `&format=JSON` +
      `&apikey=${KEY}`;

    console.log('[TwelveData] GET', url.replace(KEY, '***')); // <-- видно в DevTools Console
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return { bars: [], error: `HTTP_${res.status}`, rawCount: 0, symbol, fetchedAt };
    }
    const data = (await res.json()) as RawTwelveData;
    if (data.status !== 'ok' || !data.values) {
      return { bars: [], error: data.message ?? 'API_ERROR', rawCount: 0, symbol, fetchedAt };
    }
    // TwelveData возвращает в обратном порядке (новые → старые)
    const bars: Bar[] = data.values
      .map(v => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: v.volume ? parseFloat(v.volume) : 0,
      }))
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log(`[TwelveData] OK · ${bars.length} bars · ${bars[0]?.datetime} → ${bars[bars.length - 1]?.datetime}`);
    return { bars, error: null, rawCount: bars.length, symbol, fetchedAt };
  } catch (e) {
    return { bars: [], error: (e as Error).message, rawCount: 0, symbol, fetchedAt };
  }
}