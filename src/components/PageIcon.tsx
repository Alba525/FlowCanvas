import React from 'react';
import { Bookmark, Calendar, Compass, FileText, Repeat } from 'lucide-react';
import { PageIconType } from '../types/workspace';

interface PageIconProps {
  icon: PageIconType | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PageIcon: React.FC<PageIconProps> = ({ icon, size = 'sm', className = '' }) => {
  if (!icon) {
    return <FileText className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-[#9B9A97] ${className}`} />;
  }

  if (icon === 'checklist') {
    const dim = size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dim} shrink-0 ${className}`}
        aria-hidden="true"
      >
        <path
          d="M10 17L15 22L24 12"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 18H54"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
        <path
          d="M10 33L15 38L24 28"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 34H54"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
        <path
          d="M10 49L15 54L24 44"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 50H54"
          stroke="#357A57"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === 'repeat') {
    const boxSize = size === 'lg' ? 'w-14 h-14 rounded-xl' : size === 'md' ? 'w-5 h-5 rounded' : 'w-4 h-4 rounded-[3px]';
    const iconSize = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    return (
      <span
        className={`inline-flex items-center justify-center bg-[#4E6B84] text-white shrink-0 ${boxSize} ${className}`}
      >
        <Repeat className={iconSize} strokeWidth={2.3} />
      </span>
    );
  }

  const iconDims = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  switch (icon) {
    case 'calendar':
      return <Calendar className={`${iconDims} text-[#4C7A9E] shrink-0 ${className}`} />;
    case 'bookmark':
      return <Bookmark className={`${iconDims} text-[#B26A45] shrink-0 ${className}`} />;
    case 'compass':
      return <Compass className={`${iconDims} text-[#4E7A65] shrink-0 ${className}`} />;
    case 'doc':
    default:
      return <FileText className={`${iconDims} text-[#787774] shrink-0 ${className}`} />;
  }
};
