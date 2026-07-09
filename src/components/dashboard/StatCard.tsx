import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'violet' | 'cyan' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
}) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
    cyan: 'bg-cyan-550/10 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  };

  return (
    <Card hoverEffect>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">
            {title}
          </span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {value}
          </h3>
          {subtext && (
            <p className="text-[10px] text-slate-400 font-medium">
              {subtext}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colors[color]} shrink-0 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};
export default StatCard;
