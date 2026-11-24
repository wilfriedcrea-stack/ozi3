import React, { useState, useEffect } from 'react';
import { X, Download, ShieldCheck, AlertCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Artbook } from '../../types';
import { useData } from '../../context/DataContext';

interface FreeDownloadModalProps {
  artbook: Artbook;
  isOpen: boolean;
  onClose: () => void;
  onFormCompleted?: (lead: { userName: string; userEmail: string }) => void;
}

export const FreeDownloadModal: React.FC<FreeDownloadModalProps> = ({
  artbook,
  isOpen,
  onClose,
  onFormCompleted,
}) => {
  const { currentUser, readerProfile, recordArtbookDownload } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill user data if connected
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (readerProfile?.displayName || currentUser?.displayName) {
        setName(readerProfile?.displayName || currentUser?.displayName || '');
      }
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    }
  }, [isOpen, currentUser, readerProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg('Veuillez renseigner votre nom et prénom.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Veuillez renseigner une adresse e-mail valide.');
      return;
    }
    if (!consent) {
      setErrorMsg('Veuillez accepter les conditions de téléchargement et d\'utilisation des données.');
      return;
    }

    setIsSubmitting(true);

    try {
      const downloadRecordId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await recordArtbookDownload({
        id: downloadRecordId,
        artbookId: artbook.id,
        artbookTitle: artbook.title,
        artistName: artbook.artistName,
        userName: cleanName,
        userEmail: cleanEmail,
        userPhone: '',
        consentedAt: new Date().toISOString(),
        downloadedAt: new Date().toISOString(),
        userId: currentUser?.uid,
      });

      onClose();
      if (onFormCompleted) {
        onFormCompleted({ userName: cleanName, userEmail: cleanEmail });
      }
    } catch (err) {
      console.error('Error during download form submission:', err);
      setErrorMsg('Impossible de valider vos informations. Veuillez vérifier votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#14151e] border border-zinc-800 shadow-2xl p-6 sm:p-8 text-zinc-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* FORM STATE */}
        <div>
          <div className="flex items-center gap-3 mb-4 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 font-heading">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Accès Libre • Gratuit</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-almodobar">
                Télécharger l'Artbook
              </h3>
            </div>
          </div>

          {/* Target Artbook card mini (no format info) */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 mb-5 flex items-center gap-3">
            <img
              src={artbook.coverUrl}
              alt={artbook.title}
              className="w-12 h-16 object-cover rounded-xl border border-zinc-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{artbook.title}</div>
              <div className="text-xs text-zinc-400 truncate">Par {artbook.artistName}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                {artbook.pageCount} pages • Édition officielle
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Nom et prénom <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex : Aminata Diallo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-white text-sm focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Adresse e-mail <span className="text-emerald-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex : aminata@exemple.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-white text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* RGPD & Privacy Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-400 leading-snug">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 shrink-0"
                />
                <span>
                  J'accepte que mes coordonnées soient enregistrées de façon sécurisée pour accéder à cet artbook et recevoir les actualités d'OZI Éditions conformément à la politique de protection des données.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validation en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Valider et télécharger (PDF + EPUB)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aucune carte bancaire requise • Téléchargement direct 100% gratuit</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
