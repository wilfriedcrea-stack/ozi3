import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Series } from '../../../types';
import { AuthorInfoModal } from './AuthorInfoModal';

interface WorkBannerIdentityProps {
  series: Series;
  className?: string;
  onReadFirstChapter?: () => void;
}

export const WorkBannerIdentity: React.FC<WorkBannerIdentityProps> = ({
  series,
  className = '',
  onReadFirstChapter
}) => {
  const [isAuthorInfoOpen, setIsAuthorInfoOpen] = useState(false);

  return (
    <>
      <div className={`work-banner__identity flex flex-col items-center text-center max-w-2xl mx-auto px-4 z-10 ${className}`}>
        
        {/* Category / Genre (Dynamic) */}
        {series.genre && (
          <div className="work-banner__category mb-2 sm:mb-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase bg-[#ff5a50]/20 text-[#ff746c] border border-[#ff5a50]/40 backdrop-blur-md shadow-sm font-heading">
              {series.genre}
            </span>
          </div>
        )}

        {/* Dynamic Series Title (Single true H1) */}
        <h1 className="work-banner__title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-almodobar tracking-tight leading-[1.08] sm:leading-[1.1] mb-2 sm:mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] max-w-full overflow-wrap-anywhere">
          {series.title}
        </h1>

        {/* Dynamic Author + Info Icon (ⓘ) */}
        {series.author && (
          <div className="work-banner__author flex items-center justify-center gap-1.5 text-xs sm:text-sm md:text-base font-semibold text-zinc-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mb-4">
            <span className="truncate max-w-[280px] sm:max-w-md">
              {series.author}
            </span>

            <button
              type="button"
              id="author-info-btn"
              onClick={() => setIsAuthorInfoOpen(true)}
              aria-label={`Afficher les informations sur l'auteur ${series.author}`}
              title="Informations sur l'auteur"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a50] ml-0.5"
            >
              <Info className="w-3 h-3 fill-current stroke-none" />
            </button>
          </div>
        )}

        {/* Button: Lire le premier chapitre (Just below the author name) */}
        {onReadFirstChapter && (
          <div className="mt-1">
            <button
              type="button"
              id="banner-read-first-chapter-btn"
              onClick={onReadFirstChapter}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-[#f95e4e] hover:bg-[#e04f40] text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-[#f95e4e]/35 hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading drop-shadow-md"
            >
              <span>Lire le premier chapitre</span>
            </button>
          </div>
        )}

      </div>

      {/* Author Details Modal */}
      <AuthorInfoModal
        series={series}
        isOpen={isAuthorInfoOpen}
        onClose={() => setIsAuthorInfoOpen(false)}
      />
    </>
  );
};
