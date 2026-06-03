'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { PairStrip } from '@/components/PairStrip';
import { ExportCsvModal } from '@/components/ExportCsvModal';
import { DataSourceStrip } from '@/components/DataSourceStrip';
import { MarketClosedBanner } from '@/components/MarketClosedBanner';
import { ASRCard } from '@/components/cards/ASRCard';
import { AsiaBreakoutCard } from '@/components/cards/AsiaBreakoutCard';
import { SessionExtremesCard } from '@/components/cards/SessionExtremesCard';
import { CorrelationCard } from '@/components/cards/CorrelationCard';
import { WeekdayExtremesCard } from '@/components/cards/WeekdayExtremesCard';
import { NYMidnightCard } from '@/components/cards/NYMidnightCard';
import { useMetrics } from '@/hooks/useMetrics';
import { getForexStatus } from '@/utils/marketHours';
import { calcLiveStats } from '@/utils/quantMath';
import { ContextBanner } from '@/components/ContextBanner';
import { SessionDirectionsCard } from '@/components/cards/SessionDirectionsCard';

// ─── Тема ────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState('light');
  useEffect(() => { try { setTheme(localStorage.getItem('ta-theme') || 'light'); } catch {} }, []);
  useEffect(() => {
    const r = document.documentElement;
    if (theme === 'dark') r.classList.add('dark'); else r.classList.remove('dark');
    try { localStorage.setItem('ta-theme', theme); } catch {}
  }, [theme]);
  return [theme, setTheme];
}

// ─── Загрузка баров: архив + TwelveData ──────────────────────────────────
function useBars(pair) {
  const [state, setState] = useState({
    bars: null, dxyBars: null, loading: true, source: 'pending',
    apiError: null, dxyError: null,
    archiveCount: 0, apiCount: 0, dxyCount: 0, mergedCount: 0,
    firstBar: null, lastBar: null, fetchedAt: null,
  });

  useEffect(() => {
    let aborted = false;
    setState(s => ({ ...s, loading: true }));
    const symbol = pair === 'EURUSD' ? 'EUR/USD' : pair.replace(/(\w{3})(\w{3})/, '$1/$2');

    Promise.all([
      fetch('/heavy_market_data.json').then(r => r.json()).catch(() => null),
      import('@/lib/twelveData').then(m => m.fetchTwelveData(symbol, '15min', 500)),
      import('@/lib/dxyData').then(m => m.fetchDXY(500)),  // ← новое
    ]).then(([archiveJson, api, dxy]) => {
      if (aborted) return;
      const archiveBars = Array.isArray(archiveJson) ? archiveJson : (archiveJson?.values ?? []);
      const apiBars = api.bars;
      const map = new Map();
      for (const b of archiveBars) map.set(b.datetime, b);
      for (const b of apiBars)     map.set(b.datetime, b);
      const bars = Array.from(map.values()).sort((a, b) => a.datetime.localeCompare(b.datetime));

      const source =
        apiBars.length && archiveBars.length ? 'merged'
        : apiBars.length ? 'api_only'
        : archiveBars.length ? 'archive_only'
        : 'none';

      setState({
        bars, dxyBars: dxy.bars, loading: false, source,
        apiError: api.error, dxyError: dxy.error,
        archiveCount: archiveBars.length,
        apiCount: apiBars.length,
        dxyCount: dxy.bars.length,
        mergedCount: bars.length,
        firstBar: bars[0]?.datetime ?? null,
        lastBar:  bars[bars.length - 1]?.datetime ?? null,
        fetchedAt: api.fetchedAt,
      });
    });
    return () => { aborted = true; };
  }, [pair]);

  return state;
}

// ─── Главный компонент ───────────────────────────────────────────────────
export default function Page() {
  const [theme, setTheme] = useTheme();
  const [pair, setPair]   = useState('EURUSD');
  const [range]           = useState('30d');
  const [exportOpen, setExportOpen] = useState(false);
  const [useAsiaContext, setUseAsiaContext] = useState(true);
  

  // Конфиг метрик
  const [asrSession, setAsrSession]                 = useState('london');
  const [asrPeriod, setAsrPeriod]                   = useState(20);
  const [correlationPair, setCorrelationPair]       = useState('asia-london');
  const [nyMidnightDistance, setNyMidnightDistance] = useState(35);

  // ── Состояние рынка ──
  const [showAnyway, setShowAnyway]     = useState(false);
  const [marketStatus, setMarketStatus] = useState(() => getForexStatus());
  useEffect(() => {
    const id = setInterval(() => setMarketStatus(getForexStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Данные
 const dataState = useBars(pair);
  const m = useMetrics(dataState.bars, {
  asrSession, asrPeriod, correlationPair, nyMidnightDistance,
  historyDays: 0,
  useAsiaContext,
  dxyBars: dataState.dxyBars, 
});
  const liveStats = useMemo(
  () => calcLiveStats(dataState.bars || []),
  [dataState.bars]
  );
  // ── DnD ──
  const initialOrder = [
    'asr', 'asia-breakout', 'session-extremes',
    'correlation', 'session-directions', 'weekday-extremes', 'ny-midnight',
  ];
  const [order, setOrder] = useState(initialOrder);
  const [draggingId, setDraggingId]     = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const onDragStart = useCallback((id) => setDraggingId(id), []);
  const onDragOver  = useCallback((id) => setDropTargetId(id), []);
  const onDrop = useCallback((targetId) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null); setDropTargetId(null); return;
    }
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggingId);
      const to   = next.indexOf(targetId);
      next.splice(from, 1);
      next.splice(to,   0, draggingId);
      return next;
    });
    setDraggingId(null); setDropTargetId(null);
  }, [draggingId]);
  useEffect(() => {
    const onUp = () => { setDraggingId(null); setDropTargetId(null); };
    window.addEventListener('dragend', onUp);
    return () => window.removeEventListener('dragend', onUp);
  }, []);
  const cardProps = (id) => ({
    id, onDragStart, onDragOver, onDrop,
    dragging: draggingId === id,
    dropTarget: draggingId && draggingId !== id && dropTargetId === id,
  });

  const loading = dataState.loading;

  const renderById = {
    'asr': (
      <ASRCard {...cardProps('asr')}
        session={asrSession} period={asrPeriod}
        onSessionChange={setAsrSession} onPeriodChange={setAsrPeriod}
        pips={m.asr.pips} pctOfADR={m.asr.pctOfADR} trendPct={m.asr.trendPct}
        loading={loading}
      />
    ),
    'asia-breakout': (
      <AsiaBreakoutCard {...cardProps('asia-breakout')}
        probability={m.asiaBreakout.probability}
        upProbability={m.asiaBreakout.upProbability}
        downProbability={m.asiaBreakout.downProbability}
        continuation={m.asiaBreakout.continuation}
        loading={loading}
      />
    ),
    'session-extremes': (
      <SessionExtremesCard {...cardProps('session-extremes')}
        rows={m.sessionExtremes.rows} loading={loading}
      />
    ),
    'session-directions': (
      <SessionDirectionsCard
        {...cardProps('session-directions')}
        rows={m.sessionDirections.rows}
        sampleSize={m.sessionDirections.sampleSize}
        loading={loading}
      />
    ),
    'weekday-extremes': (
      <WeekdayExtremesCard {...cardProps('weekday-extremes')}
        rows={m.weekdayExtremes.rows} loading={loading}
      />
    ),
    'ny-midnight': (
      <NYMidnightCard {...cardProps('ny-midnight')}
        distance={nyMidnightDistance} onDistanceChange={setNyMidnightDistance}
        probability={m.nyMidnight.probability} sampleSize={m.nyMidnight.sampleSize}
        loading={loading}
      />
    ),
  };

  return (
    <div className="min-h-screen">
      <Header theme={theme} setTheme={setTheme} pair={pair} setPair={setPair}
              onExport={() => setExportOpen(true)} />
      <ExportCsvModal open={exportOpen} onClose={() => setExportOpen(false)}
                pair={pair} bars={dataState.bars} dxyBars={dataState.dxyBars} />
      <PairStrip pair={pair} range={range} stats={liveStats} />
      <DataSourceStrip status={dataState} />
      <ContextBanner
        context={m.asiaContext}
        filtered={m.filtered}
        enabled={useAsiaContext}
        onToggle={setUseAsiaContext}
      />
    
      <main className="max-w-[1480px] mx-auto px-6 pb-12">
        {!marketStatus.isOpen && !showAnyway ? (
          <MarketClosedBanner status={marketStatus} onForceShow={() => setShowAnyway(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {order.map((id) => (
              <div key={id} className={id === 'weekday-extremes' ? 'lg:col-span-2' : ''}>
                {renderById[id]}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}