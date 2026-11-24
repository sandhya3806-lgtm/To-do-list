import { AlertTriangle, Check, Clock, Flag, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../types/todo';
import { formatTaskDueDisplay, isTaskOverdue } from '../utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
  now?: Date;
}

const PRIORITY_META: Record<
  Task['priority'],
  { label: string; colorClass: string }
> = {
  high: {
    label: 'High priority',
    colorClass: 'text-rose-700 dark:text-rose-400',
  },
  medium: {
    label: 'Medium priority',
    colorClass: 'text-amber-700 dark:text-amber-400',
  },
  low: {
    label: 'Low priority',
    colorClass: 'text-sky-700 dark:text-sky-400',
  },
};

export function TaskRow({
  task,
  onToggleComplete,
  onEdit,
  onRequestDelete,
  now = new Date(),
}: TaskRowProps) {
  const overdue = isTaskOverdue(task, now);
  const dueDisplay = formatTaskDueDisplay(task.dueDate, task.dueTime, now);
  const priorityMeta = PRIORITY_META[task.priority];

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-sky-50/40 dark:hover:bg-slate-800/50 sm:px-5 ${
        task.completed ? 'opacity-75' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={
          task.completed
            ? `Mark "${task.title}" as pending`
            : `Mark "${task.title}" as completed`
        }
        aria-pressed={task.completed}
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-sky-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:bg-slate-700/60"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150 ${
            task.completed
              ? 'border-blue-950 bg-blue-950 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950'
              : overdue
              ? 'border-rose-400 bg-white dark:border-rose-500 dark:bg-slate-900'
              : 'border-slate-300 bg-white group-hover:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:group-hover:border-sky-400'
          }`}
        >
          {task.completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
        </span>
      </button>

      <div className="min-w-0 flex-1 pt-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4
            className={`text-sm font-medium leading-snug sm:text-[15px] ${
              task.completed
                ? 'text-slate-500 line-through dark:text-slate-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {task.title}
          </h4>
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-blue-950 dark:text-sky-300">
            {task.category}
          </span>

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
            ·
          </span>

          <span
            className={`inline-flex items-center gap-1 tabular-nums ${
              overdue
                ? 'font-medium text-rose-700 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {overdue ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{overdue ? `Overdue (${dueDisplay})` : dueDisplay}</span>
          </span>

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
            ·
          </span>

          <span className={`inline-flex items-center gap-1 font-medium ${priorityMeta.colorClass}`}>
            <Flag className="h-3 w-3 shrink-0" />
            <span>{priorityMeta.label}</span>
          </span>

          {task.tags.length > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                ·
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {task.tags.map((tag) => `#${tag}`).join(' ')}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 pt-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit "${task.title}"`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-50 hover:text-blue-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-sky-300"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRequestDelete(task)}
          aria-label={`Delete "${task.title}"`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:text-slate-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
