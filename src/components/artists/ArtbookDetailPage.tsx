import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Lock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Calendar, 
  Share2, 
  Check, 
  ShieldCheck,
  Star,
  BookOpen,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FreeDownloadModal } from './FreeDownloadModal';
import { PaidPurchaseModal } from './PaidPurchaseModal';
import { DownloadFormatModal } from './DownloadFormatModal';
import { ArtbookReviewsSection } from './ArtbookReviewsSection';
import { checkArtbookAccess } from '../../services/paystackClientService';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { formatPriceXofWithEur } from '../../utils/currency';

export const ArtbookDetailPage: React.FC = () => {
  const { 
    artbooks, 
    artists, 
    selectedArtbookId, 
    openArtistPage, 
    openArtbookPage,
    setViewMode,
    currentUser,
    artbookPurchases,
    validatedArtbookNotification,
    clearValidatedArtbookNotification,
    openCartModal
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
  const [isFormatModalOpen, setIsFormatModalOpen] = useState<boolean>(false);
  const [isPaymentJustValidated, setIsPaymentJustValidated] = useState<boolean>(false);
  const [downloadLead, setDownloadLead] = useState<{
    userName?: string;
    userEmail?: string;
    isPaid?: boolean;
    priceXof?: number;
    transactionRef?: string;
  }>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Touch gesture support for mobile swiping
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const [hasPurchasedAccess, setHasPurchasedAccess] = useState(false);
  const [reviewStats, setReviewStats] = useState<{
    averageRating: number | null;
    ratedCount: number;
    totalCount: number;
  }>({ averageRating: null, ratedCount: 0, totalCount: 0 });

  const handleReviewStatsChange = useCallback(
    (stats: { averageRating: number | null; ratedCount: number; totalCount: number }) => {
      setReviewStats(stats);
    },
    []
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIndex(0);
  }, [currentArtbook?.id]);

  const localCompletedPurchase = useMemo(() => {
    if (!currentArtbook) return null;
    return (
      (artbookPurchases || []).find(
        (p) =>
          (p.artbookId === currentArtbook.id || p.artbookId === currentArtbook.slug) &&
          p.status === 'completed' &&
          p.downloadAuthorized
      ) || null
    );
  }, [artbookPurchases, currentArtbook?.id, currentArtbook?.slug]);

  // Vérifier si le lecteur (connecté ou invité) a déjà acheté cet Artbook via Paystack
  useEffect(() => {
    if (!currentArtbook || currentArtbook.isFree) {
      setHasPurchasedAccess(false);
      return;
    }
    if (localCompletedPurchase) {
      setHasPurchasedAccess(true);
      return;
    }
    if (!currentUser?.uid) {
      setHasPurchasedAccess(false);
      return;
    }
    checkArtbookAccess(currentUser.uid, currentArtbook.id).then(res => {
      if (res.hasAccess) {
        setHasPurchasedAccess(true);
      }
    });
  }, [currentArtbook?.id, currentUser?.uid, localCompletedPurchase]);

  // Ouverture automatique de l'onglet « Paiement validé » + téléchargement PDF & EPUB au retour de Paystack
  useEffect(() => {
    if (!currentArtbook || !validatedArtbookNotification) return;
    const targetId = validatedArtbookNotification.artbookId;
    if (targetId === currentArtbook.id || targetId === currentArtbook.slug) {
      setDownloadLead({
        userName: validatedArtbookNotification.userName,
        userEmail: validatedArtbookNotification.userEmail,
        isPaid: true,
        priceXof: validatedArtbookNotification.priceXof || currentArtbook.price,
        transactionRef: validatedArtbookNotification.transactionRef,
      });
      setIsPaymentJustValidated(true);
      setIsFormatModalOpen(true);
      clearValidatedArtbookNotification();
    }
  }, [currentArtbook, validatedArtbookNotification, clearValidatedArtbookNotification]);

  if (!currentArtbook) {
    return (
      <div className="min-h-[70vh] bg-white text-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-3 font-almodobar">Artbook introuvable</h2>
        <p className="text-zinc-600 mb-6 max-w-md">L'artbook sélectionné n'est pas disponible ou a été déplacé.</p>
        <button
          onClick={() => setViewMode('artistes')}
          className="px-6 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Retour aux artistes
        </button>
      </div>
    );
  }

  const normalizedCover = normalizeImageUrl(currentArtbook.coverUrl);
  const previewImages = (currentArtbook.previewImages && currentArtbook.previewImages.length > 0
    ? currentArtbook.previewImages
    : [normalizedCover]
  )
    .map(img => normalizeImageUrl(img, normalizedCover))
    .filter(Boolean);

  const displayRating =
    reviewStats.averageRating !== null
      ? reviewStats.averageRating
      : typeof currentArtbook.rating === 'number' && currentArtbook.rating > 0
      ? currentArtbook.rating
      : null;

  const handleDirectUnlockedDownload = () => {
    setIsPaymentJustValidated(false);
    setDownloadLead({
      userName: localCompletedPurchase?.userName || currentUser?.displayName || 'Lecteur OZI',
      userEmail: localCompletedPurchase?.userEmail || currentUser?.email || '',
      isPaid: true,
      priceXof: localCompletedPurchase?.priceXof || currentArtbook.price,
      transactionRef: localCompletedPurchase?.paymentReference,
    });
    setIsFormatModalOpen(true);
  };

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
    <div className="py-8 sm:py-12 bg-white min-h-screen text-zinc-950 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 overflow-x-auto py-1">
            <button
              onClick={() => setViewMode('artistes')}
              className="hover:text-black transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tous les Artistes</span>
            </button>
            <span className="text-zinc-400">/</span>
            {currentArtist ? (
              <button
                onClick={() => openArtistPage(currentArtist.id)}
                className="hover:text-black transition-colors cursor-pointer shrink-0 truncate max-w-[140px] sm:max-w-none font-medium"
              >
                {currentArtist.name}
              </button>
            ) : (
              <span className="shrink-0 font-medium">{currentArtbook.artistName}</span>
            )}
            <span className="text-zinc-400">/</span>
            <span className="text-black font-bold truncate max-w-[160px] sm:max-w-none">
              {currentArtbook.title}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-700 hover:text-black border border-zinc-200 transition-colors cursor-pointer shrink-0 font-medium"
            title="Partager cet artbook"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Lien copié' : 'Partager'}</span>
          </button>
        </div>

        {/* SECTION A: PRESENTATION & INFORMATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          
          {/* Cover Art (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative group w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-lg">
              <img 
                src={normalizedCover} 
                alt={currentArtbook.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />

              {/* Price Tag Badge */}
              <div className="absolute top-3 right-3">
                {currentArtbook.isFree ? (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-md">
                    Gratuit
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-black text-white font-black text-xs uppercase tracking-wider shadow-md">
                    {formatPriceXofWithEur(currentArtbook.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details & Metadata (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Header Metadata */}
              <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
                <span className="font-bold uppercase tracking-widest text-[#e14f41] font-heading flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Artbook Officiel OZI</span>
                </span>
                {displayRating !== null && (
                  <>
                    <span className="text-zinc-300" aria-hidden="true">·</span>
                    <a
                      href="#artbook-reviews"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('artbook-reviews')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold tabular-nums cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{displayRating.toFixed(1)}/5</span>
                      {reviewStats.totalCount > 0 && (
                        <span className="text-zinc-500 font-normal">({reviewStats.totalCount} avis)</span>
                      )}
                    </a>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 tracking-tight font-almodobar mb-3">
                {currentArtbook.title}
              </h1>

              {/* Artist Name (clickable) */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-zinc-600">Créé par</span>
                {currentArtist ? (
                  <button
                    onClick={() => openArtistPage(currentArtist.id)}
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-sm font-bold text-zinc-950 transition-all cursor-pointer group"
                  >
                    <img 
                      src={normalizeImageUrl(currentArtist.photoUrl)} 
                      alt="" 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                    <span>{currentArtist.name}</span>
                  </button>
                ) : (
                  <span className="text-sm font-bold text-zinc-950">{currentArtbook.artistName}</span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed mb-6 font-body">
                {currentArtbook.description}
              </p>

              {/* Specs Grid (without format info) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#e14f41]" />
                    <span>Pages</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-950 tabular-nums">{currentArtbook.pageCount} pages HD</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Année</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-950 tabular-nums">{currentArtbook.releaseYear}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Téléchargements</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-950 tabular-nums">{currentArtbook.downloadsCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Tags */}
              {currentArtbook.tags && currentArtbook.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 text-xs text-zinc-600">
                  {currentArtbook.tags.map((tag, i) => (
                    <React.Fragment key={tag}>
                      {i > 0 && <span aria-hidden="true">·</span>}
                      <span>#{tag}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Quick Actions in Presentation */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {hasPurchasedAccess ? (
                  <button
                    type="button"
                    onClick={handleDirectUnlockedDownload}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger mon Artbook</span>
                  </button>
                ) : currentArtbook.isFree ? (
                  <button
                    type="button"
                    onClick={() => setIsFreeModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger gratuitement</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPaidModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-sm shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Acheter — {formatPriceXofWithEur(currentArtbook.price)}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => document.getElementById('artbook-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#e14f41]" />
                  <span>Avis & Notes ({reviewStats.totalCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: GALERIE D'APERÇU (EXACTEMENT 5 IMAGES) */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-zinc-50 border border-zinc-200 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#e14f41] uppercase tracking-wider font-heading mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feuilleter l'Artbook</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 font-almodobar">
                Galerie d'Aperçu ({previewImages.length} Planches Officielles)
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="font-mono font-bold text-zinc-950 tabular-nums">0{activeImageIndex + 1}</span>
              <span>/</span>
              <span className="font-mono text-zinc-500 tabular-nums">0{previewImages.length}</span>
              <span className="text-[11px] text-zinc-500 ml-2 hidden sm:inline">(Glissez ou utilisez les flèches)</span>
            </div>
          </div>

          {/* Central Viewport with responsive non-distorting display */}
          <div 
            className="relative w-full h-[360px] sm:h-[480px] md:h-[540px] rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center select-none"
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
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 shadow-md flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
              aria-label="Planche précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={handleNextImage}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 shadow-md flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
              aria-label="Planche suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Fullscreen Zoom trigger button */}
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-xs font-semibold text-zinc-900 border border-zinc-200 shadow-sm backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Agrandir</span>
            </button>

            {/* Counter label */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-xs font-mono font-bold text-zinc-900 border border-zinc-200 shadow-sm backdrop-blur-md tabular-nums">
              Planche {activeImageIndex + 1} sur {previewImages.length}
            </div>
          </div>

          {/* Interactive Thumbnails row */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-4">
            {previewImages.map((img, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[3/4] sm:aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                    isActive 
                      ? 'border-black shadow-md scale-[1.03]' 
                      : 'border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-400'
                  }`}
                  aria-label={`Afficher la planche ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white tabular-nums">
                    0{idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SECTION C: BOUTON D'ACTION PRINCIPAL SOUS LA GALERIE */}
          <div className="mt-8 pt-8 border-t border-zinc-200 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full">
              {hasPurchasedAccess ? (
                /* ALREADY PURCHASED PAYSTACK ACCESS */
                <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm mb-3 font-heading">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Artbook Débloqué • Accès Paystack Validé</span>
                  </div>
                  <button
                    onClick={handleDirectUnlockedDownload}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-sm flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer font-almodobar"
                  >
                    <Download className="w-5 h-5" />
                    <span>Télécharger à nouveau mon Artbook</span>
                  </button>
                </div>
              ) : currentArtbook.isFree ? (
                /* FREE ARTBOOK ACTION BUTTON */
                <button
                  id="btn-download-free-artbook"
                  onClick={() => setIsFreeModalOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base sm:text-lg shadow-sm flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer font-almodobar"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger gratuitement</span>
                </button>
              ) : (
                /* PAID ARTBOOK ACTION BUTTON */
                <button
                  id="btn-buy-paid-artbook"
                  onClick={() => setIsPaidModalOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-black hover:bg-zinc-800 text-white font-extrabold text-base sm:text-lg shadow-sm flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer font-almodobar"
                >
                  <Lock className="w-5 h-5" />
                  <span>Acheter — {formatPriceXofWithEur(currentArtbook.price)}</span>
                </button>
              )}

              <p className="text-xs text-zinc-600 mt-3 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {currentArtbook.isFree 
                    ? 'Aucun paiement requis • Édition haute définition officielle'
                    : 'Paiement sécurisé Wave, Orange, MTN, Moov & Carte • Accès immédiat'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D: COMMENTAIRES & NOTATION (ÉTOILES SUR 5/5) */}
        <ArtbookReviewsSection
          artbookId={currentArtbook.id}
          artbookTitle={currentArtbook.title}
          onStatsChange={handleReviewStatsChange}
        />

        {/* RELATED ARTBOOKS SECTION */}
        {relatedArtbooks.length > 0 && (
          <div className="mt-12 pt-8 border-t border-zinc-200">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-6 font-almodobar flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e14f41]" />
              <span>D'autres Artbooks à découvrir</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArtbooks.map(a => (
                <div
                  key={a.id}
                  onClick={() => openArtbookPage(a.id)}
                  className="group rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 overflow-hidden cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-100 relative">
                    <img 
                      src={normalizeImageUrl(a.coverUrl)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        a.isFree ? 'bg-emerald-600 text-white' : 'bg-black text-white'
                      }`}>
                        {a.isFree ? 'Gratuit' : formatPriceXofWithEur(a.price)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-zinc-950 truncate transition-colors">
                      {a.title}
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">Par {a.artistName}</p>
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
        onFormCompleted={({ userName, userEmail }) => {
          setIsPaymentJustValidated(false);
          setDownloadLead({ userName, userEmail, isPaid: false });
          setIsFormatModalOpen(true);
        }}
      />

      {/* PAID PURCHASE MODAL */}
      <PaidPurchaseModal
        artbook={currentArtbook}
        isOpen={isPaidModalOpen}
        onClose={() => setIsPaidModalOpen(false)}
        onOpenFormatChoice={({ userName, userEmail, transactionRef }) => {
          setIsPaymentJustValidated(true);
          setDownloadLead({ userName, userEmail, isPaid: true, priceXof: currentArtbook.price, transactionRef });
          setIsFormatModalOpen(true);
        }}
      />

      {/* AUTOMATIC DUAL DOWNLOAD MODAL (PDF + EPUB / PAIEMENT VALIDÉ) */}
      <DownloadFormatModal
        artbook={currentArtbook}
        isOpen={isFormatModalOpen}
        onClose={() => {
          setIsFormatModalOpen(false);
          setIsPaymentJustValidated(false);
        }}
        userName={downloadLead.userName}
        userEmail={downloadLead.userEmail}
        isPaid={downloadLead.isPaid}
        paymentJustValidated={isPaymentJustValidated}
        priceXof={downloadLead.priceXof}
        transactionRef={downloadLead.transactionRef}
        onOpenCart={() => {
          setIsFormatModalOpen(false);
          setIsPaymentJustValidated(false);
          openCartModal();
        }}
      />
    </div>
  );
};
