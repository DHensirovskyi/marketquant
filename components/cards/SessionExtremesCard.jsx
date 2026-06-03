'use client';

import { TrendingUpDown } from 'lucide-react';
import { Card } from '../Card';

function DonutGauge({ value, color, label, percentColor }) {
  const size = 92;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-semibold tabular ${percentColor}`}>
            {value}%
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium ${percentColor}`}>{label}</span>
    </div>
  );
}

export function SessionExtremesCard({ rows = [], loading, ...drag }) {
  return (
    <Card {...drag} title="Потенціал HOD/LOD" Icon={TrendingUpDown} accent="indigo">
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.session}>
            <div className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              {row.name}
            </div>
            <div className="flex items-center justify-around">
              <DonutGauge
                value={loading ? 0 : row.hodPct}
                color="#10b981"
                label="Хай дня"
                percentColor="text-emerald-600 dark:text-emerald-400"
              />
              <DonutGauge
                value={loading ? 0 : row.lodPct}
                color="#f43f5e"
                label="Лоу дня"
                percentColor="text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}