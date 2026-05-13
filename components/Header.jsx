'use client';

import { CandlestickChart, Download, Sun, Moon } from 'lucide-react';
import { Select } from './primitives';
import { MarketClock } from './MarketClock';

export function Header({ theme, setTheme, pair, setPair, onExport }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/80 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-[1480px] mx-auto px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-600 flex items-center justify-center shadow-sm">
            <CandlestickChart className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
              Trading Analytics
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Сесійна аналітика ринків
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-2 text-xs">
          <button className="px-2.5 py-1.5 rounded-md font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800">
            Дашборд
          </button>
        </div>

        <div className="flex-1" />

        <MarketClock />

        {/* Currency pair */}
        <div className="hidden sm:block w-40">
          <Select
            value={pair}
            onChange={setPair}
            options={[
              { value: 'EURUSD', label: 'EUR/USD' },
              { value: 'GBPUSD', label: 'GBP/USD' },
              { value: 'DXY', label: 'DXY' },
            ]}
          />
        </div>

        {/* Export CSV */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10 transition"
          title="Експортувати CSV бектесту"
        >
          <Download className="w-4 h-4" />
          <span className="hidden lg:inline">CSV</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative inline-flex items-center w-14 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Перемкнути тему"
          title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow flex items-center justify-center transition-transform duration-300 ${
              theme === 'dark' ? 'translate-x-6' : ''
            }`}
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </span>
          <span
            className={`absolute left-2 transition-opacity ${
              theme === 'dark' ? 'opacity-30' : 'opacity-0'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-slate-500" />
          </span>
          <span
            className={`absolute right-2 transition-opacity ${
              theme === 'dark' ? 'opacity-0' : 'opacity-30'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-slate-500" />
          </span>
        </button>
      </div>
    </header>
  );
}
