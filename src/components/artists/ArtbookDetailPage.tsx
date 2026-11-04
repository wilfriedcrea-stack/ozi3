import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Lock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  FileText, 
  Calendar, 
  Layers, 
  User, 
  Share2, 
  Check, 
  ShieldCheck,
  Star,
  BookOpen
} from 'lucide-react';
import { Artbook, Artist } from '../../types';
import { useData } from '../../context/DataContext';
import { FreeDownloadModal } from './FreeDownloadModal';
import { PaidPurchaseModal } from './PaidPurchaseModal';

export const ArtbookDetailPage: React.FC = () => {
  const { 
    artbooks, 
    artists, 
    selectedArtbookId, 
    openArtistPage, 
    openArtbookPage,
    setViewMode 
  } = useData();

  // Find target artbook
  const currentArtbook = useMemo(() => {
    if (!artbooks || artbooks.length === 0) return null;
    if (!selectedArtbookId) return artbooks[0];
    return artbooks.find(a => a.id === selectedArtbookId || a.slug === selectedArtbookId) || artbooks[0];
  }, [artbooks, selectedArtbookId]);

  // Find associated artist
  const currentArtist = useMemo(() => {
    if (!currentArtbook || !artists) return null;
    return artists.find(a => a.id === currentArtbook.artistId || a.name.toLowerCase() === currentArtbook.artistName.toLowerCase()) || null;
  }, [currentArtbook, artists]);

  // Gallery state: exactly 5 preview images
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isFreeModalOpen, setIsFreeModalOpen] = useState<boolean>(false);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Touch gesture support for mobile swiping
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIndex(0);
  }, [currentArtbook?.id]);

  if (!currentArtbook) {
    return (
      <div className="min-h-[70vh] bg-[#06070a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-3 font-almodobar">Artbook introuvable</h2>
        <p className="text-zinc-400 mb-6 max-w-md">L'artbook sélectionné n'est pas disponible ou a été déplacé.</p>
        <button
          onClick={() => setViewMode('artistes')}
          className="px-6 py-2.5 rounded-xl bg-[#ff8679] text-white font-bold hover:bg-[#eb6e60] transition-colors"
        >
          Retour aux artistes
        </button>
      </div>
    );
  }

  // Ensure exactly 5 images
  const previewImages = currentArtbook.previewImages || [];

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev === 0 ? previewImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev === previewImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (distance > 50) {
        // Swiped left -> next
        handleNextImage();
      } else if (distance < -50) {
        // Swiped right -> prev
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentArtbook.title} — OZI Artbooks`,
        text: `Découvrez l'artbook "${currentArtbook.title}" par ${currentArtbook.artistName} sur OZI.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Other artbooks by this artist or others
  const relatedArtbooks = artbooks
    .filter(a => a.id !== currentArtbook.id)
    .slice(0, 3);

  return (
    <div className="py-8 sm:py-12 bg-[#06070a] min-h-screen text-white relative">
      {/* Background ambient glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#ff8679]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 overflow-x-auto py-1">
            <button
              onClick={() => setViewMode('artistes')}
              className="hover:text-[#ff8679] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tous les Artistes</span>
            </button>
            <span>/</span>
            {currentArtist ? (
              <button
                onClick={() => openArtistPage(currentArtist.id)}
                className="hover:text-white transition-colors cursor-pointer shrink-0 truncate max-w-[140px] sm:max-w-none"
              >
                {currentArtist.name}
              </button>
            ) : (
              <span className="shrink-0">{currentArtbook.artistName}</span>
            )}
            <span>/</span>
            <span className="text-[#ff8679] font-bold truncate max-w-[160px] sm:max-w-none">
              {currentArtbook.title}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Partager cet artbook"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Lien copié' : 'Partager'}</span>
          </button>
        </div>

        {/* SECTION A: PRESENTATION & INFORMATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          
          {/* Cover Art (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative group w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80">
              <img 
                src={currentArtbook.coverUrl} 
                alt={currentArtbook.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Price Tag Badge */}
              <div className="absolute top-3 right-3">
                {currentArtbook.isFree ? (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-white font-black text-xs uppercase tracking-wider backdrop-blur-md shadow-lg">
                    Gratuit
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff8679] to-[#fb923c] text-white font-black text-xs uppercase tracking-wider backdrop-blur-md shadow-lg">
                    {currentArtbook.price.toLocaleString()} FCFA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details & Metadata (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Header Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#ff8679] font-heading flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Artbook Officiel OZI</span>
                </span>
                {currentArtbook.rating && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{currentArtbook.rating}</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-almodobar mb-3">
                {currentArtbook.title}
              </h1>

              {/* Artist Name (clickable) */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-zinc-400">Créé par</span>
                {currentArtist ? (
                  <button
                    onClick={() => openArtistPage(currentArtist.id)}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-white hover:text-[#ff8679] transition-all cursor-pointer group"
                  >
                    <img 
                      src={currentArtist.photoUrl} 
                      alt="" 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                    <span>{currentArtist.name}</span>
                  </button>
                ) : (
                  <span className="text-sm font-bold text-white">{currentArtbook.artistName}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6 font-body">
                {currentArtbook.description}
              </p>

              {/* Badges / Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-[#12131b] border border-zinc-800/80 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#ff8679]" />
                    <span>Pages</span>
                  </div>
                  <div className="text-sm font-bold text-white">{currentArtbook.pageCount} pages HD</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#12131b] border border-zinc-800/80 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#fb923c]" />
                    <span>Format</span>
                  </div>
                  <div className="text-sm font-bold text-white">PDF ({currentArtbook.fileSizeFormatted})</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#12131b] border border-zinc-800/80 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Année</span>
                  </div>
                  <div className="text-sm font-bold text-white">{currentArtbook.releaseYear}</div>
                </div>

                <div className="p-3 rounded-2xl bg-[#12131b] border border-zinc-800/80 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Téléchargements</span>
                  </div>
                  <div className="text-sm font-bold text-white">{currentArtbook.downloadsCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Tags */}
              {currentArtbook.tags && currentArtbook.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {currentArtbook.tags.map(tag => (
                    <span 
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION B: GALERIE D'APERÇU (EXACTEMENT 5 IMAGES) */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-[#0e0f17] border border-zinc-800/90 shadow-2xl relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#ff8679] uppercase tracking-wider font-heading mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feuilleter l'Artbook</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar">
                Galerie d'Aperçu (5 Planches Officielles)
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono font-bold text-white">0{activeImageIndex + 1}</span>
              <span>/</span>
              <span className="font-mono text-zinc-500">0{previewImages.length}</span>
              <span className="text-[11px] text-zinc-500 ml-2 hidden sm:inline">(Glissez ou utilisez les flèches)</span>
            </div>
          </div>

          {/* Central Viewport with responsive non-distorting display */}
          <div 
            className="relative w-full h-[360px] sm:h-[480px] md:h-[540px] rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden flex items-center justify-center select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The active preview image displayed completely without destructive cropping */}
            <img 
              src={previewImages[activeImageIndex]} 
              alt={`Aperçu planche ${activeImageIndex + 1}`}
              className="max-w-full max-h-full object-contain cursor-zoom-in transition-opacity duration-300"
              onClick={() => setIsZoomModalOpen(true)}
              title="Cliquer pour zoomer en plein écran"
            />

            {/* Left Nav Arrow */}
            <button
              onClick={handlePrevImage}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
              aria-label="Planche précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={handleNextImage}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
              aria-label="Planche suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Fullscreen Zoom trigger button */}
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-xs font-semibold text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Agrandir</span>
            </button>

            {/* Counter pill */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 text-xs font-mono font-bold text-white border border-white/10 backdrop-blur-md">
              Planche {activeImageIndex + 1} sur {previewImages.length}
            </div>
          </div>

          {/* 5 Interactive Thumbnails row */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-4">
            {previewImages.map((img, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[3/4] sm:aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'border-[#ff8679] shadow-lg shadow-[#ff8679]/20 scale-105' 
                      : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600'
                  }`}
                  aria-label={`Afficher la planche ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                    0{idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SECTION C: BOUTON D'ACTION PRINCIPAL SOUS LA GALERIE */}
          <div className="mt-8 pt-8 border-t border-zinc-800/80 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full">
              {currentArtbook.isFree ? (
                /* FREE ARTBOOK ACTION BUTTON */
                <button
                  id="btn-download-free-artbook"
                  onClick={() => setIsFreeModalOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-almodobar"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger gratuitement</span>
                </button>
              ) : (
                /* PAID ARTBOOK ACTION BUTTON */
                <button
                  id="btn-buy-paid-artbook"
                  onClick={() => setIsPaidModalOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff8679] to-[#fb923c] hover:from-[#eb6e60] hover:to-[#ea580c] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-[#ff8679]/25 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-almodobar"
                >
                  <Lock className="w-5 h-5" />
                  <span>Acheter — {currentArtbook.price.toLocaleString()} FCFA</span>
                </button>
              )}

              <p className="text-xs text-zinc-400 mt-3 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentArtbook.isFree 
                    ? 'Aucun paiement requis • Fichier PDF haute définition officiel'
                    : 'Paiement sécurisé Wave, Orange, MTN, Moov & Carte • Accès immédiat'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* RELATED ARTBOOKS SECTION */}
        {relatedArtbooks.length > 0 && (
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-6 font-almodobar flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff8679]" />
              <span>D'autres Artbooks à découvrir</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArtbooks.map(a => (
                <div
                  key={a.id}
                  onClick={() => openArtbookPage(a.id)}
                  className="group rounded-2xl bg-[#12131b] border border-zinc-800 hover:border-[#ff8679]/50 overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-900 relative">
                    <img 
                      src={a.coverUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        a.isFree ? 'bg-emerald-500 text-white' : 'bg-[#ff8679] text-white'
                      }`}>
                        {a.isFree ? 'Gratuit' : `${a.price.toLocaleString()} FCFA`}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff8679] transition-colors">
                      {a.title}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">Par {a.artistName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* FULLSCREEN ZOOM MODAL */}
      {isZoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsZoomModalOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between py-2 z-10" onClick={e => e.stopPropagation()}>
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {currentArtbook.title} — Planche {activeImageIndex + 1} / {previewImages.length}
            </div>
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Large Center Image */}
          <div 
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2" 
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={previewImages[activeImageIndex]} 
              alt="" 
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl" 
            />

            <button
              onClick={handlePrevImage}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>

          {/* Bottom Caption */}
          <div className="text-xs text-zinc-400 py-2">
            Illustrations officielles de {currentArtbook.artistName} • Appuyez n'importe où pour fermer
          </div>
        </div>
      )}

      {/* FREE DOWNLOAD MODAL */}
      <FreeDownloadModal
        artbook={currentArtbook}
        isOpen={isFreeModalOpen}
        onClose={() => setIsFreeModalOpen(false)}
      />

      {/* PAID PURCHASE MODAL */}
      <PaidPurchaseModal
        artbook={currentArtbook}
        isOpen={isPaidModalOpen}
        onClose={() => setIsPaidModalOpen(false)}
      />
    </div>
  );
};
