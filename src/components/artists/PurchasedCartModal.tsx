import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Download,
  ExternalLink,
  CheckCircle2,
  Palette,
  Receipt,
  Sparkles,
  Mail,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Artbook, ArtbookPurchaseRecord } from '../../types';
import { DownloadFormatModal } from './DownloadFormatModal';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { formatPriceXofWithEur } from '../../utils/currency';

export const PurchasedCartModal: React.FC = () => {
  const {
    isCartModalOpen,
    closeCartModal,
    artbookPurchases,
    artbooks,
    openArtbookPage,
    setViewMode,
    currentUser,
    recoverArtbookPurchasesByEmail,
  } = useData();

  const [selectedDownloadTarget, setSelectedDownloadTarget] = useState<{
    artbook: Artbook;
    purchase: ArtbookPurchaseRecord;
  } | null>(null);

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isCartModalOpen) {
      setRecoveryStatus(null);
      if (!recoveryEmail && currentUser?.email) {
        setRecoveryEmail(currentUser.email);
      }
    }
  }, [isCartModalOpen, currentUser?.email]);

  useEffect(() => {
    if (!isCartModalOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedDownloadTarget) {
        closeCartModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCartModalOpen, closeCartModal, selectedDownloadTarget]);

  const paidPurchases = useMemo(() => {
    const completed = (artbookPurchases || []).filter(
      (p) => p.status === 'completed' && p.downloadAuthorized
    );
    const seen = new Set<string>();
    return completed.filter((p) => {
      const key = p.paymentReference || `${p.artbookId}:${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [artbookPurchases]);

  if (!isCartModalOpen) return null;

  const handleRecoverByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus(null);
    setIsRecovering(true);
    try {
      const result = await recoverArtbookPurchasesByEmail(recoveryEmail);
      if (!result.success) {
        setRecoveryStatus({ type: 'error', text: result.message });
      } else if (result.count === 0) {
        setRecoveryStatus({ type: 'info', text: result.message });
      } else {
        setRecoveryStatus({ type: 'success', text: result.message });
      }
    } catch {
      setRecoveryStatus({
        type: 'error',
        text: 'Erreur réseau lors de la récupération de vos achats.',
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const findArtbookForPurchase = (purchase: ArtbookPurchaseRecord): Artbook => {
    const found = (artbooks || []).find(
      (a) => a.id === purchase.artbookId || a.slug === purchase.artbookId
    );
    if (found) return found;

    return {
      id: purchase.artbookId,
      slug: purchase.artbookId,
      artistId: '',
      artistName: purchase.artistName || 'Artiste OZI',
      title: purchase.artbookTitle || 'Artbook OZI',
      description: 'Édition digitale officielle OZI débloquée via Paystack.',
      coverUrl: '',
      previewImages: ['', '', '', '', ''],
      pageCount: 32,
      releaseYear: new Date().getFullYear(),
      fileSizeFormatted: 'HD',
      isFree: false,
      price: purchase.priceXof || 0,
      tags: ['Artbook'],
      downloadsCount: 1,
      createdAt: purchase.purchasedAt,
    };
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={closeCartModal}
        role="dialog"
        aria-modal="true"
        aria-label="Mes Artbooks payés"
      >
        <div
          className="relative w-full max-w-xl rounded-3xl bg-[#14151e] border border-zinc-800 shadow-2xl p-6 sm:p-7 text-zinc-100 max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeCartModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-heading">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Espace Achats & Téléchargements</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-almodobar">
                Mes Artbooks Payés ({paidPurchases.length})
              </h2>
            </div>
          </div>

          {/* Retrouver mes achats avec mon e-mail */}
          <div className="mb-4 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 mb-2">
              <Mail className="w-4 h-4 text-[#ff8679] shrink-0" />
              <span>Retrouver mes achats avec mon e-mail</span>
            </div>
            <form onSubmit={handleRecoverByEmail} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="Votre e-mail utilisé lors du paiement"
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isRecovering}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isRecovering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Retrouver</span>
                  </>
                )}
              </button>
            </form>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Récupérez tous vos artbooks payés depuis n’importe quel téléphone ou ordinateur.
            </p>

            {recoveryStatus && (
              <div
                className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  recoveryStatus.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : recoveryStatus.type === 'error'
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                }`}
              >
                {recoveryStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{recoveryStatus.text}</span>
              </div>
            )}
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {paidPurchases.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Aucun artbook payé sur cet appareil</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Dès que vous achetez un artbook via Paystack, il apparaît ici pour télécharger ses fichiers PDF et EPUB à tout moment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeCartModal();
                    setViewMode('artistes');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                >
                  <Palette className="w-4 h-4" />
                  <span>Découvrir les Artbooks</span>
                </button>
              </div>
            ) : (
              paidPurchases.map((purchase) => {
                const matchedArtbook = findArtbookForPurchase(purchase);
                const coverSrc = matchedArtbook.coverUrl
                  ? normalizeImageUrl(matchedArtbook.coverUrl)
                  : '';

                return (
                  <div
                    key={purchase.id || purchase.paymentReference}
                    className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={matchedArtbook.title}
                          className="w-14 h-20 rounded-xl object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                        />
                      ) : (
                        <div className="w-14 h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <Palette className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold mb-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Payé & Débloqué</span>
                        </div>

                        <h3 className="text-sm font-bold text-white truncate">
                          {purchase.artbookTitle || matchedArtbook.title}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">
                          Par {purchase.artistName || matchedArtbook.artistName}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                          <span className="font-bold text-emerald-400">
                            {formatPriceXofWithEur(purchase.priceXof || matchedArtbook.price || 0)}
                          </span>
                          {purchase.paymentReference && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                              <Receipt className="w-3 h-3" />
                              {purchase.paymentReference.slice(0, 18)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDownloadTarget({
                            artbook: matchedArtbook,
                            purchase,
                          })
                        }
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger (PDF + EPUB)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeCartModal();
                          openArtbookPage(purchase.artbookId);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Voir la fiche</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Automatic Dual Downloader (PDF + EPUB) directly from Cart */}
      {selectedDownloadTarget && (
        <DownloadFormatModal
          artbook={selectedDownloadTarget.artbook}
          isOpen={true}
          onClose={() => setSelectedDownloadTarget(null)}
          userName={selectedDownloadTarget.purchase.userName}
          userEmail={selectedDownloadTarget.purchase.userEmail}
          isPaid={true}
          priceXof={selectedDownloadTarget.purchase.priceXof}
          transactionRef={selectedDownloadTarget.purchase.paymentReference}
        />
      )}
    </>
  );
};
