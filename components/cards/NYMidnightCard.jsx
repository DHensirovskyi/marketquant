'use client';

import { useState } from 'react';
import { MoonStar } from 'lucide-react';
import { Card } from '../Card';
import { NumberInput, ProgressBar } from '../primitives';

export function NYMidnightCard(props) {
  const [distance, setDistance] = useState(35);
  const probability = 65;
  return (
    <Card {...props} title="Перекриття NY Midnight" Icon={MoonStar} accent="indigo">
      <div className="flex items-baseline gap-3 mb-4">
        <div className="text-5xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {probability}
          <span className="text-2xl text-slate-400 dark:text-slate-500">%</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
          ймовірність
          <br />
          перекриття
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
          Відстань до Midnight
        </label>
        <NumberInput
          value={distance}
          onChange={(v) => setDistance(Math.max(0, +v || 0))}
          suffix="pips"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Шкала ймовірності</span>
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular">
            {probability}%
          </span>
        </div>
        <ProgressBar value={probability} />
      </div>
    </Card>
  );
}
