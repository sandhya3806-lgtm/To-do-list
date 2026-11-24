/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Menu, Moon, Sun, X } from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { DashboardView } from './components/DashboardView';
import { NotificationsPopover } from './components/NotificationsPopover';
import { Sidebar } from './components/Sidebar';
import { TaskListView } from './components/TaskListView';
import { TaskModal } from './components/TaskModal';
import {
  CategoryItem,
  DeadlineAlert,
  Priority,
  SortBy,
  SortOrder,
  Task,
  TaskFormData,
  TaskView,
} from './types/todo';
import {
  formatTaskDueDisplay,
  isTaskDueSoon,
  isTaskDueToday,
  isTaskOverdue,
  isTaskUpcoming,
} from './utils/dateUtils';
import {
  loadCategories,
  loadNotificationsEnabled,
  loadTasks,
  loadTheme,
  saveCategories,
  saveNotificationsEnabled,
  saveTasks,
  saveTheme,
} from './utils/storage';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const VIEW_LABELS: Record<TaskView, string> = {
  dashboard: 'Dashboard',
  all: 'All Tasks',
  today: "Today's Tasks",
  upcoming: 'Upcoming Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
  overdue: 'Overdue Tasks',
  calendar: 'Calendar View',
};

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    loadCategories()
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    loadNotificationsEnabled()
  );

  const [activeView, setActiveView] = useState<TaskView>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    editingTask: Task | null;
    defaultDate: string;
  }>({
    isOpen: false,
    editingTask: null,
    defaultDate: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'task'; task: Task }
    | { kind: 'category'; category: CategoryItem }
    | null
  >(null);

  const [toastMessage, setToastMessage] = useState<{
    id: number;
    title: string;
    detail: string;
  } | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Sync theme to document root & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  // Persist tasks & categories automatically
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveNotificationsEnabled(notificationsEnabled);
  }, [notificationsEnabled]);

  // Keep current clock updated every 30s for overdue & deadline checks
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const showToast = useCallback((title: string, detail: string) => {
    const id = Date.now();
    setToastMessage({ id, title, detail });
    window.setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  // Deadline alerts (overdue + due within 24 hours)
  const deadlineAlerts = useMemo<DeadlineAlert[]>(() => {
    const list: DeadlineAlert[] = [];
    for (const task of tasks) {
      if (isTaskOverdue(task, now)) {
        list.push({
          id: `alert-${task.id}`,
          taskId: task.id,
          title: task.title,
          dueDisplay: formatTaskDueDisplay(task.dueDate, task.dueTime, now),
          kind: 'overdue',
        });
      } else if (isTaskDueSoon(task, now, 24)) {
        list.push({
          id: `alert-${task.id}`,
          taskId: task.id,
          title: task.title,
          dueDisplay: formatTaskDueDisplay(task.dueDate, task.dueTime, now),
          kind: 'due-soon',
        });
      }
    }
    return list;
  }, [tasks, now]);

  // Trigger upcoming deadline reminder toast / browser notification once per task
  useEffect(() => {
    if (!notificationsEnabled || deadlineAlerts.length === 0) return;
    const unnotified = deadlineAlerts.filter(
      (alert) => !notifiedIdsRef.current.has(alert.taskId)
    );
    if (unnotified.length === 0) return;

    const first = unnotified[0];
    for (const alert of unnotified) {
      notifiedIdsRef.current.add(alert.taskId);
    }

    const summary =
      unnotified.length === 1
        ? `${first.title} (${first.dueDisplay})`
        : `${first.title} and ${unnotified.length - 1} more task(s) require attention.`;

    showToast(
      first.kind === 'overdue' ? 'Overdue task reminder' : 'Upcoming deadline',
      summary
    );

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(
          first.kind === 'overdue' ? 'Overdue Task — Clearway' : 'Upcoming Deadline — Clearway',
          { body: summary }
        );
      } catch {
        // Ignore if blocked by sandboxed iframe
      }
    }
  }, [deadlineAlerts, notificationsEnabled, showToast]);

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    if (
      next &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore in restricted environments
      }
    }
    showToast(
      next ? 'Deadline alerts enabled' : 'Deadline alerts muted',
      next
        ? 'You will receive reminders for upcoming deadlines.'
        : 'Upcoming deadline popups are paused.'
    );
  };

  // Live view counts for sidebar
  const viewCounts = useMemo<Record<TaskView, number>>(() => {
    return {
      dashboard: tasks.length,
      all: tasks.length,
      today: tasks.filter((t) => isTaskDueToday(t, now)).length,
      upcoming: tasks.filter((t) => isTaskUpcoming(t, now)).length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      overdue: tasks.filter((t) => isTaskOverdue(t, now)).length,
      calendar: tasks.filter((t) => Boolean(t.dueDate)).length,
    };
  }, [tasks, now]);

  const categoryCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.name] = 0;
    }
    for (const task of tasks) {
      counts[task.category] = (counts[task.category] ?? 0) + 1;
    }
    return counts;
  }, [tasks, categories]);

  // Filtered & sorted list for TaskListView
  const filteredTasks = useMemo(() => {
    if (activeView === 'dashboard' || activeView === 'calendar') return [];

    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (activeView === 'today' && !isTaskDueToday(task, now)) return false;
      if (activeView === 'upcoming' && !isTaskUpcoming(task, now)) return false;
      if (activeView === 'pending' && task.completed) return false;
      if (activeView === 'completed' && !task.completed) return false;
      if (activeView === 'overdue' && !isTaskOverdue(task, now)) return false;

      if (selectedCategory && task.category !== selectedCategory) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      if (query) {
        const haystack = [
          task.title,
          task.description,
          task.category,
          ...task.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        const aKey = a.dueDate
          ? `${a.dueDate}T${a.dueTime || '23:59'}`
          : '9999-12-31T23:59';
        const bKey = b.dueDate
          ? `${b.dueDate}T${b.dueTime || '23:59'}`
          : '9999-12-31T23:59';
        comparison = aKey.localeCompare(bKey);
      } else if (sortBy === 'priority') {
        comparison = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      if (comparison === 0) {
        comparison = a.createdAt.localeCompare(b.createdAt);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [
    tasks,
    activeView,
    selectedCategory,
    priorityFilter,
    searchQuery,
    sortBy,
    sortOrder,
    now,
  ]);

  const handleOpenNewTask = (defaultDate: string = '') => {
    setTaskModalState({
      isOpen: true,
      editingTask: null,
      defaultDate,
    });
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskModalState({
      isOpen: true,
      editingTask: task,
      defaultDate: '',
    });
  };

  const handleSaveTask = (data: TaskFormData, existingId?: string) => {
    const timestamp = new Date().toISOString();
    if (existingId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === existingId
            ? {
                ...task,
                ...data,
                updatedAt: timestamp,
              }
            : task
        )
      );
      showToast('Task updated', data.title);
    } else {
      const newTask: Task = {
        id: generateId('task'),
        ...data,
        completed: false,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast('Task created', data.title);
    }

    setTaskModalState({ isOpen: false, editingTask: null, defaultDate: '' });
  };

  const handleToggleComplete = (taskId: string) => {
    const timestamp = new Date().toISOString();
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? timestamp : null,
          updatedAt: timestamp,
        };
      })
    );
  };

  const handleAddCategory = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return false;

    const newCat: CategoryItem = {
      id: generateId('cat'),
      name: trimmed,
      isDefault: false,
    };
    setCategories((prev) => [...prev, newCat]);
    return true;
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'task') {
      const deletedTitle = deleteTarget.task.title;
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.task.id));
      showToast('Task deleted', deletedTitle);
    } else {
      const catName = deleteTarget.category.name;
      setCategories((prev) =>
        prev.filter((c) => c.id !== deleteTarget.category.id)
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.category === catName ? { ...t, category: 'Other' } : t
        )
      );
      if (selectedCategory === catName) {
        setSelectedCategory(null);
      }
      showToast('Category removed', `Tasks moved to Other.`);
    }
    setDeleteTarget(null);
  };

  const breadcrumbLabel = selectedCategory
    ? `${VIEW_LABELS[activeView]} / ${selectedCategory}`
    : VIEW_LABELS[activeView];

  return (
    <div className="flex min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        selectedCategory={selectedCategory}
        categories={categories}
        viewCounts={viewCounts}
        categoryCounts={categoryCounts}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectView={setActiveView}
        onSelectCategory={setSelectedCategory}
        onAddCategory={handleAddCategory}
        onRequestDeleteCategory={(category) =>
          setDeleteTarget({ kind: 'category', category })
        }
        onOpenNewTask={() => handleOpenNewTask()}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-400 dark:text-slate-500 sm:inline">
                Workspace
              </span>
              <span
                aria-hidden="true"
                className="hidden text-slate-300 dark:text-slate-700 sm:inline"
              >
                /
              </span>
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                {breadcrumbLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Deadline Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Toggle deadline notifications"
                aria-expanded={isNotificationsOpen}
                className="relative flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Bell className="h-4 w-4 text-blue-950 dark:text-sky-400" />
                <span className="hidden sm:inline">Reminders</span>
                {deadlineAlerts.length > 0 && (
                  <span className="font-mono text-xs font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                    {deadlineAlerts.length}
                  </span>
                )}
              </button>

              <NotificationsPopover
                isOpen={isNotificationsOpen}
                alerts={deadlineAlerts}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
                onSelectTask={(taskId) => {
                  const found = tasks.find((t) => t.id === taskId);
                  if (found) handleOpenEditTask(found);
                }}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>

            {/* Light / Dark Mode Switch */}
            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
              }
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 text-blue-950" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-sky-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activeView === 'dashboard' ? (
            <DashboardView
              tasks={tasks}
              now={now}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleOpenEditTask}
              onRequestDeleteTask={(task) =>
                setDeleteTarget({ kind: 'task', task })
              }
              onOpenNewTask={handleOpenNewTask}
              onNavigateView={(view) => {
                setSelectedCategory(null);
                setActiveView(view);
              }}
            />
          ) : activeView === 'calendar' ? (
            <CalendarView
              tasks={tasks}
              now={now}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleOpenEditTask}
              onRequestDeleteTask={(task) =>
                setDeleteTarget({ kind: 'task', task })
              }
              onOpenNewTask={handleOpenNewTask}
            />
          ) : (
            <TaskListView
              view={activeView}
              selectedCategory={selectedCategory}
              tasks={filteredTasks}
              categories={categories}
              searchQuery={searchQuery}
              priorityFilter={priorityFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              now={now}
              onSearchChange={setSearchQuery}
              onCategoryFilterChange={setSelectedCategory}
              onPriorityFilterChange={setPriorityFilter}
              onSortByChange={setSortBy}
              onToggleSortOrder={() =>
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              onClearFilters={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setSelectedCategory(null);
              }}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleOpenEditTask}
              onRequestDeleteTask={(task) =>
                setDeleteTarget({ kind: 'task', task })
              }
              onOpenNewTask={() => handleOpenNewTask()}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={taskModalState.isOpen}
        editingTask={taskModalState.editingTask}
        defaultDate={taskModalState.defaultDate}
        defaultCategory={selectedCategory ?? 'Personal'}
        categories={categories}
        onAddCategory={handleAddCategory}
        onSave={handleSaveTask}
        onClose={() =>
          setTaskModalState({ isOpen: false, editingTask: null, defaultDate: '' })
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title={
          deleteTarget?.kind === 'category'
            ? `Delete "${deleteTarget.category.name}" category?`
            : 'Delete this task?'
        }
        message={
          deleteTarget?.kind === 'category'
            ? 'Any tasks in this category will be reassigned to "Other". This action cannot be undone.'
            : `Are you sure you want to permanently delete "${
                deleteTarget?.task.title ?? ''
              }"?`
        }
        confirmLabel={
          deleteTarget?.kind === 'category' ? 'Delete Category' : 'Delete Task'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {toastMessage.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {toastMessage.detail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
