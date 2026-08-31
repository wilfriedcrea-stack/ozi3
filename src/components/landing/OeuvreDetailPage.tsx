import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
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
  ChevronRight,
  Play,
  Layers,
  Calendar,
  User,
  Film,
  Tv,
  Check
} from 'lucide-react';
import { Series, Chapter } from '../../types';
import { useData } from '../../context/DataContext';
import { ChapterSection } from './chapters/ChapterSection';
import { WorkBanner } from './banner/WorkBanner';

export const OeuvreDetailPage: React.FC = () => {
  const { 
    series, 
    selectedOeuvreId, 
    openOeuvrePage,
    openReader, 
    openTeaserModal, 
    teasers, 
    setViewMode,
    appVersion 
  } = useData();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Find target series
  const currentSeries = useMemo(() => {
    if (!series || series.length === 0) return null;
    if (!selectedOeuvreId) return series[0];

    return series.find(
      s => s.id === selectedOeuvreId || s.slug === selectedOeuvreId
    ) || series[0];
  }, [series, selectedOeuvreId]);

  // Teaser for this series if exists
  const seriesTeaser = useMemo(() => {
    if (!currentSeries || !teasers) return null;
    return teasers.find(t => t.seriesId === currentSeries.id || t.seriesTitle?.toLowerCase() === currentSeries.title.toLowerCase()) || null;
  }, [currentSeries, teasers]);

  // Related series in similar genres
  const relatedSeries = useMemo(() => {
    if (!currentSeries || !series) return [];
    return series
      .filter(s => s.id !== currentSeries.id)
      .filter(s => s.genre === currentSeries.genre || s.country === currentSeries.country)
      .slice(0, 3);
  }, [series, currentSeries]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsLiked(false);
  }, [currentSeries?.id]);

  if (!currentSeries) {
    return (
      <div className="min-h-[70vh] bg-[#0c0d12] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Œuvre introuvable</h2>
        <p className="text-zinc-400 mb-6 max-w-md">L'œuvre demandée n'existe pas ou a été retirée du catalogue.</p>
        <button
          onClick={() => setViewMode('oeuvres')}
          className="px-6 py-2.5 rounded-full bg-[#ff5a50] text-white font-semibold hover:bg-[#ff6b5b] transition-colors"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  const chapters: Chapter[] = currentSeries.chapters && currentSeries.chapters.length > 0 
    ? currentSeries.chapters 
    : [
        {
          id: `${currentSeries.id}-ch-1`,
          seriesId: currentSeries.id,
          chapterNumber: 1,
          title: 'Prologue & Chapitre 1',
          releaseDate: currentSeries.updatedAt || '2026-08-20',
          isFree: true,
          coinsRequired: 0,
          likesCount: Math.floor(currentSeries.totalLikes / 2),
          readTimeMinutes: 6,
          summary: 'Découvrez les premiers pas et l\'ouverture épique de l\'histoire.',
          pages: [currentSeries.coverUrl]
        }
      ];

  const firstChapter = chapters[0];

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${currentSeries.title} sur OZI`;
    const text = `Découvrez la série webtoon "${currentSeries.title}" sur la plateforme OZI !`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  const apkUrl = appVersion?.downloadUrl || appVersion?.apkDownloadUrl || 'https://ozibd.net/ozi-reader.apk';

  return (
    <article id="oeuvre-standalone-page" className="min-h-screen bg-[#07080c] text-white pb-24 font-sans relative overflow-hidden">
      
      {/* 0. Top Navigation & Breadcrumbs Bar */}
      <div className="bg-[#0b0c13]/90 border-b border-zinc-800/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-zinc-400 flex-wrap">
              <button 
                onClick={() => setViewMode('accueil')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Accueil
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <button 
                onClick={() => setViewMode('oeuvres')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Catalogue des Œuvres
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-orange-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {currentSeries.title}
              </span>
            </nav>

            <button
              id="back-to-catalog-top-btn"
              onClick={() => setViewMode('oeuvres')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tous les Webtoons</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Large Top Hero WorkBanner */}
      <WorkBanner 
        work={currentSeries} 
        onReadFirstChapter={() => openReader(currentSeries.id, firstChapter.id)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6">

        {/* 2. Direct Synopsis Section (Unframed & Clean) */}
        <section className="mb-10 relative">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4 pb-3 border-b border-zinc-800/80">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-orange-400 font-heading">
              Synopsis de l'œuvre
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                {currentSeries.genre}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                {currentSeries.ageRating || 'Tous publics'}
              </span>
              <span className={`px-2.5 py-1 rounded-md font-semibold ${
                currentSeries.status === 'completed' 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
              }`}>
                {currentSeries.status === 'completed' ? 'Terminé' : 'En cours'}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-body mb-6">
            {currentSeries.synopsis}
          </p>

          {/* Tags & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/60">
            {currentSeries.tags && currentSeries.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {currentSeries.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : <div />}

            <div className="flex items-center gap-2 flex-wrap">
              {seriesTeaser && (
                <button
                  onClick={() => openTeaserModal(seriesTeaser)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span>Bande-Annonce</span>
                </button>
              )}

              <a
                href={apkUrl}
                download={`OZI-Reader-${appVersion?.version || 'v2.4.0'}.apk`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs border border-zinc-800 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>APK</span>
              </a>

              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${
                  copiedLink
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copié' : 'Partager'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Editorial Dynamic Chapter Section */}
        <ChapterSection series={currentSeries} />

        {/* Related Series Recommendations */}
        {relatedSeries.length > 0 && (
          <section className="pt-8 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar">
                Dans le même univers / Recommandé
              </h2>
              <button
                onClick={() => setViewMode('oeuvres')}
                className="text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tout le catalogue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {relatedSeries.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => openOeuvrePage(rel.slug || rel.id)}
                  className="group p-4 rounded-2xl bg-[#0d0e15] border border-zinc-800/80 hover:border-orange-500/40 transition-all cursor-pointer flex gap-3.5"
                >
                  <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                    <img
                      src={rel.coverUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase font-heading">
                        {rel.genre}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors line-clamp-2 mt-0.5 font-heading">
                        {rel.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{rel.rating.toFixed(1)}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{rel.country}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Back Button */}
        <div className="mt-14 text-center">
          <button
            onClick={() => setViewMode('oeuvres')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:text-white transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue complet</span>
          </button>
        </div>

      </div>
    </article>
  );
};
