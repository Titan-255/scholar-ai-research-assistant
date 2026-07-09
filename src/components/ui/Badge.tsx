import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-indigo-550/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    secondary: 'bg-violet-550/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
    accent: 'bg-cyan-550/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    success: 'bg-emerald-550/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-550/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    error: 'bg-red-550/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
