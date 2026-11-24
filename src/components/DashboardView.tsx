import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ListChecks,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Task, TaskView } from '../types/todo';
import {
  formatCurrentHeaderDate,
  formatTaskDueDisplay,
  getGreeting,
  getLast7DaysProductivity,
  isTaskDueSoon,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/dateUtils';
import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';

interface DashboardViewProps {
  tasks: Task[];
  now: Date;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onRequestDeleteTask: (task: Task) => void;
  onOpenNewTask: (defaultDate?: string) => void;
  onNavigateView: (view: TaskView) => void;
}

export function DashboardView({
  tasks,
  now,
  onToggleComplete,
  onEditTask,
  onRequestDeleteTask,
  onOpenNewTask,
  onNavigateView,
}: DashboardViewProps) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t, now));
  const overdueCount = overdueTasks.length;

  const completionPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const todaysTasks = tasks
    .filter((t) => isTaskDueToday(t, now))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
    });

  const dueSoonTasks = tasks
    .filter((t) => isTaskDueSoon(t, now, 48))
    .sort((a, b) =>
      `${a.dueDate}T${a.dueTime || '23:59'}`.localeCompare(
        `${b.dueDate}T${b.dueTime || '23:59'}`
      )
    )
    .slice(0, 4);

  const productivityDays = getLast7DaysProductivity(tasks, now);
  const maxDailyCompleted = Math.max(
    1,
    ...productivityDays.map((d) => d.completedCount)
  );
  const weeklyCompletedTotal = productivityDays.reduce(
    (sum, d) => sum + d.completedCount,
    0
  );
  const todayCompletedCount =
    productivityDays[productivityDays.length - 1]?.completedCount ?? 0;

  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;

  const kpiCards: Array<{
    label: string;
    value: number;
    viewTarget: TaskView;
    icon: typeof ListChecks;
    accentClass: string;
    helperText: string;
  }> = [
    {
      label: 'Total Tasks',
      value: totalCount,
      viewTarget: 'all',
      icon: ListChecks,
      accentClass: 'text-blue-950 dark:text-sky-300',
      helperText: 'All tracked items',
    },
    {
      label: 'Completed',
      value: completedCount,
      viewTarget: 'completed',
      icon: CheckCircle2,
      accentClass: 'text-emerald-700 dark:text-emerald-400',
      helperText: `${completionPercentage}% completion rate`,
    },
    {
      label: 'Pending',
      value: pendingCount,
      viewTarget: 'pending',
      icon: CircleDashed,
      accentClass: 'text-sky-700 dark:text-sky-400',
      helperText: 'Active in queue',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      viewTarget: 'overdue',
      icon: AlertCircle,
      accentClass:
        overdueCount > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-500 dark:text-slate-400',
      helperText: overdueCount > 0 ? 'Needs attention' : 'All on schedule',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting & Date Hero Header */}
      <section className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-400">
            {formatCurrentHeaderDate(now)}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {getGreeting(now)}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {pendingCount === 0
              ? 'All scheduled tasks are complete. Add a new task to plan ahead.'
              : `You have ${pendingCount} pending ${
                  pendingCount === 1 ? 'task' : 'tasks'
                }${
                  overdueCount > 0
                    ? ` and ${overdueCount} overdue`
                    : ''
                }.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenNewTask(todayIso)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section
        aria-label="Task summary statistics"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigateView(kpi.viewTarget)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all hover:border-sky-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <Icon className={`h-4 w-4 shrink-0 ${kpi.accentClass}`} />
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {kpi.value}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600 dark:text-slate-600 dark:group-hover:text-sky-400" />
              </div>

              <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {kpi.helperText}
              </p>
            </button>
          );
        })}
      </section>

      {/* Progress + Daily Productivity Tracker + Upcoming Deadlines */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Progress & 7-Day Productivity Tracker */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Task Completion & Daily Productivity
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Overall progress and completed tasks across the last 7 days
                </p>
              </div>
              <span className="font-mono text-2xl font-bold text-blue-950 tabular-nums dark:text-sky-300">
                {completionPercentage}%
              </span>
            </div>

            {/* Completion Progress Bar */}
            <div className="mt-4">
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-valuenow={completionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall task completion percentage"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-900 transition-all duration-300 dark:from-sky-400 dark:to-blue-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 tabular-nums dark:text-slate-400">
                <span>
                  {completedCount} of {totalCount} tasks completed
                </span>
                <span>{pendingCount} remaining</span>
              </div>
            </div>
          </div>

          {/* 7-Day Daily Productivity Tracker */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>7-Day Productivity Tracker</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                <span>Today: {todayCompletedCount} done</span>
                <span aria-hidden="true">·</span>
                <span>7-day total: {weeklyCompletedTotal}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 sm:gap-3">
              {productivityDays.map((day) => {
                const heightPercent =
                  day.completedCount === 0
                    ? 8
                    : Math.max(
                        18,
                        Math.round((day.completedCount / maxDailyCompleted) * 100)
                      );

                return (
                  <div
                    key={day.dateStr}
                    title={`${day.fullDateLabel}: ${day.completedCount} completed`}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                      {day.completedCount}
                    </span>
                    <div className="flex h-24 w-full max-w-[36px] items-end rounded-lg bg-slate-100/80 p-1 dark:bg-slate-800/80">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          day.completedCount === 0
                            ? 'bg-slate-200 dark:bg-slate-700'
                            : day.isToday
                            ? 'bg-blue-950 dark:bg-sky-400'
                            : 'bg-sky-400 dark:bg-sky-600'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        day.isToday
                          ? 'font-semibold text-blue-950 dark:text-sky-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {day.isToday ? 'Today' : day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines & Overdue Focus */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Deadline Radar
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Overdue items and tasks due within 48 hours
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateView('upcoming')}
              className="text-xs font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 whitespace-nowrap shrink-0"
            >
              View all
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {overdueTasks.length === 0 && dueSoonTasks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <p className="mt-2.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                  No urgent deadlines
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  You are clear for the next 48 hours.
                </p>
              </div>
            ) : (
              <>
                {overdueTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 px-6 py-3.5"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="block truncate text-left text-sm font-medium text-slate-900 hover:text-blue-900 dark:text-slate-100 dark:hover:text-sky-300"
                      >
                        {task.title}
                      </button>
                      <p className="mt-0.5 text-xs font-medium text-rose-600 tabular-nums dark:text-rose-400">
                        Overdue · {formatTaskDueDisplay(task.dueDate, task.dueTime, now)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      Complete
                    </button>
                  </div>
                ))}

                {dueSoonTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 px-6 py-3.5"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="block truncate text-left text-sm font-medium text-slate-900 hover:text-blue-900 dark:text-slate-100 dark:hover:text-sky-300"
                      >
                        {task.title}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {task.category} ·{' '}
                        {formatTaskDueDisplay(task.dueDate, task.dueTime, now)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                      Complete
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Today's Tasks Section */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Today&apos;s Tasks
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {todaysTasks.length} scheduled for today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateView('today')}
              className="text-xs font-medium text-slate-600 hover:text-blue-950 dark:text-slate-400 dark:hover:text-sky-300 whitespace-nowrap shrink-0"
            >
              Open Today view
            </button>
            <button
              type="button"
              onClick={() => onOpenNewTask(todayIso)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-blue-950 transition-colors hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add for Today</span>
            </button>
          </div>
        </div>

        {todaysTasks.length === 0 ? (
          <EmptyState
            variant="tasks"
            compact
            title="No tasks scheduled for today"
            description="Your schedule for today is open. Add a task or check your upcoming calendar."
            actionLabel="Add Today's Task"
            onAction={() => onOpenNewTask(todayIso)}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todaysTasks.map((task) => (
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
      </section>
    </div>
  );
}
