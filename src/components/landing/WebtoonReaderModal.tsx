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
  VolumeX
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ambientAudio } from '../../lib/ambientAudioEngine';

export const WebtoonReaderModal: React.FC = () => {
  const { 
    activeReaderSeries, 
    activeReaderChapter, 
    closeReader, 
    openReader, 
    likeChapter 
  } = useData();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const audioStartedRef = useRef<boolean>(false);

  // Auto-play immersive ambient soundtrack whenever chapter opens or switches
  useEffect(() => {
    // Reset zoom and like state
    setZoomLevel(100);
    setLiked(false);

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

  // Stop soundtrack when modal closes (unmounts)
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  if (!activeReaderSeries || !activeReaderChapter) return null;

  const chapters = activeReaderSeries.chapters || [];
  const currentChapterIndex = chapters.findIndex(c => c.id === activeReaderChapter.id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 
    ? chapters[currentChapterIndex + 1] 
    : null;

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
      {/* Top Sticky Header */}
      <header className="h-16 shrink-0 bg-[#12121c]/95 border-b border-[#1f1f2e] px-4 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        {/* Left: Series & Chapter info */}
        <div className="flex items-center gap-3">
          <button
            id="reader-close-btn"
            onClick={closeReader}
            className="p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors cursor-pointer"
            title="Quitter le lecteur"
            aria-label="Quitter le lecteur"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <span className="font-black text-sm sm:text-base text-zinc-100 line-clamp-1 font-heading">
              {activeReaderSeries.title}
            </span>
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
                Ch. {c.chapterNumber} - {c.title} {c.isFree ? '(Gratuit)' : `(${c.coinsRequired} pièces)`}
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
        </div>
      </header>

      {/* Main Webtoon Scrolling Canvas Container */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#09090e] flex flex-col items-center py-6 px-2 sm:px-4">
        
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
            {activeReaderChapter.pages.map((pageUrl, idx) => (
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
              </div>
            ))}
          </div>

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
    </div>
  );
};
