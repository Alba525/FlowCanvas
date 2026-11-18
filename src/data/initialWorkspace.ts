import { CoverPreset, HabitItem, PageDoc, TaskItem } from '../types/workspace';

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'ukiyoe-coast',
    label: 'Coastal Woodblock',
    url: '/src/assets/images/cover_ukiyoe_landscape_1795022253182.jpg',
    fallbackGradient: 'linear-gradient(120deg, #dce5dc 0%, #c8d6df 50%, #e7dcc8 100%)',
  },
  {
    id: 'alpine-mist',
    label: 'Alpine Dawn',
    url: '/src/assets/images/cover_alpine_mist_1795022252167.jpg',
    fallbackGradient: 'linear-gradient(120deg, #cfd9e3 0%, #99afc2 55%, #5b7186 100%)',
  },
  {
    id: 'travertine-arch',
    label: 'Travertine Atrium',
    url: '/src/assets/images/cover_bauhaus_stone_1795022253718.jpg',
    fallbackGradient: 'linear-gradient(120deg, #e9dfd1 0%, #d4c4ae 55%, #b8a388 100%)',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Personal Project (Meeting and improvements)',
    due: 'Today',
    done: false,
    createdAt: 1,
  },
  {
    id: 'task-2',
    title: 'Finish word bank practice on boundaries and Vocab unit 1-4',
    due: 'Today',
    done: false,
    createdAt: 2,
  },
  {
    id: 'task-3',
    title: 'Work on SAA Research template',
    due: 'Tomorrow',
    done: false,
    createdAt: 3,
  },
  {
    id: 'task-4',
    title: 'MateROV Document',
    due: 'Tomorrow',
    done: false,
    createdAt: 4,
  },
  {
    id: 'task-5',
    title: 'Science Test Crit A',
    due: 'Tomorrow',
    done: false,
    createdAt: 5,
  },
  {
    id: 'task-6',
    title: 'Electronics Criteria B',
    due: 'Next Monday',
    done: false,
    createdAt: 6,
  },
  {
    id: 'task-7',
    title: 'Submit physics lab reflection draft',
    due: 'This Week',
    done: true,
    createdAt: 7,
  },
];

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'hab-1',
    name: 'Morning Reading (20 mins)',
    days: [true, true, true, false, true, true, false],
  },
  {
    id: 'hab-2',
    name: 'SAT Vocab & Practice',
    days: [true, true, false, true, true, false, false],
  },
  {
    id: 'hab-3',
    name: 'Deep Work Block (90 mins)',
    days: [true, false, true, true, false, false, false],
  },
  {
    id: 'hab-4',
    name: 'Evening Walk & Reset',
    days: [true, true, true, true, true, false, false],
  },
];

export const INITIAL_PAGES: PageDoc[] = [
  {
    id: 'page-todo-dashboard',
    title: 'To Do List',
    kind: 'dashboard',
    icon: 'checklist',
    coverUrl: COVER_PRESETS[0].url,
    coverPosition: 45,
    isFavorite: true,
    fullWidth: false,
    updatedAt: Date.now() - 60_000,
    blocks: [
      {
        id: 'dash-block-1',
        type: 'text',
        content: '',
      },
    ],
    reminderHeading: 'Reminders (This Week)',
    reminderBlocks: [
      {
        id: 'rem-1',
        type: 'todo',
        content: 'Send Email to Madam Lery for meet up at Wednesday Afterschool',
        checked: true,
      },
      {
        id: 'rem-2',
        type: 'todo',
        content: 'Schedule Meeting with Counselor to discuss university requirements and application in Saudi Arabia',
        checked: true,
      },
      {
        id: 'rem-3',
        type: 'todo',
        content: 'Wear thobe or traditional clothes to science (November 17, 2026)',
        checked: true,
      },
      {
        id: 'rem-4',
        type: 'todo',
        content: 'Complete an SAT Practice on Bluebook at least once this week',
        checked: false,
      },
    ],
  },
  {
    id: 'page-habit-tracker',
    title: 'Habit Tracker',
    kind: 'habits',
    parentId: 'page-todo-dashboard',
    icon: 'repeat',
    coverUrl: COVER_PRESETS[1].url,
    coverPosition: 50,
    isFavorite: false,
    fullWidth: false,
    updatedAt: Date.now() - 3600_000,
    blocks: [
      {
        id: 'hab-block-1',
        type: 'h2',
        content: 'Weekly Reflection',
      },
      {
        id: 'hab-block-2',
        type: 'text',
        content: '',
      },
    ],
  },
  {
    id: 'page-blank-scratchpad',
    title: 'New page',
    kind: 'canvas',
    icon: null,
    coverUrl: null,
    coverPosition: 50,
    isFavorite: false,
    fullWidth: false,
    updatedAt: Date.now() - 7200_000,
    blocks: [
      {
        id: 'blank-block-1',
        type: 'text',
        content: '',
      },
    ],
  },
];
