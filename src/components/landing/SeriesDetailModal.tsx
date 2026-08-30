import React from 'react';
import { 
  X, 
  BookOpen, 
  Star, 
  Heart, 
  Share2, 
  Eye, 
  Download, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Series } from '../../types';
import { useData } from '../../context/DataContext';

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({ series, onClose }) => {
  const { openReader, likeSeries, appVersion } = useData();

  if (!series) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${series.title} sur OZI`,
        text: `Découvrez la série webtoon "${series.title}" sur la plateforme OZI !`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien de la série copié dans le presse-papier !');
    }
  };

  return (
    <div 
      id="series-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="series-detail-modal-card"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#12121c] border border-[#2e2e46] shadow-2xl text-zinc-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner with Backdrop */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
          <img 
            src={series.bannerUrl || series.coverUrl} 
            alt={series.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-[#12121c]/60 to-transparent" />
          
          {/* Close button */}
          <button
            id="close-series-detail-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-[#09090e]/80 hover:bg-[#1c1c2b] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating tags */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-heading">
              {series.genre}
            </span>
            {series.isExclusive && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/90 text-white font-heading">
                Exclusivité OZI
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#09090e]/80 backdrop-blur-md text-zinc-300 border border-[#2e2e46] font-body">
              {series.ageRating}
            </span>
          </div>

          {/* Series Title overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400 font-heading">
                {series.country} • {series.releaseYear}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 font-heading">
                {series.title}
              </h2>
              <p className="text-xs text-zinc-300 font-medium font-body">
                Scénario : <span className="text-orange-300 font-bold">{series.author}</span> • Dessin : <span className="text-orange-300 font-bold">{series.artist}</span>
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                id="share-series-btn"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[#09090e]/80 hover:bg-[#1c1c2b] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors"
                title="Partager la série"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                id="like-series-btn"
                onClick={() => likeSeries(series.id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#09090e]/80 hover:bg-[#1c1c2b] text-rose-400 border border-[#2e2e46] font-bold text-xs transition-colors"
              >
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>{series.totalLikes.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          
          {/* Key Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#09090e]/80 border border-[#242436] text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-orange-400 font-black text-lg font-heading">
                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                <span>{series.rating}</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">({series.reviewsCount} avis)</span>
            </div>

            <div>
              <div className="text-lg font-black text-zinc-200 font-heading">
                {series.chaptersCount}
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">Épisodes publiés</span>
            </div>

            <div>
              <div className="text-lg font-black text-zinc-200 font-heading">
                {series.totalReads.toLocaleString()}
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">Lectures totales</span>
            </div>

            <div>
              <div className="text-lg font-black text-emerald-400 font-heading">
                {series.status === 'ongoing' ? 'En cours' : 'Terminé'}
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">Statut de la série</span>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-400 mb-2 font-heading">
              Synopsis
            </h3>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-body">
              {series.synopsis}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {series.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#1a1a28] text-xs font-medium text-zinc-400 border border-[#2e2e46]"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Chapters List / Episodes list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2 font-heading">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span>Liste des Épisodes ({series.chapters?.length || series.chaptersCount})</span>
              </h3>
              <span className="text-xs text-orange-400 font-bold font-body">
                Tous les épisodes disponibles sur l'APK OZI
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {series.chapters && series.chapters.length > 0 ? (
                series.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#09090e]/70 hover:bg-[#181826] border border-[#242436] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1c1c2b] flex items-center justify-center font-black text-xs text-orange-400 border border-[#2e2e46] font-heading">
                        {ch.chapterNumber}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-orange-300 transition-colors font-heading">
                          {ch.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-body">
                          <Clock className="w-3 h-3" />
                          <span>{ch.readTimeMinutes} min de lecture</span>
                          <span>•</span>
                          <span>{ch.releaseDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ch.isFree ? (
                        <button
                          onClick={() => {
                            onClose();
                            openReader(series.id, ch.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md transition-transform hover:scale-105 font-heading"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lire</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c1c2b] text-zinc-400 text-xs font-medium border border-[#2e2e46]">
                          <Lock className="w-3.5 h-3.5 text-orange-400" />
                          <span>{ch.coinsRequired} Pièces</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[#09090e]/50 border border-[#242436] text-center text-xs text-zinc-400">
                  Épisodes complets synchronisés et disponibles en continu sur l'application mobile OZI.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action CTA */}
          <div className="pt-4 border-t border-[#242436] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => {
                onClose();
                openReader(series.id);
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-[#ff6600] to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] font-heading"
            >
              <Eye className="w-4 h-4" />
              <span>Lancer la lecture du Chapitre 1 (Aperçu)</span>
            </button>

            <a
              href="#section-download"
              onClick={onClose}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-200 font-bold text-xs border border-[#2e2e46] transition-colors font-heading"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Télécharger l'APK OZI</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
