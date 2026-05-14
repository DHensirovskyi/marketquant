// components/DataSourceStrip.jsx
'use client';
import { Database, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export function DataSourceStrip({ status }) {
  if (!status || status.loading) {
    return (
      <div className="max-w-[1480px] mx-auto px-6 py-2 text-xs text-slate-500 dark:text-slate-400">
        Завантаження…
      </div>
    );
  }
  const { source, apiError, archiveCount, apiCount, mergedCount, firstBar, lastBar, fetchedAt } = status;

  const map = {
    merged:       { icon: Wifi,         tone: 'emerald', label: 'TwelveData API + архів'   },
    api_only:     { icon: Wifi,         tone: 'emerald', label: 'TwelveData API'           },
    archive_only: { icon: Database,     tone: 'amber',   label: 'Лише оффлайн архів'       },
    none:         { icon: AlertTriangle,tone: 'rose',    label: 'Дані відсутні'            },
  };
  const cfg = map[source] || map.none;
  const Icon = cfg.icon;
  const toneCls = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    amber:   'text-amber-600   dark:text-amber-400   bg-amber-50   dark:bg-amber-950/40',
    rose:    'text-rose-600    dark:text-rose-400    bg-rose-50    dark:bg-rose-950/40',
  }[cfg.tone];

  return (
    <div className="max-w-[1480px] mx-auto px-6 mb-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${toneCls}`}>
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
        </span>
        <span className="tabular">API: <b>{apiCount.toLocaleString()}</b></span>
        <span className="tabular">Архів: <b>{archiveCount.toLocaleString()}</b></span>
        <span className="tabular">Усього: <b>{mergedCount.toLocaleString()}</b> барів</span>
        {firstBar && lastBar && (
          <span className="tabular">{firstBar} → {lastBar}</span>
        )}
        {apiError && apiError !== 'NO_API_KEY' && (
          <span className="text-rose-600 dark:text-rose-400">API error: {apiError}</span>
        )}
        {apiError === 'NO_API_KEY' && (
          <span className="text-slate-400">Без API ключа</span>
        )}
        {fetchedAt && <span className="text-slate-400">· оновлено {new Date(fetchedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}