import React, { useEffect, useRef } from 'react';
import {
  CheckSquare,
  ChevronRight,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  MessageSquare,
  Minus,
  Quote,
  Type,
} from 'lucide-react';
import { BlockType } from '../types/workspace';

export interface SlashBlockOption {
  type: BlockType;
  label: string;
  description: string;
  shortcut?: string;
  keywords: string[];
  icon: React.ReactNode;
}

export const SLASH_BLOCK_OPTIONS: SlashBlockOption[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Just start writing with plain text.',
    keywords: ['text', 'paragraph', 'plain', 'p'],
    icon: <Type className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'h1',
    label: 'Heading 1',
    description: 'Big section heading.',
    shortcut: '#',
    keywords: ['heading', 'h1', 'title', 'big', 'header'],
    icon: <Heading1 className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading.',
    shortcut: '##',
    keywords: ['heading', 'h2', 'subtitle', 'medium', 'header'],
    icon: <Heading2 className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'h3',
    label: 'Heading 3',
    description: 'Small section heading.',
    shortcut: '###',
    keywords: ['heading', 'h3', 'small', 'header'],
    icon: <Heading3 className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'todo',
    label: 'To-do list',
    description: 'Track tasks with a to-do list.',
    shortcut: '[]',
    keywords: ['todo', 'to-do', 'task', 'checkbox', 'check'],
    icon: <CheckSquare className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'bullet',
    label: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    shortcut: '-',
    keywords: ['bullet', 'bulleted', 'list', 'unordered', 'ul'],
    icon: <List className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'number',
    label: 'Numbered list',
    description: 'Create a list with numbering.',
    shortcut: '1.',
    keywords: ['numbered', 'number', 'ordered', 'ol', 'list'],
    icon: <ListOrdered className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'toggle',
    label: 'Toggle list',
    description: 'Toggles can hide and show content inside.',
    shortcut: '>',
    keywords: ['toggle', 'collapse', 'accordion', 'dropdown'],
    icon: <ChevronRight className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Capture a quote.',
    shortcut: '"',
    keywords: ['quote', 'blockquote', 'citation'],
    icon: <Quote className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks.',
    shortcut: '---',
    keywords: ['divider', 'line', 'separator', 'hr'],
    icon: <Minus className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Make writing stand out.',
    keywords: ['callout', 'note', 'info', 'highlight'],
    icon: <MessageSquare className="w-4 h-4 text-[#37352F]" />,
  },
  {
    type: 'code',
    label: 'Code',
    description: 'Capture a code snippet.',
    shortcut: '```',
    keywords: ['code', 'snippet', 'pre', 'mono'],
    icon: <Code2 className="w-4 h-4 text-[#37352F]" />,
  },
];

export function filterSlashOptions(query: string): SlashBlockOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_BLOCK_OPTIONS;
  return SLASH_BLOCK_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.description.toLowerCase().includes(q) ||
      opt.keywords.some((k) => k.includes(q))
  );
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number; lineHeight: number };
  options: SlashBlockOption[];
  activeIndex: number;
  query: string;
  onSelect: (type: BlockType) => void;
  onHoverIndex: (index: number) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  position,
  options,
  activeIndex,
  query,
  onSelect,
  onHoverIndex,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const MENU_WIDTH = 316;
  const MENU_MAX_HEIGHT = 340;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

  const clampedLeft = Math.max(12, Math.min(position.left, viewportWidth - MENU_WIDTH - 12));
  const spaceBelow = viewportHeight - (position.top + 6);
  const shouldFlipUp = spaceBelow < 240 && position.top > MENU_MAX_HEIGHT;
  const computedTop = shouldFlipUp
    ? Math.max(12, position.top - position.lineHeight - Math.min(MENU_MAX_HEIGHT, options.length * 52 + 48))
    : Math.min(position.top + 4, viewportHeight - 160);

  return (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Insert block"
      style={{
        top: `${computedTop}px`,
        left: `${clampedLeft}px`,
        width: `${MENU_WIDTH}px`,
      }}
      className="fixed z-50 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_8px_28px_rgba(15,15,15,0.12),0_2px_6px_rgba(15,15,15,0.06)] overflow-hidden select-none animate-in fade-in duration-100"
    >
      <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between border-b border-[#F1F1EF]">
        <span className="text-[11px] font-medium text-[#787774] tracking-[0.01em]">
          Basic blocks
        </span>
        {query && (
          <span className="text-[11px] font-mono text-[#9B9A97] tabular-nums">
            /{query}
          </span>
        )}
      </div>

      <div className="max-h-[296px] overflow-y-auto py-1.5 px-1.5">
        {options.length === 0 ? (
          <div className="px-3 py-6 text-center text-[13px] text-[#9B9A97]">
            No matching blocks for “{query}”
          </div>
        ) : (
          options.map((option, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={option.type}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => onHoverIndex(idx)}
                onMouseDown={(e) => {
                  // Prevent editor blur before selection fires
                  e.preventDefault();
                  onSelect(option.type);
                }}
                className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors duration-75 ${
                  isActive ? 'bg-[#F1F1EF]' : 'bg-transparent hover:bg-[#F7F7F5]'
                }`}
              >
                <div className="w-10 h-10 rounded-[5px] bg-white border border-[#E6E5E1] flex items-center justify-center shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
                  {option.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-[#37352F] truncate">
                      {option.label}
                    </span>
                    {option.shortcut && (
                      <span className="text-[11px] font-mono text-[#9B9A97] shrink-0">
                        {option.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#787774] truncate leading-snug">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
