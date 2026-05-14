'use client';
import { Filter, Globe } from 'lucide-react';

export function ContextBanner({ context, filtered, enabled, onToggle }) {
  if (!context.available) {
    return (
      <div className="max-w-[1480px] mx-auto px-6 mb-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <Globe className="w-3.5 h-3.5" />
          <span>Глобальна статистика · контекст Азії оновиться о 08:00 UTC</span>
        </div>
      </div>
    );
  }

  const appliedSteps = filtered.steps.filter(s => s.applied);
  const droppedSteps = filtered.steps.filter(s => !s.applied);
  const ratio = (filtered.sampleSize / filtered.globalSize) * 100;

  return (
    <div className="max-w-[1480px] mx-auto px-6 mb-3">
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)}
                   className="w-3.5 h-3.5" />
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-slate-900 dark:text-white">Контекстна фільтрація</span>
          </label>

          <span className="text-slate-500 dark:text-slate-400">
            Азія: <b className="text-slate-900 dark:text-white">{context.width}</b>
            {' · '}
            <b className="text-slate-900 dark:text-white">{context.direction}</b>
            {' · '}
            close <b className="text-slate-900 dark:text-white">{context.closePos}</b>
            {context.sweep !== 'none' && (
              <> · sweep <b className="text-amber-600 dark:text-amber-400">{context.sweep}</b></>
            )}
            {' · '}
            range <b className="text-slate-900 dark:text-white tabular">
              {context.asiaRangePips} pips ({context.ratioToADR}× ADR)
            </b>
          </span>

          {enabled && (
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">
                Вибірка: <b className="text-slate-900 dark:text-white tabular">
                  {filtered.sampleSize}
                </b>
                <span className="text-slate-400"> / {filtered.globalSize}</span>
                <span className="text-slate-400"> ({ratio.toFixed(0)}%)</span>
              </span>
            </span>
          )}
        </div>

        {enabled && (appliedSteps.length > 0 || droppedSteps.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {appliedSteps.map(s => (
              <span key={s.name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]
                               bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                ✓ {s.name} <span className="opacity-60">({s.sampleAfter})</span>
              </span>
            ))}
            {droppedSteps.map(s => (
              <span key={s.name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]
                               bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 line-through">
                {s.name} <span className="opacity-60 not-italic no-underline">({s.reason})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}