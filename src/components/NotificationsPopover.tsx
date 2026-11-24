import { useEffect, useRef } from 'react';
import { AlertTriangle, Bell, BellOff, Clock, CheckCircle2 } from 'lucide-react';
import { DeadlineAlert } from '../types/todo';

interface NotificationsPopoverProps {
  isOpen: boolean;
  alerts: DeadlineAlert[];
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onSelectTask: (taskId: string) => void;
  onClose: () => void;
}

export function NotificationsPopover({
  isOpen,
  alerts,
  notificationsEnabled,
  onToggleNotifications,
  onSelectTask,
  onClose,
}: NotificationsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Upcoming deadline notifications"
      className="absolute top-full right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Deadline Notifications
          </h3>
          <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {alerts.length === 0
              ? 'No urgent reminders'
              : `${alerts.length} upcoming or overdue ${
                  alerts.length === 1 ? 'deadline' : 'deadlines'
                }`}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleNotifications}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          {notificationsEnabled ? (
            <>
              <Bell className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Alerts On</span>
            </>
          ) : (
            <>
              <BellOff className="h-3.5 w-3.5 text-slate-400" />
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              All clear
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              No overdue tasks or deadlines within the next 24 hours.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                onSelectTask(alert.taskId);
                onClose();
              }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sky-50/50 dark:hover:bg-slate-800/60"
            >
              {alert.kind === 'overdue' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {alert.title}
                </p>
                <p
                  className={`mt-0.5 text-xs tabular-nums ${
                    alert.kind === 'overdue'
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {alert.kind === 'overdue' ? 'Overdue' : 'Due soon'} ·{' '}
                  {alert.dueDisplay}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
