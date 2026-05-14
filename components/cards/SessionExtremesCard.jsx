'use client';

import { TrendingUpDown } from 'lucide-react';
import { Card } from '../Card';

export function SessionExtremesCard({ rows = [], loading, ...drag }) {
  // Шкалу беремо динамічну, але з підлогою 30, щоб не "розтягувало" 5% бари на всю ширину
  const peak = Math.max(30, ...rows.flatMap(r => [r.hodPct, r.lodPct]));

  return (
    <Card {...drag} title="Екстремуми по сесіях" Icon={TrendingUpDown} accent="indigo">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" /> HOD
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 dark:bg-rose-400" /> LOD
          </span>
        </div>
        <span className="text-slate-400 dark:text-slate-500">ймовірність, %</span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.session}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.name}</div>
              <div className="text-xs tabular text-slate-500 dark:text-slate-400">
                {loading ? '—' : `${row.hodPct}% / ${row.lodPct}%`}
              </div>
            </div>
            <div className="flex gap-1.5 h-2.5">
              <div className="flex-1 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-sm transition-all duration-700"
                     style={{ width: (loading ? 0 : (row.hodPct / peak) * 100) + '%' }} />
              </div>
              <div className="flex-1 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-rose-500 dark:bg-rose-400 rounded-sm transition-all duration-700"
                     style={{ width: (loading ? 0 : (row.lodPct / peak) * 100) + '%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}