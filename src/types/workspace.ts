export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'todo'
  | 'bullet'
  | 'number'
  | 'toggle'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'code';

export interface CanvasBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  isOpen?: boolean;
  details?: string;
}

export type DueBucket = 'Today' | 'Tomorrow' | 'Next Monday' | 'This Week' | 'No date';

export interface TaskItem {
  id: string;
  title: string;
  due: DueBucket;
  done: boolean;
  createdAt: number;
}

export interface HabitItem {
  id: string;
  name: string;
  days: boolean[]; // 7 days (Mon..Sun)
}

export type PageIconType = 'checklist' | 'repeat' | 'doc' | 'calendar' | 'bookmark' | 'compass';

export type PageKind = 'dashboard' | 'habits' | 'canvas';

export interface PageDoc {
  id: string;
  title: string;
  kind: PageKind;
  parentId?: string;
  icon: PageIconType | null;
  coverUrl: string | null;
  coverPosition: number; // percentage Y offset 0-100
  isFavorite: boolean;
  fullWidth: boolean;
  updatedAt: number;
  // Canvas blocks for standard pages or left-column canvas on dashboard
  blocks: CanvasBlock[];
  // Right-column reminder blocks on dashboard
  reminderHeading?: string;
  reminderBlocks?: CanvasBlock[];
}

export interface CoverPreset {
  id: string;
  label: string;
  url: string;
  fallbackGradient: string;
}
