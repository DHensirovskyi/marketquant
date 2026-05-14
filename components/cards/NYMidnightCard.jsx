'use client';

import { MoonStar } from 'lucide-react';
import { Card } from '../Card';
import { NumberInput, ProgressBar } from '../primitives';

export function NYMidnightCard({
  distance, onDistanceChange, probability = 0, sampleSize = 0, loading, ...drag
}) {
  return (
    <Card {...drag} title="Перекриття NY Midnight" Icon={MoonStar} accent="indigo">
      <div className="flex items-baseline gap-3 mb-4">
        <div className="text-5xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {loading ? '—' : probability}
          <span className="text-2xl text-slate-400 dark:text-slate-500">%</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
          ймовірність<br />перекриття
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
          Відстань до Midnight
        </label>
        <NumberInput
          value={distance}
          onChange={(v) => onDistanceChange(Math.max(0, +v || 0))}
          suffix="pips"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Шкала ймовірності {!loading && sampleSize > 0 ? `· n=${sampleSize}` : ''}
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular">
            {loading ? '—' : `${probability}%`}
          </span>
        </div>
        <ProgressBar value={loading ? 0 : probability} />
      </div>
    </Card>
  );
}