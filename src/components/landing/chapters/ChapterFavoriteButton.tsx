import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useData } from '../../../context/DataContext';

interface ChapterFavoriteButtonProps {
  seriesId: string;
  chapterId: string;
  initialLikesCount: number;
  className?: string;
}

const FAVORITES_STORAGE_KEY = 'ozi_user_favorited_chapters_v1';

export const ChapterFavoriteButton: React.FC<ChapterFavoriteButtonProps> = ({
  seriesId,
  chapterId,
  initialLikesCount,
  className = ''
}) => {
  const { likeChapter } = useData();
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount || 0);

  // Sync initialLikesCount if it changes externally
  useEffect(() => {
    setLikesCount(prev => Math.max(prev, initialLikesCount || 0));
  }, [initialLikesCount]);

  // Load user favorite state from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (ids.includes(chapterId)) {
          setIsFavorited(true);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [chapterId]);

  const handleToggleFavorite = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (isFavorited) {
        // Remove from favorites
        ids = ids.filter(id => id !== chapterId);
        setIsFavorited(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Add to favorites
        if (!ids.includes(chapterId)) {
          ids.push(chapterId);
        }
        setIsFavorited(true);
        setLikesCount(prev => prev + 1);
        likeChapter(seriesId, chapterId);
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Fallback in-memory toggle
      setIsFavorited(prev => !prev);
      setLikesCount(prev => (isFavorited ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const formattedCount = new Intl.NumberFormat('fr-FR').format(likesCount);

  return (
    <button
      type="button"
      id={`fav-btn-${chapterId}`}
      onClick={handleToggleFavorite}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleToggleFavorite(e);
        }
      }}
      aria-label={isFavorited ? `Retirer des favoris (${formattedCount})` : `Ajouter aux favoris (${formattedCount})`}
      aria-pressed={isFavorited}
      className={`inline-flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ff5a50] ${className}`}
    >
      <Heart
        className={`w-4 h-4 shrink-0 transition-transform active:scale-125 duration-150 ${
          isFavorited
            ? 'fill-[#ff5a50] text-[#ff5a50]'
            : 'text-[#9ca3af] hover:text-white'
        }`}
      />
      <span className={`text-xs font-medium ${isFavorited ? 'text-[#ff5a50]' : 'text-[#9ca3af]'}`}>
        {formattedCount}
      </span>
    </button>
  );
};
