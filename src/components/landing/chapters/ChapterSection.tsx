import React, { useState, useMemo } from 'react';
import { BookOpen, Sparkles, ChevronRight, Play } from 'lucide-react';
import { Series, Chapter } from '../../../types';
import { useData } from '../../../context/DataContext';
import { ChapterList } from './ChapterList';
import { ChapterSkeleton } from './ChapterSkeleton';
import { LoadMoreChaptersButton } from './LoadMoreChaptersButton';

interface ChapterSectionProps {
  series: Series;
  isLoading?: boolean;
}

const CHAPTERS_PER_PAGE = 20;

export const ChapterSection: React.FC<ChapterSectionProps> = ({
  series,
  isLoading = false
}) => {
  const { openReader } = useData();
  const [visibleCount, setVisibleCount] = useState<number>(CHAPTERS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Filter and sort chapters dynamically from real series data
  const sortedChapters = useMemo(() => {
    if (!series || !series.chapters || series.chapters.length === 0) {
      // If series has no chapters array, fallback to default first chapter if chaptersCount > 0
      return [
        {
          id: `${series.id}-ch-1`,
          seriesId: series.id,
          chapterNumber: 1,
          title: 'Prologue & Chapitre 1',
          releaseDate: series.updatedAt || new Date().toISOString().split('T')[0],
          isFree: true,
          coinsRequired: 0,
          likesCount: Math.floor((series.totalLikes || 100) / 2),
          readTimeMinutes: 6,
          summary: 'Découvrez les premiers pas et l\'ouverture de l\'histoire.',
          pages: [series.coverUrl]
        } as Chapter
      ];
    }

    // 1. Filter chapters: same work/series, published !== false, releaseDate <= now
    const filtered = series.chapters.filter((ch) => {
      // Work identifier check
      if (ch.seriesId && ch.seriesId !== series.id) {
        return false;
      }

      // Published status check
      if (ch.published === false) {
        return false;
      }

      // Date check if future scheduled date
      if (ch.releaseDate) {
        try {
          const chDate = new Date(ch.releaseDate);
          const now = new Date();
          // Allow today or past dates
          if (chDate > now && ch.published !== true) {
            return false;
          }
        } catch {
          // Keep if date parsing fails
        }
      }

      return true;
    });

    // 2. Sort from newest to oldest: b.chapterNumber - a.chapterNumber
    return [...filtered].sort((a, b) => (b.chapterNumber || 0) - (a.chapterNumber || 0));
  }, [series]);

  // Paginated slice
  const displayedChapters = useMemo(() => {
    return sortedChapters.slice(0, visibleCount);
  }, [sortedChapters, visibleCount]);

  const hasMore = visibleCount < sortedChapters.length;
  const remainingCount = sortedChapters.length - visibleCount;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + CHAPTERS_PER_PAGE);
      setIsLoadingMore(false);
    }, 200);
  };

  const handleSelectChapter = (chapterId: string) => {
    openReader(series.id, chapterId);
  };

  const handleReadFromBeginning = () => {
    // Oldest chapter (Chapter 1) is at the bottom of newest-first sort
    const oldestChapter = sortedChapters[sortedChapters.length - 1];
    if (oldestChapter) {
      openReader(series.id, oldestChapter.id);
    }
  };

  return (
    <section
      id="chapters-section"
      aria-label={`Chapitres de ${series.title}`}
      className="relative w-full overflow-hidden my-10"
    >
      {/* Container with exact +10px width on each side in black */}
      <div className="w-[calc(100%+20px)] -mx-[10px] bg-[#000000] text-[#ffffff] border-y border-[#252525] shadow-2xl">
        
        {/* Section Header */}
        <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#252525] bg-[#000000]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#ffffff] font-almodobar tracking-tight">
                Chapitres disponibles
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#2e2e2e] text-[#9ca3af] text-xs font-semibold">
                {sortedChapters.length} {sortedChapters.length > 1 ? 'chapitres' : 'chapitre'}
              </span>
            </div>
            <p className="text-xs text-[#9ca3af] mt-1">
              Sélectionnez un chapitre pour lancer la lecture immédiate.
            </p>
          </div>

          {sortedChapters.length > 1 && (
            <button
              type="button"
              id="read-from-start-btn"
              onClick={handleReadFromBeginning}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff5a50] hover:text-[#ff746c] transition-colors cursor-pointer self-start sm:self-center py-1 focus:outline-none focus-visible:underline"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lire depuis le début (Ch. 1)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Chapter States */}
        {isLoading ? (
          <ChapterSkeleton count={5} />
        ) : sortedChapters.length === 0 ? (
          <div className="py-16 text-center bg-[#000000] text-[#9ca3af] flex flex-col items-center justify-center px-4">
            <BookOpen className="w-10 h-10 text-[#333333] mb-3" />
            <p className="text-sm font-medium text-[#cccccc]">
              Aucun chapitre n’est disponible pour le moment.
            </p>
            <span className="text-xs text-[#777777] mt-1">
              Les prochains chapitres seront publiés très bientôt.
            </span>
          </div>
        ) : (
          <>
            {/* Real Chapters List */}
            <ChapterList
              chapters={displayedChapters}
              seriesCoverUrl={series.coverUrl}
              seriesSlugOrId={series.slug || series.id}
              onSelectChapter={handleSelectChapter}
            />

            {/* Load More Button for High Chapter Counts (>20) */}
            {hasMore && (
              <LoadMoreChaptersButton
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                remainingCount={remainingCount}
              />
            )}
          </>
        )}

      </div>
    </section>
  );
};
