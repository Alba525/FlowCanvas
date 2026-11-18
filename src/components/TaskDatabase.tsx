import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  CheckSquare,
  ChevronDown,
  ListFilter,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { DueBucket, TaskItem } from '../types/workspace';

interface TaskDatabaseProps {
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
}

const DUE_OPTIONS: DueBucket[] = ['Today', 'Tomorrow', 'Next Monday', 'This Week', 'No date'];

const DUE_RANK: Record<DueBucket, number> = {
  Today: 1,
  Tomorrow: 2,
  'This Week': 3,
  'Next Monday': 4,
  'No date': 5,
};

type SortMode = 'manual' | 'due' | 'alpha';

export const TaskDatabase: React.FC<TaskDatabaseProps> = ({ tasks, onChange }) => {
  const [view, setView] = useState<'todo' | 'done'>('todo');
  const [filterDue, setFilterDue] = useState<DueBucket | 'All'>('All');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [openMenu, setOpenMenu] = useState<'filter' | 'sort' | 'new' | null>(null);
  const [editingDueId, setEditingDueId] = useState<string | null>(null);

  const [addingInline, setAddingInline] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState<DueBucket>('Today');

  const inlineInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openMenu && !editingDueId) return;
    const handleDown = () => {
      setOpenMenu(null);
      setEditingDueId(null);
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [openMenu, editingDueId]);

  useEffect(() => {
    if (addingInline) {
      inlineInputRef.current?.focus();
    }
  }, [addingInline]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const todoCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);
  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);

  const visibleTasks = useMemo(() => {
    let list = tasks.filter((t) => (view === 'todo' ? !t.done : t.done));
    if (filterDue !== 'All') {
      list = list.filter((t) => t.due === filterDue);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.due.toLowerCase().includes(q)
      );
    }
    if (sortMode === 'due') {
      list = [...list].sort((a, b) => DUE_RANK[a.due] - DUE_RANK[b.due]);
    } else if (sortMode === 'alpha') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [tasks, view, filterDue, searchQuery, sortMode]);

  const toggleTask = (id: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const updateTitle = (id: string, title: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, title } : t)));
  };

  const updateDue = (id: string, due: DueBucket) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, due } : t)));
    setEditingDueId(null);
  };

  const deleteTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const commitNewTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      setAddingInline(false);
      return;
    }
    const item: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      due: newTaskDue,
      done: view === 'done',
      createdAt: Date.now(),
    };
    onChange([...tasks, item]);
    setNewTaskTitle('');
    inlineInputRef.current?.focus();
  };

  const startNewTaskWithDue = (due: DueBucket) => {
    setNewTaskDue(due);
    setAddingInline(true);
    setOpenMenu(null);
    requestAnimationFrame(() => inlineInputRef.current?.focus());
  };

  return (
    <section aria-label="Task database">
      {/* Database View Switcher & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EFEFED]">
        {/* Left: View tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('todo')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              view === 'todo'
                ? 'bg-[#EFEFED] text-[#37352F]'
                : 'text-[#787774] hover:bg-[#F7F7F5] hover:text-[#37352F]'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>To Do</span>
            <span className="text-[11px] text-[#787774] tabular-nums">{todoCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setView('done')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              view === 'done'
                ? 'bg-[#EFEFED] text-[#37352F]'
                : 'text-[#787774] hover:bg-[#F7F7F5] hover:text-[#37352F]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Done</span>
            <span className="text-[11px] text-[#787774] tabular-nums">{doneCount}</span>
          </button>
        </div>

        {/* Right: Filter, Sort, Search, New */}
        <div className="flex items-center gap-1 relative">
          {searchOpen && (
            <div className="flex items-center gap-1 bg-[#F7F7F5] border border-[#E6E5E1] rounded-md px-2 py-0.5 mr-1">
              <Search className="w-3.5 h-3.5 text-[#9B9A97]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="w-28 sm:w-36 text-[12.5px] bg-transparent outline-none text-[#37352F] placeholder:text-[#9B9A97]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#9B9A97] hover:text-[#37352F]"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Filter Menu */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              title="Filter by due date"
              onClick={() => setOpenMenu((m) => (m === 'filter' ? null : 'filter'))}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                filterDue !== 'All'
                  ? 'text-[#2383E2] bg-[#EBF3FC]'
                  : 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F]'
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>
            {openMenu === 'filter' && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_6px_20px_rgba(15,15,15,0.1)] py-1 text-[13px]">
                <div className="px-3 py-1 text-[11px] font-medium text-[#787774]">
                  Filter due date
                </div>
                {(['All', ...DUE_OPTIONS] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setFilterDue(opt);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#F1F1EF] text-[#37352F]"
                  >
                    <span>{opt === 'All' ? 'All tasks' : opt}</span>
                    {filterDue === opt && <Check className="w-3.5 h-3.5 text-[#2383E2]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Menu */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              title="Sort tasks"
              onClick={() => setOpenMenu((m) => (m === 'sort' ? null : 'sort'))}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                sortMode !== 'manual'
                  ? 'text-[#2383E2] bg-[#EBF3FC]'
                  : 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F]'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {openMenu === 'sort' && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_6px_20px_rgba(15,15,15,0.1)] py-1 text-[13px]">
                <div className="px-3 py-1 text-[11px] font-medium text-[#787774]">Sort by</div>
                {[
                  { id: 'manual' as SortMode, label: 'Default order' },
                  { id: 'due' as SortMode, label: 'Due date' },
                  { id: 'alpha' as SortMode, label: 'Title (A–Z)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortMode(opt.id);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#F1F1EF] text-[#37352F]"
                  >
                    <span>{opt.label}</span>
                    {sortMode === opt.id && <Check className="w-3.5 h-3.5 text-[#2383E2]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Toggle */}
          <button
            type="button"
            title="Search tasks"
            onClick={() => {
              setSearchOpen((prev) => {
                if (prev) setSearchQuery('');
                return !prev;
              });
            }}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              searchOpen
                ? 'text-[#2383E2] bg-[#EBF3FC]'
                : 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Primary Blue Split New Button */}
          <div className="relative flex items-center ml-1" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => startNewTaskWithDue('Today')}
              className="h-7 pl-2.5 pr-2 rounded-l-[5px] bg-[#2383E2] hover:bg-[#1C71C7] text-white text-[13px] font-medium transition-colors whitespace-nowrap shrink-0"
            >
              New
            </button>
            <button
              type="button"
              aria-label="New task options"
              onClick={() => setOpenMenu((m) => (m === 'new' ? null : 'new'))}
              className="h-7 px-1.5 rounded-r-[5px] bg-[#2383E2] hover:bg-[#1C71C7] text-white border-l border-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {openMenu === 'new' && (
              <div className="absolute right-0 top-8 z-30 w-48 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_6px_20px_rgba(15,15,15,0.1)] py-1 text-[13px]">
                <div className="px-3 py-1 text-[11px] font-medium text-[#787774]">
                  Quick schedule
                </div>
                {(['Today', 'Tomorrow', 'Next Monday', 'This Week'] as DueBucket[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => startNewTaskWithDue(d)}
                    className="w-full px-3 py-1.5 text-left text-[#37352F] hover:bg-[#F1F1EF] flex items-center justify-between"
                  >
                    <span>New task</span>
                    <span className="text-[12px] text-[#787774]">{d}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter bar indicator */}
      {filterDue !== 'All' && (
        <div className="flex items-center justify-between py-1.5 px-1 text-[12px] text-[#787774] border-b border-[#F1F1EF]">
          <span>
            Filtered by due date: <strong className="font-medium text-[#37352F]">{filterDue}</strong>
          </span>
          <button
            type="button"
            onClick={() => setFilterDue('All')}
            className="text-[#2383E2] hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Task Rows */}
      <div className="divide-y divide-[#F1F1EF]">
        {visibleTasks.length === 0 && !addingInline ? (
          <div className="py-6 text-[13.5px] text-[#9B9A97] flex items-center justify-between">
            <span>
              {searchQuery || filterDue !== 'All'
                ? 'No tasks match your current filter.'
                : view === 'todo'
                ? 'All tasks completed.'
                : 'No completed tasks yet.'}
            </span>
            {(searchQuery || filterDue !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDue('All');
                }}
                className="text-[12.5px] text-[#2383E2] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div
              key={task.id}
              className="group min-h-[38px] py-1.5 px-1 flex items-center justify-between gap-3 hover:bg-[#F7F7F5]/75 rounded-sm transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  aria-label={task.done ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                  onClick={() => toggleTask(task.id)}
                  className={`w-[15px] h-[15px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors ${
                    task.done
                      ? 'bg-[#2383E2] border border-[#2383E2] text-white'
                      : 'bg-white border border-[#C7C6C2] hover:border-[#787774]'
                  }`}
                >
                  {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTitle(task.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  aria-label="Task title"
                  className={`w-full bg-transparent outline-none text-[14px] leading-snug truncate ${
                    task.done ? 'line-through text-[#9B9A97]' : 'text-[#37352F]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 relative" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setEditingDueId((id) => (id === task.id ? null : task.id))}
                  className={`text-[13px] px-1.5 py-0.5 rounded hover:bg-[#EFEFED] transition-colors whitespace-nowrap ${
                    task.due === 'Today' && !task.done
                      ? 'text-[#37352F] font-medium'
                      : 'text-[#787774]'
                  }`}
                >
                  {task.due}
                </button>

                {editingDueId === task.id && (
                  <div className="absolute right-6 top-7 z-30 w-36 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_6px_20px_rgba(15,15,15,0.1)] py-1 text-[12.5px]">
                    {DUE_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateDue(task.id, d)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#F1F1EF] text-[#37352F]"
                      >
                        <span>{d}</span>
                        {task.due === d && <Check className="w-3 h-3 text-[#2383E2]" />}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  aria-label="Delete task"
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#9B9A97] hover:text-[#C43E3E] p-1 rounded transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Inline + New task row */}
        {addingInline ? (
          <div className="min-h-[38px] py-1.5 px-1 flex items-center justify-between gap-3 bg-[#F7F7F5]/60">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="w-[15px] h-[15px] rounded-[3px] border border-[#D4D3CE] bg-white shrink-0" />
              <input
                ref={inlineInputRef}
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitNewTask();
                  } else if (e.key === 'Escape') {
                    setNewTaskTitle('');
                    setAddingInline(false);
                  }
                }}
                onBlur={() => {
                  if (newTaskTitle.trim()) {
                    commitNewTask();
                  } else {
                    setAddingInline(false);
                  }
                }}
                placeholder="Type a task name and press Enter..."
                className="w-full bg-transparent outline-none text-[14px] text-[#37352F] placeholder:text-[#9B9A97]"
              />
            </div>
            <select
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value as DueBucket)}
              aria-label="Due date"
              className="text-[12.5px] text-[#787774] bg-transparent outline-none cursor-pointer"
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingInline(true)}
            className="w-full min-h-[36px] py-1.5 px-1 flex items-center gap-2 text-[13.5px] text-[#9B9A97] hover:text-[#37352F] hover:bg-[#F7F7F5]/75 transition-colors text-left"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New task</span>
          </button>
        )}
      </div>
    </section>
  );
};
