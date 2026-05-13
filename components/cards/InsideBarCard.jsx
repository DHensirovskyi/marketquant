'use client';

import { LayoutDashboard } from 'lucide-react';
import { Card } from '../Card';

export function InsideBarCard(props) {
  const probability = 15;
  const days = [
    { d: 'Пн', v: 18 },
    { d: 'Вт', v: 12 },
    { d: 'Ср', v: 22 },
    { d: 'Чт', v: 9 },
    { d: 'Пт', v: 14 },
  ];
  const max = Math.max(...days.map((d) => d.v));
  return (
    <Card {...props} title="Паттерн Inside Bar" Icon={LayoutDashboard} accent="indigo">
      <div className="flex items-baseline gap-3 mb-4">
        <div className="text-5xl font-semibold tabular text-slate-900 dark:text-white tracking-tight">
          {probability}
          <span className="text-2xl text-slate-400 dark:text-slate-500">%</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
          ймовірність
          <br />
          формування
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
        Розподіл по днях тижня
      </div>
      <div className="flex items-stretch gap-2 h-20">
        {days.map((day, i) => (
          <div key={day.d} className="flex-1 flex flex-col items-center gap-1.5 h-full">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t-sm bar-anim"
                style={{
                  height: (day.v / max) * 100 + '%',
                  animationDelay: i * 80 + 'ms',
                }}
                title={day.v + '%'}
              />
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {day.d}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
