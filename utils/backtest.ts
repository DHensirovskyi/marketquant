// utils/backtest.ts
import {
  Bar, DailyBar, SessionId,
  groupByDay, applyContextFilter,
  calcASR, calcAsiaBreakout, calcSessionExtremes,
  calcInsideBar, calcNYMidnight,
} from './quantMath';
import { extractAsiaContext, AsiaContext } from './asiaContext';

const PIP = 0.0001;
const toPips = (d: number) => Math.round((d / PIP) * 10) / 10;

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
  asiaContinuation: boolean;
  isInsideBar: boolean | null;
  nyMidnightOpen: number | null;
  nyMidnightTriggered: boolean;
  nyMidnightRetouched: boolean;
}

function extractDayFacts(day: DailyBar, prev: DailyBar | null, nyMidDist: number): DayFacts {
  const WD = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][day.dayOfWeek];

  let aH = -Infinity, aL = Infinity, aFound = false;
  for (const b of day.bars) {
    if (hourOf(b) < 8) {
      aFound = true;
      if (b.high > aH) aH = b.high;
      if (b.low  < aL) aL = b.low;
    }
  }

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

  let hodBar: Bar | null = null, lodBar: Bar | null = null;
  for (const b of day.bars) {
    if (!hodBar && b.high === day.high) hodBar = b;
    if (!lodBar && b.low  === day.low ) lodBar = b;
    if (hodBar && lodBar) break;
  }

  const isIB = prev ? (day.high <= prev.high && day.low >= prev.low) : null;

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
    date: day.date, weekday: WD,
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
    asiaBreakUp: upHit, asiaBreakDown: downHit,
    asiaBreakFirst: firstDir, asiaContinuation: continuation,
    isInsideBar: isIB,
    nyMidnightOpen: nyMidBar?.open ?? null,
    nyMidnightTriggered: nymTrig, nyMidnightRetouched: nymRetouch,
  };
}

interface DayPrediction {
  predDir: 'LONG' | 'SHORT';
  predDirProb: number;
  predHodSession: SessionId;
  predLodSession: SessionId;
  predBreakProb: number;
  predContProb: number;
  predIbProb: number;
  predNymProb: number;
  predAsrAsia: number;
  predAsrLondon: number;
  predAsrNy: number;
  historyDays: number;
}

function predict(history: DailyBar[], nyMidDist: number): DayPrediction {
  const asrA = calcASR(history, 'asian',  Math.min(20, history.length));
  const asrL = calcASR(history, 'london', Math.min(20, history.length));
  const asrN = calcASR(history, 'ny',     Math.min(20, history.length));

  const recentForDir = history.slice(-Math.min(100, history.length));
  let lng = 0, srt = 0;
  for (const d of recentForDir) {
    const dir = dayDirection(d);
    if (dir === 'LONG')  lng++;
    else if (dir === 'SHORT') srt++;
  }
  const tot = lng + srt;
  const longPct  = tot > 0 ? (lng / tot) * 100 : 50;
  const shortPct = 100 - longPct;
  const predDir: 'LONG' | 'SHORT' = longPct >= shortPct ? 'LONG' : 'SHORT';
  const predDirProb = Math.round(Math.max(longPct, shortPct));

  const sessionHours: Record<SessionId, number> = { asian: 8, london: 5, ny: 11 };
  const se = calcSessionExtremes(history);
  const argmaxDensity = (key: 'hodPct' | 'lodPct'): SessionId => {
    let bestS: SessionId = 'london', bestDensity = -1;
    for (const r of se.rows) {
      const density = r[key] / sessionHours[r.session];
      if (density > bestDensity) { bestDensity = density; bestS = r.session; }
    }
    return bestS;
  };

  const breakout = calcAsiaBreakout(history);
  const ib       = calcInsideBar(history);
  const nym      = calcNYMidnight(history, nyMidDist);

  return {
    predDir, predDirProb,
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

function buildAsiaContextForDay(
  day: DailyBar,
  history: DailyBar[],
  dxyBars?: Bar[],
): AsiaContext {
  const fakeNow = new Date(day.date + 'T08:01:00Z');
  return extractAsiaContext(day.bars, history, fakeNow, dxyBars);
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Главный прогон                                                       ║
// ╚══════════════════════════════════════════════════════════════════════╝

export interface BacktestOptions {
  daysToBacktest: number;
  minHistory?: number;
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
  onProgress?: (p: BacktestProgress) => void,
  dxyBars?: Bar[],
): Promise<string> {
  const days = groupByDay(bars);
  const minHist = opts.minHistory ?? 60;
  const total = Math.min(opts.daysToBacktest, days.length - minHist);
  if (total <= 0) return '';

  const startIdx = days.length - total;

  const headers = [
    'date','weekday','history_days',

    'asia_width','asia_direction','asia_close_pos','asia_sweep',
    'asia_range_pips','asia_ratio_adr','asia_gap_pips',
    'dxy_direction','dxy_change_pct',

    'ctx_filters_applied','ctx_sample_size',

    'pred_dir_global','pred_dir_ctx','actual_dir',
    'dir_hit_global','dir_hit_ctx',
    'pred_dir_prob_global','pred_dir_prob_ctx',

    'pred_hod_global','pred_hod_ctx','actual_hod',
    'hod_hit_global','hod_hit_ctx',
    'pred_lod_global','pred_lod_ctx','actual_lod',
    'lod_hit_global','lod_hit_ctx',

    'pred_break_prob_global','pred_break_prob_ctx',
    'asia_break_first','asia_break_occurred',
    'break_aligned_global','break_aligned_ctx',

    'pred_cont_prob_global','pred_cont_prob_ctx',
    'actual_continuation',
    'cont_aligned_global','cont_aligned_ctx',

    'pred_ib_prob_global','pred_ib_prob_ctx','actual_inside_bar',

    'pred_nym_prob_global','pred_nym_prob_ctx',
    'nym_triggered','nym_retouched',
    'nym_aligned_global','nym_aligned_ctx',

    'pred_asr_asia_global','pred_asr_asia_ctx','actual_asia_range',
    'asr_asia_err_global','asr_asia_err_ctx',
    'pred_asr_london_global','pred_asr_london_ctx','actual_london_range',
    'asr_london_err_global','asr_london_err_ctx',
    'pred_asr_ny_global','pred_asr_ny_ctx','actual_ny_range',
    'asr_ny_err_global','asr_ny_err_ctx',

    'day_open','day_high','day_low','day_close','day_range_pips',
  ];
  const rows: string[] = [headers.join(',')];

  const sessionEq = (a: SessionId | null, b: SessionId | null) =>
    a && b && a === b ? 1 : 0;
  const align = (probPct: number, actualBool: boolean) =>
    (probPct > 50 && actualBool) || (probPct <= 50 && !actualBool) ? 1 : 0;

  for (let i = startIdx; i < days.length; i++) {
    const day = days[i];
    const history = days.slice(0, i);
    const prev = i > 0 ? days[i - 1] : null;

    const ctx = buildAsiaContextForDay(day, history, dxyBars);
    const predGlobal = predict(history, opts.nyMidnightDistance);

    let predCtx: DayPrediction;
    let appliedFilters = 0;
    let ctxSample = history.length;

    if (ctx.available) {
      const filtered = applyContextFilter(history, ctx, dxyBars);
      appliedFilters = filtered.steps.filter(s => s.applied).length;
      ctxSample = filtered.sampleSize;
      predCtx = predict(filtered.days, opts.nyMidnightDistance);
    } else {
      predCtx = predGlobal;
    }

    const facts = extractDayFacts(day, prev, opts.nyMidnightDistance);
    const breakOccurred = facts.asiaBreakUp || facts.asiaBreakDown;

    const row = [
      facts.date, facts.weekday, predGlobal.historyDays,

      ctx.width, ctx.direction, ctx.closePos, ctx.sweep,
      ctx.asiaRangePips, ctx.ratioToADR, ctx.gapPips,
      ctx.dxyDirection, ctx.dxyChangePct,

      appliedFilters, ctxSample,

      predGlobal.predDir, predCtx.predDir, facts.direction,
      facts.direction === predGlobal.predDir ? 1 : 0,
      facts.direction === predCtx.predDir    ? 1 : 0,
      predGlobal.predDirProb, predCtx.predDirProb,

      predGlobal.predHodSession, predCtx.predHodSession, facts.hodSession ?? '',
      sessionEq(predGlobal.predHodSession, facts.hodSession),
      sessionEq(predCtx.predHodSession,    facts.hodSession),
      predGlobal.predLodSession, predCtx.predLodSession, facts.lodSession ?? '',
      sessionEq(predGlobal.predLodSession, facts.lodSession),
      sessionEq(predCtx.predLodSession,    facts.lodSession),

      predGlobal.predBreakProb, predCtx.predBreakProb,
      facts.asiaBreakFirst, breakOccurred ? 1 : 0,
      align(predGlobal.predBreakProb, breakOccurred),
      align(predCtx.predBreakProb,    breakOccurred),

      predGlobal.predContProb, predCtx.predContProb,
      facts.asiaContinuation ? 1 : 0,
      align(predGlobal.predContProb, facts.asiaContinuation),
      align(predCtx.predContProb,    facts.asiaContinuation),

      predGlobal.predIbProb, predCtx.predIbProb,
      facts.isInsideBar === null ? '' : (facts.isInsideBar ? 1 : 0),

      predGlobal.predNymProb, predCtx.predNymProb,
      facts.nyMidnightTriggered ? 1 : 0, facts.nyMidnightRetouched ? 1 : 0,
      facts.nyMidnightTriggered ? align(predGlobal.predNymProb, facts.nyMidnightRetouched) : '',
      facts.nyMidnightTriggered ? align(predCtx.predNymProb,    facts.nyMidnightRetouched) : '',

      predGlobal.predAsrAsia, predCtx.predAsrAsia, facts.asiaRangePips,
      Math.round((facts.asiaRangePips - predGlobal.predAsrAsia) * 10) / 10,
      Math.round((facts.asiaRangePips - predCtx.predAsrAsia)    * 10) / 10,
      predGlobal.predAsrLondon, predCtx.predAsrLondon, facts.londonRangePips,
      Math.round((facts.londonRangePips - predGlobal.predAsrLondon) * 10) / 10,
      Math.round((facts.londonRangePips - predCtx.predAsrLondon)    * 10) / 10,
      predGlobal.predAsrNy, predCtx.predAsrNy, facts.nyRangePips,
      Math.round((facts.nyRangePips - predGlobal.predAsrNy) * 10) / 10,
      Math.round((facts.nyRangePips - predCtx.predAsrNy)    * 10) / 10,

      facts.open, facts.high, facts.low, facts.close, facts.dayRangePips,
    ];
    rows.push(row.join(','));

    if (onProgress && (i - startIdx) % 10 === 0) {
      onProgress({ done: i - startIdx + 1, total, currentDate: facts.date });
      await new Promise(r => setTimeout(r, 0));
    }
  }
  if (onProgress) onProgress({ done: total, total, currentDate: days[days.length - 1].date });

  // ─── Summary ──────────────────────────────────────────────
  const data = rows.slice(1).map(r => r.split(','));
  const colIdx = (name: string) => headers.indexOf(name);

  const avgCol = (name: string, filterFn?: (r: string[]) => boolean) => {
    const idx = colIdx(name);
    let s = 0, c = 0;
    for (const r of data) {
      if (filterFn && !filterFn(r)) continue;
      const v = parseFloat(r[idx]);
      if (Number.isFinite(v)) { s += v; c++; }
    }
    return c > 0 ? (s / c).toFixed(3) : 'N/A';
  };

  rows.push('');
  rows.push('=== SUMMARY: GLOBAL vs CTX ===');
  rows.push(`Metric,Global,Context,Delta,Baseline`);
  const cmp = (name: string, gCol: string, cCol: string, base: string, filter?: (r: string[]) => boolean) => {
    const g = avgCol(gCol, filter);
    const c = avgCol(cCol, filter);
    const delta = (g !== 'N/A' && c !== 'N/A')
      ? ((parseFloat(c) - parseFloat(g)) * 100).toFixed(1) + 'pp'
      : '—';
    rows.push(`${name},${g},${c},${delta},${base}`);
  };
  cmp('Direction hit',     'dir_hit_global',     'dir_hit_ctx',     '0.500');
  cmp('HOD hit',           'hod_hit_global',     'hod_hit_ctx',     '0.333');
  cmp('LOD hit',           'lod_hit_global',     'lod_hit_ctx',     '0.333');
  cmp('Asia breakout aln', 'break_aligned_global','break_aligned_ctx','0.500');
  cmp('Continuation aln',  'cont_aligned_global','cont_aligned_ctx','0.600');
  cmp('NYM aligned',       'nym_aligned_global', 'nym_aligned_ctx', '0.500',
      r => r[colIdx('nym_triggered')] === '1');

  rows.push('');
  rows.push('=== CONTEXT BREAKDOWN ===');
  rows.push(`Filters applied,Days,Direction hit (ctx),HOD hit (ctx)`);
  for (let f = 0; f <= 4; f++) {
    const sub = data.filter(r => parseInt(r[colIdx('ctx_filters_applied')]) === f);
    if (sub.length === 0) continue;
    const dir = sub.reduce((s, r) => s + parseFloat(r[colIdx('dir_hit_ctx')]), 0) / sub.length;
    const hod = sub.reduce((s, r) => s + parseFloat(r[colIdx('hod_hit_ctx')]), 0) / sub.length;
    rows.push(`${f},${sub.length},${dir.toFixed(3)},${hod.toFixed(3)}`);
  }

  rows.push('');
  rows.push('=== DXY BREAKDOWN ===');
  rows.push(`DXY direction,Days,Direction hit (ctx),Break aligned (ctx)`);
  for (const d of ['bullish','bearish','neutral','unknown']) {
    const sub = data.filter(r => r[colIdx('dxy_direction')] === d);
    if (sub.length === 0) continue;
    const dir = sub.reduce((s, r) => s + parseFloat(r[colIdx('dir_hit_ctx')]), 0) / sub.length;
    const brk = sub.reduce((s, r) => s + parseFloat(r[colIdx('break_aligned_ctx')]), 0) / sub.length;
    rows.push(`${d},${sub.length},${dir.toFixed(3)},${brk.toFixed(3)}`);
  }

  return rows.join('\n');
}