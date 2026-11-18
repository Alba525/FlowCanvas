import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { COVER_PRESETS } from '../data/initialWorkspace';

interface CoverPickerPopoverProps {
  isOpen: boolean;
  currentCoverUrl: string | null;
  onSelectCover: (url: string | null) => void;
  onClose: () => void;
}

export const CoverPickerPopover: React.FC<CoverPickerPopoverProps> = ({
  isOpen,
  currentCoverUrl,
  onSelectCover,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/15"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4 rounded-xl bg-white border border-[#E6E5E1] shadow-[0_12px_36px_rgba(15,15,15,0.16)] overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-[#F1F1EF] flex items-center justify-between">
          <span className="text-[13.5px] font-semibold text-[#37352F]">Gallery Covers</span>
          <div className="flex items-center gap-2">
            {currentCoverUrl && (
              <button
                type="button"
                onClick={() => {
                  onSelectCover(null);
                  onClose();
                }}
                className="text-[12.5px] text-[#787774] hover:text-[#37352F] px-2 py-1 rounded hover:bg-[#F7F7F5]"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cover gallery"
              className="w-6 h-6 rounded flex items-center justify-center text-[#787774] hover:bg-[#F7F7F5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COVER_PRESETS.map((preset) => {
            const isSelected = currentCoverUrl === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectCover(preset.url);
                  onClose();
                }}
                className="group text-left focus:outline-none"
              >
                <div
                  style={{ background: preset.fallbackGradient }}
                  className={`relative aspect-video rounded-md overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-[#2383E2] ring-2 ring-[#2383E2]/30'
                      : 'border-[#E6E5E1] group-hover:border-[#9B9A97]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#2383E2] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="block mt-1.5 text-[12px] text-[#5F5E5B] truncate">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
