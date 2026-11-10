import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Volume2,
  VolumeX,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Download,
  WifiOff,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ambientAudio } from '../../lib/ambientAudioEngine';
import { WorkPremiumModal } from '../premium/WorkPremiumModal';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WorkReviewsSection } from '../comments/WorkReviewsSection';

export const WebtoonReaderModal: React.FC = () => {
  const { 
    activeReaderSeries, 
    activeReaderChapter, 
    closeReader, 
    openReader, 
    likeChapter,
    currentUser,
    openAuthModal,
    hasWorkAccess
  } = useData();

  const isOnline = useOnlineStatus();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  const [isCachedOffline, setIsCachedOffline] = useState<boolean>(false);
  const [cacheProgress, setCacheProgress] = useState<number>(0);
  const [showComments, setShowComments] = useState<boolean>(false);
  const audioStartedRef = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLElement>(null);

  // Auto-play immersive ambient soundtrack whenever chapter opens or switches
  useEffect(() => {
    // Reset zoom, like state, and scroll progress
    setZoomLevel(100);
    setLiked(false);
    setScrollProgress(0);

    // Scroll to top of container when chapter changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    if (!activeReaderChapter || !activeReaderSeries) return;

    // Launch ambient soundtrack for this chapter
    const launchAudio = () => {
      ambientAudio.playChapterAudio(
        activeReaderChapter.audioConfig,
        activeReaderSeries.genre
      );
      ambientAudio.resumeAudioContext();
    };

    launchAudio();
    audioStartedRef.current = true;

    // Browser autoplay policy handler: ensure sound starts on first interaction if blocked
    const handleFirstGesture = () => {
      ambientAudio.resumeAudioContext();
      if (!ambientAudio.isPlaying() && !isAudioMuted) {
        launchAudio();
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture, true);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('scroll', handleFirstGesture, { capture: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture, true);
    };
  }, [activeReaderChapter?.id, activeReaderSeries?.id]);

  // Handle scroll progress tracking
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll > 0) {
      const percentage = Math.min(100, Math.max(0, (target.scrollTop / maxScroll) * 100));
      setScrollProgress(percentage);
    } else {
      setScrollProgress(0);
    }
  };

  // Instantaneous audio cut and cleanup when closing the reader
  const handleClose = () => {
    ambientAudio.stop();
    closeReader();
  };

  // Keyboard shortcut: Escape to close and silence instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Stop soundtrack when modal closes (unmounts)
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  // Vérification de la disponibilité hors-ligne des planches
  useEffect(() => {
    let isMounted = true;
    const checkChapterCache = async () => {
      if (!('caches' in window) || !activeReaderChapter?.pages?.length) return;
      try {
        const cache = await caches.open('ozi-webtoon-panels-v1');
        const firstPage = activeReaderChapter.pages[0];
        const match = await cache.match(firstPage);
        if (isMounted) {
          setIsCachedOffline(!!match);
        }
      } catch (err) {
        console.warn('[Cache status check]', err);
      }
    };
    checkChapterCache();
    return () => { isMounted = false; };
  }, [activeReaderChapter?.id, activeReaderChapter?.pages]);

  // Téléchargement / mise en cache des planches pour lecture hors-ligne
  const handleDownloadForOffline = async () => {
    if (!('caches' in window) || !activeReaderChapter?.pages?.length) return;
    try {
      setIsCaching(true);
      setCacheProgress(15);
      const cache = await caches.open('ozi-webtoon-panels-v1');
      const validUrls = activeReaderChapter.pages.filter(Boolean);
      let loaded = 0;
      for (const url of validUrls) {
        try {
          const response = await fetch(url, { mode: 'no-cors' });
          if (response) {
            await cache.put(url, response);
          }
        } catch (fetchErr) {
          console.warn('[Cache direct fetch]', url, fetchErr);
        }
        loaded++;
        setCacheProgress(Math.round((loaded / validUrls.length) * 100));
      }

      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_CHAPTER_PAGES',
          chapterId: activeReaderChapter.id,
          urls: validUrls
        });
      }
      setIsCachedOffline(true);
    } catch (err) {
      console.error('[Download offline failed]', err);
    } finally {
      setIsCaching(false);
    }
  };

  if (!activeReaderSeries || !activeReaderChapter) return null;

  const chapters = activeReaderSeries.chapters || [];
  const currentChapterIndex = chapters.findIndex(c => c.id === activeReaderChapter.id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 
    ? chapters[currentChapterIndex + 1] 
    : null;

  // Chapter access and paywall determination
  const isChapterFree = activeReaderChapter.isFree ?? true;
  const hasAccess = isChapterFree || hasWorkAccess(activeReaderSeries.id);

  // If chapter is locked, only 2 pages are displayed for preview
  const displayedPages = (!hasAccess && activeReaderChapter.pages)
    ? activeReaderChapter.pages.slice(0, 2)
    : (activeReaderChapter.pages || []);

  const toggleAudio = () => {
    if (isAudioMuted) {
      ambientAudio.resumeAudioContext();
      ambientAudio.playChapterAudio(
        activeReaderChapter.audioConfig,
        activeReaderSeries.genre
      );
      setIsAudioMuted(false);
    } else {
      ambientAudio.stop();
      setIsAudioMuted(true);
    }
  };

  const handleLike = () => {
    if (!liked) {
      likeChapter(activeReaderSeries.id, activeReaderChapter.id);
      setLiked(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setFullscreen(false);
    }
  };

  return (
    <div 
      id="webtoon-reader-modal"
      className="fixed inset-0 z-50 flex flex-col bg-[#09090e] text-zinc-100 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Slim Non-Intrusive Progress Bar at the very top edge */}
      <div 
        id="reader-scroll-progress-container"
        className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none"
      >
        <div 
          id="reader-scroll-progress-bar"
          className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-[width] duration-75 ease-out shadow-[0_0_8px_rgba(249,115,22,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Sticky Header */}
      <header className="h-16 shrink-0 bg-[#12121c]/95 border-b border-[#1f1f2e] px-4 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        {/* Left: Series & Chapter info */}
        <div className="flex items-center gap-3">
          <button
            id="reader-close-btn"
            onClick={handleClose}
            className="p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors cursor-pointer"
            title="Quitter le lecteur"
            aria-label="Quitter le lecteur"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-zinc-100 line-clamp-1 font-heading">
                {activeReaderSeries.title}
              </span>
              {!isChapterFree && (
                hasAccess ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-heading">
                    <Sparkles className="w-2.5 h-2.5" /> Pass Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-heading">
                    <Lock className="w-2.5 h-2.5" /> Exclusif
                  </span>
                )
              )}
            </div>
            <span className="text-xs text-orange-400 font-bold line-clamp-1 font-heading">
              Chapitre {activeReaderChapter.chapterNumber} : {activeReaderChapter.title}
            </span>
          </div>
        </div>

        {/* Center: Chapter switcher selector */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="reader-prev-chapter-btn"
            disabled={!prevChapter}
            onClick={() => prevChapter && openReader(activeReaderSeries.id, prevChapter.id)}
            className="p-2 rounded-lg bg-[#1c1c2b] hover:bg-[#26263a] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors text-xs flex items-center gap-1 font-heading font-bold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          <select
            id="reader-chapter-select"
            value={activeReaderChapter.id}
            onChange={(e) => openReader(activeReaderSeries.id, e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1c1c2b] border border-[#2e2e46] text-xs font-bold text-zinc-200 focus:outline-none focus:border-orange-500 font-heading cursor-pointer"
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Ch. {c.chapterNumber} - {c.title} {c.isFree ? '(Gratuit)' : '(Pass 30j)'}
              </option>
            ))}
          </select>

          <button
            id="reader-next-chapter-btn"
            disabled={!nextChapter}
            onClick={() => nextChapter && openReader(activeReaderSeries.id, nextChapter.id)}
            className="p-2 rounded-lg bg-[#1c1c2b] hover:bg-[#26263a] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors text-xs flex items-center gap-1 font-heading font-bold cursor-pointer"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Audio, Zoom, Fullscreen, Like */}
        <div className="flex items-center gap-2">
          {/* Quick Paystack Unlock / Active Badge */}
          {!isChapterFree && !hasAccess && (
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setIsPremiumModalOpen(true);
                } else {
                  openAuthModal('login');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer font-heading"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pass 30j (2 000 FCFA)</span>
              <span className="sm:hidden">Pass 30j</span>
            </button>
          )}

          {!isChapterFree && hasAccess && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-heading">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pass Actif</span>
            </div>
          )}

          {/* Mode Hors-Ligne Indicator when disconnected */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-heading animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hors-Ligne</span>
            </div>
          )}

          {/* Download chapter offline for low/no connectivity */}
          <button
            type="button"
            onClick={handleDownloadForOffline}
            disabled={isCaching}
            title={isCachedOffline ? "Chapitre sauvegardé pour lecture hors-ligne" : "Télécharger les planches pour lire sans connexion"}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-heading cursor-pointer ${
              isCachedOffline
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 border-[#2e2e46]'
            }`}
          >
            {isCaching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                <span className="hidden md:inline text-[11px] font-bold text-orange-400">{cacheProgress}%</span>
              </>
            ) : isCachedOffline ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline font-bold">Hors-ligne prêt</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-zinc-300" />
                <span className="hidden md:inline font-bold">Sauvegarder</span>
              </>
            )}
          </button>

          {/* Audio Soundtrack Toggle Button */}
          <button
            id="reader-audio-toggle-btn"
            onClick={toggleAudio}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              !isAudioMuted 
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30' 
                : 'bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-400 border-[#2e2e46]'
            }`}
            title={isAudioMuted ? 'Activer la musique' : 'Couper la musique'}
            aria-label={isAudioMuted ? 'Activer la musique' : 'Couper la musique'}
          >
            {!isAudioMuted ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-[#1c1c2b] border border-[#2e2e46] rounded-lg p-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
              className="p-1 hover:text-orange-400 text-zinc-400 transition-colors cursor-pointer"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-zinc-300 w-10 text-center font-mono">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
              className="p-1 hover:text-orange-400 text-zinc-400 transition-colors cursor-pointer"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors cursor-pointer"
            title="Plein écran"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Like button */}
          <button
            id="reader-like-btn"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
              liked 
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20' 
                : 'bg-[#1c1c2b] hover:bg-[#26263a] text-rose-400 border-[#2e2e46]'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
            <span>{(activeReaderChapter.likesCount + (liked ? 1 : 0)).toLocaleString()}</span>
          </button>

          {/* Scroll to chapter comments */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('reader-comments-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Avis et commentaires des lecteurs"
            className="p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Webtoon Scrolling Canvas Container */}
      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#09090e] flex flex-col items-center py-6 px-2 sm:px-4"
      >
        
        {/* Webtoon Column Canvas */}
        <div 
          className="w-full flex flex-col items-center transition-all duration-200"
          style={{ maxWidth: `${Math.round(750 * (zoomLevel / 100))}px` }}
        >
          {/* Chapter Title Cover Page */}
          <div className="w-full bg-[#12121c] border border-[#242436] rounded-2xl p-6 sm:p-8 mb-4 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400 font-heading">
              {activeReaderSeries.title} • Épisode {activeReaderChapter.chapterNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-3 font-heading">
              {activeReaderChapter.title}
            </h1>
            {activeReaderChapter.summary && (
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto italic font-body">
                « {activeReaderChapter.summary} »
              </p>
            )}
          </div>

          {/* Webtoon Panels / Vertical strip with zero page indicator overlay */}
          <div className="w-full flex flex-col gap-0 shadow-2xl rounded-2xl overflow-hidden border border-[#242436] bg-[#12121c]">
            {displayedPages.map((pageUrl, idx) => (
              <div key={idx} className="relative w-full overflow-hidden bg-[#12121c]">
                <img 
                  src={pageUrl} 
                  alt={`Planche ${idx + 1}`}
                  className="w-full h-auto object-cover block"
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to series cover if chapter page is broken
                    const target = e.currentTarget;
                    if (target.src !== activeReaderSeries.coverUrl) {
                      target.src = activeReaderSeries.coverUrl;
                    }
                  }}
                />
                {/* Visual fade-out effect on the last preview page when locked */}
                {!hasAccess && idx === displayedPages.length - 1 && (
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#12121c] via-[#12121c]/90 to-transparent pointer-events-none" />
                )}
              </div>
            ))}
          </div>

          {/* Paywall Card when chapter is exclusive and reader does not have an active 30-day Pass */}
          {!hasAccess && (
            <section 
              aria-label="Débloquer ce chapitre"
              className="w-full mt-6 bg-gradient-to-b from-[#18182b] via-[#121220] to-[#0d0d17] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Ambient lighting */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto">
                {/* Golden Lock Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-xl shadow-amber-500/25 mb-4 animate-bounce">
                  <Lock className="w-8 h-8 stroke-[2.5]" />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-3 font-heading">
                  <Sparkles className="w-3.5 h-3.5" />
                  Chapitre Exclusif • Pass 30 Jours
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight mb-3">
                  Envie de découvrir la suite ?
                </h2>

                <p className="text-sm sm:text-base text-zinc-300 font-body leading-relaxed mb-6">
                  Ce chapitre et les planches complètes sont réservés aux abonnés. 
                  Activez votre <strong className="text-amber-400 font-bold">Pass 30 Jours</strong> pour lire en illimité et en haute définition l'intégralité de 
                  <strong className="text-white font-bold"> « {activeReaderSeries.title} »</strong>.
                </p>

                {/* Pricing summary */}
                <div className="w-full bg-[#1e1e30]/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <span className="text-xs text-zinc-400 font-bold block uppercase tracking-wider font-heading">Pass Oeuvre 30 Jours</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-white font-heading">2 000 FCFA</span>
                      <span className="text-sm text-zinc-400 font-medium">/ 30 jours</span>
                    </div>
                  </div>

                  <div className="flex flex-col text-left sm:text-right text-xs text-zinc-300 gap-1 font-heading">
                    <span className="flex items-center sm:justify-end gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Accès immédiat 24/7
                    </span>
                    <span className="flex items-center sm:justify-end gap-1.5 text-zinc-400">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" /> Mobile Money & Carte
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => setIsPremiumModalOpen(true)}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-heading"
                    >
                      <span>Débloquer mon Pass 30 Jours</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-heading"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Se connecter pour débloquer (2 000 FCFA)</span>
                    </button>
                  )}
                </div>

                {/* Benefits */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Paiement sécurisé Paystack
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Soutien direct aux créateurs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Zéro publicité intrusive
                  </span>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Bottom Sticky Mobile Navigation Helper */}
      <footer className="md:hidden h-14 bg-[#12121c] border-t border-[#1f1f2e] px-4 flex items-center justify-between shrink-0">
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && openReader(activeReaderSeries.id, prevChapter.id)}
          className="p-2 rounded-lg bg-[#1c1c2b] disabled:opacity-30 text-xs font-bold flex items-center gap-1 text-zinc-300 font-heading cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Précédent</span>
        </button>

        <span className="text-xs font-black text-orange-400 font-heading">
          Ch. {activeReaderChapter.chapterNumber} / {chapters.length}
        </span>

        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && openReader(activeReaderSeries.id, nextChapter.id)}
          className="p-2 rounded-lg bg-[#1c1c2b] disabled:opacity-30 text-xs font-bold flex items-center gap-1 text-zinc-300 font-heading cursor-pointer"
        >
          <span>Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* Work Premium Checkout Modal */}
      <WorkPremiumModal
        series={activeReaderSeries}
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </div>
  );
};
