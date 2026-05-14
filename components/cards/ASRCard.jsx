'use client';

import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../Card';
import { Select, NumberInput, ProgressBar, Badge } from '../primitives';

export function ASRCard({
  session, period, onSessionChange, onPeriodChange,
  pips, pctOfADR, trendPct, loading,
  ...drag
}) {
  const isUp = trendPct >= 0;
  return (
    <Card {...drag} title="Середній діапазон сесії (ASR)" Icon={Activity} accent="emerald">
      <div className="flex items-baseline gap-2 mb-4">
        <div className="text-4xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {loading ? '—' : pips}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">pips</div>
        {!loading && Number.isFinite(trendPct) && (
          <Badge tone={isUp ? 'emerald' : 'rose'}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {(isUp ? '+' : '')}{trendPct}%
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
            Сесія
          </label>
          <Select
            value={session}
            onChange={onSessionChange}
            options={[
              { value: 'asian',  label: 'Азійська' },
              { value: 'london', label: 'Лондонська' },
              { value: 'ny',     label: 'Нью-Йоркська' },
            ]}
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
            Період (днів)
          </label>
          <NumberInput
            value={period}
            onChange={(v) => onPeriodChange(Math.max(1, +v || 1))}
            suffix="дн."
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">% від денного ADR</span>
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular">
            {loading ? '—' : `${pctOfADR}%`}
          </span>
        </div>
        <ProgressBar value={loading ? 0 : pctOfADR} />
      </div>
    </Card>
  );
}