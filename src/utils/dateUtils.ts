import { Task } from '../types/todo';

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(now: Date = new Date()): string {
  return toLocalDateString(now);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr;
  parsed.setDate(parsed.getDate() + days);
  return toLocalDateString(parsed);
}

export function parseLocalDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function parseTaskDueDateTime(dueDate: string, dueTime: string): Date | null {
  const date = parseLocalDate(dueDate);
  if (!date) return null;
  if (dueTime) {
    if (!/^\d{2}:\d{2}$/.test(dueTime)) return null;
    const [hours, minutes] = dueTime.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    date.setHours(hours, minutes, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

export function validateDateAndTime(dueDate: string, dueTime: string): string | null {
  if (dueTime && !dueDate) {
    return 'Please choose a due date when setting a due time.';
  }
  if (dueDate) {
    const parsedDate = parseLocalDate(dueDate);
    if (!parsedDate) {
      return 'Please enter a valid calendar date.';
    }
  }
  if (dueTime && !/^\d{2}:\d{2}$/.test(dueTime)) {
    return 'Please enter a valid time.';
  }
  return null;
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatCurrentHeaderDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
}

export function formatTimeDisplay(dueTime: string): string {
  if (!/^\d{2}:\d{2}$/.test(dueTime)) return '';
  const [h, m] = dueTime.split(':').map(Number);
  const temp = new Date(2026, 0, 1, h, m);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(temp);
}

export function formatTaskDueDisplay(
  dueDate: string,
  dueTime: string,
  now: Date = new Date()
): string {
  if (!dueDate) return 'No due date';
  const parsed = parseLocalDate(dueDate);
  if (!parsed) return 'Invalid date';

  const todayStr = getTodayDateString(now);
  const tomorrowStr = addDaysToDateString(todayStr, 1);
  const yesterdayStr = addDaysToDateString(todayStr, -1);

  let dateLabel: string;
  if (dueDate === todayStr) {
    dateLabel = 'Today';
  } else if (dueDate === tomorrowStr) {
    dateLabel = 'Tomorrow';
  } else if (dueDate === yesterdayStr) {
    dateLabel = 'Yesterday';
  } else {
    dateLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: parsed.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(parsed);
  }

  if (dueTime) {
    return `${dateLabel} · ${formatTimeDisplay(dueTime)}`;
  }
  return dateLabel;
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.completed || !task.dueDate) return false;
  const parsedDate = parseLocalDate(task.dueDate);
  if (!parsedDate) return false;

  const todayStr = getTodayDateString(now);
  if (task.dueDate < todayStr) return true;
  if (task.dueDate > todayStr) return false;

  if (task.dueTime) {
    const dueDateTime = parseTaskDueDateTime(task.dueDate, task.dueTime);
    if (!dueDateTime) return false;
    return dueDateTime.getTime() < now.getTime();
  }
  return false;
}

export function isTaskDueToday(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return task.dueDate === getTodayDateString(now);
}

export function isTaskUpcoming(task: Task, now: Date = new Date()): boolean {
  if (task.completed || !task.dueDate) return false;
  const todayStr = getTodayDateString(now);
  if (task.dueDate > todayStr) return true;
  if (task.dueDate === todayStr && task.dueTime) {
    const dueDateTime = parseTaskDueDateTime(task.dueDate, task.dueTime);
    return Boolean(dueDateTime && dueDateTime.getTime() >= now.getTime());
  }
  return false;
}

export function isTaskDueSoon(
  task: Task,
  now: Date = new Date(),
  hoursThreshold: number = 24
): boolean {
  if (task.completed || !task.dueDate) return false;
  if (isTaskOverdue(task, now)) return false;

  const dueDateTime = parseTaskDueDateTime(task.dueDate, task.dueTime);
  if (!dueDateTime) return false;

  const diffMs = dueDateTime.getTime() - now.getTime();
  const maxMs = hoursThreshold * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= maxMs;
}

export interface DailyProductivityPoint {
  dateStr: string;
  dayLabel: string;
  fullDateLabel: string;
  completedCount: number;
  isToday: boolean;
}

export function getLast7DaysProductivity(
  tasks: Task[],
  now: Date = new Date()
): DailyProductivityPoint[] {
  const todayStr = getTodayDateString(now);
  const completedByDate = new Map<string, number>();

  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      if (!Number.isNaN(completedDate.getTime())) {
        const key = toLocalDateString(completedDate);
        completedByDate.set(key, (completedByDate.get(key) ?? 0) + 1);
      }
    }
  }

  const points: DailyProductivityPoint[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dateStr = addDaysToDateString(todayStr, offset);
    const parsed = parseLocalDate(dateStr) ?? now;
    points.push({
      dateStr,
      dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(parsed),
      fullDateLabel: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(parsed),
      completedCount: completedByDate.get(dateStr) ?? 0,
      isToday: dateStr === todayStr,
    });
  }
  return points;
}

export function getMonthCalendarDays(year: number, monthIndex: number): Array<{
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}> {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
  }> = [];

  // Leading days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    cells.push({
      dateStr: toLocalDateString(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push({
      dateStr: toLocalDateString(d),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  // Trailing days to complete 42 cells (6 rows) or 35 cells (5 rows)
  const targetLength = cells.length > 35 ? 42 : 35;
  let nextDay = 1;
  while (cells.length < targetLength) {
    const d = new Date(year, monthIndex + 1, nextDay++);
    cells.push({
      dateStr: toLocalDateString(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  return cells;
}
