'use client';

export function PairStrip({ pair, range, stats }) {
  const fmt = {
    price: stats ? stats.lastPrice.toFixed(5) : '—',
    change: stats
      ? `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%`
      : '—',
    day: stats ? `${stats.dayRangePips} pips` : '—',
    adr: stats ? `${stats.adrPips} pips` : '—',
  };
  const isUp = stats ? stats.changePct >= 0 : true;

  return (
    <div className="max-w-[1480px] mx-auto px-6 py-3">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {pair} · {range}
          </div>
          <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
            Поточна ціна {fmt.price}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Зміна (день)
          </div>
          <div className={`text-xl font-semibold tabular ${
            isUp ? 'text-emerald-600 dark:text-emerald-400'
                 : 'text-rose-600 dark:text-rose-400'
          }`}>
            {fmt.change}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Денний діапазон
          </div>
          <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
            {fmt.day}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            ADR (20 дн.)
          </div>
          <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
            {fmt.adr}
          </div>
        </div>
      </div>
    </div>
  );
}