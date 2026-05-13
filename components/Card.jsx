'use client';

import { GripVertical } from 'lucide-react';

const accentMap = {
  slate:   { bg: 'bg-slate-50 dark:bg-slate-500/10',     fg: 'text-slate-600 dark:text-slate-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', fg: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',     fg: 'text-amber-600 dark:text-amber-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-500/10',       fg: 'text-rose-600 dark:text-rose-400' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-500/10',   fg: 'text-indigo-600 dark:text-indigo-400' },
};

export function Card({
  id,
  title,
  Icon,
  accent = 'slate',
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
  dropTarget,
  children,
  footer,
}) {
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div
      data-card-id={id}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(id);
      }}
      onDrop={() => onDrop(id)}
      className={`group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow ${
        dragging ? 'dragging' : ''
      } ${dropTarget ? 'drop-target' : ''}`}
    >
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-lg ${a.bg} ${a.fg} shrink-0`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            {title}
          </h3>
        </div>
        <button
          draggable
          onDragStart={() => onDragStart(id)}
          className="grip-handle p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition opacity-60 group-hover:opacity-100"
          aria-label="Перетягнути картку"
          title="Перетягнути"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 pb-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
