import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Tag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CategoryItem, Priority, Task, TaskFormData } from '../types/todo';
import { getTodayDateString, validateDateAndTime } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  defaultDate?: string;
  defaultCategory?: string;
  categories: CategoryItem[];
  onAddCategory: (name: string) => boolean;
  onSave: (data: TaskFormData, existingId?: string) => void;
  onClose: () => void;
}

export function TaskModal({
  isOpen,
  editingTask,
  defaultDate = '',
  defaultCategory = 'Personal',
  categories,
  onAddCategory,
  onSave,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setTags(editingTask.tags);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(defaultDate || getTodayDateString());
      setDueTime('');
      setPriority('medium');
      setCategory(defaultCategory || categories[0]?.name || 'Personal');
      setTags([]);
    }
    setTagInput('');
    setShowNewCategory(false);
    setNewCategoryName('');
    setError(null);
  }, [isOpen, editingTask, defaultDate, defaultCategory, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddTag = () => {
    const cleaned = tagInput
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[^a-z0-9-_]/g, '');
    if (!cleaned) {
      setTagInput('');
      return;
    }
    if (!tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCreateInlineCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const created = onAddCategory(trimmed);
    if (created) {
      setCategory(trimmed);
      setNewCategoryName('');
      setShowNewCategory(false);
    } else {
      setError('A category with that name already exists.');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required.');
      return;
    }

    const dateError = validateDateAndTime(dueDate, dueTime);
    if (dateError) {
      setError(dateError);
      return;
    }

    // Flush any pending tag text before saving
    let finalTags = [...tags];
    const pendingTag = tagInput
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[^a-z0-9-_]/g, '');
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag);
    }

    onSave(
      {
        title: trimmedTitle,
        description: description.trim(),
        dueDate,
        dueTime,
        priority,
        category,
        tags: finalTags,
      },
      editingTask?.id
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2
                id="task-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="task-title"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Prepare quarterly review slides"
                  autoFocus
                  maxLength={140}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes, sub-steps, or reference links..."
                  maxLength={500}
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Due Date</span>
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        if (!e.target.value) setDueTime('');
                        if (error) setError(null);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setDueTime('');
                        }}
                        aria-label="Clear due date"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-due-time"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Due Time</span>
                  </label>
                  <input
                    id="task-due-time"
                    type="time"
                    value={dueTime}
                    onChange={(e) => {
                      setDueTime(e.target.value);
                      if (error) setError(null);
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Priority
                  </span>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    {(['low', 'medium', 'high'] as Priority[]).map((level) => {
                      const active = priority === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriority(level)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-all whitespace-nowrap ${
                            active
                              ? 'bg-white text-blue-950 shadow-sm dark:bg-slate-900 dark:text-sky-300'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="task-category"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory((prev) => !prev)}
                      className="text-xs font-medium text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      {showNewCategory ? 'Cancel' : '+ New category'}
                    </button>
                  </div>

                  {showNewCategory ? (
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateInlineCategory();
                          }
                        }}
                        placeholder="Category name"
                        maxLength={28}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineCategory}
                        className="rounded-lg bg-blue-950 px-3 py-2 text-xs font-medium text-white hover:bg-blue-900 dark:bg-sky-500 dark:text-slate-950 whitespace-nowrap shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      id="task-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="task-tags"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <Tag className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Tags</span>
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="task-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a tag and press Enter (e.g., exam, urgent)"
                    maxLength={24}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setTags((prev) => prev.filter((item) => item !== tag))
                        }
                        aria-label={`Remove tag ${tag}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                      >
                        <span>#{tag}</span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-950 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 whitespace-nowrap shrink-0"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
