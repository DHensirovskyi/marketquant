'use client';
import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { runBacktest } from '@/utils/backtest';

export function ExportCsvModal({ open, onClose, pair, bars }) {
  const [days, setDays] = useState(60);
  const [nyMidnightDistance, setNyMidnightDistance] = useState(35);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentDate: '' });
  if (!open) return null;

  const onRun = async () => {
    if (!bars || bars.length === 0) {
      alert('Дані ще завантажуються. Зачекай і спробуй ще.');
      return;
    }
    setBusy(true);
    setProgress({ done: 0, total: days, currentDate: '' });

    const csv = await runBacktest(
      bars,
      { daysToBacktest: days, minHistory: 60, nyMidnightDistance },
      (p) => setProgress(p),
    );

    if (!csv) {
      alert('Недостатньо історії для бектесту. Спробуй менше днів.');
      setBusy(false);
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${pair}_${days}d_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={busy ? undefined : onClose}
           className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-md" />
      <div role="dialog" aria-modal="true"
           className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6">
        <button onClick={onClose} disabled={busy}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Експорт CSV бектесту
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Walk-forward прогон: на кожен з обраних останніх торгових днів прогноз
          обчислюється тільки на історії, що передує цьому дню, а потім порівнюється з фактом.
          Вихідні та свята не торгуються — отже їх немає в історії, тому пропускаються автоматично.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Кількість торгових днів
            </span>
            <input type="number" min={5} max={500} value={days} disabled={busy}
              onChange={(e) => setDays(Math.max(5, +e.target.value || 5))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm tabular text-slate-900 dark:text-white" />
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              NY Midnight distance, pips
            </span>
            <input type="number" min={5} max={200} value={nyMidnightDistance} disabled={busy}
              onChange={(e) => setNyMidnightDistance(Math.max(5, +e.target.value || 5))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm tabular text-slate-900 dark:text-white" />
          </label>
        </div>

        {busy && (
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Обробка: {progress.done} / {progress.total} {progress.currentDate && `· ${progress.currentDate}`}
            <div className="mt-1 h-1.5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all"
                   style={{ width: progress.total > 0 ? (progress.done / progress.total) * 100 + '%' : '0%' }} />
            </div>
          </div>
        )}

        <button onClick={onRun} disabled={busy}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition">
          <Download className="w-4 h-4" />
          {busy ? 'Обчислення…' : 'Запустити та завантажити CSV'}
        </button>
      </div>
    </div>
  );
}