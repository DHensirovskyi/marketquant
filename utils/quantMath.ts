// utils/quantMath.ts
// Чиста математика. Без React, без I/O. Тестопридатно.

export interface Bar {
  datetime: string; // "YYYY-MM-DD HH:MM:SS" в UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DailyBar {
  date: string;       // YYYY-MM-DD (UTC)
  bars: Bar[];        // 15-min бари дня, відсортовані за часом
  open: number;
  high: number;
  low: number;
  close: number;
  dayOfWeek: number;  // 0=Нд .. 6=Сб (UTC)
}

export interface LiveStats {
  lastPrice: number;
  changePct: number;        // (last - prev_close) / prev_close * 100
  dayRangePips: number;     // диапазон сегодняшнего/последнего торгового дня
  adrPips: number;          // средний дневной диапазон за 20 дней (EWMA)
  lastBarTime: string;      // ISO для отображения "обновлено N мин назад"
}

export type SessionId = 'asian' | 'london' | 'ny';
export type CorrelationPair = 'asia-london' | 'asia-ny' | 'london-ny';


export function calcLiveStats(bars: Bar[]): LiveStats | null {
  if (!bars || bars.length === 0) return null;
  const days = groupByDay(bars);
  if (days.length === 0) return null;

  const last = days[days.length - 1];
  const prev = days.length > 1 ? days[days.length - 2] : null;

  const lastPrice = last.close;
  const changePct = prev ? ((lastPrice - prev.close) / prev.close) * 100 : 0;
  const dayRangePips = Math.round((last.high - last.low) / 0.0001 * 10) / 10;

  // ADR — EWMA по 20 дням
  const recent = days.slice(-20);
  const alpha = 2 / (20 + 1);
  let adrAcc = 0, init = false;
  for (const d of recent) {
    const r = (d.high - d.low) / 0.0001;
    adrAcc = init ? alpha * r + (1 - alpha) * adrAcc : r;
    init = true;
  }

  return {
    lastPrice,
    changePct: Math.round(changePct * 100) / 100,
    dayRangePips,
    adrPips: Math.round(adrAcc),
    lastBarTime: last.bars[last.bars.length - 1].datetime,
  };
}


// Сесії за умовою користувача (UTC). Перекриваються.
export const SESSIONS: Record<SessionId, { start: number; end: number; label: string }> = {
  asian:  { start: 0,  end: 8,  label: 'Азія' },
  london: { start: 8,  end: 16, label: 'Лондон' },
  ny:     { start: 13, end: 22, label: 'Нью-Йорк' },
};

const PIP = 0.0001;                         // EUR/USD
const toPips = (delta: number) => delta / PIP;
const round1 = (x: number) => Math.round(x * 10) / 10;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ── Час ───────────────────────────────────────────────────────────────────

function parseUTC(dt: string): Date {
  // Дані TwelveData без TZ — трактуємо як UTC.
  return new Date(dt.replace(' ', 'T') + 'Z');
}
function dateKey(d: Date): string {
  return (
    d.getUTCFullYear() +
    '-' + String(d.getUTCMonth() + 1).padStart(2, '0') +
    '-' + String(d.getUTCDate()).padStart(2, '0')
  );
}

// ── Агрегація ─────────────────────────────────────────────────────────────

export function groupByDay(bars: Bar[]): DailyBar[] {
  if (!bars || bars.length === 0) return [];
  const sorted = [...bars].sort((a, b) => a.datetime.localeCompare(b.datetime));

  const map = new Map<string, Bar[]>();
  for (const b of sorted) {
    const key = dateKey(parseUTC(b.datetime));
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(b);
  }

  const out: DailyBar[] = [];
  for (const key of Array.from(map.keys()).sort()) {
    const dayBars = map.get(key)!;
    const dow = parseUTC(dayBars[0].datetime).getUTCDay();

    // ─── ФИЛЬТР НЕТОРГОВЫХ ДНЕЙ ──────────────────────────────────
    // Forex closed: суббота полностью.
    // Воскресенье торгуется только после 22:00 UTC — обычно <30 баров.
    // Требуем минимум 48 баров (12 часов) — это отсекает хвосты пятницы
    // и недозакрытые воскресенья.
    if (dow === 6) continue;                         // Суббота — выкидываем
    if (dow === 0 && dayBars.length < 48) continue;  // Неполное воскресенье
    if (dayBars.length < 48) continue;               // Любой день с <12ч данных

    let high = -Infinity, low = Infinity;
    for (const b of dayBars) {
      if (b.high > high) high = b.high;
      if (b.low  < low)  low  = b.low;
    }
    out.push({
      date: key,
      bars: dayBars,
      open: dayBars[0].open,
      close: dayBars[dayBars.length - 1].close,
      high, low,
      dayOfWeek: dow,
    });
  }
  return out;
}

// Бари у заданому вікні сесії (Asia через північ).
function barsInSession(bars: Bar[], session: SessionId): Bar[] {
  const out: Bar[] = [];
  for (const b of bars) {
    const h = parseUTC(b.datetime).getUTCHours();
    let inSession = false;
    if (session === 'asian')          inSession = h >= 22 || h < 6;
    else if (session === 'london')    inSession = h >= 7  && h < 12;
    else if (session === 'ny')        inSession = h >= 12 && h < 22;
    if (inSession) out.push(b);
  }
  return out;
}

function sessionRange(bars: Bar[], session: SessionId): { high: number; low: number; first: Bar; last: Bar } | null {
  const sb = barsInSession(bars, session);
  if (sb.length === 0) return null;
  let high = -Infinity, low = Infinity;
  for (const b of sb) {
    if (b.high > high) high = b.high;
    if (b.low  < low)  low  = b.low;
  }
  return { high, low, first: sb[0], last: sb[sb.length - 1] };
}

// Non-overlapping корзина для HOD/LOD: Asia[0,8) London[8,13) NY[13,22)
function classifyBarSession(b: Bar): SessionId | null {
  const h = parseUTC(b.datetime).getUTCHours();
  if (h >= 0  && h < 8)  return 'asian';
  if (h >= 8  && h < 13) return 'london';
  if (h >= 13 && h < 24) return 'ny';
  return null;
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 1. ASR — Average Session Range                                       ║
// ╚══════════════════════════════════════════════════════════════════════╝
// ASR_s = (1/N) · Σ (H_s,i − L_s,i),  i ∈ [t−N+1, t]
// Trend: (ASR_now − ASR_prev) / ASR_prev · 100%
export interface ASRResult {
  pips: number;
  adrPips: number;
  pctOfADR: number;
  trendPct: number;     // зміна vs попередній період такого ж розміру
  sampleSize: number;
}

export function calcASR(days: DailyBar[], session: SessionId, period: number): ASRResult {
  if (days.length === 0) {
    return { pips: 0, adrPips: 0, pctOfADR: 0, trendPct: 0, sampleSize: 0 };
  }

  // EWMA: alpha = 2/(period+1). Свежие дни весят больше.
  const alpha = 2 / (period + 1);
  const ewma = (slice: DailyBar[], fn: (d: DailyBar) => number | null): number => {
    let acc: number | null = null;
    for (const d of slice) {
      const v = fn(d);
      if (v === null) continue;
      acc = acc === null ? v : alpha * v + (1 - alpha) * acc;
    }
    return acc ?? 0;
  };

  const cur  = days.slice(-period);
  const prev = days.slice(-(period * 2), -period);

  const sessionPips = (d: DailyBar) => {
    const r = sessionRange(d.bars, session);
    return r ? toPips(r.high - r.low) : null;
  };
  const adrFn = (d: DailyBar) => toPips(d.high - d.low);

  const pips     = ewma(cur, sessionPips);
  const adrPips  = ewma(cur, adrFn);
  const prevPips = ewma(prev, sessionPips);
  const trendPct = prevPips > 0 ? round1(((pips - prevPips) / prevPips) * 100) : 0;

  let sampleSize = 0;
  for (const d of cur) if (sessionPips(d) !== null) sampleSize++;

  return {
    pips: round1(pips),
    adrPips: round1(adrPips),
    pctOfADR: adrPips > 0 ? Math.round((pips / adrPips) * 100) : 0,
    trendPct,
    sampleSize,
  };
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 2. Asian Range Breakout                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝
// AsianHigh = max H, AsianLow = min L  у [0, 8) UTC.
// Перевірка пробою на барах [8, 22). Continuation = закриття дня за рівнем,
// у напрямку першого пробою.
export interface AsiaBreakoutResult {
  probability: number;     // % днів з будь-яким пробоєм
  upProbability: number;
  downProbability: number;
  continuation: number;    // P(close_day_за_рівнем | був перший пробій)
  sampleSize: number;
}

export function calcAsiaBreakout(days: DailyBar[]): AsiaBreakoutResult {
  let total = 0, any = 0, up = 0, down = 0;
  let firstHits = 0, contHits = 0;

  for (const day of days) {
    const asia = sessionRange(day.bars, 'asian');
    if (!asia) continue;

    // bars after Asia (London + NY window)
    const post: Bar[] = [];
    for (const b of day.bars) {
      const h = parseUTC(b.datetime).getUTCHours();
      if (h >= 8 && h < 22) post.push(b);
    }
    if (post.length === 0) continue;
    total++;

    let upHit = false, downHit = false;
    let firstDir: 'up' | 'down' | null = null;

    for (const b of post) {
      if (!upHit && b.high > asia.high) {
        upHit = true;
        if (!firstDir) firstDir = 'up';
      }
      if (!downHit && b.low < asia.low) {
        downHit = true;
        if (!firstDir) firstDir = 'down';
      }
      if (upHit && downHit) break;
    }

    if (upHit) up++;
    if (downHit) down++;
    if (upHit || downHit) any++;

    if (firstDir) {
      firstHits++;
      if (firstDir === 'up'   && day.close > asia.high) contHits++;
      if (firstDir === 'down' && day.close < asia.low ) contHits++;
    }
  }

  return {
    probability:     pct(any,  total),
    upProbability:   pct(up,   total),
    downProbability: pct(down, total),
    continuation:    pct(contHits, firstHits),
    sampleSize: total,
  };
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 3. Session Extremes (HOD / LOD by session)                           ║
// ╚══════════════════════════════════════════════════════════════════════╝
// Для кожного дня знаходимо перший бар, який торкнувся day.high (HOD)
// та day.low (LOD), і відносимо його до non-overlapping корзини.
export interface SessionExtremesResult {
  rows: { session: SessionId; name: string; hodPct: number; lodPct: number }[];
  sampleSize: number;
}

export function calcSessionExtremes(days: DailyBar[]): SessionExtremesResult {
  const hod: Record<SessionId, number> = { asian: 0, london: 0, ny: 0 };
  const lod: Record<SessionId, number> = { asian: 0, london: 0, ny: 0 };
  let total = 0;

  for (const day of days) {
    if (day.bars.length === 0) continue;
    total++;

    let hodBar: Bar | null = null;
    let lodBar: Bar | null = null;
    for (const b of day.bars) {
      if (!hodBar && b.high === day.high) hodBar = b;
      if (!lodBar && b.low  === day.low ) lodBar = b;
      if (hodBar && lodBar) break;
    }
    if (hodBar) { const s = classifyBarSession(hodBar); if (s) hod[s]++; }
    if (lodBar) { const s = classifyBarSession(lodBar); if (s) lod[s]++; }
  }

  const rows = (['asian', 'london', 'ny'] as SessionId[]).map(s => ({
    session: s,
    name: SESSIONS[s].label,
    hodPct: pct(hod[s], total),
    lodPct: pct(lod[s], total),
  }));
  return { rows, sampleSize: total };
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 4. Session Correlation (directional match)                           ║
// ╚══════════════════════════════════════════════════════════════════════╝
// P(dir(s2) == dir(s1) | обидві сесії спрямовані).
// Напрям = sign(close_last − open_first) усередині сесії.
function sessionDir(bars: Bar[], s: SessionId): 'up' | 'down' | null {
  const sb = barsInSession(bars, s);
  if (sb.length === 0) return null;
  const o = sb[0].open;
  const c = sb[sb.length - 1].close;
  if (c > o) return 'up';
  if (c < o) return 'down';
  return null;
}

export function calcCorrelations(days: DailyBar[]): Record<CorrelationPair, number> {
  const pairs: [CorrelationPair, SessionId, SessionId][] = [
    ['asia-london', 'asian',  'london'],
    ['asia-ny',     'asian',  'ny'],
    ['london-ny',   'london', 'ny'],
  ];
  const out = { 'asia-london': 0, 'asia-ny': 0, 'london-ny': 0 } as Record<CorrelationPair, number>;
  for (const [key, a, b] of pairs) {
    let total = 0, match = 0;
    for (const day of days) {
      const d1 = sessionDir(day.bars, a);
      const d2 = sessionDir(day.bars, b);
      if (!d1 || !d2) continue;
      total++;
      if (d1 === d2) match++;
    }
    // Зберігаємо як 0..1 з двома знаками — UI рендерить .toFixed(2)
    out[key] = total > 0 ? Math.round((match / total) * 100) / 100 : 0;
  }
  return out;
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 5. Inside Bar                                                        ║
// ╚══════════════════════════════════════════════════════════════════════╝
// IB_i: high_i ≤ high_{i-1} AND low_i ≥ low_{i-1}
// Розподіл по днях тижня: P(IB | weekday) = N_IB_dow / N_dow
export interface InsideBarResult {
  probability: number;
  byWeekday: { d: string; v: number }[];
  sampleSize: number;
}

export function calcInsideBar(days: DailyBar[]): InsideBarResult {
  const tot = [0, 0, 0, 0, 0, 0, 0];
  const ib  = [0, 0, 0, 0, 0, 0, 0];
  let allT = 0, allIB = 0;

  for (let i = 1; i < days.length; i++) {
    const p = days[i - 1], c = days[i];
    const dow = c.dayOfWeek;
    tot[dow]++; allT++;
    if (c.high <= p.high && c.low >= p.low) {
      ib[dow]++; allIB++;
    }
  }
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
  const byWeekday = [1, 2, 3, 4, 5].map((i, idx) => ({
    d: labels[idx],
    v: pct(ib[i], tot[i]),
  }));
  return { probability: pct(allIB, allT), byWeekday, sampleSize: allT };
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 6. Weekday Extremes                                                  ║
// ╚══════════════════════════════════════════════════════════════════════╝
// Тижні: Пн..Пт. Для кожного тижня знаходимо weekHigh/Low і
// записуємо weekday, на який це випало.
function isoWeekKey(date: Date): string {
  // Понеділок-початок тижня
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay() || 7; // Нд → 7
  d.setUTCDate(d.getUTCDate() - dow + 1);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export interface WeekdayExtremesResult {
  rows: { d: string; high: number; low: number }[];
  sampleSize: number;
}

export function calcWeekdayExtremes(days: DailyBar[]): WeekdayExtremesResult {
  const weeks = new Map<string, DailyBar[]>();
  for (const day of days) {
    const dt = new Date(day.date + 'T00:00:00Z');
    const key = isoWeekKey(dt);
    let arr = weeks.get(key);
    if (!arr) { arr = []; weeks.set(key, arr); }
    arr.push(day);
  }

  const hi = [0, 0, 0, 0, 0]; // Пн..Пт
  const lo = [0, 0, 0, 0, 0];
  let weekCount = 0;

  for (const wd of weeks.values()) {
    // Беремо тільки повноцінні робочі тижні (≥ 2 дні)
    if (wd.length < 2) continue;
    weekCount++;
    let wh = -Infinity, wl = Infinity;
    let wHi: DailyBar | null = null, wLo: DailyBar | null = null;
    for (const d of wd) {
      if (d.high > wh) { wh = d.high; wHi = d; }
      if (d.low  < wl) { wl = d.low;  wLo = d; }
    }
    if (wHi && wHi.dayOfWeek >= 1 && wHi.dayOfWeek <= 5) hi[wHi.dayOfWeek - 1]++;
    if (wLo && wLo.dayOfWeek >= 1 && wLo.dayOfWeek <= 5) lo[wLo.dayOfWeek - 1]++;
  }

  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
  return {
    rows: labels.map((d, i) => ({
      d,
      high: pct(hi[i], weekCount),
      low:  pct(lo[i], weekCount),
    })),
    sampleSize: weekCount,
  };
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 7. NY Midnight Overlap                                               ║
// ╚══════════════════════════════════════════════════════════════════════╝
// mOpen = open бара 05:00 UTC.
// Trigger: під час Лондона [8,16) ціна відхилилася від mOpen на ≥ distance pips.
// Retouch: під час NY [13,22) ціна повернулася і торкнулась mOpen (low≤mOpen≤high).
// probability = retouches / triggers.
export interface NYMidnightResult {
  probability: number;
  sampleSize: number;     // кількість триггер-днів
}

export function calcNYMidnight(days: DailyBar[], distancePips: number): NYMidnightResult {
  const threshold = distancePips * PIP;
  let triggers = 0, retouches = 0;

  for (const day of days) {
    // Бар, що відкривається рівно о 05:00 UTC
    let midBar: Bar | null = null;
    for (const b of day.bars) {
      const d = parseUTC(b.datetime);
      if (d.getUTCHours() === 5 && d.getUTCMinutes() === 0) { midBar = b; break; }
    }
    if (!midBar) continue;
    const mOpen = midBar.open;

    // Лондон
    let triggered = false;
    for (const b of day.bars) {
      const h = parseUTC(b.datetime).getUTCHours();
      if (h < 8 || h >= 16) continue;
      if (b.high - mOpen >= threshold || mOpen - b.low >= threshold) { triggered = true; break; }
    }
    if (!triggered) continue;
    triggers++;

    // NY
    for (const b of day.bars) {
      const h = parseUTC(b.datetime).getUTCHours();
      if (h < 13 || h >= 22) continue;
      if (b.low <= mOpen && b.high >= mOpen) { retouches++; break; }
    }
  }
  return { probability: pct(retouches, triggers), sampleSize: triggers };
}


// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Progressive Bayesian filter                                          ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { AsiaContext, AsiaWidth, AsiaDirection, SweepKind } from './asiaContext';

export interface FilterStep {
  name: string;
  applied: boolean;
  sampleAfter: number;
  reason?: string;  // если не применился — почему
}

export interface FilteredDays {
  days: DailyBar[];
  steps: FilterStep[];
  sampleSize: number;
  globalSize: number;
}

const MIN_SAMPLE = 30;

function asiaWidthOfDay(day: DailyBar, adr: number): AsiaWidth {
  let h = -Infinity, l = Infinity, found = false;
  for (const b of day.bars) {
    const hr = new Date(b.datetime.replace(' ', 'T') + 'Z').getUTCHours();
    if (hr < 8) {
      found = true;
      if (b.high > h) h = b.high;
      if (b.low  < l) l = b.low;
    }
  }
  if (!found) return 'normal';
  const ratio = ((h - l) / 0.0001) / (adr || 1);
  return ratio < 0.4 ? 'narrow' : ratio > 0.7 ? 'wide' : 'normal';
}

function asiaDirectionOfDay(day: DailyBar): AsiaDirection {
  let firstAsia: Bar | null = null, lastAsia: Bar | null = null;
  for (const b of day.bars) {
    const hr = new Date(b.datetime.replace(' ', 'T') + 'Z').getUTCHours();
    if (hr < 8) {
      if (!firstAsia) firstAsia = b;
      lastAsia = b;
    }
  }
  if (!firstAsia || !lastAsia) return 'neutral';
  const diff = lastAsia.close - firstAsia.open;
  if (Math.abs(diff) < 0.0001 * 5) return 'neutral';
  return diff > 0 ? 'bullish' : 'bearish';
}

function asiaSweepOfDay(day: DailyBar, prev: DailyBar | null): SweepKind {
  if (!prev) return 'none';
  let h = -Infinity, l = Infinity;
  for (const b of day.bars) {
    const hr = new Date(b.datetime.replace(' ', 'T') + 'Z').getUTCHours();
    if (hr < 8) {
      if (b.high > h) h = b.high;
      if (b.low  < l) l = b.low;
    }
  }
  const sH = h > prev.high, sL = l < prev.low;
  if (sH && sL) return 'both';
  if (sH) return 'PDH';
  if (sL) return 'PDL';
  return 'none';
}

function adrOfHistory(history: DailyBar[]): number {
  const slice = history.slice(-20);
  let acc = 0, init = false;
  const alpha = 2 / 21;
  for (const d of slice) {
    const r = (d.high - d.low) / 0.0001;
    acc = init ? alpha * r + (1 - alpha) * acc : r;
    init = true;
  }
  return acc;
}

export function applyContextFilter(
     days: DailyBar[],
     context: AsiaContext,
     dxyBars?: Bar[],
   ): FilteredDays {
  const steps: FilterStep[] = [];
  const adr = adrOfHistory(days);

  if (!context.available) {
    return { days, steps, sampleSize: days.length, globalSize: days.length };
  }

  let current = days;

  // Filter 1: Asia width
  const candidate1 = current.filter(d => asiaWidthOfDay(d, adr) === context.width);
  const step1: FilterStep = {
    name: `Asia ${context.width}`,
    applied: candidate1.length >= MIN_SAMPLE,
    sampleAfter: candidate1.length,
  };
  if (!step1.applied) step1.reason = `<${MIN_SAMPLE} samples`;
  steps.push(step1);
  if (step1.applied) current = candidate1;

  // Filter 2: Asia direction
  if (context.direction !== 'neutral') {
    const candidate2 = current.filter(d => asiaDirectionOfDay(d) === context.direction);
    const step2: FilterStep = {
      name: `Asia ${context.direction}`,
      applied: candidate2.length >= MIN_SAMPLE,
      sampleAfter: candidate2.length,
    };
    if (!step2.applied) step2.reason = `<${MIN_SAMPLE} samples`;
    steps.push(step2);
    if (step2.applied) current = candidate2;
  }

  // Filter 3: Asia sweep
  if (context.sweep !== 'none') {
    const candidate3: DailyBar[] = [];
    for (let i = 1; i < current.length; i++) {
      if (asiaSweepOfDay(current[i], current[i - 1]) === context.sweep) {
        candidate3.push(current[i]);
      }
    }
    const step3: FilterStep = {
      name: `Asia swept ${context.sweep}`,
      applied: candidate3.length >= MIN_SAMPLE,
      sampleAfter: candidate3.length,
    };
    if (!step3.applied) step3.reason = `<${MIN_SAMPLE} samples`;
    steps.push(step3);
    if (step3.applied) current = candidate3;
  }

  // Filter 4: DXY direction (только если есть данные)
  // EUR/USD исторически отрицательно коррелирует с DXY:
  // DXY bullish → EUR/USD bearish и наоборот.
  // Поэтому фильтруем исторические дни по тому же DXY direction.
  if (context.dxyDirection !== 'unknown' && context.dxyDirection !== 'neutral') {
    // Для исторической фильтрации нам нужен dxyDirection каждого исторического дня.
    // Это требует расширения DailyBar. Пока используем простой proxy:
    // знак (close − open) Азии. EUR/USD up → DXY down → invert.
    // Это слабее реального DXY, но в отсутствие исторических DXY-баров работает.
    
    // Поскольку DXY ~ -EUR/USD, если сегодня DXY bullish → ищем дни где Азия bearish.
    const targetEurAsiaDir = context.dxyDirection === 'bullish' ? 'bearish' : 'bullish';
    
    const candidate4 = current.filter(d => asiaDirectionOfDay(d) === targetEurAsiaDir);
    const step4: FilterStep = {
      name: `DXY ${context.dxyDirection}`,
      applied: candidate4.length >= MIN_SAMPLE,
      sampleAfter: candidate4.length,
    };
    if (!step4.applied) step4.reason = `<${MIN_SAMPLE} samples`;
    steps.push(step4);
    if (step4.applied) current = candidate4;
  }

  return {
    days: current,
    steps,
    sampleSize: current.length,
    globalSize: days.length,
  };
}


export interface SessionDirectionResult {
  rows: {
    session: SessionId;
    name: string;
    longPct: number;
    shortPct: number;
    sample: number;
  }[];
  sampleSize: number;
}

export function calcSessionDirections(days: DailyBar[]): SessionDirectionResult {
  const counts: Record<SessionId, { long: number; short: number; total: number }> = {
    asian:     { long: 0, short: 0, total: 0 },
    london:    { long: 0, short: 0, total: 0 },
    ny:        { long: 0, short: 0, total: 0 },
  };

  for (const day of days) {
    for (const session of ['asian', 'frankfurt', 'london', 'ny'] as SessionId[]) {
      const bars = barsInSession(day.bars, session);
      if (bars.length === 0) continue;
      const o = bars[0].open;
      const c = bars[bars.length - 1].close;
      counts[session].total++;
      if (c > o) counts[session].long++;
      else if (c < o) counts[session].short++;
    }
  }

  // UI: показываем 3 сессии, Frankfurt скрыт (он в backend для полноты)
  const rows = (['asian', 'london', 'ny'] as SessionId[]).map(s => ({
    session: s,
    name: SESSIONS[s].label,
    longPct: counts[s].total > 0 ? Math.round((counts[s].long / counts[s].total) * 100) : 0,
    shortPct: counts[s].total > 0 ? Math.round((counts[s].short / counts[s].total) * 100) : 0,
    sample: counts[s].total,
  }));

  return { rows, sampleSize: days.length };
}