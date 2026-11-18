import React, { useEffect, useState } from 'react';
import {
  Check,
  Download,
  Image,
  Link2,
  Lock,
  Maximize2,
  Menu,
  MoreHorizontal,
  Star,
  Trash2,
} from 'lucide-react';
import { PageDoc } from '../types/workspace';
import { PageIcon } from './PageIcon';

interface TopBarProps {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  page: PageDoc;
  parentPage?: PageDoc;
  onSelectPage: (id: string) => void;
  onToggleFavorite: () => void;
  onToggleFullWidth: () => void;
  onOpenCoverPicker: () => void;
  onExportMarkdown: () => void;
  onDeletePage: () => void;
}

function formatEditedAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 45) return 'Edited just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `Edited ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Edited ${hrs}h ago`;
  return 'Edited recently';
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  onOpenSidebar,
  page,
  parentPage,
  onSelectPage,
  onToggleFavorite,
  onToggleFullWidth,
  onOpenCoverPicker,
  onExportMarkdown,
  onDeletePage,
}) => {
  const [menuOpen, setMenuOpen] = useState<'share' | 'more' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${page.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1600);
  };

  return (
    <header className="h-11 px-3 sm:px-4 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-sm sticky top-0 z-30 border-b border-transparent">
      {/* Left: Sidebar Toggle + Breadcrumb + Privacy */}
      <div className="flex items-center gap-2 min-w-0">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            title="Open sidebar"
            className="w-7 h-7 rounded flex items-center justify-center text-[#5F5E5B] hover:bg-[#EFEFED] transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-[13.5px]">
          {parentPage && (
            <>
              <button
                type="button"
                onClick={() => onSelectPage(parentPage.id)}
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#EFEFED] text-[#5F5E5B] truncate max-w-[140px] whitespace-nowrap"
              >
                <PageIcon icon={parentPage.icon} size="sm" />
                <span className="truncate">{parentPage.title || 'Untitled'}</span>
              </button>
              <span className="text-[#9B9A97] select-none">/</span>
            </>
          )}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[#37352F] font-medium truncate max-w-[200px]">
            <PageIcon icon={page.icon} size="sm" />
            <span className="truncate">{page.title || 'Untitled'}</span>
          </div>
        </nav>

        <span className="hidden sm:inline-flex items-center gap-1 text-[12px] text-[#787774] pl-1 whitespace-nowrap shrink-0">
          <Lock className="w-3 h-3" />
          <span>Private</span>
        </span>
      </div>

      {/* Right: Edited status + Share + Star + More */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <span className="hidden md:inline text-[12.5px] text-[#9B9A97] mr-2 whitespace-nowrap tabular-nums">
          {formatEditedAgo(page.updatedAt)}
        </span>

        {/* Share Popover */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((m) => (m === 'share' ? null : 'share'))}
            className="px-2.5 py-1 rounded text-[13px] font-medium text-[#37352F] hover:bg-[#EFEFED] transition-colors whitespace-nowrap"
          >
            Share
          </button>
          {menuOpen === 'share' && (
            <div className="absolute right-0 top-9 z-40 w-64 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_8px_24px_rgba(15,15,15,0.12)] p-3 text-[13px]">
              <div className="font-medium text-[#37352F] mb-1">Share this page</div>
              <p className="text-[12px] text-[#787774] mb-3">
                Copy a direct workspace link or export your page as Markdown.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-[#2383E2] hover:bg-[#1C71C7] text-white text-[12.5px] font-medium transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportMarkdown();
                    setMenuOpen(null);
                  }}
                  className="px-2.5 py-1.5 rounded border border-[#E6E5E1] hover:bg-[#F7F7F5] text-[#37352F] text-[12.5px] font-medium inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.md</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy link"
          className="w-7 h-7 rounded flex items-center justify-center text-[#5F5E5B] hover:bg-[#EFEFED] transition-colors"
        >
          {copiedLink ? <Check className="w-4 h-4 text-[#2383E2]" /> : <Link2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleFavorite}
          title={page.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          className="w-7 h-7 rounded flex items-center justify-center text-[#5F5E5B] hover:bg-[#EFEFED] transition-colors"
        >
          <Star
            className={`w-4 h-4 ${
              page.isFavorite ? 'fill-[#DFAB01] text-[#DFAB01]' : 'text-[#5F5E5B]'
            }`}
          />
        </button>

        {/* Page Actions Menu */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((m) => (m === 'more' ? null : 'more'))}
            title="Page settings"
            className="w-7 h-7 rounded flex items-center justify-center text-[#5F5E5B] hover:bg-[#EFEFED] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen === 'more' && (
            <div className="absolute right-0 top-9 z-40 w-52 rounded-lg bg-white border border-[#E6E5E1] shadow-[0_8px_24px_rgba(15,15,15,0.12)] py-1.5 text-[13px]">
              <button
                type="button"
                onClick={() => {
                  onOpenCoverPicker();
                  setMenuOpen(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[#37352F] hover:bg-[#F1F1EF]"
              >
                <Image className="w-4 h-4 text-[#787774]" />
                <span>{page.coverUrl ? 'Change cover' : 'Add cover'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleFullWidth();
                  setMenuOpen(null);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-left text-[#37352F] hover:bg-[#F1F1EF]"
              >
                <span className="flex items-center gap-2.5">
                  <Maximize2 className="w-4 h-4 text-[#787774]" />
                  <span>Full width</span>
                </span>
                {page.fullWidth && <Check className="w-3.5 h-3.5 text-[#2383E2]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportMarkdown();
                  setMenuOpen(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[#37352F] hover:bg-[#F1F1EF]"
              >
                <Download className="w-4 h-4 text-[#787774]" />
                <span>Export Markdown</span>
              </button>
              {page.id !== 'page-todo-dashboard' && (
                <>
                  <div className="my-1 border-t border-[#F1F1EF]" />
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePage();
                      setMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[#C43E3E] hover:bg-[#FDF2F2]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete page</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
