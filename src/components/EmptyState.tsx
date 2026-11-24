import { useState } from 'react';
import { Calendar, CheckSquare, Plus } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'tasks' | 'calendar';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

const IMAGE_PATHS = {
  tasks: '/src/assets/images/empty_tasks_illustration_1795507068952.jpg',
  calendar: '/src/assets/images/empty_calendar_illustration_1795507069943.jpg',
};

export function EmptyState({
  variant = 'tasks',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-6 py-8' : 'px-6 py-12'
      }`}
    >
      <div
        className={`mb-5 overflow-hidden rounded-xl border border-slate-200/80 bg-sky-50/50 dark:border-slate-800 dark:bg-slate-800/60 ${
          compact ? 'h-32 w-44' : 'h-44 w-60'
        }`}
      >
        {!imgFailed ? (
          <img
            src={IMAGE_PATHS[variant]}
            alt={
              variant === 'calendar'
                ? 'Minimalist desk calendar illustration'
                : 'Minimalist organized notebook illustration'
            }
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover dark:opacity-90"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100/70 text-blue-900 dark:from-slate-800 dark:to-slate-900 dark:text-sky-300">
            {variant === 'calendar' ? (
              <Calendar className="h-10 w-10 stroke-[1.5]" />
            ) : (
              <CheckSquare className="h-10 w-10 stroke-[1.5]" />
            )}
          </div>
        )}
      </div>

      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{actionLabel}</span>
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
