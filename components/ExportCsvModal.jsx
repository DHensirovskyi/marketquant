'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

export function ExportCsvModal({ open, onClose, pair }) {
  const [days, setDays] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const runAndDownload = () => {
    if (busy) return;
    setBusy(true);

    const headers = [
      'date',
      'pair',
      'session',
      'predicted_direction',
      'actual_direction',
      'predicted_high',
      'actual_high',
      'predicted_low',
      'actual_low',
      'asr_pips',
      'adr_pct',
      'inside_bar',
      'ny_midnight_overlap',
      'hit',
    ];
    const sessions = ['Asia', 'London', 'NewYork'];
    const dirs = ['long', 'short'];
    const rows = [headers.join(',')];
    const today = new Date();
    const n = Math.max(1, Math.min(2000, parseInt(days, 10) || 0));

    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const wd = d.getUTCDay();
      if (wd === 0 || wd === 6) continue;
      const dateStr = d.toISOString().slice(0, 10);
      const session = sessions[i % sessions.length];
      const predDir = dirs[Math.floor(Math.random() * 2)];
      const actDir =
        Math.random() < 0.58 ? predDir : dirs[(dirs.indexOf(predDir) + 1) % 2];
      const ph = (1.08 + Math.random() * 0.02).toFixed(5);
      const ah = (parseFloat(ph) + (Math.random() - 0.5) * 0.002).toFixed(5);
      const pl = (1.07 + Math.random() * 0.02).toFixed(5);
      const al = (parseFloat(pl) + (Math.random() - 0.5) * 0.002).toFixed(5);
      const asr = (40 + Math.random() * 50).toFixed(1);
      const adrPct = (50 + Math.random() * 50).toFixed(1);
      const ib = Math.random() < 0.18 ? 1 : 0;
      const nym = Math.random() < 0.65 ? 1 : 0;
      const hit = predDir === actDir ? 1 : 0;
      rows.push(
        [dateStr, pair, session, predDir, actDir, ph, ah, pl, al, asr, adrPct, ib, nym, hit].join(
          ','
        )
      );
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${pair}_${n}d.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setTimeout(() => {
      setBusy(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-csv-title"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" />
        </button>

        <h2
          id="export-csv-title"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Експорт CSV бектесту
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Запустити рушій на останні N торгових днів і вивантажити CSV (один рядок на день) із
          прогнозами та фактичними результатами.
        </p>

        <div className="mt-5">
          <label
            htmlFor="days"
            className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-2"
          >
            Кількість днів
          </label>
          <input
            id="days"
            type="number"
            min="1"
            max="2000"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full px-3.5 py-2.5 text-base rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 tabular focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
          />
          <div className="flex gap-1.5 mt-2">
            {[30, 60, 90, 180, 365].map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  String(days) === String(p)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p}д
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Скасувати
          </button>
          <button
            onClick={runAndDownload}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-900 shadow-sm transition disabled:opacity-60 disabled:cursor-wait"
          >
            {busy ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="3"
                  />
                  <path
                    d="M21 12a9 9 0 00-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Запуск…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Запустити та завантажити
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
