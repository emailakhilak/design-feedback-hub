import { DashboardStats, FeedbackItem, Project, FeedbackPriority, FeedbackStatus } from '@/types';

export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateDashboardStats(
  projects: Project[],
  feedbackList: FeedbackItem[]
): DashboardStats {
  const totalProjects = projects.length;
  const totalFeedback = feedbackList.length;

  let pendingImprovements = 0; // 'To Do'
  let inProgressImprovements = 0; // 'In Progress'
  let completedImprovements = 0; // 'Completed'

  for (const item of feedbackList) {
    if (item.status === 'Completed') {
      completedImprovements++;
    } else if (item.status === 'In Progress') {
      inProgressImprovements++;
    } else {
      pendingImprovements++;
    }
  }

  const completionPercentage =
    totalFeedback > 0 ? Math.round((completedImprovements / totalFeedback) * 100) : 0;

  return {
    totalProjects,
    totalFeedback,
    pendingImprovements,
    inProgressImprovements,
    completedImprovements,
    completionPercentage,
  };
}

export function getPriorityStyles(priority: FeedbackPriority): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (priority) {
    case 'Critical':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/60',
        dot: 'bg-rose-600',
      };
    case 'High':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/60',
        dot: 'bg-amber-600',
      };
    case 'Medium':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-600',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-stone-100 dark:bg-stone-800',
        text: 'text-stone-700 dark:text-stone-400',
        border: 'border-stone-200 dark:border-stone-700',
        dot: 'bg-stone-500',
      };
  }
}

export function getStatusStyles(status: FeedbackStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'Completed':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-600',
      };
    case 'In Progress':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-600',
      };
    case 'To Do':
    default:
      return {
        bg: 'bg-stone-100 dark:bg-stone-800',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-200 dark:border-stone-700',
        dot: 'bg-stone-400',
      };
  }
}
