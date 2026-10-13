import React from 'react';
import { cn, getPriorityStyles, getStatusStyles } from '@/lib/utils';
import { FeedbackPriority, FeedbackStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'accent';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-stone-100 text-stone-700 border-stone-200',
    secondary: 'bg-stone-50 text-stone-600 border-stone-200/60',
    outline: 'bg-transparent text-stone-700 border-stone-300',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: FeedbackPriority }) {
  const styles = getPriorityStyles(priority);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border',
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  const styles = getStatusStyles(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border',
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />
      {status}
    </span>
  );
}
