import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  BookOpen,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Artbook } from '../../types';
import { generateAndDownloadArtbookPdf } from '../../utils/pdfGenerator';
import { generateAndDownloadArtbookEpub } from '../../utils/epubGenerator';
import { normalizeImageUrl } from '../../utils/imageUtils';

interface DownloadFormatModalProps {
  artbook: Artbook;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  isPaid?: boolean;
  transactionRef?: string;
}

type ChosenFormat = 'pdf' | 'epub';

function triggerDirectAnchorDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
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
  transactionRef,
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<ChosenFormat | null>(null);
  const [downloadedFormats, setDownloadedFormats] = useState<Record<ChosenFormat, boolean>>({
    pdf: false,
    epub: false,
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDownloadingFormat(null);
      setDownloadedFormats({ pdf: false, epub: false });
      setErrorMsg('');
    }
  }, [isOpen, artbook.id]);

  if (!isOpen) return null;

  const cleanBaseName = artbook.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  const handleSelectFormat = async (format: ChosenFormat) => {
    if (downloadingFormat) return;
    setErrorMsg('');
    setDownloadingFormat(format);

    try {
      const configuredPrimary = (artbook.pdfDownloadUrl || artbook.downloadUrl || '').trim();
      const configuredEpub = (artbook.epubDownloadUrl || '').trim();

      if (format === 'pdf') {
        const isEpubOnlyUrl = /\.epub(\?.*)?$/i.test(configuredPrimary);
        if (configuredPrimary && !isEpubOnlyUrl) {
          triggerDirectAnchorDownload(configuredPrimary, `${cleanBaseName}_Artbook.pdf`);
          setDownloadedFormats(prev => ({ ...prev, pdf: true }));
        } else {
          const result = await generateAndDownloadArtbookPdf({
            artbook,
            userName,
            userEmail,
            isPaid,
            transactionRef,
          });
          if (!result.success) {
            setErrorMsg('Impossible de lancer le téléchargement PDF. Veuillez réessayer.');
            return;
          }
          setDownloadedFormats(prev => ({ ...prev, pdf: true }));
        }
      } else {
        const fallbackEpubFromPrimary = /\.epub(\?.*)?$/i.test(configuredPrimary)
          ? configuredPrimary
          : '';
        const directEpubUrl = configuredEpub || fallbackEpubFromPrimary;

        if (directEpubUrl) {
          triggerDirectAnchorDownload(directEpubUrl, `${cleanBaseName}_Artbook.epub`);
          setDownloadedFormats(prev => ({ ...prev, epub: true }));
        } else {
          const result = await generateAndDownloadArtbookEpub({
            artbook,
            userName,
            userEmail,
            isPaid,
            transactionRef,
          });
          if (!result.success) {
            setErrorMsg('Impossible de lancer le téléchargement EPUB. Veuillez réessayer.');
            return;
          }
          setDownloadedFormats(prev => ({ ...prev, epub: true }));
        }
      }

      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Error launching format download:', err);
      setErrorMsg('Une erreur est survenue lors du lancement du téléchargement.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const hasDownloadedAny = downloadedFormats.pdf || downloadedFormats.epub;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#14151e] border border-zinc-800 shadow-2xl p-6 sm:p-8 text-zinc-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-heading">
              Étape 2 sur 2
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white font-almodobar">
              Choisissez votre format
            </h3>
          </div>
        </div>

        {/* Mini Artbook Summary */}
        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 mb-5 flex items-center gap-3">
          <img
            src={normalizeImageUrl(artbook.coverUrl)}
            alt={artbook.title}
            className="w-11 h-14 object-cover rounded-xl border border-zinc-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{artbook.title}</div>
            <div className="text-xs text-zinc-400 truncate">Par {artbook.artistName}</div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 mb-4 leading-relaxed">
          Sélectionnez le format souhaité pour lancer immédiatement le téléchargement :
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Format Options: 1. PDF & 2. EPUB */}
        <div className="space-y-3 mb-6">
          {/* Option 1: PDF */}
          <button
            type="button"
            onClick={() => handleSelectFormat('pdf')}
            disabled={downloadingFormat !== null}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer disabled:opacity-60 ${
              downloadedFormats.pdf
                ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-700/80 hover:border-emerald-500/70 text-white'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#ff8679] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>PDF</span>
                {downloadedFormats.pdf && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Téléchargé
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {downloadingFormat === 'pdf'
                  ? 'Téléchargement en cours...'
                  : 'Mise en page fidèle pour ordinateur, tablette et mobile'}
              </div>
            </div>
            <div className="shrink-0 text-emerald-400">
              {downloadingFormat === 'pdf' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
          </button>

          {/* Option 2: EPUB */}
          <button
            type="button"
            onClick={() => handleSelectFormat('epub')}
            disabled={downloadingFormat !== null}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer disabled:opacity-60 ${
              downloadedFormats.epub
                ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-zinc-700/80 hover:border-emerald-500/70 text-white'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sky-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>EPUB</span>
                {downloadedFormats.epub && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Téléchargé
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {downloadingFormat === 'epub'
                  ? 'Téléchargement en cours...'
                  : 'Livre numérique interactif pour liseuses et applications de lecture'}
              </div>
            </div>
            <div className="shrink-0 text-emerald-400">
              {downloadingFormat === 'epub' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] text-zinc-400">
            {hasDownloadedAny
              ? 'Téléchargement lancé ! Vous pouvez aussi choisir l’autre format.'
              : 'Les deux formats sont inclus.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            {hasDownloadedAny ? 'Terminer' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
