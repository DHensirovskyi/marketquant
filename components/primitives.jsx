'use client';

import { ChevronDown } from 'lucide-react';

export function Select({ value, onChange, options, className = '' }) {
  return (
    <div className={'relative ' + className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </span>
    </div>
  );
}

export function NumberInput({ value, onChange, suffix, className = '' }) {
  return (
    <div className={'relative ' + className}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-12 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 tabular transition"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, accent = 'emerald' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    accent === 'emerald'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : 'bg-indigo-500 dark:bg-indigo-400';
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div
        className={`h-full ${fill} rounded-full transition-all duration-700 ease-out`}
        style={{ width: pct + '%' }}
      />
    </div>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
