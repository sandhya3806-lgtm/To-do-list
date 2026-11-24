import { CategoryItem, Task } from '../types/todo';
import { addDaysToDateString, getTodayDateString } from './dateUtils';

const TASKS_STORAGE_KEY = 'clearway_tasks_v1';
const CATEGORIES_STORAGE_KEY = 'clearway_categories_v1';
const THEME_STORAGE_KEY = 'clearway_theme_v1';
const NOTIFICATIONS_STORAGE_KEY = 'clearway_notifications_enabled_v1';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-personal', name: 'Personal', isDefault: true },
  { id: 'cat-college', name: 'College', isDefault: true },
  { id: 'cat-projects', name: 'Projects', isDefault: true },
  { id: 'cat-work', name: 'Work', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', isDefault: true },
  { id: 'cat-other', name: 'Other', isDefault: true },
];

function createSeedTasks(): Task[] {
  const now = new Date();
  const today = getTodayDateString(now);
  const yesterday = addDaysToDateString(today, -1);
  const twoDaysAgo = addDaysToDateString(today, -2);
  const tomorrow = addDaysToDateString(today, 1);
  const inThreeDays = addDaysToDateString(today, 3);

  const isoToday = now.toISOString();
  const isoYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoTwoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'seed-1',
      title: 'Finalize Q4 product roadmap presentation',
      description: 'Review milestone slides, confirm engineering estimates, and export final PDF deck.',
      completed: false,
      completedAt: null,
      dueDate: today,
      dueTime: '17:00',
      priority: 'high',
      category: 'Work',
      tags: ['roadmap', 'presentation'],
      createdAt: isoYesterday,
      updatedAt: isoYesterday,
    },
    {
      id: 'seed-2',
      title: 'Submit distributed systems lab report',
      description: 'Upload benchmark plots and Raft consensus test logs to the course portal.',
      completed: false,
      completedAt: null,
      dueDate: tomorrow,
      dueTime: '14:00',
      priority: 'high',
      category: 'College',
      tags: ['lab', 'systems'],
      createdAt: isoYesterday,
      updatedAt: isoYesterday,
    },
    {
      id: 'seed-3',
      title: 'Pick up desk lamp and notebook refills',
      description: 'Check stationery aisle for dot-grid A5 notebooks and warm LED bulb.',
      completed: false,
      completedAt: null,
      dueDate: today,
      dueTime: '',
      priority: 'low',
      category: 'Shopping',
      tags: ['errands'],
      createdAt: isoToday,
      updatedAt: isoToday,
    },
    {
      id: 'seed-4',
      title: 'Refactor portfolio case study layout',
      description: 'Tighten mobile spacing and verify image aspect ratios across breakpoints.',
      completed: false,
      completedAt: null,
      dueDate: inThreeDays,
      dueTime: '11:30',
      priority: 'medium',
      category: 'Projects',
      tags: ['design', 'web'],
      createdAt: isoTwoDaysAgo,
      updatedAt: isoTwoDaysAgo,
    },
    {
      id: 'seed-5',
      title: 'Renew gym membership and book physiotherapy checkup',
      description: 'Call reception before noon to confirm morning slot.',
      completed: false,
      completedAt: null,
      dueDate: yesterday,
      dueTime: '10:00',
      priority: 'medium',
      category: 'Personal',
      tags: ['health'],
      createdAt: isoTwoDaysAgo,
      updatedAt: isoTwoDaysAgo,
    },
    {
      id: 'seed-6',
      title: 'Morning inbox zero & weekly review',
      description: 'Archived resolved threads and prioritized top three goals for the week.',
      completed: true,
      completedAt: isoToday,
      dueDate: today,
      dueTime: '09:00',
      priority: 'medium',
      category: 'Work',
      tags: ['planning'],
      createdAt: isoYesterday,
      updatedAt: isoToday,
    },
    {
      id: 'seed-7',
      title: 'Read chapters 4 and 5 for seminar',
      description: 'Prepared three discussion questions on architecture trade-offs.',
      completed: true,
      completedAt: isoYesterday,
      dueDate: yesterday,
      dueTime: '18:00',
      priority: 'low',
      category: 'College',
      tags: ['reading'],
      createdAt: isoTwoDaysAgo,
      updatedAt: isoYesterday,
    },
  ];
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw === null) {
      const seeded = createSeedTasks();
      saveTasks(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Task =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string'
    );
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw === null) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    // Ensure default categories always exist
    const existingNames = new Set(
      parsed.map((c: CategoryItem) => String(c.name).toLowerCase())
    );
    const merged = [...parsed];
    for (const def of DEFAULT_CATEGORIES) {
      if (!existingNames.has(def.name.toLowerCase())) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

export function saveNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}
