export type Priority = 'high' | 'medium' | 'low';

export type TaskView =
  | 'dashboard'
  | 'all'
  | 'today'
  | 'upcoming'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'calendar';

export type SortBy = 'dueDate' | 'priority' | 'createdAt' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  dueDate: string; // YYYY-MM-DD or ''
  dueTime: string; // HH:mm or ''
  priority: Priority;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  category: string;
  tags: string[];
}

export interface DeadlineAlert {
  id: string;
  taskId: string;
  title: string;
  dueDisplay: string;
  kind: 'overdue' | 'due-soon';
}
