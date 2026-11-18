import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Copy,
  GripVertical,
  Lightbulb,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { BlockType, CanvasBlock } from '../types/workspace';
import {
  filterSlashOptions,
  SLASH_BLOCK_OPTIONS,
  SlashCommandMenu,
} from './SlashCommandMenu';

interface EditableContentProps {
  blockId: string;
  blockType: BlockType;
  initialContent: string;
  placeholder: string;
  className: string;
  registerRef: (el: HTMLDivElement | null) => void;
  onTextChange: (text: string, el: HTMLDivElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Uncontrolled-contenteditable wrapper that syncs DOM text only when block identity
 * or block type changes, preventing React re-renders from jumping the caret.
 */
const EditableContent: React.FC<EditableContentProps> = React.memo(
  ({
    blockId,
    blockType,
    initialContent,
    placeholder,
    className,
    registerRef,
    onTextChange,
    onKeyDown,
    onFocus,
    onBlur,
  }) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const lastSyncedKey = useRef<string>('');

    useEffect(() => {
      const el = localRef.current;
      if (!el) return;
      const syncKey = `${blockId}:${blockType}`;
      if (lastSyncedKey.current !== syncKey || el.textContent !== initialContent) {
        if (document.activeElement !== el || lastSyncedKey.current !== syncKey) {
          el.textContent = initialContent;
        }
        lastSyncedKey.current = syncKey;
      }
    }, [blockId, blockType, initialContent]);

    const handleRef = useCallback(
      (el: HTMLDivElement | null) => {
        localRef.current = el;
        registerRef(el);
      },
      [registerRef]
    );

    return (
      <div
        ref={handleRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="false"
        data-placeholder={placeholder}
        onInput={(e) => {
          const el = e.currentTarget;
          // Normalize bare <br> leftover from browser when clearing contentEditable
          if (el.innerHTML === '<br>') {
            el.innerHTML = '';
          }
          onTextChange(el.textContent ?? '', el);
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`outline-none break-words whitespace-pre-wrap min-w-0 ${className}`}
      />
    );
  }
);

EditableContent.displayName = 'EditableContent';

interface SlashMenuState {
  blockId: string;
  query: string;
  activeIndex: number;
  position: { top: number; left: number; lineHeight: number };
}

interface BlockEditorProps {
  blocks: CanvasBlock[];
  onChange: (blocks: CanvasBlock[]) => void;
  emptyFirstPlaceholder?: string;
  showGutterControls?: boolean;
  compact?: boolean;
  onAddButtonClick?: () => void;
  addButtonLabel?: string;
}

export function createBlock(type: BlockType = 'text', content = ''): CanvasBlock {
  return {
    id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    content,
    checked: type === 'todo' ? false : undefined,
    isOpen: type === 'toggle' ? true : undefined,
    details: type === 'toggle' ? '' : undefined,
  };
}

function getCaretCoordinates(el: HTMLElement): { top: number; left: number; lineHeight: number } {
  const elRect = el.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(el);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rects = range.getClientRects();
    if (rects.length > 0) {
      const r = rects[0];
      if (r.top !== 0 || r.left !== 0) {
        return {
          top: r.bottom,
          left: r.left,
          lineHeight: r.height || lineHeight,
        };
      }
    }
    const bounding = range.getBoundingClientRect();
    if (bounding.top !== 0 || bounding.left !== 0) {
      return {
        top: bounding.bottom,
        left: bounding.left,
        lineHeight: bounding.height || lineHeight,
      };
    }
  }

  return {
    top: elRect.bottom,
    left: elRect.left,
    lineHeight,
  };
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onChange,
  emptyFirstPlaceholder = 'Press / to insert blocks',
  showGutterControls = true,
  compact = false,
  addButtonLabel,
}) => {
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [blockMenuId, setBlockMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [slashState, setSlashState] = useState<SlashMenuState | null>(null);

  const filteredOptions = useMemo(() => {
    if (!slashState) return [];
    return filterSlashOptions(slashState.query);
  }, [slashState]);

  const focusBlock = useCallback((blockId: string, toEnd = true) => {
    requestAnimationFrame(() => {
      const el = blockRefs.current[blockId];
      if (!el) return;
      el.focus();
      if (toEnd) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }, []);

  // Close block context menu when clicking outside
  useEffect(() => {
    if (!blockMenuId) return;
    const close = () => setBlockMenuId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [blockMenuId]);

  const handleSelectSlashOption = useCallback(
    (selectedType: BlockType) => {
      if (!slashState) return;
      const targetId = slashState.blockId;
      const index = blocks.findIndex((b) => b.id === targetId);
      if (index === -1) return;

      if (selectedType === 'divider') {
        const nextBlocks = [...blocks];
        nextBlocks[index] = {
          ...nextBlocks[index],
          type: 'divider',
          content: '',
        };
        const afterBlock = createBlock('text', '');
        nextBlocks.splice(index + 1, 0, afterBlock);
        onChange(nextBlocks);
        setSlashState(null);
        focusBlock(afterBlock.id, false);
        return;
      }

      const nextBlocks = blocks.map((b) =>
        b.id === targetId
          ? {
              ...b,
              type: selectedType,
              content: '',
              checked: selectedType === 'todo' ? false : undefined,
              isOpen: selectedType === 'toggle' ? true : undefined,
              details: selectedType === 'toggle' ? '' : undefined,
            }
          : b
      );
      onChange(nextBlocks);
      setSlashState(null);

      requestAnimationFrame(() => {
        const el = blockRefs.current[targetId];
        if (el) {
          el.textContent = '';
          el.focus();
        }
      });
    },
    [blocks, focusBlock, onChange, slashState]
  );

  const handleTextChange = useCallback(
    (block: CanvasBlock, text: string, el: HTMLDivElement) => {
      // Check markdown shortcuts when starting a line on plain text
      if (block.type === 'text') {
        const shortcutMap: Array<{ prefix: string; type: BlockType }> = [
          { prefix: '# ', type: 'h1' },
          { prefix: '## ', type: 'h2' },
          { prefix: '### ', type: 'h3' },
          { prefix: '[] ', type: 'todo' },
          { prefix: '[ ] ', type: 'todo' },
          { prefix: '- ', type: 'bullet' },
          { prefix: '* ', type: 'bullet' },
          { prefix: '1. ', type: 'number' },
          { prefix: '> ', type: 'toggle' },
        ];
        const matched = shortcutMap.find((s) => text === s.prefix);
        if (matched) {
          const next = blocks.map((b) =>
            b.id === block.id
              ? {
                  ...b,
                  type: matched.type,
                  content: '',
                  checked: matched.type === 'todo' ? false : undefined,
                  isOpen: matched.type === 'toggle' ? true : undefined,
                  details: matched.type === 'toggle' ? '' : undefined,
                }
              : b
          );
          onChange(next);
          setSlashState(null);
          requestAnimationFrame(() => {
            if (blockRefs.current[block.id]) {
              blockRefs.current[block.id]!.textContent = '';
              blockRefs.current[block.id]!.focus();
            }
          });
          return;
        }
      }

      // Detect slash command trigger on an empty line (text starts with '/')
      if (text.startsWith('/') && !text.includes('\n')) {
        const query = text.slice(1);
        const coords = getCaretCoordinates(el);
        setSlashState((prev) => ({
          blockId: block.id,
          query,
          activeIndex: prev && prev.blockId === block.id && prev.query === query ? prev.activeIndex : 0,
          position: coords,
        }));
      } else if (slashState?.blockId === block.id) {
        setSlashState(null);
      }

      const next = blocks.map((b) => (b.id === block.id ? { ...b, content: text } : b));
      onChange(next);
    },
    [blocks, onChange, slashState]
  );

  const handleKeyDown = useCallback(
    (block: CanvasBlock, index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
      // 1. If Slash Command Menu is open for this block, intercept Up/Down/Enter/Escape
      if (slashState && slashState.blockId === block.id) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (filteredOptions.length > 0) {
            setSlashState((prev) =>
              prev
                ? {
                    ...prev,
                    activeIndex: (prev.activeIndex + 1) % filteredOptions.length,
                  }
                : null
            );
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (filteredOptions.length > 0) {
            setSlashState((prev) =>
              prev
                ? {
                    ...prev,
                    activeIndex:
                      (prev.activeIndex - 1 + filteredOptions.length) % filteredOptions.length,
                  }
                : null
            );
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const chosen = filteredOptions[slashState.activeIndex];
          if (chosen) {
            handleSelectSlashOption(chosen.type);
          } else {
            setSlashState(null);
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSlashState(null);
          return;
        }
      }

      // 2. Normal Enter creates a new block below (continuing lists/todos unless empty)
      if (e.key === 'Enter' && !e.shiftKey) {
        if (block.type === 'code') {
          return; // allow newlines inside code blocks
        }
        e.preventDefault();

        const currentText = (e.currentTarget.textContent ?? '').trim();
        // Pressing Enter on an empty list/todo item reverts it to plain text
        if (
          currentText === '' &&
          (block.type === 'todo' ||
            block.type === 'bullet' ||
            block.type === 'number' ||
            block.type === 'quote' ||
            block.type === 'callout')
        ) {
          const next = blocks.map((b) =>
            b.id === block.id ? { ...b, type: 'text' as BlockType, checked: undefined } : b
          );
          onChange(next);
          focusBlock(block.id, false);
          return;
        }

        const nextType: BlockType =
          block.type === 'todo' || block.type === 'bullet' || block.type === 'number'
            ? block.type
            : 'text';
        const newBlock = createBlock(nextType, '');
        const nextBlocks = [...blocks];
        nextBlocks.splice(index + 1, 0, newBlock);
        onChange(nextBlocks);
        focusBlock(newBlock.id, false);
        return;
      }

      // 3. Backspace on empty block
      if (e.key === 'Backspace') {
        const currentText = e.currentTarget.textContent ?? '';
        if (currentText === '') {
          if (block.type !== 'text') {
            e.preventDefault();
            const next = blocks.map((b) =>
              b.id === block.id ? { ...b, type: 'text' as BlockType, checked: undefined } : b
            );
            onChange(next);
            focusBlock(block.id, false);
            return;
          }
          if (blocks.length > 1) {
            e.preventDefault();
            const prevBlock = blocks[index - 1] ?? blocks[index + 1];
            const next = blocks.filter((b) => b.id !== block.id);
            onChange(next);
            if (prevBlock && prevBlock.type !== 'divider') {
              focusBlock(prevBlock.id, true);
            }
          }
        }
        return;
      }

      // 4. ArrowUp / ArrowDown across blocks when slash menu is closed
      if (e.key === 'ArrowUp' && index > 0) {
        const sel = window.getSelection();
        if (sel && sel.anchorOffset === 0) {
          const prev = blocks[index - 1];
          if (prev && prev.type !== 'divider') {
            e.preventDefault();
            focusBlock(prev.id, true);
          }
        }
      } else if (e.key === 'ArrowDown' && index < blocks.length - 1) {
        const textLen = (e.currentTarget.textContent ?? '').length;
        const sel = window.getSelection();
        if (sel && sel.anchorOffset >= textLen) {
          const next = blocks[index + 1];
          if (next && next.type !== 'divider') {
            e.preventDefault();
            focusBlock(next.id, false);
          }
        }
      }
    },
    [blocks, filteredOptions, focusBlock, handleSelectSlashOption, onChange, slashState]
  );

  const openSlashMenuFromPlus = (index: number) => {
    const newBlk = createBlock('text', '/');
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, newBlk);
    onChange(nextBlocks);
    requestAnimationFrame(() => {
      const el = blockRefs.current[newBlk.id];
      if (!el) return;
      el.textContent = '/';
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      const coords = getCaretCoordinates(el);
      setSlashState({
        blockId: newBlk.id,
        query: '',
        activeIndex: 0,
        position: coords,
      });
    });
  };

  const getNumberIndex = (idx: number): number => {
    let count = 1;
    for (let i = idx - 1; i >= 0; i--) {
      if (blocks[i].type === 'number') count++;
      else break;
    }
    return count;
  };

  const getPlaceholder = (block: CanvasBlock, idx: number): string => {
    switch (block.type) {
      case 'h1':
        return 'Heading 1';
      case 'h2':
        return 'Heading 2';
      case 'h3':
        return 'Heading 3';
      case 'todo':
        return 'To-do';
      case 'bullet':
      case 'number':
        return 'List';
      case 'toggle':
        return 'Toggle';
      case 'quote':
        return 'Empty quote';
      case 'callout':
        return 'Type something...';
      case 'code':
        return '// Write code snippet...';
      case 'text':
      default:
        if (focusedId === block.id || idx === 0) {
          return emptyFirstPlaceholder;
        }
        return "Type '/' for commands";
    }
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    onChange(next);
    setBlockMenuId(null);
  };

  const turnIntoBlock = (blockId: string, newType: BlockType) => {
    const next = blocks.map((b) =>
      b.id === blockId
        ? {
            ...b,
            type: newType,
            checked: newType === 'todo' ? b.checked ?? false : undefined,
            isOpen: newType === 'toggle' ? true : undefined,
          }
        : b
    );
    onChange(next);
    setBlockMenuId(null);
    focusBlock(blockId, true);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) {
      onChange([createBlock('text', '')]);
    } else {
      onChange(blocks.filter((b) => b.id !== blockId));
    }
    setBlockMenuId(null);
  };

  return (
    <div className={`relative ${compact ? 'space-y-1' : 'space-y-1.5'}`}>
      {blocks.map((block, index) => {
        const isHovered = hoveredId === block.id || blockMenuId === block.id;

        return (
          <div
            key={block.id}
            onMouseEnter={() => setHoveredId(block.id)}
            onMouseLeave={() => setHoveredId((prev) => (prev === block.id ? null : prev))}
            className="group relative flex items-start"
          >
            {showGutterControls && (
              <div
                className={`absolute -left-12 top-0.5 flex items-center gap-0.5 transition-opacity duration-100 ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  title="Click to add block below"
                  onClick={() => openSlashMenuFromPlus(index)}
                  className="w-5 h-5 rounded flex items-center justify-center text-[#9B9A97] hover:bg-[#EFEFED] hover:text-[#37352F] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    title="Block options"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() =>
                      setBlockMenuId((prev) => (prev === block.id ? null : block.id))
                    }
                    className="w-5 h-5 rounded flex items-center justify-center text-[#9B9A97] hover:bg-[#EFEFED] hover:text-[#37352F] transition-colors"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>

                  {blockMenuId === block.id && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute left-0 top-6 z-40 w-48 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_6px_20px_rgba(15,15,15,0.1)] py-1.5 text-[13px]"
                    >
                      <div className="px-2.5 py-1 text-[11px] font-medium text-[#787774]">
                        Turn into
                      </div>
                      <div className="max-h-44 overflow-y-auto px-1">
                        {SLASH_BLOCK_OPTIONS.filter((o) => o.type !== 'divider').map((opt) => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => turnIntoBlock(block.id, opt.type)}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-[#F1F1EF] ${
                              block.type === opt.type ? 'text-[#2383E2] font-medium' : 'text-[#37352F]'
                            }`}
                          >
                            <span className="scale-90 opacity-80">{opt.icon}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="my-1 border-t border-[#F1F1EF]" />
                      <div className="px-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveBlock(index, -1)}
                          className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[#37352F] hover:bg-[#F1F1EF] disabled:opacity-40"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-[#787774]" />
                          <span>Move up</span>
                        </button>
                        <button
                          type="button"
                          disabled={index === blocks.length - 1}
                          onClick={() => moveBlock(index, 1)}
                          className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[#37352F] hover:bg-[#F1F1EF] disabled:opacity-40"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-[#787774]" />
                          <span>Move down</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[#C43E3E] hover:bg-[#FDF2F2]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Block Content Renderer */}
            <div className="flex-1 min-w-0">
              {block.type === 'divider' ? (
                <div className="py-3 flex items-center justify-between gap-2">
                  <div className="h-[1px] w-full bg-[#E6E5E1]" />
                </div>
              ) : block.type === 'todo' ? (
                <div className="flex items-start gap-2.5 py-[3px]">
                  <button
                    type="button"
                    aria-label={block.checked ? 'Mark incomplete' : 'Mark complete'}
                    onClick={() => {
                      const next = blocks.map((b) =>
                        b.id === block.id ? { ...b, checked: !b.checked } : b
                      );
                      onChange(next);
                    }}
                    className={`mt-[3px] w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 transition-colors duration-100 ${
                      block.checked
                        ? 'bg-[#2383E2] border border-[#2383E2] text-white'
                        : 'bg-white border-[1.5px] border-[#C7C6C2] hover:border-[#787774]'
                    }`}
                  >
                    {block.checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className={`flex-1 text-[14.5px] leading-[1.55] transition-colors ${
                      block.checked ? 'line-through text-[#9B9A97]' : 'text-[#37352F]'
                    }`}
                  />
                </div>
              ) : block.type === 'bullet' ? (
                <div className="flex items-start gap-2.5 py-[2px] pl-1">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[#37352F] shrink-0"
                  />
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className="flex-1 text-[15px] leading-[1.6] text-[#37352F]"
                  />
                </div>
              ) : block.type === 'number' ? (
                <div className="flex items-start gap-2 py-[2px] pl-0.5">
                  <span className="text-[14.5px] leading-[1.6] text-[#37352F] font-medium tabular-nums shrink-0 min-w-[18px]">
                    {getNumberIndex(index)}.
                  </span>
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className="flex-1 text-[15px] leading-[1.6] text-[#37352F]"
                  />
                </div>
              ) : block.type === 'toggle' ? (
                <div className="py-[2px]">
                  <div className="flex items-start gap-1.5">
                    <button
                      type="button"
                      aria-label={block.isOpen ? 'Collapse toggle' : 'Expand toggle'}
                      onClick={() => {
                        const next = blocks.map((b) =>
                          b.id === block.id ? { ...b, isOpen: !b.isOpen } : b
                        );
                        onChange(next);
                      }}
                      className="mt-1 w-5 h-5 rounded flex items-center justify-center text-[#37352F] hover:bg-[#EFEFED] shrink-0 transition-transform duration-150"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          block.isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    <EditableContent
                      blockId={block.id}
                      blockType={block.type}
                      initialContent={block.content}
                      placeholder={getPlaceholder(block, index)}
                      registerRef={(el) => {
                        blockRefs.current[block.id] = el;
                      }}
                      onTextChange={(text, el) => handleTextChange(block, text, el)}
                      onKeyDown={(e) => handleKeyDown(block, index, e)}
                      onFocus={() => setFocusedId(block.id)}
                      onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                      className="flex-1 text-[15px] font-medium leading-[1.6] text-[#37352F]"
                    />
                  </div>
                  {block.isOpen && (
                    <div className="pl-6 mt-1">
                      <input
                        type="text"
                        value={block.details ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange(
                            blocks.map((b) => (b.id === block.id ? { ...b, details: val } : b))
                          );
                        }}
                        placeholder="Empty toggle. Type nested notes here..."
                        className="w-full text-[14px] text-[#5F5E5B] placeholder:text-[#37352F]/35 bg-transparent outline-none py-0.5"
                      />
                    </div>
                  )}
                </div>
              ) : block.type === 'quote' ? (
                <div className="my-1 px-3.5 py-2.5 rounded-md bg-[#F7F7F5] border border-[#E6E5E1] flex items-start gap-2.5">
                  <span className="font-display text-lg leading-none text-[#9B9A97] select-none mt-0.5">
                    “
                  </span>
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className="flex-1 text-[15px] italic leading-[1.6] text-[#37352F]"
                  />
                </div>
              ) : block.type === 'callout' ? (
                <div className="my-1 px-3.5 py-3 rounded-md bg-[#F1F1EF] border border-[#E6E5E1] flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#787774] mt-1 shrink-0" />
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className="flex-1 text-[14.5px] leading-[1.55] text-[#37352F]"
                  />
                </div>
              ) : block.type === 'code' ? (
                <div className="my-1.5 rounded-md bg-[#F7F7F5] border border-[#E6E5E1] p-3.5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(block.content);
                      setCopiedId(block.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="absolute top-2.5 right-2.5 px-2 py-1 rounded text-[11px] font-medium text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFED] flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === block.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <EditableContent
                    blockId={block.id}
                    blockType={block.type}
                    initialContent={block.content}
                    placeholder={getPlaceholder(block, index)}
                    registerRef={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    onTextChange={(text, el) => handleTextChange(block, text, el)}
                    onKeyDown={(e) => handleKeyDown(block, index, e)}
                    onFocus={() => setFocusedId(block.id)}
                    onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                    className="font-mono text-[13px] leading-[1.6] text-[#37352F] pr-14"
                  />
                </div>
              ) : (
                <EditableContent
                  blockId={block.id}
                  blockType={block.type}
                  initialContent={block.content}
                  placeholder={getPlaceholder(block, index)}
                  registerRef={(el) => {
                    blockRefs.current[block.id] = el;
                  }}
                  onTextChange={(text, el) => handleTextChange(block, text, el)}
                  onKeyDown={(e) => handleKeyDown(block, index, e)}
                  onFocus={() => setFocusedId(block.id)}
                  onBlur={() => setFocusedId((prev) => (prev === block.id ? null : prev))}
                  className={
                    block.type === 'h1'
                      ? 'font-display text-[26px] font-bold tracking-[-0.02em] leading-[1.28] text-[#37352F] pt-3 pb-1'
                      : block.type === 'h2'
                      ? 'font-display text-[20px] font-semibold tracking-[-0.015em] leading-[1.32] text-[#37352F] pt-2.5 pb-0.5'
                      : block.type === 'h3'
                      ? 'font-display text-[17px] font-semibold tracking-[-0.01em] leading-[1.38] text-[#37352F] pt-1.5'
                      : 'text-[15px] leading-[1.6] text-[#37352F] py-[3px]'
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      {addButtonLabel && (
        <button
          type="button"
          onClick={() => {
            const newBlk = createBlock('todo', '');
            onChange([...blocks, newBlk]);
            focusBlock(newBlk.id, false);
          }}
          className="mt-1 inline-flex items-center gap-2 py-1 text-[13.5px] text-[#9B9A97] hover:text-[#37352F] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{addButtonLabel}</span>
        </button>
      )}

      {/* Floating Notion-style Slash Command Block Selector */}
      <SlashCommandMenu
        isOpen={Boolean(slashState)}
        position={slashState?.position ?? { top: 0, left: 0, lineHeight: 24 }}
        options={filteredOptions}
        activeIndex={
          slashState ? Math.min(slashState.activeIndex, Math.max(0, filteredOptions.length - 1)) : 0
        }
        query={slashState?.query ?? ''}
        onSelect={handleSelectSlashOption}
        onHoverIndex={(idx) =>
          setSlashState((prev) => (prev ? { ...prev, activeIndex: idx } : null))
        }
        onClose={() => setSlashState(null)}
      />
    </div>
  );
};
