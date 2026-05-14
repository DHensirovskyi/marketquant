'use client';

import { Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../Card';
import { ProgressBar, Badge } from '../primitives';

export function AsiaBreakoutCard({
  probability, upProbability, downProbability, continuation, loading, ...drag
}) {
  return (
    <Card {...drag} title="Пробій Азійської сесії" Icon={Zap} accent="amber">
      <div className="flex items-end gap-3 mb-4">
        <div className="text-5xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {loading ? '—' : probability}
          <span className="text-2xl text-slate-400 dark:text-slate-500">%</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 pb-2 leading-tight">
          ймовірність<br />пробою
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge tone="amber">
          <ArrowUpRight className="w-3 h-3" />
          Up-side {loading ? '—' : upProbability}%
        </Badge>
        <Badge tone="rose">
          <ArrowDownRight className="w-3 h-3" />
          Down-side {loading ? '—' : downProbability}%
        </Badge>
      </div>

      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Продовження руху в напрямку пробою
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white tabular">
            {loading ? '—' : `${continuation}%`}
          </div>
        </div>
        <ProgressBar value={loading ? 0 : continuation} accent="emerald" />
      </div>
    </Card>
  );
}