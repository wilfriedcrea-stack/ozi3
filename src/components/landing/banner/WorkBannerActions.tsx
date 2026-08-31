import React from 'react';
import { Series } from '../../../types';
import { ShareWorkButton } from './ShareWorkButton';

interface WorkBannerActionsProps {
  series: Series;
  className?: string;
}

export const WorkBannerActions: React.FC<WorkBannerActionsProps> = ({
  series,
  className = ''
}) => {
  return (
    <div className={`work-banner__actions flex items-center gap-2.5 z-10 ${className}`}>
      {/* Social Sharing */}
      <ShareWorkButton series={series} variant="icons-row" />
    </div>
  );
};
