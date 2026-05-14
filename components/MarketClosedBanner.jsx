'use client';
import { useEffect, useState } from 'react';
import { Moon, Eye } from 'lucide-react';
import { getForexStatus, formatCountdown } from '@/utils/marketHours';

const REASONS = {
  weekend:         'Сьогодні вихідний — Forex закрит',
  friday_close:    'Тиждень завершено — Forex відкриється в неділю о 22:00 UTC',
  sunday_pre_open: 'Очікуємо відкриття ринку — неділя, до 22:00 UTC',
};

export function MarketClosedBanner({ status, onForceShow }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fresh = getForexStatus();  // пересчитываем каждую секунду
  void tick;

  return (
    <div className="max-w-[1480px] mx-auto px-6 mt-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 mb-5">
          <Moon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Зачекайте, поки відкриється ринок
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {REASONS[fresh.reason] ?? 'Ринок зараз закритий'}
        </p>
        <div className="mt-6 inline-flex flex-col items-center gap-1 px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            До відкриття
          </span>
          <span className="text-3xl font-semibold tabular text-slate-900 dark:text-white">
            {formatCountdown(fresh.msUntilOpen)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular">
            {fresh.nextOpenUTC.toUTCString()}
          </span>
        </div>
        {onForceShow && (
          <button
            onClick={onForceShow}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Eye className="w-3.5 h-3.5" />
            Все одно показати історичні дані
          </button>
        )}
      </div>
    </div>
  );
}