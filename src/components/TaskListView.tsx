import { ArrowDownUp, Plus, Search, X } from 'lucide-react';
import { CategoryItem, Priority, SortBy, SortOrder, Task, TaskView } from '../types/todo';
import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';

interface TaskListViewProps {
  view: Exclude<TaskView, 'dashboard' | 'calendar'>;
  selectedCategory: string | null;
  tasks: Task[];
  categories: CategoryItem[];
  searchQuery: string;
  priorityFilter: Priority | 'all';
  sortBy: SortBy;
  sortOrder: SortOrder;
  now: Date;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (categoryName: string | null) => void;
  onPriorityFilterChange: (priority: Priority | 'all') => void;
  onSortByChange: (sortBy: SortBy) => void;
  onToggleSortOrder: () => void;
  onClearFilters: () => void;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onRequestDeleteTask: (task: Task) => void;
  onOpenNewTask: () => void;
}

const VIEW_METADATA: Record<
  Exclude<TaskView, 'dashboard' | 'calendar'>,
  { title: string; subtitle: string; emptyTitle: string; emptyDescription: string }
> = {
  all: {
    title: 'All Tasks',
    subtitle: 'Complete workspace inventory across all categories and dates',
    emptyTitle: 'No tasks yet',
    emptyDescription:
      'Create your first task with a due date, priority, and category to get started.',
  },
  today: {
    title: "Today's Tasks",
    subtitle: 'Tasks scheduled for today',
    emptyTitle: 'Nothing scheduled for today',
    emptyDescription:
      'Enjoy a clear schedule or add a new task for today.',
  },
  upcoming: {
    title: 'Upcoming Tasks',
    subtitle: 'Pending tasks scheduled for later today and future dates',
    emptyTitle: 'No upcoming tasks scheduled',
    emptyDescription:
      'Plan ahead by adding due dates to your upcoming projects and deadlines.',
  },
  pending: {
    title: 'Pending Tasks',
    subtitle: 'All active tasks waiting to be completed',
    emptyTitle: 'All caught up',
    emptyDescription:
      'Every task in your workspace has been completed.',
  },
  completed: {
    title: 'Completed Tasks',
    subtitle: 'Finished tasks archived for your productivity record',
    emptyTitle: 'No completed tasks yet',
    emptyDescription:
      'Check off tasks as you finish them to build your daily productivity streak.',
  },
  overdue: {
    title: 'Overdue Tasks',
    subtitle: 'Pending tasks past their scheduled date or time',
    emptyTitle: 'Zero overdue tasks',
    emptyDescription:
      'Great work—everything is either completed or right on schedule.',
  },
};

export function TaskListView({
  view,
  selectedCategory,
  tasks,
  categories,
  searchQuery,
  priorityFilter,
  sortBy,
  sortOrder,
  now,
  onSearchChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  onSortByChange,
  onToggleSortOrder,
  onClearFilters,
  onToggleComplete,
  onEditTask,
  onRequestDeleteTask,
  onOpenNewTask,
}: TaskListViewProps) {
  const meta = VIEW_METADATA[view];
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'all' ||
    selectedCategory !== null;

  const heading = selectedCategory ? `${selectedCategory} Tasks` : meta.title;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {meta.subtitle} ·{' '}
            <span className="font-mono tabular-nums">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, description, category, or tag..."
              aria-label="Search tasks"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Priority Segmented Filter */}
          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            role="group"
            aria-label="Filter by priority"
          >
            {(['all', 'high', 'medium', 'low'] as const).map((level) => {
              const active = priorityFilter === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onPriorityFilterChange(level)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-blue-950 shadow-xs dark:bg-slate-900 dark:text-sky-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {level === 'all' ? 'All Priorities' : level}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by category"
              value={selectedCategory ?? ''}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value ? e.target.value : null)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <select
                aria-label="Sort tasks by"
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as SortBy)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="createdAt">Sort: Created</option>
                <option value="title">Sort: Title</option>
              </select>

              <button
                type="button"
                onClick={onToggleSortOrder}
                aria-label={`Toggle sort order (currently ${
                  sortOrder === 'asc' ? 'ascending' : 'descending'
                })`}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <ArrowDownUp className="h-3.5 w-3.5" />
                <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {tasks.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              variant="tasks"
              title="No matching tasks"
              description="Try adjusting your search keywords, category, or priority filter."
              actionLabel="Clear Filters"
              onAction={onClearFilters}
              secondaryActionLabel="New Task"
              onSecondaryAction={onOpenNewTask}
            />
          ) : (
            <EmptyState
              variant="tasks"
              title={meta.emptyTitle}
              description={meta.emptyDescription}
              actionLabel="Create Task"
              onAction={onOpenNewTask}
            />
          )
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => (
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
  );
}
