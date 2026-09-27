import React from 'react';
import { Series } from '../../../types';

interface WorkBannerActionsProps {
  series: Series;
  className?: string;
}

export const WorkBannerActions: React.FC<WorkBannerActionsProps> = ({
  series,
  className = ''
}) => {
  if (!series.genre) return null;

  return (
    <div className={`work-banner__actions flex items-center gap-2.5 z-10 ${className}`}>
      {/* Category / Genre Badge relocated to the right anchor zone */}
      <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-[#ff8679]/20 text-[#ffa296] border border-[#ff8679]/40 backdrop-blur-md shadow-sm font-heading">
        {series.genre}
      </span>
    </div>
  );
};
