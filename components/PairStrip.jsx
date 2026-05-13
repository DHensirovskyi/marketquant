'use client';

import { Badge } from './primitives';

const STATS = {
  EURUSD: { price: '1.08643', change: '+0.34%', changePos: true,  day: '0.0058', adr: '95 pips' },
  GBPUSD: { price: '1.27412', change: '−0.12%', changePos: false, day: '0.0042', adr: '102 pips' },
  DXY:    { price: '104.218', change: '−0.18%', changePos: false, day: '0.412',  adr: '0.58 pt' },
  USDJPY: { price: '152.847', change: '+0.21%', changePos: true,  day: '0.512',  adr: '88 pips' },
  AUDUSD: { price: '0.66218', change: '+0.08%', changePos: true,  day: '0.0021', adr: '71 pips' },
  USDCAD: { price: '1.36502', change: '−0.18%', changePos: false, day: '0.0029', adr: '69 pips' },
  XAUUSD: { price: '2342.18', change: '+0.62%', changePos: true,  day: '24.40',  adr: '$31.20' },
};

const RANGES = {
  '7d': '7 днів',
  '30d': '30 днів',
  '90d': '90 днів',
  ytd: 'YTD',
  custom: 'Власний',
};

export function PairStrip({ pair, range }) {
  const stats = STATS[pair] || { price: '—', change: '—', changePos: true, day: '—', adr: '—' };
  const labelRange = RANGES[range];
  const displayPair =
    pair === 'DXY' ? 'DXY' : `${pair.slice(0, 3)}/${pair.slice(3)}`;

  return (
    <div className="max-w-[1480px] mx-auto px-6 pt-6 pb-2">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Аналітика {displayPair}
            </h1>
            <Badge tone="emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Static
            </Badge>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Сесійні метрики · період: 6 років
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-x-6 gap-y-2 ml-auto">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Поточна ціна
            </div>
            <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
              {stats.price}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Зміна (день)
            </div>
            <div
              className={`text-xl font-semibold tabular ${
                stats.changePos
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.change}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Денний діапазон
            </div>
            <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
              {stats.day}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              ADR
            </div>
            <div className="text-xl font-semibold tabular text-slate-900 dark:text-white">
              {stats.adr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
