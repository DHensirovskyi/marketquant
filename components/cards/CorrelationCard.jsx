'use client';

import { GitCompareArrows } from 'lucide-react';
import { Card } from '../Card';
import { Select, Badge } from '../primitives';

export function CorrelationCard({ pair, onPairChange, value = 0, loading, ...drag }) {
  const abs = Math.abs(value);
  const strength =
    abs >= 0.7 ? { label: 'Сильна', tone: 'emerald' } :
    abs >= 0.4 ? { label: 'Середня', tone: 'amber'  } :
                 { label: 'Слабка', tone: 'slate'  };
  const dots = 12;
  const filled = Math.round(abs * dots);

  return (
    <Card {...drag} title="Кореляція сесій" Icon={GitCompareArrows} accent="indigo">
      <div className="flex items-baseline gap-3 mb-4">
        <div className="text-5xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {loading ? '—' : value.toFixed(2)}
        </div>
        {!loading && <Badge tone={strength.tone}>{strength.label}</Badge>}
      </div>

      <div className="mb-4">
        <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block">
          Зв&apos;язок
        </label>
        <Select
          value={pair}
          onChange={onPairChange}
          options={[
            { value: 'asia-london', label: 'Азія → Лондон' },
            { value: 'asia-ny',     label: 'Азія → Нью-Йорк' },
            { value: 'london-ny',   label: 'Лондон → Нью-Йорк' },
          ]}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-slate-600 dark:text-slate-400">Індикатор сили</span>
          <span className="tabular text-slate-500 dark:text-slate-400">
            Слабка · Середня · Сильна
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: dots }).map((_, i) => (
            <span key={i}
              className={`flex-1 h-2 rounded-sm transition-colors ${
                i < filled
                  ? i < 4 ? 'bg-slate-400 dark:bg-slate-500'
                  : i < 8 ? 'bg-amber-400 dark:bg-amber-500'
                          : 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}