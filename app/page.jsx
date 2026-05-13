'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PairStrip } from '@/components/PairStrip';
import { ExportCsvModal } from '@/components/ExportCsvModal';
import { ASRCard } from '@/components/cards/ASRCard';
import { AsiaBreakoutCard } from '@/components/cards/AsiaBreakoutCard';
import { SessionExtremesCard } from '@/components/cards/SessionExtremesCard';
import { CorrelationCard } from '@/components/cards/CorrelationCard';
import { InsideBarCard } from '@/components/cards/InsideBarCard';
import { WeekdayExtremesCard } from '@/components/cards/WeekdayExtremesCard';
import { NYMidnightCard } from '@/components/cards/NYMidnightCard';

function useTheme() {
  const [theme, setTheme] = useState('light');

  // Read persisted theme once on mount (the inline bootstrap in layout has already
  // applied the class to <html>; this just syncs React state to it).
  useEffect(() => {
    try {
      const t = localStorage.getItem('ta-theme') || 'light';
      setTheme(t);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('ta-theme', theme);
    } catch {}
  }, [theme]);

  return [theme, setTheme];
}

export default function Page() {
  const [theme, setTheme] = useTheme();
  const [pair, setPair] = useState('EURUSD');
  const [range] = useState('30d');
  const [exportOpen, setExportOpen] = useState(false);

  const initialOrder = [
    'asr',
    'asia-breakout',
    'session-extremes',
    'correlation',
    'inside-bar',
    'weekday-extremes',
    'ny-midnight',
  ];
  const [order, setOrder] = useState(initialOrder);
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const onDragStart = useCallback((id) => setDraggingId(id), []);
  const onDragOver = useCallback((id) => setDropTargetId(id), []);
  const onDrop = useCallback(
    (targetId) => {
      if (!draggingId || draggingId === targetId) {
        setDraggingId(null);
        setDropTargetId(null);
        return;
      }
      setOrder((prev) => {
        const next = [...prev];
        const from = next.indexOf(draggingId);
        const to = next.indexOf(targetId);
        next.splice(from, 1);
        next.splice(to, 0, draggingId);
        return next;
      });
      setDraggingId(null);
      setDropTargetId(null);
    },
    [draggingId]
  );

  useEffect(() => {
    const onUp = () => {
      setDraggingId(null);
      setDropTargetId(null);
    };
    window.addEventListener('dragend', onUp);
    return () => window.removeEventListener('dragend', onUp);
  }, []);

  const cardProps = (id) => ({
    id,
    onDragStart,
    onDragOver,
    onDrop,
    dragging: draggingId === id,
    dropTarget: draggingId && draggingId !== id && dropTargetId === id,
  });

  const renderById = {
    asr: <ASRCard {...cardProps('asr')} />,
    'asia-breakout': <AsiaBreakoutCard {...cardProps('asia-breakout')} />,
    'session-extremes': <SessionExtremesCard {...cardProps('session-extremes')} />,
    correlation: <CorrelationCard {...cardProps('correlation')} />,
    'inside-bar': <InsideBarCard {...cardProps('inside-bar')} />,
    'weekday-extremes': <WeekdayExtremesCard {...cardProps('weekday-extremes')} />,
    'ny-midnight': <NYMidnightCard {...cardProps('ny-midnight')} />,
  };

  return (
    <div className="min-h-screen">
      <Header
        theme={theme}
        setTheme={setTheme}
        pair={pair}
        setPair={setPair}
        onExport={() => setExportOpen(true)}
      />
      <ExportCsvModal open={exportOpen} onClose={() => setExportOpen(false)} pair={pair} />
      <PairStrip pair={pair} range={range} />

      <main className="max-w-[1480px] mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {order.map((id) => (
            <div
              key={id}
              className={id === 'weekday-extremes' ? 'lg:col-span-2' : ''}
            >
              {renderById[id]}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
