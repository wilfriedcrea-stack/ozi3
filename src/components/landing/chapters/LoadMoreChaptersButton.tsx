import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface LoadMoreChaptersButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  remainingCount: number;
}

export const LoadMoreChaptersButton: React.FC<LoadMoreChaptersButtonProps> = ({
  onClick,
  isLoading = false,
  remainingCount
}) => {
  return (
    <div className="w-full bg-[#000000] py-6 flex items-center justify-center border-t border-[#252525]">
      <button
        type="button"
        id="load-more-chapters-btn"
        onClick={onClick}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-[#111111] hover:bg-[#1c1c1c] active:bg-[#0a0a0a] text-white text-sm font-semibold border border-[#252525] hover:border-[#383838] transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a50] disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#ff5a50]" />
            <span>Chargement des chapitres...</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-[#ff5a50]" />
            <span>Voir plus de chapitres ({remainingCount} restants)</span>
          </>
        )}
      </button>
    </div>
  );
};
