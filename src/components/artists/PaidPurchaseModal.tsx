import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Lock, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Receipt,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Artbook } from '../../types';
import { useData } from '../../context/DataContext';
import { initiateArtbookPurchase, verifyPaystackPayment } from '../../services/paystackClientService';
import { formatPriceXofWithEur } from '../../utils/currency';

interface PaidPurchaseModalProps {
  artbook: Artbook;
  isOpen: boolean;
  onClose: () => void;
  onOpenFormatChoice?: (info: { userName: string; userEmail: string; transactionRef: string }) => void;
}

type CheckoutStep = 'details' | 'processing' | 'confirmed' | 'failed';

export const PaidPurchaseModal: React.FC<PaidPurchaseModalProps> = ({
  artbook,
  isOpen,
  onClose,
  onOpenFormatChoice
}) => {
  const { currentUser, readerProfile, recordArtbookPurchase } = useData();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentAuthUrl, setPaymentAuthUrl] = useState('');
  const [checkoutUid, setCheckoutUid] = useState('');
  const [downloadAuthorized, setDownloadAuthorized] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Pre-fill user details if logged in and clear polling on close/unmount
  useEffect(() => {
    if (isOpen) {
      stopPolling();
      setStep('details');
      setErrorMsg('');
      setDownloadAuthorized(false);
      setTransactionRef('');
      setPaymentAuthUrl('');
      setCheckoutUid('');
      if (readerProfile?.displayName || currentUser?.displayName) {
        setName(readerProfile?.displayName || currentUser?.displayName || '');
      }
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, currentUser, readerProfile]);

  if (!isOpen) return null;

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    stopPolling();

    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Veuillez renseigner une adresse e-mail valide.');
      return;
    }
    setStep('processing');

    try {
      const uid = currentUser?.uid || `guest_${Date.now()}`;
      setCheckoutUid(uid);

      // 1. Initialisation réelle de la transaction Paystack (Mobile Money / Carte)
      const initResult = await initiateArtbookPurchase({
        uid,
        artbookId: artbook.id,
        artbookTitle: artbook.title,
        artistName: artbook.artistName,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: '',
        amount: artbook.price || 3500,
      });

      if (!initResult.success || !initResult.reference) {
        setStep('failed');
        setErrorMsg(initResult.message || 'Impossible d\'initialiser le paiement Paystack.');
        return;
      }

      setTransactionRef(initResult.reference);
      setPaymentAuthUrl(initResult.authorizationUrl || '');
      const purchaseId = `purchase-${Date.now()}`;

      // 2. Enregistrer l'initiation en attente localement
      await recordArtbookPurchase({
        id: purchaseId,
        artbookId: artbook.id,
        artbookTitle: artbook.title,
        artistName: artbook.artistName,
        priceXof: artbook.price,
        userName: name.trim(),
        userEmail: email.trim().toLowerCase(),
        userPhone: '',
        paymentGateway: 'paystack',
        paymentReference: initResult.reference,
        status: 'pending',
        purchasedAt: new Date().toISOString(),
        downloadAuthorized: false,
        userId: currentUser?.uid
      });

      // 3. Ouvrir le guichet sécurisé Paystack si URL fournie
      if (initResult.authorizationUrl) {
        try {
          window.open(initResult.authorizationUrl, '_blank', 'noopener,noreferrer,width=540,height=720');
        } catch {
          // Si le navigateur bloque la fenêtre, l'utilisateur clique sur le bouton manuel dans l'étape processing
        }
      }

      // 4. Polling actif de vérification auprès du serveur (Node ou PHP LWS)
      let checkAttempts = 0;
      const activeRef = initResult.reference;
      pollIntervalRef.current = setInterval(async () => {
        checkAttempts++;
        try {
          const verifyData = await verifyPaystackPayment(activeRef, uid, artbook.id, 'artbook_purchase');

          if (verifyData.success && (verifyData.verified || verifyData.status === 'success')) {
            stopPolling();
            setDownloadAuthorized(true);
            setStep('confirmed');

            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.6 }
            });

            if (onOpenFormatChoice) {
              onClose();
              onOpenFormatChoice({
                userName: name.trim(),
                userEmail: email.trim().toLowerCase(),
                transactionRef: activeRef
              });
            }
          }
        } catch (pollErr) {
          console.warn('[Artbook verification poll warning]', pollErr);
        }

        // Arrêt après 60 tentatives (3 minutes)
        if (checkAttempts >= 60) {
          stopPolling();
        }
      }, 3000);

    } catch (err: any) {
      stopPolling();
      setStep('failed');
      setErrorMsg(err.message || 'Erreur lors de la communication avec la passerelle Paystack.');
    }
  };

  const handleOpenFormatPicker = () => {
    if (!downloadAuthorized) return;
    onClose();
    if (onOpenFormatChoice) {
      onOpenFormatChoice({
        userName: name.trim(),
        userEmail: email.trim().toLowerCase(),
        transactionRef
      });
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
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff8679]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================= STEP 1: DETAILS & GATEWAY SELECTION ================= */}
        {step === 'details' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ff8679]/15 border border-[#ff8679]/30 flex items-center justify-center text-[#ff8679] shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ff8679] font-heading">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paiement Sécurisé OZI</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white font-almodobar">
                  Acheter l'Artbook
                </h3>
              </div>
            </div>

            {/* Artbook summary box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={artbook.coverUrl} 
                  alt="" 
                  className="w-12 h-16 object-cover rounded-xl border border-zinc-800 shrink-0" 
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{artbook.title}</div>
                  <div className="text-xs text-zinc-400 truncate">Par {artbook.artistName}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Édition Haute Définition ({artbook.pageCount} p.)</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base sm:text-lg font-black text-[#ff8679] font-almodobar">
                  {formatPriceXofWithEur(artbook.price)}
                </div>
                <div className="text-[10px] text-zinc-500">TTC • Accès à vie</div>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStartPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Nom et prénom <span className="text-[#ff8679]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex : Moussa Koné"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Adresse e-mail <span className="text-[#ff8679]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex : moussa@exemple.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff8679] to-[#fb923c] hover:from-[#eb6e60] hover:to-[#ea580c] text-white font-bold text-sm shadow-lg shadow-[#ff8679]/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmer — {formatPriceXofWithEur(artbook.price)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paiement sécurisé Paystack (Mobile Money & Carte) • Téléchargement après vérification</span>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: PROCESSING / VERIFICATION ================= */}
        {step === 'processing' && (
          <div className="flex flex-col items-center text-center py-10">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-[#ff8679] animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center text-[#ff8679]">
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2 font-almodobar">
              Vérification sécurisée en cours...
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-4 leading-relaxed">
              Nous traitons votre paiement via le guichet sécurisé Paystack. Validez la transaction sur votre téléphone ou carte bancaire.
            </p>

            <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 mb-5">
              Réf Paystack : {transactionRef || 'Génération...'}
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {paymentAuthUrl && (
                <a
                  href={paymentAuthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#ff8679] to-[#fb923c] hover:from-[#eb6e60] hover:to-[#ea580c] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff8679]/20 transition-all font-heading"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir la page de paiement Paystack</span>
                </a>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!transactionRef) return;
                  try {
                    const uid = checkoutUid || currentUser?.uid || '';
                    const data = await verifyPaystackPayment(transactionRef, uid, artbook.id, 'artbook_purchase');
                    if (data.success && (data.verified || data.status === 'success')) {
                      stopPolling();
                      setDownloadAuthorized(true);
                      setStep('confirmed');
                      confetti({ particleCount: 100, spread: 80 });
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-heading"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>J'ai validé mon paiement / Vérifier</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CONFIRMED ================= */}
        {step === 'confirmed' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-heading mb-1">
              Paiement confirmé & vérifié
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 font-almodobar">
              Merci pour votre achat !
            </h3>

            <p className="text-sm text-zinc-300 mb-5 max-w-sm leading-relaxed">
              Votre commande pour <span className="font-bold text-white">{artbook.title}</span> a été validée avec succès.
            </p>

            {/* Receipt Summary */}
            <div className="w-full p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 mb-6 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-zinc-500" /> Référence transaction :
                </span>
                <span className="font-mono font-bold text-white">{transactionRef}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Montant réglé :</span>
                <span className="font-bold text-emerald-400">{formatPriceXofWithEur(artbook.price)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Titulaire :</span>
                <span className="font-semibold text-zinc-200">{name} ({email})</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleOpenFormatPicker}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger mon Artbook</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: FAILED OR CANCELLED ================= */}
        {step === 'failed' && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white mb-2 font-almodobar">
              Paiement interrompu ou échoué
            </h3>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
              {errorMsg || 'La transaction n\'a pas pu aboutir ou a été interrompue. Aucun débit n\'a été effectué.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex-1 py-3 px-4 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer le paiement</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
