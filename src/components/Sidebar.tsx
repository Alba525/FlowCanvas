import React, { useState } from 'react';
import { ChevronRight, ChevronsLeft, Plus, Search, Trash2 } from 'lucide-react';
import { PageDoc } from '../types/workspace';
import { PageIcon } from './PageIcon';

interface SidebarProps {
  isOpen: boolean;
  pages: PageDoc[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onCollapse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    'page-todo-dashboard': true,
  });

  if (!isOpen) return null;

  const favorites = pages.filter((p) => p.isFavorite);
  const rootPages = pages.filter((p) => !p.parentId);
  const filteredPages = searchTerm.trim()
    ? pages.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderPageRow = (page: PageDoc, depth = 0) => {
    const children = pages.filter((p) => p.parentId === page.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents[page.id] ?? true;
    const isActive = activePageId === page.id;

    return (
      <div key={page.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPage(page.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPage(page.id);
            }
          }}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          className={`group flex items-center justify-between gap-1.5 pr-2 py-1.5 rounded-[5px] text-[13.5px] cursor-pointer transition-colors ${
            isActive
              ? 'bg-[#EFEFED] text-[#37352F] font-medium'
              : 'text-[#5F5E5B] hover:bg-[#EFEFED]/70 hover:text-[#37352F]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                aria-label={isExpanded ? 'Collapse subpages' : 'Expand subpages'}
                onClick={(e) => toggleExpand(page.id, e)}
                className="w-4 h-4 rounded flex items-center justify-center text-[#9B9A97] hover:bg-[#E3E2DF] shrink-0"
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-150 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <PageIcon icon={page.icon} size="sm" />
            <span className="truncate">{page.title || 'Untitled'}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {pages.length > 1 && page.id !== 'page-todo-dashboard' && (
              <button
                type="button"
                title="Delete page"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
                className="p-0.5 rounded text-[#9B9A97] hover:text-[#C43E3E] hover:bg-[#E3E2DF]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              title="Add subpage"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedParents((prev) => ({ ...prev, [page.id]: true }));
                onCreatePage(page.id);
              }}
              className="p-0.5 rounded text-[#9B9A97] hover:text-[#37352F] hover:bg-[#E3E2DF]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {children.map((child) => renderPageRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 bg-[#F7F7F5] border-r border-[#EAE9E5] flex flex-col select-none">
      {/* Workspace Header */}
      <div className="h-12 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-[4px] bg-[#37352F] text-white font-display text-[11px] font-bold flex items-center justify-center shrink-0">
            F
          </div>
          <span className="font-display text-[13.5px] font-semibold text-[#37352F] truncate">
            Folio Workspace
          </span>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          title="Collapse sidebar"
          className="w-6 h-6 rounded flex items-center justify-center text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F] transition-colors shrink-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="px-2.5 pb-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] bg-[#EFEFED]/70 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#D4D3CE] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#787774] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pages"
            className="w-full bg-transparent outline-none text-[13px] text-[#37352F] placeholder:text-[#787774]"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {filteredPages ? (
          <div>
            <div className="px-2 pb-1 text-[11px] font-medium text-[#787774]">
              Search results
            </div>
            {filteredPages.length === 0 ? (
              <div className="px-2 py-2 text-[12.5px] text-[#9B9A97]">No matching pages</div>
            ) : (
              <div className="space-y-0.5">
                {filteredPages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPage(p.id);
                      setSearchTerm('');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[13.5px] text-[#37352F] hover:bg-[#EFEFED] text-left"
                  >
                    <PageIcon icon={p.icon} size="sm" />
                    <span className="truncate">{p.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <div>
                <div className="px-2 pb-1 text-[11px] font-medium text-[#787774]">
                  Favorites
                </div>
                <div className="space-y-0.5">
                  {favorites.map((p) => (
                    <button
                      key={`fav-${p.id}`}
                      type="button"
                      onClick={() => onSelectPage(p.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[13.5px] text-left transition-colors ${
                        activePageId === p.id
                          ? 'bg-[#EFEFED] text-[#37352F] font-medium'
                          : 'text-[#5F5E5B] hover:bg-[#EFEFED]/70 hover:text-[#37352F]'
                      }`}
                    >
                      <PageIcon icon={p.icon} size="sm" />
                      <span className="truncate">{p.title || 'Untitled'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#787774]">Private</span>
                <button
                  type="button"
                  onClick={() => onCreatePage()}
                  title="New page"
                  className="w-4 h-4 rounded flex items-center justify-center text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">{rootPages.map((p) => renderPageRow(p, 0))}</div>
            </div>
          </>
        )}
      </div>

      {/* Bottom New Page Button */}
      <div className="p-2 border-t border-[#EAE9E5]">
        <button
          type="button"
          onClick={() => onCreatePage()}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[13px] font-medium text-[#5F5E5B] hover:bg-[#EFEFED] hover:text-[#37352F] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#787774]" />
          <span>New page</span>
        </button>
      </div>
    </aside>
  );
};
