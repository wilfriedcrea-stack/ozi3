import React, { useState, useEffect } from 'react';
import { Bookmark, Check, Plus } from 'lucide-react';
import { useData } from '../../../context/DataContext';

interface FollowWorkButtonProps {
  seriesId: string;
  initialFollowersCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FOLLOWED_SERIES_STORAGE_KEY = 'ozi_user_followed_series_v1';

export const FollowWorkButton: React.FC<FollowWorkButtonProps> = ({
  seriesId,
  initialFollowersCount = 0,
  className = '',
  size = 'md'
}) => {
  const { toggleFollowSeries } = useData();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(initialFollowersCount || 0);

  useEffect(() => {
    setFollowersCount(prev => Math.max(prev, initialFollowersCount || 0));
  }, [initialFollowersCount]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FOLLOWED_SERIES_STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (ids.includes(seriesId)) {
          setIsFollowed(true);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [seriesId]);

  const handleToggleFollow = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem(FOLLOWED_SERIES_STORAGE_KEY);
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (isFollowed) {
        ids = ids.filter(id => id !== seriesId);
        setIsFollowed(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        if (!ids.includes(seriesId)) {
          ids.push(seriesId);
        }
        setIsFollowed(true);
        setFollowersCount(prev => prev + 1);
        if (typeof toggleFollowSeries === 'function') {
          toggleFollowSeries(seriesId);
        }
      }

      localStorage.setItem(FOLLOWED_SERIES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      setIsFollowed(prev => !prev);
      setFollowersCount(prev => (isFollowed ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  return (
    <button
      type="button"
      id={`follow-work-btn-${seriesId}`}
      onClick={handleToggleFollow}
      aria-label={isFollowed ? "Vous êtes abonné à cette œuvre. Cliquer pour vous désabonner" : "S'abonner aux nouveaux chapitres de cette œuvre"}
      aria-pressed={isFollowed}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-full transition-all duration-200 cursor-pointer select-none shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 ${
        isFollowed
          ? 'bg-[#181922] text-white border border-zinc-600 hover:border-zinc-400 hover:bg-[#20222e]'
          : 'bg-[#ff5a50] hover:bg-[#ff6b5b] text-white shadow-[#ff5a50]/25 hover:shadow-[#ff5a50]/40'
      } ${
        size === 'sm'
          ? 'px-3.5 py-1.5 text-xs min-h-[36px]'
          : size === 'lg'
          ? 'px-6 py-3 text-sm min-h-[46px]'
          : 'px-4 sm:px-5 py-2 text-xs sm:text-sm min-h-[40px]'
      } ${className}`}
    >
      {isFollowed ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>Abonné</span>
        </>
      ) : (
        <>
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>S'abonner</span>
        </>
      )}
    </button>
  );
};
