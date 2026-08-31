import React, { useState } from 'react';
import { Series } from '../../../types';
import { WorkBannerIdentity } from './WorkBannerIdentity';
import { WorkBannerActions } from './WorkBannerActions';
import { WorkBannerFallback } from './WorkBannerFallback';

interface WorkBannerProps {
  work: Series;
  isLoading?: boolean;
  className?: string;
  onReadFirstChapter?: () => void;
}

export const WorkBanner: React.FC<WorkBannerProps> = ({
  work,
  isLoading = false,
  className = '',
  onReadFirstChapter
}) => {
  const [bgImageError, setBgImageError] = useState(false);

  if (isLoading || !work) {
    return <WorkBannerFallback className={className} />;
  }

  // Determine optimal background image with strict fallback chain
  const projectFallback = '/images/ozi_mosaic_banner.jpg';
  const hasBanner = Boolean(work.bannerUrl && work.bannerUrl.trim() !== '');
  const displayBg = (!bgImageError && (hasBanner ? work.bannerUrl : work.coverUrl)) || projectFallback;

  return (
    <div
      id="work-main-banner"
      className={`work-banner hidden md:block relative w-full overflow-hidden bg-[#0c0d14] border-b border-zinc-800/80 select-none ${className}`}
      style={{
        minHeight: '270px'
      }}
    >
      {/* 1. Full-width Background Image (Priority Loading) */}
      <img
        src={displayBg}
        alt={`Bannière de l'œuvre ${work.title}`}
        onError={() => setBgImageError(true)}
        className="work-banner__background absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
      />

      {/* 2. Dual Gradient Overlays for Guaranteed Text Legibility */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/55 via-black/25 to-black/55" 
      />
      <div 
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#07080c] via-black/40 to-black/60" 
      />

      {/* 3. Responsive Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full min-h-[270px] sm:min-h-[320px] md:min-h-[360px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between">
        
        {/* DESKTOP LAYOUT (>= 768px): Centered Content with Left & Right Balanced Anchor Zones */}
        <div className="hidden md:grid md:grid-cols-12 items-center w-full my-auto gap-4">
          
          {/* Left Decorative/Cover Zone (if not a wide native banner) */}
          <div className="md:col-span-3 flex items-center justify-start">
            {!hasBanner && work.coverUrl && (
              <div className="w-20 h-28 lg:w-24 lg:h-34 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-900 shrink-0">
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Center Identity (Category, Title H1, Author ⓘ, Read Chapter 1 CTA) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center text-center">
            <WorkBannerIdentity series={work} onReadFirstChapter={onReadFirstChapter} />
          </div>

          {/* Right Action Zone (Social Share) */}
          <div className="md:col-span-3 flex items-center justify-end">
            <WorkBannerActions series={work} />
          </div>

        </div>

        {/* MOBILE LAYOUT (< 768px): Clean Stacked Hierarchy with Bottom Action Bar */}
        <div className="md:hidden flex flex-col items-center justify-between flex-1 gap-6 py-2">
          
          {/* Mobile Top Spacer to vertically balance */}
          <div className="w-full" />

          {/* Mobile Center Identity */}
          <WorkBannerIdentity series={work} className="w-full" onReadFirstChapter={onReadFirstChapter} />

          {/* Mobile Bottom Actions */}
          <div className="w-full flex items-center justify-center gap-3 pt-2">
            <WorkBannerActions series={work} />
          </div>

        </div>

      </div>
    </div>
  );
};
