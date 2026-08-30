import React from 'react';
import { Film, Play, Eye, Clock, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const TeasersSection: React.FC = () => {
  const { teasers, openTeaserModal } = useData();

  return (
    <section id="section-teasers" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff5a50]/15 border border-[#ff5a50]/30 text-[#ff6b5b] text-xs font-bold uppercase tracking-wider mb-3 font-almodobar">
              <Film className="w-3.5 h-3.5" />
              <span>Teasers & Bandes-Annonces</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-almodobar">
              Plongez dans l'Action en Vidéo
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl font-body">
              Bandes-annonces animées, motion comics rythmés et interviews des créateurs pour découvrir les univers OZI avant de vous lancer dans la lecture.
            </p>
          </div>
        </div>

        {/* Teasers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teasers.map((teaser) => (
            <div
              key={teaser.id}
              id={`teaser-card-${teaser.id}`}
              onClick={() => openTeaserModal(teaser)}
              className="group relative rounded-3xl bg-[#0d0e15] border border-slate-800 hover:border-[#ff5a50]/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 cursor-pointer flex flex-col tap-active"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-[#07080c]">
                <img 
                  src={teaser.thumbnailUrl} 
                  alt={teaser.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/30 to-transparent" />

                {/* Floating Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-ozi-primary text-white flex items-center justify-center shadow-lg glow-ozi group-hover:scale-110 transition-all duration-300">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration & Tag */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#07080c]/80 backdrop-blur-md text-[#ff6b5b] border border-[#ff5a50]/30 font-heading">
                    {teaser.type === 'trailer' ? 'Bande-Annonce' : teaser.type === 'motion_comic' ? 'Motion Comic' : 'Interview'}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#07080c]/80 backdrop-blur-md text-[11px] font-mono text-slate-300">
                  <Clock className="w-3 h-3 text-[#ff5a50]" />
                  <span>{teaser.duration}</span>
                </div>
              </div>

              {/* Teaser Info */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  {teaser.seriesTitle && (
                    <span className="text-[11px] font-bold text-[#ff6b5b] uppercase tracking-wider block mb-1 font-heading">
                      {teaser.seriesTitle}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-white group-hover:text-[#ffd4cf] transition-colors line-clamp-2 font-almodobar">
                    {teaser.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-body">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{teaser.viewsCount.toLocaleString()} vues</span>
                  </div>
                  <span className="text-[#ff6b5b] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform font-heading">
                    <span>Regarder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
