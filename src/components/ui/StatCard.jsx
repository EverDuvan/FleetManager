import React from 'react';
import { Card } from './Card';

export function StatCard({ title, value, icon: Icon, description, trend, trendType = 'neutral' }) {
  const trendColor = {
    positive: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
    negative: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
    neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
  }[trendType];

  return (
    <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {Icon && (
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:scale-110 transition-transform duration-300">
              <Icon size={20} />
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendColor}`}>
              {trend}
            </span>
          )}
        </div>
        
        {description && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
