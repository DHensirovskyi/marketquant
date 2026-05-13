'use client';

import { useEffect, useState } from 'react';

export function MarketClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Render nothing on the server / first paint to avoid hydration mismatch.
  if (!now) {
    return <div className="hidden md:flex w-[280px] h-9" aria-hidden="true" />;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const hh = pad(now.getUTCHours());
  const mm = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());
  const dow = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][now.getUTCDay()];

  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const day = now.getUTCDay();
  const weekday = day >= 1 && day <= 5;
  const sessions = [
    { key: 'asia', label: 'Азія', start: 0, end: 9 },
    { key: 'london', label: 'Лондон', start: 7, end: 16 },
    { key: 'ny', label: 'Нью-Йорк', start: 13, end: 22 },
  ];
  const active = weekday ? sessions.filter((s) => h >= s.start && h < s.end) : [];
  const isOpen = active.length > 0;

  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/70 bg-white/60 dark:bg-slate-900/40">
      <div className="flex items-center gap-1.5">
        <span className="relative flex w-2 h-2">
          <span
            className={`absolute inset-0 rounded-full ${
              isOpen ? 'bg-emerald-500 live-dot' : 'bg-rose-500'
            }`}
          />
          {isOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-40 animate-ping" />
          )}
        </span>
        <span
          className={`text-xs font-semibold ${
            isOpen
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isOpen ? 'Ринок відкрито' : 'Ринок закрито'}
        </span>
      </div>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          UTC
        </span>
        <span className="text-sm font-semibold tabular text-slate-900 dark:text-slate-100 leading-none">
          {hh}:{mm}
          <span className="text-slate-400 dark:text-slate-500">:{ss}</span>
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{dow}</span>
      </div>

      {isOpen && (
        <>
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1">
            {active.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                {s.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
