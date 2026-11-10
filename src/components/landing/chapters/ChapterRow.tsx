import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Chapter } from '../../../types';
import { useData } from '../../../context/DataContext';
import { ChapterThumbnail } from './ChapterThumbnail';
import { ChapterFavoriteButton } from './ChapterFavoriteButton';

interface ChapterRowProps {
  chapter: Chapter;
  seriesCoverUrl?: string;
  seriesSlugOrId: string;
  onSelectChapter: (chapterId: string) => void;
}

// Utility to parse any date representation (string, Date, or Firestore Timestamp)
function formatChapterDate(rawDate: any): string {
  if (!rawDate) return 'Récent';

  try {
    let dateObj: Date;

    if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else if (typeof rawDate === 'object' && rawDate !== null && 'seconds' in rawDate) {
      // Firestore Timestamp
      dateObj = new Date(rawDate.seconds * 1000);
    } else if (typeof rawDate === 'object' && rawDate !== null && typeof rawDate.toDate === 'function') {
      dateObj = rawDate.toDate();
    } else {
      // String or numeric timestamp
      dateObj = new Date(rawDate);
    }

    if (isNaN(dateObj.getTime())) {
      return typeof rawDate === 'string' ? rawDate : 'Récent';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  } catch {
    return 'Récent';
  }
}

// Generate proper title display
function formatChapterTitle(chapterNumber: number, customTitle?: string): string {
  const cleanTitle = (customTitle || '').trim();
  if (!cleanTitle) {
    return `Chapitre ${chapterNumber}`;
  }

  const lower = cleanTitle.toLowerCase();
  if (lower.startsWith('chapitre') || lower.startsWith('épisode') || lower.startsWith('ep.') || lower.startsWith('ch.')) {
    return cleanTitle;
  }

  return `Chapitre ${chapterNumber} — ${cleanTitle}`;
}

export const ChapterRow: React.FC<ChapterRowProps> = ({
  chapter,
  seriesCoverUrl,
  seriesSlugOrId,
  onSelectChapter
}) => {
  const { hasWorkAccess } = useData();
  const chapterNumber = chapter.chapterNumber ?? 1;
  const displayTitle = formatChapterTitle(chapterNumber, chapter.title);
  const formattedDate = formatChapterDate(chapter.publishedAt || chapter.releaseDate);
  const thumbnailSrc = chapter.thumbnailUrl || (chapter as any).thumbnail || (chapter.pages && chapter.pages.length > 0 ? chapter.pages[0] : undefined);

  const isChapterFree = chapter.isFree ?? true;
  const hasAccess = isChapterFree || hasWorkAccess(chapter.seriesId || seriesSlugOrId);

  const handleClick = () => {
    onSelectChapter(chapter.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectChapter(chapter.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      id={`chapter-row-${chapter.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Lire ${displayTitle}`}
      className="group w-full block bg-[#000000] text-[#ffffff] border-b border-[#252525] hover:bg-[#111111] transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#ff8679] select-none"
    >
      {/* DESKTOP LAYOUT (>= 768px) */}
      <div className="hidden md:grid grid-cols-[106px_minmax(0,1fr)_160px_120px_65px] items-center min-h-[102px] w-full px-0">
        
        {/* 1. Miniature (106px x 102px) */}
        <ChapterThumbnail
          src={thumbnailSrc}
          fallbackSrc={seriesCoverUrl}
          alt={displayTitle}
          className="w-[106px] h-[102px]"
        />

        {/* 2. Titre du chapitre + Badge exclusif */}
        <div className="px-6 py-2 min-w-0 flex items-center gap-2.5">
          <span className="text-base font-semibold text-[#ffffff] group-hover:text-zinc-200 transition-colors line-clamp-2 leading-snug">
            {displayTitle}
          </span>
          {!isChapterFree && (
            hasAccess ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" /> Pass Actif
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="w-2.5 h-2.5" /> Pass 30j
              </span>
            )
          )}
        </div>

        {/* 3. Date de publication (160px stable zone) */}
        <div className="px-3 text-left">
          <time className="text-xs sm:text-sm font-medium text-[#9ca3af] whitespace-nowrap">
            {formattedDate}
          </time>
        </div>

        {/* 4. Coeur + favoris (120px stable zone) */}
        <div className="px-3 flex items-center">
          <ChapterFavoriteButton
            seriesId={chapter.seriesId || seriesSlugOrId}
            chapterId={chapter.id}
            initialLikesCount={chapter.likesCount || 0}
          />
        </div>

        {/* 5. Numéro court complètement à droite (65px zone) */}
        <div className="pr-5 pl-2 text-right">
          <span className="text-sm font-bold text-[#ffffff] font-mono tracking-tight">
            #{chapterNumber}
          </span>
        </div>
      </div>

      {/* MOBILE LAYOUT (< 768px) */}
      <div className="relative md:hidden grid grid-cols-[82px_minmax(0,1fr)] gap-3 min-h-[98px] py-2 px-2.5 items-center w-full">
        
        {/* Miniature carrée (82px x 82px) */}
        <ChapterThumbnail
          src={thumbnailSrc}
          fallbackSrc={seriesCoverUrl}
          alt={displayTitle}
          className="w-[82px] h-[82px] rounded-none shrink-0"
        />

        {/* Contenu textuel à droite */}
        <div className="min-w-0 flex flex-col justify-between py-1 pr-9 gap-2">
          
          {/* Ligne 1: Titre réel (max 2 lignes) + Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-[#ffffff] leading-snug line-clamp-2">
              {displayTitle}
            </h3>
            {!isChapterFree && (
              hasAccess ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-2 h-2" /> Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Lock className="w-2 h-2" /> Pass 30j
                </span>
              )
            )}
          </div>

          {/* Ligne 2: Date réelle & Favoris */}
          <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1">
            <span className="text-[11px] font-medium text-[#9ca3af] whitespace-nowrap">
              {formattedDate}
            </span>

            <ChapterFavoriteButton
              seriesId={chapter.seriesId || seriesSlugOrId}
              chapterId={chapter.id}
              initialLikesCount={chapter.likesCount || 0}
              className="p-0"
            />
          </div>
        </div>

        {/* Numéro du chapitre en haut à droite */}
        <div className="absolute top-3 right-3 text-right">
          <span className="text-xs font-bold text-[#ffffff] font-mono">
            #{chapterNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
