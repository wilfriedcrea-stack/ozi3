import React from 'react';

interface WorkBannerFallbackProps {
  className?: string;
}

export const WorkBannerFallback: React.FC<WorkBannerFallbackProps> = ({
  className = ''
}) => {
  return (
    <div 
      className={`relative w-full min-h-[260px] sm:min-h-[320px] md:min-h-[360px] bg-[#0c0d14] flex flex-col items-center justify-center p-6 border-b border-zinc-800/80 animate-pulse overflow-hidden select-none ${className}`}
      aria-label="Chargement de la bannière..."
    >
      {/* Background Skeleton Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d14] via-[#161722] to-[#0c0d14] opacity-70" />

      {/* Central Skeleton Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-md">
        {/* Category Pill Skeleton */}
        <div className="h-6 w-24 bg-zinc-800/90 rounded-full" />
        
        {/* Title Skeleton */}
        <div className="h-10 sm:h-12 w-3/4 max-w-sm bg-zinc-700/80 rounded-xl" />
        
        {/* Author Skeleton */}
        <div className="h-4 w-36 bg-zinc-800/80 rounded-md" />
      </div>

      {/* Bottom Actions Skeleton */}
      <div className="absolute bottom-4 right-4 sm:right-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-zinc-800" />
        <div className="w-8 h-8 rounded-full bg-zinc-800" />
        <div className="w-8 h-8 rounded-full bg-zinc-800" />
        <div className="w-24 h-9 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
};
