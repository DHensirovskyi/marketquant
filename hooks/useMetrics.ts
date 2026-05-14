'use client';
import { useMemo } from 'react';
import {
  Bar, CorrelationPair, SessionId,
  groupByDay, applyContextFilter,
  calcASR, calcAsiaBreakout, calcSessionExtremes,
  calcCorrelations, calcInsideBar, calcWeekdayExtremes, calcNYMidnight,
} from '@/utils/quantMath';
import { extractAsiaContext } from '@/utils/asiaContext';

export interface MetricsConfig {
  asrSession: SessionId;
  asrPeriod: number;
  correlationPair: CorrelationPair;
  nyMidnightDistance: number;
  historyDays?: number;
  /** Включить контекстную фильтрацию по Азии. Применяется только после 08:00 UTC. */
  useAsiaContext?: boolean;
  dxyBars?: Bar[];
}

export function useMetrics(bars: Bar[] | null | undefined, config: MetricsConfig) {
  const allDays = useMemo(() => (bars && bars.length ? groupByDay(bars) : []), [bars]);

  // Делим историю и сегодняшний live-day
  const { history, liveBars, todayKey } = useMemo(() => {
    if (allDays.length === 0) return { history: [], liveBars: [] as Bar[], todayKey: '' };
    const last = allDays[allDays.length - 1];
    return {
      history: allDays.slice(0, -1),
      liveBars: last.bars,
      todayKey: last.date,
    };
  }, [allDays]);

  // Контекст Азии
  const asiaContext = useMemo(
  () => extractAsiaContext(liveBars, history, new Date(), config.dxyBars),
  [liveBars, history, config.dxyBars]
);

  // Фильтрация
  const filtered = useMemo(() => {
    if (!config.useAsiaContext || !asiaContext.available) {
      return { days: history, steps: [], sampleSize: history.length, globalSize: history.length };
    }
    return applyContextFilter(history, asiaContext);
  }, [history, asiaContext, config.useAsiaContext]);

  const baseDays = filtered.days;

  // ASR на полной истории (он про волатильность, контекст не нужен)
  const asr = useMemo(
    () => calcASR(history, config.asrSession, config.asrPeriod),
    [history, config.asrSession, config.asrPeriod]
  );

  const asiaBreakout    = useMemo(() => calcAsiaBreakout(baseDays),    [baseDays]);
  const sessionExtremes = useMemo(() => calcSessionExtremes(baseDays), [baseDays]);
  const correlations    = useMemo(() => calcCorrelations(baseDays),    [baseDays]);
  const insideBar       = useMemo(() => calcInsideBar(baseDays),       [baseDays]);
  const weekdayExtremes = useMemo(() => calcWeekdayExtremes(baseDays), [baseDays]);
  const nyMidnight      = useMemo(
    () => calcNYMidnight(baseDays, config.nyMidnightDistance),
    [baseDays, config.nyMidnightDistance]
  );

  return {
    ready: allDays.length > 0,
    sampleDays: allDays.length,
    asiaContext, filtered,
    asr, asiaBreakout, sessionExtremes, correlations,
    insideBar, weekdayExtremes, nyMidnight,
  };
}