'use client';

import { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { Card } from '../Card';
import { Select, NumberInput, ProgressBar, Badge } from '../primitives';

export function ASRCard(props) {
  const [session, setSession] = useState('london');
  const [period, setPeriod] = useState(20);
  const baseValues = { asian: 42, london: 65, ny: 58 };
  const adr = 95;
  const pips = baseValues[session];
  const pct = Math.round((pips / adr) * 100);
  return (
    <Card {...props} title="Середній діапазон сесії (ASR)" Icon={Activity} accent="emerald">
      <div className="flex items-baseline gap-2 mb-4">
        <div className="text-4xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {pips}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">pips</div>
        <Badge tone="emerald">
          <TrendingUp className="w-3 h-3" />
          +4.2%
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
            Сесія
          </label>
          <Select
            value={session}
            onChange={setSession}
            options={[
              { value: 'asian', label: 'Азійська' },
              { value: 'london', label: 'Лондонська' },
              { value: 'ny', label: 'Нью-Йоркська' },
            ]}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
            Період (днів)
          </label>
          <NumberInput
            value={period}
            onChange={(v) => setPeriod(Math.max(1, +v || 1))}
            suffix="дн."
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">% від денного ADR</span>
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>
    </Card>
  );
}
