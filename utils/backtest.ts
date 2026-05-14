// utils/backtest.ts
import {
  Bar, DailyBar, SessionId,
  groupByDay,
  calcASR, calcAsiaBreakout, calcSessionExtremes,
  calcInsideBar, calcNYMidnight,
} from './quantMath';

const PIP = 0.0001;
const toPips = (d: number) => Math.round((d / PIP) * 10) / 10;

// ─────────────────────────────────────────────────────────────────────────
// Per-day "facts" — что реально случилось в этот день
// ─────────────────────────────────────────────────────────────────────────

function parseUTC(s: string) { return new Date(s.replace(' ', 'T') + 'Z'); }
function hourOf(b: Bar) { return parseUTC(b.datetime).getUTCHours(); }

function dayDirection(day: DailyBar): 'LONG' | 'SHORT' | 'NEUTRAL' {
  let hT = '', lT = '';
  for (const b of day.bars) {
    if (!hT && b.high === day.high) hT = b.datetime;
    if (!lT && b.low  === day.low ) lT = b.datetime;
    if (hT && lT) break;
  }
  if (!hT || !lT) return 'NEUTRAL';
  return lT < hT ? 'LONG' : 'SHORT';
}

function sessionOfBar(b: Bar): SessionId | null {
  const h = hourOf(b);
  if (h >= 0  && h < 8)  return 'asian';
  if (h >= 8  && h < 13) return 'london';
  if (h >= 13 && h < 24) return 'ny';
  return null;
}

function sessionRangePips(day: DailyBar, s: SessionId): number {
  const range = { asian: [0,8], london: [8,16], ny: [13,22] }[s];
  let hi = -Infinity, lo = Infinity, found = false;
  for (const b of day.bars) {
    const h = hourOf(b);
    if (h >= range[0] && h < range[1]) {
      found = true;
      if (b.high > hi) hi = b.high;
      if (b.low  < lo) lo = b.low;
    }
  }
  return found ? toPips(hi - lo) : 0;
}

interface DayFacts {
  date: string;
  weekday: string;
  open: number; high: number; low: number; close: number;
  dayRangePips: number;
  asiaHigh: number; asiaLow: number; asiaRangePips: number;
  londonRangePips: number; nyRangePips: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  hodSession: SessionId | null;
  lodSession: SessionId | null;
  asiaBreakUp: boolean;
  asiaBreakDown: boolean;
  asiaBreakFirst: 'UP' | 'DOWN' | 'NONE';
  asiaContinuation: boolean;     // close за уровнем в направлении первого пробоя
  isInsideBar: boolean | null;   // null если нет предыдущего дня
  nyMidnightOpen: number | null;
  nyMidnightTriggered: boolean;
  nyMidnightRetouched: boolean;
}

function extractDayFacts(day: DailyBar, prev: DailyBar | null, nyMidDist: number): DayFacts {
  const WD = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][day.dayOfWeek];

  // Asia range
  let aH = -Infinity, aL = Infinity, aFound = false;
  for (const b of day.bars) {
    const h = hourOf(b);
    if (h < 8) {
      aFound = true;
      if (b.high > aH) aH = b.high;
      if (b.low  < aL) aL = b.low;
    }
  }

  // Asia breakout during 8..22
  let upHit = false, downHit = false, firstDir: 'UP'|'DOWN'|'NONE' = 'NONE';
  if (aFound) {
    for (const b of day.bars) {
      const h = hourOf(b);
      if (h < 8 || h >= 22) continue;
      if (!upHit   && b.high > aH) { upHit = true;   if (firstDir==='NONE') firstDir='UP'; }
      if (!downHit && b.low  < aL) { downHit = true; if (firstDir==='NONE') firstDir='DOWN'; }
      if (upHit && downHit) break;
    }
  }
  const continuation =
    firstDir === 'UP'   ? day.close > aH :
    firstDir === 'DOWN' ? day.close < aL : false;

  // HOD / LOD session
  let hodBar: Bar | null = null, lodBar: Bar | null = null;
  for (const b of day.bars) {
    if (!hodBar && b.high === day.high) hodBar = b;
    if (!lodBar && b.low  === day.low ) lodBar = b;
    if (hodBar && lodBar) break;
  }

  // Inside Bar
  const isIB = prev ? (day.high <= prev.high && day.low >= prev.low) : null;

  // NY Midnight (05:00 UTC bar)
  let nyMidBar: Bar | null = null;
  for (const b of day.bars) {
    const d = parseUTC(b.datetime);
    if (d.getUTCHours() === 5 && d.getUTCMinutes() === 0) { nyMidBar = b; break; }
  }
  let nymTrig = false, nymRetouch = false;
  if (nyMidBar) {
    const mOpen = nyMidBar.open;
    const thr = nyMidDist * PIP;
    for (const b of day.bars) {
      const h = hourOf(b);
      if (h < 8 || h >= 16) continue;
      if (b.high - mOpen >= thr || mOpen - b.low >= thr) { nymTrig = true; break; }
    }
    if (nymTrig) {
      for (const b of day.bars) {
        const h = hourOf(b);
        if (h < 13 || h >= 22) continue;
        if (b.low <= mOpen && b.high >= mOpen) { nymRetouch = true; break; }
      }
    }
  }

  return {
    date: day.date,
    weekday: WD,
    open: day.open, high: day.high, low: day.low, close: day.close,
    dayRangePips: toPips(day.high - day.low),
    asiaHigh: aFound ? aH : NaN,
    asiaLow:  aFound ? aL : NaN,
    asiaRangePips: aFound ? toPips(aH - aL) : 0,
    londonRangePips: sessionRangePips(day, 'london'),
    nyRangePips:     sessionRangePips(day, 'ny'),
    direction: dayDirection(day),
    hodSession: hodBar ? sessionOfBar(hodBar) : null,
    lodSession: lodBar ? sessionOfBar(lodBar) : null,
    asiaBreakUp: upHit,
    asiaBreakDown: downHit,
    asiaBreakFirst: firstDir,
    asiaContinuation: continuation,
    isInsideBar: isIB,
    nyMidnightOpen: nyMidBar?.open ?? null,
    nyMidnightTriggered: nymTrig,
    nyMidnightRetouched: nymRetouch,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Прогноз на день D, основанный только на историии [0..D-1]
// ─────────────────────────────────────────────────────────────────────────

interface DayPrediction {
  predDir: 'LONG' | 'SHORT';
  predDirProb: number;            // вероятность предсказанного класса, %
  predHodSession: SessionId;
  predLodSession: SessionId;
  predBreakProb: number;          // % дней с пробоем Азии
  predContProb: number;           // continuation
  predIbProb: number;
  predNymProb: number;
  predAsrAsia: number;            // pips
  predAsrLondon: number;
  predAsrNy: number;
  historyDays: number;
}

function predict(history: DailyBar[], nyMidDist: number): DayPrediction {
  // ── ASR (как было) ────────────────────────────────────────────────
  const asrA = calcASR(history, 'asian',  Math.min(20, history.length));
  const asrL = calcASR(history, 'london', Math.min(20, history.length));
  const asrN = calcASR(history, 'ny',     Math.min(20, history.length));

  // ── Direction: momentum от вчерашнего дня ────────────────────────
  const recentForDir = history.slice(-60);

  // База — для случаев когда вчерашний день нейтральный
  let lng = 0, srt = 0;
  for (const d of recentForDir) {
    const dir = dayDirection(d);
    if (dir === 'LONG')  lng++;
    else if (dir === 'SHORT') srt++;
  }
  const tot = lng + srt;
  const longPct  = tot > 0 ? (lng / tot) * 100 : 50;
  const shortPct = 100 - longPct;

  const yesterday = history.length > 0 ? history[history.length - 1] : null;
  let predDir: 'LONG' | 'SHORT';
  let predDirProb: number;

  if (yesterday) {
    const yesterdayDir = dayDirection(yesterday);
    if (yesterdayDir === 'LONG' || yesterdayDir === 'SHORT') {
      predDir = yesterdayDir;
      // P(today = yesterdayDir | prev day = yesterdayDir) — на 60 днях
      let cMatch = 0, cTotal = 0;
      for (let i = 1; i < recentForDir.length; i++) {
        const prev = dayDirection(recentForDir[i - 1]);
        const cur  = dayDirection(recentForDir[i]);
        if (prev !== 'LONG' && prev !== 'SHORT') continue;
        if (cur  !== 'LONG' && cur  !== 'SHORT') continue;
        if (prev !== yesterdayDir) continue;
        cTotal++;
        if (cur === yesterdayDir) cMatch++;
      }
      predDirProb = cTotal > 0 ? Math.round((cMatch / cTotal) * 100) : 50;
    } else {
      predDir = longPct >= shortPct ? 'LONG' : 'SHORT';
      predDirProb = Math.round(Math.max(longPct, shortPct));
    }
  } else {
    predDir = 'LONG';
    predDirProb = 50;
  }

  // ── HOD / LOD — density-weighted argmax ───────────────────────────
  const sessionHours: Record<SessionId, number> = {
    asian:  8,   // [0, 8)
    london: 5,   // [8, 13)
    ny:     11,  // [13, 24)
  };
  const se = calcSessionExtremes(history);
  const argmaxDensity = (key: 'hodPct' | 'lodPct'): SessionId => {
    let bestS: SessionId = 'london';
    let bestDensity = -1;
    for (const r of se.rows) {
      const density = r[key] / sessionHours[r.session];
      if (density > bestDensity) {
        bestDensity = density;
        bestS = r.session;
      }
    }
    return bestS;
  };

  // ── Остальные метрики ────────────────────────────────────────────
  const breakout = calcAsiaBreakout(history);
  const ib       = calcInsideBar(history);
  const nym      = calcNYMidnight(history, nyMidDist);

  return {
    predDir,
    predDirProb,
    predHodSession: argmaxDensity('hodPct'),
    predLodSession: argmaxDensity('lodPct'),
    predBreakProb: breakout.probability,
    predContProb:  breakout.continuation,
    predIbProb:    ib.probability,
    predNymProb:   nym.probability,
    predAsrAsia:   asrA.pips,
    predAsrLondon: asrL.pips,
    predAsrNy:     asrN.pips,
    historyDays:   history.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Главный прогон
// ─────────────────────────────────────────────────────────────────────────

export interface BacktestOptions {
  daysToBacktest: number;       // последние N торговых дней
  minHistory?: number;          // минимум истории, иначе строка не пишется
  nyMidnightDistance: number;
}

export interface BacktestProgress {
  done: number;
  total: number;
  currentDate: string;
}

export async function runBacktest(
  bars: Bar[],
  opts: BacktestOptions,
  onProgress?: (p: BacktestProgress) => void
): Promise<string> {
  const days = groupByDay(bars);
  const minHist = opts.minHistory ?? 60;
  const total = Math.min(opts.daysToBacktest, days.length - minHist);
  if (total <= 0) return '';

  // Берём именно последние N дней
  const startIdx = days.length - total;

  // CSV header
  const headers = [
    'date','weekday','history_days',
    'pred_dir','actual_dir','dir_hit',
    'pred_dir_prob_pct',
    'pred_hod_session','actual_hod_session','hod_hit',
    'pred_lod_session','actual_lod_session','lod_hit',
    'pred_asia_break_prob_pct','asia_break_first','asia_break_occurred','break_pred_aligned',
    'pred_continuation_prob_pct','actual_continuation','cont_pred_aligned',
    'pred_ib_prob_pct','actual_inside_bar',
    'pred_nym_prob_pct','nym_triggered','nym_retouched','nym_pred_aligned',
    'pred_asr_asia_pips','actual_asia_range_pips','asr_asia_err_pips',
    'pred_asr_london_pips','actual_london_range_pips','asr_london_err_pips',
    'pred_asr_ny_pips','actual_ny_range_pips','asr_ny_err_pips',
    'day_open','day_high','day_low','day_close','day_range_pips',
    'asia_high','asia_low','ny_midnight_open',
  ];
  const rows: string[] = [headers.join(',')];

  const sessionEq = (a: SessionId | null, b: SessionId | null) =>
    a && b && a === b ? 1 : 0;
  const align = (probPct: number, actualBool: boolean) =>
    (probPct > 50 && actualBool) || (probPct <= 50 && !actualBool) ? 1 : 0;

  for (let i = startIdx; i < days.length; i++) {
    const day = days[i];
    const history = days.slice(0, i);              // строго до текущего
    const prev = i > 0 ? days[i - 1] : null;

    const pred = predict(history, opts.nyMidnightDistance);
    const facts = extractDayFacts(day, prev, opts.nyMidnightDistance);

    const row = [
      facts.date, facts.weekday, pred.historyDays,
      pred.predDir, facts.direction, facts.direction === pred.predDir ? 1 : 0,
      pred.predDirProb,
      pred.predHodSession, facts.hodSession ?? '', sessionEq(pred.predHodSession, facts.hodSession),
      pred.predLodSession, facts.lodSession ?? '', sessionEq(pred.predLodSession, facts.lodSession),
      pred.predBreakProb,
      facts.asiaBreakFirst, (facts.asiaBreakUp || facts.asiaBreakDown) ? 1 : 0,
      align(pred.predBreakProb, facts.asiaBreakUp || facts.asiaBreakDown),
      pred.predContProb, facts.asiaContinuation ? 1 : 0, align(pred.predContProb, facts.asiaContinuation),
      pred.predIbProb, facts.isInsideBar === null ? '' : (facts.isInsideBar ? 1 : 0),
      pred.predNymProb, facts.nyMidnightTriggered ? 1 : 0, facts.nyMidnightRetouched ? 1 : 0,
        facts.nyMidnightTriggered ? align(pred.predNymProb, facts.nyMidnightRetouched) : '',
      pred.predAsrAsia,   facts.asiaRangePips,   Math.round((facts.asiaRangePips   - pred.predAsrAsia)   * 10) / 10,
      pred.predAsrLondon, facts.londonRangePips, Math.round((facts.londonRangePips - pred.predAsrLondon) * 10) / 10,
      pred.predAsrNy,     facts.nyRangePips,     Math.round((facts.nyRangePips     - pred.predAsrNy)     * 10) / 10,
      facts.open, facts.high, facts.low, facts.close, facts.dayRangePips,
      Number.isFinite(facts.asiaHigh) ? facts.asiaHigh : '',
      Number.isFinite(facts.asiaLow)  ? facts.asiaLow  : '',
      facts.nyMidnightOpen ?? '',
    ];
    rows.push(row.join(','));

    if (onProgress && (i - startIdx) % 5 === 0) {
      onProgress({ done: i - startIdx + 1, total, currentDate: facts.date });
      await new Promise(r => setTimeout(r, 0));   // отдаём поток UI
    }
  }
  if (onProgress) onProgress({ done: total, total, currentDate: days[days.length - 1].date });

    // ─── Summary footer ──────────────────────────────────────────────────
    const sumRow = (label: string, ...vals: (string | number)[]) =>
    [label, ...vals].join(',');

    const dirHits  = rows.slice(1).map(r => +r.split(',')[5]).filter(Number.isFinite);
    const hodHits  = rows.slice(1).map(r => +r.split(',')[9]).filter(Number.isFinite);
    const lodHits  = rows.slice(1).map(r => +r.split(',')[12]).filter(Number.isFinite);
    const brkAlign = rows.slice(1).map(r => +r.split(',')[16]).filter(Number.isFinite);
    const avg = (a: number[]) => a.length ? (a.reduce((s, x) => s + x, 0) / a.length) : 0;

    rows.push('');
    rows.push(sumRow('=== SUMMARY ==='));
    rows.push(sumRow('Total days', total));
    rows.push(sumRow('Direction hit rate',     avg(dirHits).toFixed(3)));
    rows.push(sumRow('HOD session hit rate',   avg(hodHits).toFixed(3)));
    rows.push(sumRow('LOD session hit rate',   avg(lodHits).toFixed(3)));
    rows.push(sumRow('Asia breakout aligned',  avg(brkAlign).toFixed(3)));
    rows.push(sumRow('Baseline (random) dir',  '0.500'));
    rows.push(sumRow('Baseline (random) HOD',  '0.333'));

  return rows.join('\n');
}