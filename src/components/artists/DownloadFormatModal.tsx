import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  BookOpen,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Artbook } from '../../types';
import { generateAndDownloadArtbookPdf } from '../../utils/pdfGenerator';
import { generateAndDownloadArtbookEpub } from '../../utils/epubGenerator';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { formatPriceXofWithEur } from '../../utils/currency';

interface DownloadFormatModalProps {
  artbook: Artbook;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  isPaid?: boolean;
  paymentJustValidated?: boolean;
  priceXof?: number;
  transactionRef?: string;
  onOpenCart?: () => void;
}

type ChosenFormat = 'pdf' | 'epub';
type FormatStatus = 'idle' | 'downloading' | 'done' | 'error';

function triggerDirectAnchorDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export const DownloadFormatModal: React.FC<DownloadFormatModalProps> = ({
  artbook,
  isOpen,
  onClose,
  userName = 'Lecteur OZI',
  userEmail = 'lecteur@ozi.africa',
  isPaid = false,
  paymentJustValidated = false,
  priceXof,
  transactionRef,
  onOpenCart,
}) => {
  const [formatStatuses, setFormatStatuses] = useState<Record<ChosenFormat, FormatStatus>>({
    pdf: 'idle',
    epub: 'idle',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLaunchingAll, setIsLaunchingAll] = useState(false);

  const isMountedRef = useRef(true);
  const lastAutoTriggerKeyRef = useRef<string>('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cleanBaseName = artbook.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  const downloadSingleFormat = useCallback(
    async (format: ChosenFormat): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      setFormatStatuses((prev) => ({ ...prev, [format]: 'downloading' }));

      try {
        const configuredPrimary = (artbook.pdfDownloadUrl || artbook.downloadUrl || '').trim();
        const configuredEpub = (artbook.epubDownloadUrl || '').trim();

        if (format === 'pdf') {
          const isEpubOnlyUrl = /\.epub(\?.*)?$/i.test(configuredPrimary);
          if (configuredPrimary && !isEpubOnlyUrl) {
            triggerDirectAnchorDownload(configuredPrimary, `${cleanBaseName}_Artbook.pdf`);
            if (isMountedRef.current) {
              setFormatStatuses((prev) => ({ ...prev, pdf: 'done' }));
            }
            return true;
          }

          const result = await generateAndDownloadArtbookPdf({
            artbook,
            userName,
            userEmail,
            isPaid,
            transactionRef,
          });

          if (!result.success) {
            if (isMountedRef.current) {
              setFormatStatuses((prev) => ({ ...prev, pdf: 'error' }));
            }
            return false;
          }

          if (isMountedRef.current) {
            setFormatStatuses((prev) => ({ ...prev, pdf: 'done' }));
          }
          return true;
        } else {
          const fallbackEpubFromPrimary = /\.epub(\?.*)?$/i.test(configuredPrimary)
            ? configuredPrimary
            : '';
          const directEpubUrl = configuredEpub || fallbackEpubFromPrimary;

          if (directEpubUrl) {
            triggerDirectAnchorDownload(directEpubUrl, `${cleanBaseName}_Artbook.epub`);
            if (isMountedRef.current) {
              setFormatStatuses((prev) => ({ ...prev, epub: 'done' }));
            }
            return true;
          }

          const result = await generateAndDownloadArtbookEpub({
            artbook,
            userName,
            userEmail,
            isPaid,
            transactionRef,
          });

          if (!result.success) {
            if (isMountedRef.current) {
              setFormatStatuses((prev) => ({ ...prev, epub: 'error' }));
            }
            return false;
          }

          if (isMountedRef.current) {
            setFormatStatuses((prev) => ({ ...prev, epub: 'done' }));
          }
          return true;
        }
      } catch (err) {
        console.error(`Error launching ${format} download:`, err);
        if (isMountedRef.current) {
          setFormatStatuses((prev) => ({ ...prev, [format]: 'error' }));
        }
        return false;
      }
    },
    [artbook, cleanBaseName, isPaid, transactionRef, userEmail, userName]
  );

  const launchBothDownloads = useCallback(async () => {
    if (!isMountedRef.current) return;
    setErrorMsg('');
    setIsLaunchingAll(true);
    setFormatStatuses({ pdf: 'downloading', epub: 'idle' });

    const pdfOk = await downloadSingleFormat('pdf');
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (!isMountedRef.current) return;

    const epubOk = await downloadSingleFormat('epub');
    if (!isMountedRef.current) return;

    if (!pdfOk || !epubOk) {
      setErrorMsg(
        'Un des fichiers n’a pas démarré automatiquement. Utilisez le bouton « Relancer » correspondant.'
      );
    }

    confetti({
      particleCount: paymentJustValidated ? 110 : 70,
      spread: paymentJustValidated ? 85 : 65,
      origin: { y: 0.6 },
    });

    setIsLaunchingAll(false);
  }, [downloadSingleFormat, paymentJustValidated]);

  useEffect(() => {
    if (!isOpen) {
      lastAutoTriggerKeyRef.current = '';
      return;
    }

    const triggerKey = `${artbook.id}:${transactionRef || 'free'}:${paymentJustValidated ? 'val' : 'dl'}`;
    if (lastAutoTriggerKeyRef.current === triggerKey) return;
    lastAutoTriggerKeyRef.current = triggerKey;

    launchBothDownloads();
  }, [isOpen, artbook.id, transactionRef, paymentJustValidated, launchBothDownloads]);

  if (!isOpen) return null;

  const bothDone = formatStatuses.pdf === 'done' && formatStatuses.epub === 'done';
  const effectivePrice = typeof priceXof === 'number' && priceXof > 0 ? priceXof : artbook.price || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#14151e] border border-zinc-800 shadow-2xl p-6 sm:p-8 text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Onglet / En-tête Paiement validé ou Téléchargement */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
            {paymentJustValidated ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Download className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-heading mb-1">
              {paymentJustValidated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Paiement validé</span>
                </>
              ) : isPaid ? (
                <span>Accès Paystack débloqué</span>
              ) : (
                <span>Téléchargement complet</span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white font-almodobar">
              {paymentJustValidated
                ? 'Paiement validé ! Téléchargement en cours...'
                : 'Téléchargement PDF & EPUB'}
            </h3>
          </div>
        </div>

        {/* Mini Artbook Summary & Panier notice */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 mb-4 flex items-center gap-3">
          <img
            src={normalizeImageUrl(artbook.coverUrl)}
            alt={artbook.title}
            className="w-12 h-16 object-cover rounded-xl border border-zinc-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{artbook.title}</div>
            <div className="text-xs text-zinc-400 truncate">Par {artbook.artistName}</div>
            {paymentJustValidated && effectivePrice > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-emerald-400">
                  Réglé : {formatPriceXofWithEur(effectivePrice)}
                </span>
                {transactionRef && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                    <Receipt className="w-3 h-3" />
                    {transactionRef.slice(0, 20)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {paymentJustValidated && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Cet artbook a été enregistré dans votre <strong>panier</strong> pour le retrouver à tout moment.
              </span>
            </div>
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
              >
                Voir mon panier
              </button>
            )}
          </div>
        )}

        <p className="text-xs sm:text-sm text-zinc-300 mb-3 leading-relaxed">
          Vos deux fichiers (<strong className="text-white">PDF</strong> et <strong className="text-white">EPUB</strong>) se téléchargent automatiquement :
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dual Progress Rows: 1. PDF & 2. EPUB */}
        <div className="space-y-3 mb-5">
          {/* PDF Row */}
          <div
            className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
              formatStatuses.pdf === 'done'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                : formatStatuses.pdf === 'error'
                ? 'bg-rose-950/30 border-rose-500/50 text-white'
                : 'bg-zinc-900/90 border-zinc-700/80 text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#ff8679] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Fichier PDF</span>
                {formatStatuses.pdf === 'done' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Téléchargé
                  </span>
                )}
                {formatStatuses.pdf === 'downloading' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    En cours...
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Mise en page fidèle pour ordinateur, tablette et mobile
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFormat('pdf')}
              disabled={formatStatuses.pdf === 'downloading'}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Relancer le téléchargement PDF"
            >
              {formatStatuses.pdf === 'downloading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Relancer</span>
            </button>
          </div>

          {/* EPUB Row */}
          <div
            className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
              formatStatuses.epub === 'done'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                : formatStatuses.epub === 'error'
                ? 'bg-rose-950/30 border-rose-500/50 text-white'
                : 'bg-zinc-900/90 border-zinc-700/80 text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Fichier EPUB</span>
                {formatStatuses.epub === 'done' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Téléchargé
                  </span>
                )}
                {formatStatuses.epub === 'downloading' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    En cours...
                  </span>
                )}
                {formatStatuses.epub === 'idle' && (
                  <span className="text-[11px] font-semibold text-zinc-400">En file...</span>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Livre numérique interactif pour liseuses et applications
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFormat('epub')}
              disabled={formatStatuses.epub === 'downloading'}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Relancer le téléchargement EPUB"
            >
              {formatStatuses.epub === 'downloading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Relancer</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={launchBothDownloads}
            disabled={isLaunchingAll}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLaunchingAll ? 'animate-spin' : ''}`} />
            <span>Télécharger les 2 fichiers</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            {bothDone ? 'Terminer' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
