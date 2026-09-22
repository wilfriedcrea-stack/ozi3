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
      <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-[#ff5a50]/20 text-[#ff746c] border border-[#ff5a50]/40 backdrop-blur-md shadow-sm font-heading">
        {series.genre}
      </span>
    </div>
  );
};
