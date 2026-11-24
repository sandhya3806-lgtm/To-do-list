import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task } from '../types/todo';
import {
  getMonthCalendarDays,
  getTodayDateString,
  isTaskOverdue,
  parseLocalDate,
} from '../utils/dateUtils';
import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';

interface CalendarViewProps {
  tasks: Task[];
  now: Date;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onRequestDeleteTask: (task: Task) => void;
  onOpenNewTask: (defaultDate?: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  tasks,
  now,
  onToggleComplete,
  onEditTask,
  onRequestDeleteTask,
  onOpenNewTask,
}: CalendarViewProps) {
  const todayStr = getTodayDateString(now);
  const [cursorYear, setCursorYear] = useState(now.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const monthCells = useMemo(
    () => getMonthCalendarDays(cursorYear, cursorMonth),
    [cursorYear, cursorMonth]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
      });
    }
    return map;
  }, [tasks]);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(cursorYear, cursorMonth, 1));

  const selectedDateObj = parseLocalDate(selectedDate) ?? now;
  const selectedDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(selectedDateObj);

  const selectedDayTasks = tasksByDate.get(selectedDate) ?? [];

  const handlePrevMonth = () => {
    if (cursorMonth === 0) {
      setCursorYear((y) => y - 1);
      setCursorMonth(11);
    } else {
      setCursorMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (cursorMonth === 11) {
      setCursorYear((y) => y + 1);
      setCursorMonth(0);
    } else {
      setCursorMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setCursorYear(now.getFullYear());
    setCursorMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendar View
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select any date to inspect scheduled deadlines or add new tasks
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewTask(selectedDate)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Monthly Grid */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6 xl:col-span-7">
          <div className="flex items-center justify-between gap-3 pb-4">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleJumpToday}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {monthCells.map((cell) => {
              const dayTasks = tasksByDate.get(cell.dateStr) ?? [];
              const pendingForDay = dayTasks.filter((t) => !t.completed).length;
              const overdueForDay = dayTasks.some((t) => isTaskOverdue(t, now));
              const isSelected = selectedDate === cell.dateStr;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`flex min-h-[68px] flex-col items-start justify-between rounded-lg border p-2 text-left transition-all sm:min-h-[80px] ${
                    isSelected
                      ? 'border-blue-950 bg-sky-50/80 dark:border-sky-400 dark:bg-sky-950/50'
                      : isToday
                      ? 'border-sky-300 bg-sky-50/40 hover:border-sky-400 dark:border-sky-800 dark:bg-slate-800/70'
                      : 'border-slate-100 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700'
                  } ${!cell.isCurrentMonth ? 'opacity-45' : ''}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isToday
                          ? 'font-bold text-blue-950 dark:text-sky-300'
                          : isSelected
                          ? 'font-semibold text-blue-950 dark:text-white'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayTasks.length > 0 && (
                      <span
                        className={`font-mono text-[11px] font-medium tabular-nums ${
                          overdueForDay
                            ? 'text-rose-600 dark:text-rose-400'
                            : pendingForDay > 0
                            ? 'text-sky-700 dark:text-sky-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {dayTasks.length > 0 && (
                    <div className="mt-1.5 hidden w-full space-y-0.5 sm:block">
                      {dayTasks.slice(0, 2).map((t) => (
                        <p
                          key={t.id}
                          className={`truncate text-[11px] leading-tight ${
                            t.completed
                              ? 'text-slate-400 line-through dark:text-slate-500'
                              : isTaskOverdue(t, now)
                              ? 'font-medium text-rose-600 dark:text-rose-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {t.title}
                        </p>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          +{dayTasks.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
                {selectedDate === todayStr ? 'Today' : 'Selected Date'}
              </p>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {selectedDateLabel}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onOpenNewTask(selectedDate)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-blue-950 transition-colors hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex-1">
            {selectedDayTasks.length === 0 ? (
              <EmptyState
                variant="calendar"
                compact
                title="No tasks scheduled"
                description="This day is completely open. Schedule a task to keep your week organized."
                actionLabel="Schedule for This Day"
                onAction={() => onOpenNewTask(selectedDate)}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedDayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    now={now}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onRequestDelete={onRequestDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
