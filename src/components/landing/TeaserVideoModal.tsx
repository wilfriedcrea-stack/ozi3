import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Eye, BookOpen, Film, Share2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const TeaserVideoModal: React.FC = () => {
  const { activeVideoTeaser, closeTeaserModal, openReader } = useData();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!activeVideoTeaser) return null;

  return (
    <div 
      id="teaser-video-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeTeaserModal}
    >
      <div 
        id="teaser-video-modal-card"
        className="relative w-full max-w-4xl rounded-3xl bg-[#12121c] border border-[#2e2e46] shadow-2xl overflow-hidden text-zinc-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Player Display Area */}
        <div className="relative aspect-video w-full bg-[#09090e] overflow-hidden flex items-center justify-center">
          {/* Simulated Animated Trailer Player / Video Stream */}
          <img 
            src={activeVideoTeaser.thumbnailUrl} 
            alt={activeVideoTeaser.title}
            className={`w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-105 filter brightness-95' : 'brightness-75'}`}
          />
          
          {/* Video Overlay Lighting */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-transparent to-[#09090e]/40" />

          {/* Simulated Motion Comic Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

          {/* Close button */}
          <button
            id="close-teaser-video-btn"
            onClick={closeTeaserModal}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-[#09090e]/80 hover:bg-[#1c1c2b] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors z-20"
            aria-label="Fermer la vidéo"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Type Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 uppercase tracking-wider shadow-md font-heading">
              {activeVideoTeaser.type === 'trailer' ? 'Bande-Annonce Officielle' : activeVideoTeaser.type === 'motion_comic' ? 'Motion Comic Teaser' : 'Interview Créateurs'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#09090e]/80 text-zinc-300 border border-[#2e2e46]">
              {activeVideoTeaser.duration}
            </span>
          </div>

          {/* Center Play/Pause Trigger */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-500 via-[#ff6600] to-amber-500 hover:scale-110 active:scale-95 text-zinc-950 flex items-center justify-center shadow-2xl shadow-orange-500/50 transition-all z-20"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-zinc-950 text-zinc-950" />
            ) : (
              <Play className="w-8 h-8 fill-zinc-950 text-zinc-950 ml-1" />
            )}
          </button>

          {/* Video Controls Bar */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="p-2 rounded-lg bg-[#09090e]/80 text-zinc-300 hover:text-white border border-[#242436]"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
              </button>
              <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 font-body">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span>Lecture HD 1080p OZI Studio</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-body">
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>{activeVideoTeaser.viewsCount.toLocaleString()} vues</span>
            </div>
          </div>
        </div>

        {/* Video Information & CTA */}
        <div className="p-6 sm:p-8 bg-[#12121c] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                {activeVideoTeaser.title}
              </h2>
              {activeVideoTeaser.seriesTitle && (
                <p className="text-xs text-orange-400 font-bold mt-1 font-heading">
                  Série : {activeVideoTeaser.seriesTitle}
                </p>
              )}
            </div>

            {activeVideoTeaser.seriesId && (
              <button
                onClick={() => {
                  closeTeaserModal();
                  openReader(activeVideoTeaser.seriesId!);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105 shrink-0 font-heading"
              >
                <BookOpen className="w-4 h-4" />
                <span>Lire la série</span>
              </button>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed font-body">
            {activeVideoTeaser.description}
          </p>
        </div>
      </div>
    </div>
  );
};
