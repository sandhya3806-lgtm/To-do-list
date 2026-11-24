import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Folder,
  LayoutDashboard,
  ListTodo,
  Plus,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { CategoryItem, TaskView } from '../types/todo';

interface SidebarProps {
  activeView: TaskView;
  selectedCategory: string | null;
  categories: CategoryItem[];
  viewCounts: Record<TaskView, number>;
  categoryCounts: Record<string, number>;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectView: (view: TaskView) => void;
  onSelectCategory: (categoryName: string | null) => void;
  onAddCategory: (name: string) => boolean;
  onRequestDeleteCategory: (category: CategoryItem) => void;
  onOpenNewTask: () => void;
}

const NAV_ITEMS: Array<{
  id: TaskView;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'all', label: 'All Tasks', icon: ListTodo },
  { id: 'today', label: "Today's Tasks", icon: Sun },
  { id: 'upcoming', label: 'Upcoming Tasks', icon: CalendarClock },
  { id: 'pending', label: 'Pending Tasks', icon: CircleDashed },
  { id: 'completed', label: 'Completed Tasks', icon: CheckCircle2 },
  { id: 'overdue', label: 'Overdue Tasks', icon: AlertCircle },
  { id: 'calendar', label: 'Calendar View', icon: Calendar },
];

export function Sidebar({
  activeView,
  selectedCategory,
  categories,
  viewCounts,
  categoryCounts,
  isMobileOpen,
  onCloseMobile,
  onSelectView,
  onSelectCategory,
  onAddCategory,
  onRequestDeleteCategory,
  onOpenNewTask,
}: SidebarProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const handleCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Enter a category name.');
      return;
    }
    const ok = onAddCategory(trimmed);
    if (ok) {
      setNewCategoryName('');
      setCategoryError(null);
      setIsAddingCategory(false);
    } else {
      setCategoryError('Category already exists.');
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-50/80 dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            onSelectCategory(null);
            onSelectView('dashboard');
            onCloseMobile();
          }}
          className="font-display text-lg font-bold tracking-tight text-blue-950 dark:text-white whitespace-nowrap shrink-0"
        >
          Clearway
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            onOpenNewTask();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New Task</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="mb-6">
          <p className="px-3 pb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            Views
          </p>
          <nav className="space-y-0.5" aria-label="Task Views">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id && selectedCategory === null;
              const count = viewCounts[item.id];
              const isOverdueItem = item.id === 'overdue' && count > 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(null);
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-100/80 text-blue-950 dark:bg-sky-950/60 dark:text-sky-300'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isOverdueItem
                          ? 'text-rose-600 dark:text-rose-400'
                          : isActive
                          ? 'text-blue-900 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.id !== 'dashboard' && item.id !== 'calendar' && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isOverdueItem
                          ? 'font-semibold text-rose-600 dark:text-rose-400'
                          : isActive
                          ? 'text-blue-900 dark:text-sky-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Categories
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory((prev) => !prev);
                setCategoryError(null);
              }}
              aria-label="Add custom category"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-blue-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"
            >
              {isAddingCategory ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {isAddingCategory && (
            <form onSubmit={handleCategorySubmit} className="mb-3 px-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (categoryError) setCategoryError(null);
                  }}
                  placeholder="New category..."
                  maxLength={28}
                  autoFocus
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-950 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-900 dark:bg-sky-500 dark:text-slate-950 whitespace-nowrap shrink-0"
                >
                  Add
                </button>
              </div>
              {categoryError && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {categoryError}
                </p>
              )}
            </form>
          )}

          <div className="space-y-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const count = categoryCounts[cat.name] ?? 0;

              return (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between rounded-lg pr-1 transition-colors ${
                    isSelected
                      ? 'bg-sky-100/80 text-blue-950 dark:bg-sky-950/60 dark:text-sky-300'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onSelectView('all');
                      onCloseMobile();
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm font-medium"
                  >
                    <Folder
                      className={`h-4 w-4 shrink-0 ${
                        isSelected
                          ? 'text-blue-900 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>

                  <div className="flex items-center gap-1 pr-2">
                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteCategory(cat)}
                        aria-label={`Delete category ${cat.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isSelected
                          ? 'text-blue-900 dark:text-sky-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile & tablet slide-over sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 shadow-xl dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
