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
    <article id="oeuvre-standalone-page" className="min-h-screen bg-[#07080c] text-white pt-4 pb-24 font-sans relative overflow-hidden">
      
      {/* Background Ambient Backdrop Glow */}
      <div className="absolute top-0 left-0 right-0 h-[480px] sm:h-[580px] overflow-hidden pointer-events-none opacity-20 blur-3xl z-0">
        <img 
          src={currentSeries.bannerUrl || currentSeries.coverUrl} 
          alt="" 
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07080c]/80 to-[#07080c]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 mb-4 border-b border-zinc-800/80">
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

        {/* Hero Showcase Section */}
        <section className="rounded-3xl bg-[#0e0f17]/90 border border-[#1f2030] shadow-2xl p-5 sm:p-8 lg:p-10 mb-12 backdrop-blur-md relative overflow-hidden">
          
          {/* Subtle Top Right Corner Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
            
            {/* Left Column: Big Vertical Poster */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
              <div className="relative w-full max-w-[320px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 group">
                <img
                  src={currentSeries.coverUrl}
                  alt={currentSeries.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-heading shadow-md">
                    {currentSeries.genre}
                  </span>
                  {currentSeries.isExclusive && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-600/90 text-white shadow-md">
                      Exclusif OZI
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-semibold">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                    {currentSeries.ageRating || 'Tous publics'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                    {currentSeries.format === 'film' ? 'Film / One-shot' : 'Série Webtoon'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Information, Stats & CTAs */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-heading">
                    {currentSeries.country} • {currentSeries.releaseYear}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentSeries.status === 'completed' 
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' 
                      : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                  }`}>
                    {currentSeries.status === 'completed' ? 'Série Terminée' : 'En cours de parution'}
                  </span>
                </div>

                {/* Main Series Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-almodobar mb-3 leading-tight">
                  {currentSeries.title}
                </h1>

                {/* Creators */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-300 mb-6 pb-4 border-b border-zinc-800/80 font-body">
                  <div>
                    Scénario : <strong className="text-white">{currentSeries.author}</strong>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div>
                    Dessin : <strong className="text-white">{currentSeries.artist}</strong>
                  </div>
                  {currentSeries.studio && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <div>
                        Studio : <strong className="text-orange-400">{currentSeries.studio}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Note</p>
                      <p className="text-sm font-black text-white">{currentSeries.rating.toFixed(1)} <span className="text-[10px] text-zinc-500 font-normal">({currentSeries.reviewsCount})</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Lectures</p>
                      <p className="text-sm font-black text-white">{currentSeries.totalReads.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Favoris</p>
                      <p className="text-sm font-black text-white">{currentSeries.totalLikes.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Chapitres</p>
                      <p className="text-sm font-black text-white">{chapters.length}</p>
                    </div>
                  </div>
                </div>

                {/* Synopsis */}
                <div className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 font-heading">
                    Synopsis officiel
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-body">
                    {currentSeries.synopsis}
                  </p>
                </div>

                {/* Tags */}
                {currentSeries.tags && currentSeries.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-8">
                    {currentSeries.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800/80">
                <button
                  id="start-reading-oeuvre-btn"
                  onClick={() => openReader(currentSeries.id, firstChapter.id)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-[#ff5a50] hover:from-orange-600 hover:to-[#ff6b5b] text-zinc-950 font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading"
                >
                  <BookOpen className="w-5 h-5 fill-zinc-950" />
                  <span>Commencer la lecture (Ch. 1)</span>
                </button>

                {seriesTeaser && (
                  <button
                    onClick={() => openTeaserModal(seriesTeaser)}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm border border-zinc-700 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-orange-400 fill-orange-400" />
                    <span>Bande-Annonce</span>
                  </button>
                )}

                <a
                  href={apkUrl}
                  download={`OZI-Reader-${appVersion?.version || 'v2.4.0'}.apk`}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm border border-zinc-800 transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Télécharger l'APK</span>
                </a>

                <button
                  onClick={handleShare}
                  className={`inline-flex items-center gap-2 px-4 py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
                    copiedLink
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Chapters Section */}
        <section id="chapters-list-section" className="mb-16">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar">
                Liste des Chapitres ({chapters.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cliquez sur un chapitre pour lancer la lecture immédiate en plein écran.
              </p>
            </div>
            <button
              onClick={() => openReader(currentSeries.id, firstChapter.id)}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Lire depuis le début</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {chapters.map((ch, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={ch.id}
                  onClick={() => openReader(currentSeries.id, ch.id)}
                  className="group p-3.5 rounded-2xl bg-[#0f1018] hover:bg-[#151722] border border-zinc-800/80 hover:border-orange-500/40 transition-all cursor-pointer flex items-center gap-3.5 shadow-sm"
                >
                  {/* Thumbnail / Chapter Number Box */}
                  <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 flex items-center justify-center">
                    {ch.pages && ch.pages.length > 0 ? (
                      <img
                        src={ch.pages[0]}
                        alt={ch.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-zinc-600" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-black text-orange-400 font-heading">
                      #{ch.chapterNumber}
                    </span>
                  </div>

                  {/* Chapter Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-orange-400 font-heading truncate">
                        Épisode {ch.chapterNumber}
                      </span>
                      {ch.isFree ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                          Gratuit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-950/80 text-amber-400 border border-amber-800/60">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{ch.coinsRequired || 15} Coins</span>
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-300 transition-colors truncate">
                      {ch.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                      <span>{ch.releaseDate || 'Récent'}</span>
                      <span>•</span>
                      <span>{ch.readTimeMinutes || 6} min</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-full bg-zinc-900 group-hover:bg-orange-500 group-hover:text-zinc-950 text-zinc-400 transition-all shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
