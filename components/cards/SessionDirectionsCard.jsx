'use client';

import { Compass, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../Card';

export function SessionDirectionsCard({ rows = [], sampleSize = 0, loading, ...drag }) {
  return (
    <Card {...drag} title="Напрямок по сесіях" Icon={Compass} accent="indigo">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" /> Long
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 dark:bg-rose-400" /> Short
          </span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 tabular">
          n={loading ? '—' : sampleSize}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const dominant =
            row.longPct > row.shortPct ? 'long'
            : row.shortPct > row.longPct ? 'short' : 'neutral';
          return (
            <div key={row.session}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {row.name}
                </span>
                <span className="flex items-center gap-1 text-xs tabular">
                  {dominant === 'long' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                  {dominant === 'short' && <TrendingDown className="w-3 h-3 text-rose-500" />}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {loading ? '—' : `${row.longPct}%`}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {loading ? '—' : `${row.shortPct}%`}
                  </span>
                </span>
              </div>
              <div className="flex h-2 rounded-sm overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 transition-all duration-700"
                  style={{ width: `${loading ? 0 : row.longPct}%` }}
                />
                <div
                  className="bg-rose-500 dark:bg-rose-400 transition-all duration-700"
                  style={{ width: `${loading ? 0 : row.shortPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}