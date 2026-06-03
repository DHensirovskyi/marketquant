'use client';

import { Compass, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '../Card';

function DirectionBlock({ pct, label, tone, Icon, loading }) {
  const styles = tone === 'short'
    ? {
        bg: 'bg-rose-100 dark:bg-rose-950/40',
        text: 'text-rose-600 dark:text-rose-400',
        labelColor: 'text-rose-700 dark:text-rose-400',
      }
    : {
        bg: 'bg-emerald-100 dark:bg-emerald-950/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        labelColor: 'text-emerald-700 dark:text-emerald-400',
      };

  return (
    <div className={`flex-1 rounded-2xl ${styles.bg} flex flex-col items-center justify-center py-5 px-4 gap-2`}>
      <span className={`text-sm font-medium ${styles.labelColor}`}>{label}</span>
      <Icon className={`w-6 h-6 ${styles.text}`} strokeWidth={2.5} />
      <span className={`text-2xl font-semibold tabular ${styles.text}`}>
        {loading ? '—' : `${pct}%`}
      </span>
    </div>
  );
}

export function SessionDirectionsCard({ rows = [], sampleSize = 0, loading, ...drag }) {
  return (
    <Card {...drag} title="Напрямок" Icon={Compass} accent="indigo">
      <div className="flex items-center justify-end mb-3 text-xs text-slate-400 dark:text-slate-500 tabular">
        n={loading ? '—' : sampleSize}
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.session}>
            <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {row.name}
            </div>
            <div className="flex gap-2.5">
              <DirectionBlock
                pct={row.shortPct}
                label="Шорт"
                tone="short"
                Icon={ArrowDownRight}
                loading={loading}
              />
              <DirectionBlock
                pct={row.longPct}
                label="Лонг"
                tone="long"
                Icon={ArrowUpRight}
                loading={loading}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}