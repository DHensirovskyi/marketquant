// utils/asiaContext.ts
import { Bar, DailyBar } from './quantMath';

const PIP = 0.0001;
const parseUTC = (s: string) => new Date(s.replace(' ', 'T') + 'Z');
const hourOf = (b: Bar) => parseUTC(b.datetime).getUTCHours();

export type AsiaWidth = 'narrow' | 'normal' | 'wide';
export type AsiaDirection = 'bullish' | 'bearish' | 'neutral';
export type AsiaClosePos = 'top' | 'middle' | 'bottom';
export type SweepKind = 'none' | 'PDH' | 'PDL' | 'both';
export type DXYDirection = 'bullish' | 'bearish' | 'neutral' | 'unknown';

export interface AsiaContext {
  dxyDirection: DXYDirection;
  dxyChangePct: number;

  available: boolean;
  reason?: string;

  asiaOpen: number;
  asiaHigh: number;
  asiaLow: number;
  asiaClose: number;
  asiaRangePips: number;

  width: AsiaWidth;
  ratioToADR: number;           // asia_range / ADR(20)

  direction: AsiaDirection;
  closePos: AsiaClosePos;

  sweep: SweepKind;             // относительно PDH/PDL вчерашнего дня
  prevClose: number | null;
  gapPips: number;              // asia_open − yesterday_close (signed)
}

/**
 * Извлекает контекст Азии из ТЕКУЩЕГО торгового дня (livеBars).
 * Должен вызываться после 08:00 UTC, иначе вернёт available=false.
 */
export function extractAsiaContext(
  liveBars: Bar[],
  historyDays: DailyBar[],
  nowUTC: Date = new Date(),
  dxyBars?: Bar[],
): AsiaContext {
  const empty: AsiaContext = {
    available: false, reason: 'no_data',
    asiaOpen: 0, asiaHigh: 0, asiaLow: 0, asiaClose: 0,
    asiaRangePips: 0, width: 'normal', ratioToADR: 0,
    direction: 'neutral', closePos: 'middle', sweep: 'none',
    prevClose: null, gapPips: 0,
    dxyDirection: 'unknown', dxyChangePct: 0,
  };

  const nowHour = nowUTC.getUTCHours();
const asiaClosed = nowHour >= 6 && nowHour < 22;
if (!asiaClosed) {
  return { ...empty, reason: 'asia_in_progress' };
}
  if (!liveBars || liveBars.length === 0) return empty;

  // Asia bars: [0, 8) UTC
  const asia = liveBars.filter(b => {
  const h = hourOf(b);
  return h >= 22 || h < 6;
});
  if (asia.length === 0) return { ...empty, reason: 'no_asia_bars' };

  let h = -Infinity, l = Infinity;
  for (const b of asia) {
    if (b.high > h) h = b.high;
    if (b.low  < l) l = b.low;
  }
  const open  = asia[0].open;
  const close = asia[asia.length - 1].close;
  const rangePips = (h - l) / PIP;

  // ADR(20) — EWMA по истории
  const adrSlice = historyDays.slice(-20);
  let adrAcc = 0, init = false;
  const alpha = 2 / 21;
  for (const d of adrSlice) {
    const r = (d.high - d.low) / PIP;
    adrAcc = init ? alpha * r + (1 - alpha) * adrAcc : r;
    init = true;
  }
  const adr = adrAcc || rangePips;
  const ratio = rangePips / adr;

  const width: AsiaWidth =
    ratio < 0.4 ? 'narrow' :
    ratio > 0.7 ? 'wide'   : 'normal';

  // Direction
  const bodyPips = (close - open) / PIP;
  const direction: AsiaDirection =
    Math.abs(bodyPips) < rangePips * 0.15 ? 'neutral'
    : bodyPips > 0 ? 'bullish' : 'bearish';

  // Close position в диапазоне
  const posRatio = (close - l) / (h - l);
  const closePos: AsiaClosePos =
    posRatio > 0.66 ? 'top'
    : posRatio < 0.33 ? 'bottom' : 'middle';

  // Sweep vs PDH/PDL
  const prev = historyDays.length > 0 ? historyDays[historyDays.length - 1] : null;
  let sweep: SweepKind = 'none';
  if (prev) {
    const sweptHigh = h > prev.high;
    const sweptLow  = l < prev.low;
    if (sweptHigh && sweptLow) sweep = 'both';
    else if (sweptHigh) sweep = 'PDH';
    else if (sweptLow)  sweep = 'PDL';
  }

let dxyDirection: DXYDirection = 'unknown';
  let dxyChangePct = 0;
  if (dxyBars && dxyBars.length > 0) {
    // Извлекаем DXY бары для того же дня в окне Азии [0,8) UTC
    const todayKey = asia[0].datetime.substring(0, 10);
    const dxyAsia = dxyBars.filter(b => {
      if (b.datetime.substring(0, 10) !== todayKey) return false;
      return hourOf(b) < 8;
    });
    if (dxyAsia.length >= 2) {
      const dxyOpen = dxyAsia[0].open;
      const dxyClose = dxyAsia[dxyAsia.length - 1].close;
      dxyChangePct = ((dxyClose - dxyOpen) / dxyOpen) * 100;
      // Порог 0.05% — отсекает шум, ниже считаем neutral
      if (Math.abs(dxyChangePct) < 0.05) dxyDirection = 'neutral';
      else dxyDirection = dxyChangePct > 0 ? 'bullish' : 'bearish';
    }
  }

  return {
    available: true,
    asiaOpen: open, asiaHigh: h, asiaLow: l, asiaClose: close,
    asiaRangePips: Math.round(rangePips * 10) / 10,
    width, ratioToADR: Math.round(ratio * 100) / 100,
    direction, closePos, sweep,
    prevClose: prev?.close ?? null,
    gapPips: prev ? Math.round(((open - prev.close) / PIP) * 10) / 10 : 0,
    dxyDirection,
    dxyChangePct: Math.round(dxyChangePct * 100) / 100,
  };
}
