'use client';

import { BarChart3 } from 'lucide-react';
import { Card } from '../Card';

export function WeekdayExtremesCard(props) {
  const days = [
    { d: 'Пн', high: 28, low: 14 },
    { d: 'Вт', high: 19, low: 22 },
    { d: 'Ср', high: 16, low: 18 },
    { d: 'Чт', high: 22, low: 20 },
    { d: 'Пт', high: 15, low: 26 },
  ];
  const max = Math.max(...days.flatMap((d) => [d.high, d.low]));
  return (
    <Card {...props} title="Екстремуми за днями тижня" Icon={BarChart3} accent="emerald">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
            Макс. тижня
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 dark:bg-rose-400" />
            Мін. тижня
          </span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-32">
        {days.map((day, i) => (
          <div key={day.d} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end gap-1">
              <div className="flex-1 flex items-end">
                <div
                  className="w-full bg-emerald-500 dark:bg-emerald-400 rounded-t-sm bar-anim"
                  style={{
                    height: (day.high / max) * 100 + '%',
                    animationDelay: i * 80 + 'ms',
                  }}
                  title={day.high + '%'}
                />
              </div>
              <div className="flex-1 flex items-end">
                <div
                  className="w-full bg-rose-500 dark:bg-rose-400 rounded-t-sm bar-anim"
                  style={{
                    height: (day.low / max) * 100 + '%',
                    animationDelay: i * 80 + 40 + 'ms',
                  }}
                  title={day.low + '%'}
                />
              </div>
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {day.d}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
