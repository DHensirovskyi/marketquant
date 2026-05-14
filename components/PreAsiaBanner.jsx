'use client';
import { Clock } from 'lucide-react';

export function PreAsiaBanner() {
  return (
    <div className="max-w-[1480px] mx-auto px-6 mt-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <Clock className="w-10 h-10 mx-auto text-indigo-500 dark:text-indigo-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Азійська сесія в процесі
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Контекстні метрики оновляться після закриття Азії о 08:00 UTC.
        </p>
      </div>
    </div>
  );
}