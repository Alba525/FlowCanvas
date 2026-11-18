import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Smile, Table2, CheckSquare, FileText } from 'lucide-react';
import { BlockEditor, createBlock } from './components/BlockEditor';
import { CoverPickerPopover } from './components/CoverPickerPopover';
import { HabitTrackerView } from './components/HabitTrackerView';
import { PageIcon } from './components/PageIcon';
import { Sidebar } from './components/Sidebar';
import { TaskDatabase } from './components/TaskDatabase';
import { TopBar } from './components/TopBar';
import {
  COVER_PRESETS,
  INITIAL_HABITS,
  INITIAL_PAGES,
  INITIAL_TASKS,
} from './data/initialWorkspace';
import {
  CanvasBlock,
  HabitItem,
  PageDoc,
  PageIconType,
  TaskItem,
} from './types/workspace';

const STORAGE_KEY = 'folio-workspace-v1';

interface StoredState {
  pages: PageDoc[];
  tasks: TaskItem[];
  habits: HabitItem[];
  activePageId: string;
}

function loadWorkspace(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return {
          pages: parsed.pages,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_TASKS,
          habits: Array.isArray(parsed.habits) ? parsed.habits : INITIAL_HABITS,
          activePageId:
            parsed.activePageId && parsed.pages.some((p) => p.id === parsed.activePageId)
              ? parsed.activePageId
              : parsed.pages[0].id,
        };
      }
    }
  } catch {
    // Fallback to clean initial state
  }
  return {
    pages: INITIAL_PAGES,
    tasks: INITIAL_TASKS,
    habits: INITIAL_HABITS,
    activePageId: INITIAL_PAGES[0].id,
  };
}

const ICON_CHOICES: Array<{ id: PageIconType; label: string }> = [
  { id: 'checklist', label: 'Checklist' },
  { id: 'repeat', label: 'Habit' },
  { id: 'doc', label: 'Document' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'bookmark', label: 'Bookmark' },
  { id: 'compass', label: 'Compass' },
];

export default function App() {
  const [initial] = useState<StoredState>(() => loadWorkspace());
  const [pages, setPages] = useState<PageDoc[]>(initial.pages);
  const [tasks, setTasks] = useState<TaskItem[]>(initial.tasks);
  const [habits, setHabits] = useState<HabitItem[]>(initial.habits);
  const [activePageId, setActivePageId] = useState<string>(initial.activePageId);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // Persist workspace locally
  useEffect(() => {
    try {
      const payload: StoredState = { pages, tasks, habits, activePageId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [pages, tasks, habits, activePageId]);

  // Keyboard shortcut Cmd/Ctrl + \ to toggle sidebar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close icon picker on outside click
  useEffect(() => {
    if (!iconPickerOpen) return;
    const close = () => setIconPickerOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [iconPickerOpen]);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) ?? pages[0],
    [pages, activePageId]
  );

  const parentPage = useMemo(
    () =>
      activePage.parentId ? pages.find((p) => p.id === activePage.parentId) : undefined,
    [pages, activePage]
  );

  const childSubpages = useMemo(
    () => pages.filter((p) => p.parentId === activePage.id),
    [pages, activePage.id]
  );

  const updateActivePage = (updater: (page: PageDoc) => PageDoc) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id ? { ...updater(p), updatedAt: Date.now() } : p
      )
    );
  };

  const handleCreatePage = (parentId?: string) => {
    const newPage: PageDoc = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      kind: 'canvas',
      parentId,
      icon: null,
      coverUrl: null,
      coverPosition: 50,
      isFavorite: false,
      fullWidth: false,
      updatedAt: Date.now(),
      blocks: [createBlock('text', '')],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (pageId === 'page-todo-dashboard') return;
    setPages((prev) => {
      const remaining = prev.filter((p) => p.id !== pageId && p.parentId !== pageId);
      if (activePageId === pageId) {
        setActivePageId(remaining[0]?.id ?? 'page-todo-dashboard');
      }
      return remaining;
    });
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [`# ${activePage.title || 'Untitled'}`, ''];
    if (activePage.kind === 'dashboard') {
      lines.push('## To Do', '');
      tasks.forEach((t) => {
        lines.push(`- [${t.done ? 'x' : ' '}] ${t.title} (${t.due})`);
      });
      lines.push('');
      if (activePage.reminderBlocks) {
        lines.push(`## ${activePage.reminderHeading ?? 'Reminders'}`, '');
        activePage.reminderBlocks.forEach((b) => {
          lines.push(`- [${b.checked ? 'x' : ' '}] ${b.content}`);
        });
        lines.push('');
      }
    }
    activePage.blocks.forEach((b) => {
      if (b.type === 'h1') lines.push(`# ${b.content}`);
      else if (b.type === 'h2') lines.push(`## ${b.content}`);
      else if (b.type === 'h3') lines.push(`### ${b.content}`);
      else if (b.type === 'todo') lines.push(`- [${b.checked ? 'x' : ' '}] ${b.content}`);
      else if (b.type === 'bullet') lines.push(`- ${b.content}`);
      else if (b.type === 'number') lines.push(`1. ${b.content}`);
      else if (b.type === 'quote') lines.push(`> ${b.content}`);
      else if (b.type === 'divider') lines.push('---');
      else if (b.type === 'code') lines.push('```', b.content, '```');
      else if (b.content) lines.push(b.content);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activePage.title || 'untitled').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyStarterTemplate = (template: 'checklist' | 'notes' | 'dashboard') => {
    if (template === 'dashboard') {
      updateActivePage((p) => ({
        ...p,
        title: p.title || 'Project Tracker',
        kind: 'dashboard',
        icon: p.icon ?? 'checklist',
        reminderHeading: 'Reminders',
        reminderBlocks: [createBlock('todo', 'Review milestones')],
      }));
      return;
    }

    const blocks: CanvasBlock[] =
      template === 'checklist'
        ? [
            { ...createBlock('h2', 'Action Items') },
            { ...createBlock('todo', 'Define weekly priorities'), checked: false },
            { ...createBlock('todo', 'Draft outline'), checked: false },
            createBlock('text', ''),
          ]
        : [
            createBlock('h2', 'Overview'),
            createBlock('bullet', 'Key objective for this week'),
            createBlock('bullet', 'Open questions & next steps'),
            createBlock('divider', ''),
            createBlock('text', ''),
          ];

    updateActivePage((p) => ({
      ...p,
      title: p.title || (template === 'checklist' ? 'Weekly Checklist' : 'Meeting Notes'),
      blocks,
    }));
  };

  const coverPreset = COVER_PRESETS.find((c) => c.url === activePage.coverUrl);
  const isBlankCanvas =
    activePage.kind === 'canvas' &&
    !activePage.title &&
    activePage.blocks.length === 1 &&
    activePage.blocks[0].content === '' &&
    activePage.blocks[0].type === 'text';

  const containerMaxWidth = activePage.fullWidth
    ? 'max-w-full px-8 sm:px-14'
    : activePage.kind === 'dashboard'
    ? 'max-w-[1160px] px-6 sm:px-12'
    : 'max-w-[780px] px-6 sm:px-12';

  return (
    <div className="min-h-screen flex bg-white text-[#37352F]">
      {/* Collapsible Left Workspace Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        pages={pages}
        activePageId={activePage.id}
        onSelectPage={setActivePageId}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onCollapse={() => setSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <TopBar
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          page={activePage}
          parentPage={parentPage}
          onSelectPage={setActivePageId}
          onToggleFavorite={() =>
            updateActivePage((p) => ({ ...p, isFavorite: !p.isFavorite }))
          }
          onToggleFullWidth={() =>
            updateActivePage((p) => ({ ...p, fullWidth: !p.fullWidth }))
          }
          onOpenCoverPicker={() => setCoverPickerOpen(true)}
          onExportMarkdown={handleExportMarkdown}
          onDeletePage={() => handleDeletePage(activePage.id)}
        />

        <main className="flex-1 pb-24">
          {/* Page Cover Banner */}
          {activePage.coverUrl && (
            <div
              style={{
                background:
                  coverPreset?.fallbackGradient ??
                  'linear-gradient(120deg, #e7e5df 0%, #d4d1c8 100%)',
              }}
              className="group relative w-full h-[180px] sm:h-[205px] overflow-hidden bg-[#F1F1EF]"
            >
              <img
                src={activePage.coverUrl}
                alt={`${activePage.title || 'Page'} cover`}
                referrerPolicy="no-referrer"
                style={{ objectPosition: `50% ${activePage.coverPosition}%` }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => setCoverPickerOpen(true)}
                  className="px-2.5 py-1 rounded bg-white/90 hover:bg-white text-[12px] font-medium text-[#37352F] shadow-sm border border-black/10 transition-colors"
                >
                  Change cover
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateActivePage((p) => ({
                      ...p,
                      coverPosition: p.coverPosition >= 75 ? 25 : p.coverPosition + 25,
                    }))
                  }
                  className="px-2.5 py-1 rounded bg-white/90 hover:bg-white text-[12px] font-medium text-[#37352F] shadow-sm border border-black/10 transition-colors"
                >
                  Reposition
                </button>
              </div>
            </div>
          )}

          {/* Page Header & Content Container */}
          <div className={`mx-auto w-full ${containerMaxWidth}`}>
            {/* Icon + Hover Actions + Page Title */}
            <div className={`group relative ${activePage.coverUrl ? 'pt-0' : 'pt-14'}`}>
              {/* Overlapping Page Icon */}
              {activePage.icon && (
                <div
                  className={`relative inline-block ${
                    activePage.coverUrl ? '-mt-7 mb-3' : 'mb-3'
                  }`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen((v) => !v)}
                    title="Change icon"
                    className="p-1 rounded-lg hover:bg-[#EFEFED]/80 transition-colors"
                  >
                    <PageIcon icon={activePage.icon} size="lg" />
                  </button>
                </div>
              )}

              {/* Subtle Notion Hover Controls (Add icon / Add cover) */}
              <div
                className={`flex items-center gap-2 text-[12.5px] text-[#9B9A97] mb-1.5 transition-opacity duration-150 ${
                  activePage.icon && activePage.coverUrl
                    ? 'opacity-0 group-hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                } ${!activePage.icon && !activePage.coverUrl ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100' : ''}`}
              >
                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen((v) => !v)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#EFEFED] hover:text-[#5F5E5B] transition-colors"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>{activePage.icon ? 'Change icon' : 'Add icon'}</span>
                  </button>
                </div>
                {!activePage.coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverPickerOpen(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#EFEFED] hover:text-[#5F5E5B] transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Add cover</span>
                  </button>
                )}
              </div>

              {/* Icon Picker Popover */}
              {iconPickerOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute z-40 mt-1 w-64 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_8px_24px_rgba(15,15,15,0.12)] p-2.5"
                >
                  <div className="flex items-center justify-between px-1 pb-2">
                    <span className="text-[11.5px] font-medium text-[#787774]">
                      Page icon
                    </span>
                    {activePage.icon && (
                      <button
                        type="button"
                        onClick={() => {
                          updateActivePage((p) => ({ ...p, icon: null }));
                          setIconPickerOpen(false);
                        }}
                        className="text-[11.5px] text-[#787774] hover:text-[#37352F]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ICON_CHOICES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateActivePage((p) => ({ ...p, icon: item.id }));
                          setIconPickerOpen(false);
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-[#F1F1EF] transition-colors"
                      >
                        <PageIcon icon={item.id} size="md" />
                        <span className="text-[11px] text-[#5F5E5B]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Page Title */}
              <input
                type="text"
                value={activePage.title}
                onChange={(e) => {
                  const val = e.target.value;
                  updateActivePage((p) => ({ ...p, title: val }));
                }}
                placeholder="New page"
                aria-label="Page title"
                className="w-full font-display text-[32px] sm:text-[38px] font-bold tracking-[-0.025em] leading-[1.2] text-[#37352F] placeholder:text-[#37352F]/20 bg-transparent outline-none mb-6"
              />
            </div>

            {/* Page Body by Kind */}
            {activePage.kind === 'dashboard' ? (
              <div className="flex flex-col lg:flex-row items-start gap-10 xl:gap-14">
                {/* Left Column: Inline To-Do Database + Slash Block Canvas */}
                <div className="flex-1 w-full min-w-0">
                  <TaskDatabase tasks={tasks} onChange={setTasks} />

                  {/* Canvas Block Editor below Task Database ("Press / to insert blocks") */}
                  <div className="mt-7 pl-0 sm:pl-1">
                    <BlockEditor
                      blocks={activePage.blocks}
                      onChange={(nextBlocks) =>
                        updateActivePage((p) => ({ ...p, blocks: nextBlocks }))
                      }
                      emptyFirstPlaceholder="Press / to insert blocks"
                    />
                  </div>
                </div>

                {/* Right Column: Reminders (This Week) + Subpages */}
                <aside className="w-full lg:w-[350px] xl:w-[390px] shrink-0">
                  <input
                    type="text"
                    value={activePage.reminderHeading ?? 'Reminders (This Week)'}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateActivePage((p) => ({ ...p, reminderHeading: val }));
                    }}
                    aria-label="Reminders section heading"
                    className="w-full font-display text-[19px] font-semibold tracking-[-0.015em] text-[#37352F] bg-transparent outline-none mb-2.5"
                  />

                  <BlockEditor
                    blocks={activePage.reminderBlocks ?? []}
                    onChange={(nextReminders) =>
                      updateActivePage((p) => ({ ...p, reminderBlocks: nextReminders }))
                    }
                    emptyFirstPlaceholder="Press / to insert blocks"
                    showGutterControls={false}
                    compact
                    addButtonLabel="Add reminder"
                  />

                  {/* Linked Subpages (e.g. Habit Tracker) */}
                  {childSubpages.length > 0 && (
                    <div className="mt-5 space-y-1">
                      {childSubpages.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActivePageId(sub.id)}
                          className="w-full flex items-center gap-2 py-1.5 px-1 -mx-1 rounded hover:bg-[#F7F7F5] text-left transition-colors group"
                        >
                          <PageIcon icon={sub.icon} size="md" />
                          <span className="text-[14.5px] font-medium text-[#37352F] underline decoration-[#D4D3CE] underline-offset-4 group-hover:decoration-[#37352F]">
                            {sub.title || 'Untitled'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
            ) : activePage.kind === 'habits' ? (
              <div>
                <HabitTrackerView habits={habits} onChange={setHabits} />
                <BlockEditor
                  blocks={activePage.blocks}
                  onChange={(nextBlocks) =>
                    updateActivePage((p) => ({ ...p, blocks: nextBlocks }))
                  }
                  emptyFirstPlaceholder="Press / to insert blocks"
                />
              </div>
            ) : (
              <div className="min-h-[420px] flex flex-col justify-between">
                <BlockEditor
                  blocks={activePage.blocks}
                  onChange={(nextBlocks) =>
                    updateActivePage((p) => ({ ...p, blocks: nextBlocks }))
                  }
                  emptyFirstPlaceholder="Press / to insert blocks"
                />

                {isBlankCanvas && (
                  <div className="mt-24 pt-6">
                    <div className="text-[12px] text-[#9B9A97] mb-2.5">
                      Get started with
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyStarterTemplate('checklist')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E6E5E1] bg-white hover:bg-[#F7F7F5] text-[13px] font-medium text-[#5F5E5B] transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-[#787774]" />
                        <span>To-do list</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStarterTemplate('notes')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E6E5E1] bg-white hover:bg-[#F7F7F5] text-[13px] font-medium text-[#5F5E5B] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#787774]" />
                        <span>Meeting notes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStarterTemplate('dashboard')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E6E5E1] bg-white hover:bg-[#F7F7F5] text-[13px] font-medium text-[#5F5E5B] transition-colors"
                      >
                        <Table2 className="w-3.5 h-3.5 text-[#787774]" />
                        <span>Task dashboard</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cover Gallery Modal */}
      <CoverPickerPopover
        isOpen={coverPickerOpen}
        currentCoverUrl={activePage.coverUrl}
        onSelectCover={(url) => updateActivePage((p) => ({ ...p, coverUrl: url }))}
        onClose={() => setCoverPickerOpen(false)}
      />
    </div>
  );
}
