import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Download, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Smartphone, 
  Sparkles, 
  BookOpen,
  Share2
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const WebtoonReaderModal: React.FC = () => {
  const { 
    activeReaderSeries, 
    activeReaderChapter, 
    closeReader, 
    openReader, 
    likeChapter, 
    appVersion 
  } = useData();

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);

  useEffect(() => {
    // Reset zoom when chapter changes
    setZoomLevel(100);
    setLiked(false);
  }, [activeReaderChapter?.id]);

  if (!activeReaderSeries || !activeReaderChapter) return null;

  const chapters = activeReaderSeries.chapters || [];
  const currentChapterIndex = chapters.findIndex(c => c.id === activeReaderChapter.id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 
    ? chapters[currentChapterIndex + 1] 
    : null;

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
            className="p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors"
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-heading">
                Aperçu Gratuit
              </span>
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
            className="p-2 rounded-lg bg-[#1c1c2b] hover:bg-[#26263a] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors text-xs flex items-center gap-1 font-heading font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          <select
            id="reader-chapter-select"
            value={activeReaderChapter.id}
            onChange={(e) => openReader(activeReaderSeries.id, e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1c1c2b] border border-[#2e2e46] text-xs font-bold text-zinc-200 focus:outline-none focus:border-orange-500 font-heading"
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
            className="p-2 rounded-lg bg-[#1c1c2b] hover:bg-[#26263a] disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition-colors text-xs flex items-center gap-1 font-heading font-bold"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Zoom, Fullscreen, Like */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-[#1c1c2b] border border-[#2e2e46] rounded-lg p-1">
            <button
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
              className="p-1 hover:text-orange-400 text-zinc-400 transition-colors"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-zinc-300 w-10 text-center font-mono">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
              className="p-1 hover:text-orange-400 text-zinc-400 transition-colors"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-300 hover:text-white border border-[#2e2e46] transition-colors"
            title="Plein écran"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Like button */}
          <button
            id="reader-like-btn"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold ${
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

          {/* Webtoon Panels / Vertical strip */}
          <div className="w-full flex flex-col gap-0 shadow-2xl rounded-2xl overflow-hidden border border-[#242436] bg-[#12121c]">
            {activeReaderChapter.pages.map((pageUrl, idx) => (
              <div key={idx} className="relative w-full overflow-hidden bg-[#12121c]">
                <img 
                  src={pageUrl} 
                  alt={`Planche ${idx + 1}`}
                  className="w-full h-auto object-cover block"
                  loading={idx < 2 ? 'eager' : 'lazy'}
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#09090e]/80 backdrop-blur-md text-[10px] font-mono text-zinc-400 border border-[#242436]">
                  Page {idx + 1} / {activeReaderChapter.pages.length}
                </div>
              </div>
            ))}
          </div>

          {/* End of Chapter / Call to Action Box */}
          <div className="w-full mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#12121c] via-[#12121c] to-[#09090e] border border-orange-500/30 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 font-heading">
              Fin de l'Aperçu du Chapitre {activeReaderChapter.chapterNumber}
            </h2>

            <p className="text-sm text-zinc-300 max-w-md mx-auto mb-6 leading-relaxed font-body">
              Pour débloquer la suite de <strong className="text-white">{activeReaderSeries.title}</strong>, activer le mode hors-ligne et soutenir directement les auteurs, téléchargez l'application officielle OZI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#section-download"
                onClick={closeReader}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-[#ff6600] to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-xl shadow-orange-500/25 transition-all hover:scale-105 font-heading"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger l'APK OZI ({appVersion.version})</span>
              </a>

              {nextChapter && (
                <button
                  onClick={() => openReader(activeReaderSeries.id, nextChapter.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#1c1c2b] hover:bg-[#26263a] text-zinc-100 font-bold text-xs border border-[#2e2e46] transition-colors font-heading"
                >
                  <span>Lire l'épisode {nextChapter.chapterNumber}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Sticky Mobile Navigation Helper */}
      <footer className="md:hidden h-14 bg-[#12121c] border-t border-[#1f1f2e] px-4 flex items-center justify-between shrink-0">
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && openReader(activeReaderSeries.id, prevChapter.id)}
          className="p-2 rounded-lg bg-[#1c1c2b] disabled:opacity-30 text-xs font-bold flex items-center gap-1 text-zinc-300 font-heading"
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
          className="p-2 rounded-lg bg-[#1c1c2b] disabled:opacity-30 text-xs font-bold flex items-center gap-1 text-zinc-300 font-heading"
        >
          <span>Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
