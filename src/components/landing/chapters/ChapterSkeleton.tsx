import React from 'react';

interface ChapterSkeletonProps {
  count?: number;
}

export const ChapterSkeleton: React.FC<ChapterSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="w-full bg-[#000000] divide-y divide-[#252525]" aria-label="Chargement des chapitres...">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`chapter-skeleton-${idx}`}
          className="w-full bg-[#000000] select-none"
        >
          {/* Desktop Skeleton */}
          <div className="hidden md:grid grid-cols-[106px_minmax(0,1fr)_160px_120px_65px] items-center min-h-[102px] w-full">
            <div className="w-[106px] h-[102px] bg-[#161616] animate-pulse" />
            <div className="px-6 py-2">
              <div className="h-4 w-3/4 max-w-sm bg-[#1a1a1a] rounded animate-pulse" />
            </div>
            <div className="px-3">
              <div className="h-3 w-20 bg-[#161616] rounded animate-pulse" />
            </div>
            <div className="px-3">
              <div className="h-4 w-14 bg-[#161616] rounded animate-pulse" />
            </div>
            <div className="pr-5 pl-2 text-right">
              <div className="h-4 w-8 ml-auto bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>

          {/* Mobile Skeleton */}
          <div className="relative md:hidden grid grid-cols-[82px_minmax(0,1fr)] gap-3 min-h-[98px] py-2 px-2.5 items-center w-full">
            <div className="w-[82px] h-[82px] bg-[#161616] animate-pulse shrink-0" />
            <div className="flex flex-col justify-between py-1 pr-9 gap-3">
              <div className="h-4 w-4/5 bg-[#1a1a1a] rounded animate-pulse" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-[#161616] rounded animate-pulse" />
                <div className="h-3 w-12 bg-[#161616] rounded animate-pulse" />
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <div className="h-3.5 w-6 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
