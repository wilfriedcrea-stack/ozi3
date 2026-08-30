import React from 'react';

export const ArticleSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[860px] mx-auto px-2.5 sm:px-4 md:px-6 animate-pulse py-4 space-y-6">
      {/* Hero Skeleton */}
      <div className="w-full flex flex-col gap-3">
        <div className="w-full aspect-[16/9] sm:aspect-[16/8] bg-zinc-800/60 rounded-sm" />
        <div className="h-6 sm:h-8 bg-zinc-800/80 rounded w-3/4" />
        <div className="h-3 bg-zinc-800/50 rounded w-28" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-card-${i}`} className="flex flex-col gap-2">
            <div className="w-full aspect-[4/3] bg-zinc-800/60 rounded-sm" />
            <div className="h-3.5 sm:h-4 bg-zinc-800/70 rounded w-5/6" />
            <div className="h-2.5 bg-zinc-800/40 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};
