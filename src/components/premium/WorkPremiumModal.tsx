import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Series } from '../../types';
import { useData } from '../../context/DataContext';
import { initiateWorkSubscription, simulateWorkSubscription } from '../../services/paystackClientService';

interface WorkPremiumModalProps {
  series: Series;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WorkPremiumModal: React.FC<WorkPremiumModalProps> = ({
  series,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, readerProfile, openAuthModal } = useData();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const PRICE_XOF = 2000;

  const handlePaystackPayment = async () => {
    setErrorMessage(null);

    // If reader is not logged in, prompt to authenticate first
    if (!currentUser) {
      onClose();
      openAuthModal('login');
      return;
    }

    setIsLoading(true);
    try {
      const res = await initiateWorkSubscription({
        uid: currentUser.uid,
        workId: series.id,
        workTitle: series.title,
        email: currentUser.email || readerProfile?.email || '',
        amount: PRICE_XOF,
        currency: 'XOF',
      });

      if (res.success && res.authorizationUrl) {
        // If simulation sandbox mode
        if (res.authorizationUrl.includes('paystack_simulated=1')) {
          const simRes = await simulateWorkSubscription(currentUser.uid, series.id, series.title);
          if (simRes.success) {
            setSuccessInfo('Abonnement Premium de 30 jours validé avec succès (Mode Sandbox Paystack) !');
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 2500);
          } else {
            setErrorMessage(simRes.message || 'Échec de la simulation.');
          }
        } else {
          // Open official Paystack Checkout portal
          window.location.href = res.authorizationUrl;
        }
      } else {
        setErrorMessage(res.message || 'Impossible d\'initialiser le paiement Paystack.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la communication avec Paystack.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg bg-[#12131a] border border-[#26283b] rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff8679]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff8679] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff8679]/15 border border-[#ff8679]/30 text-[11px] font-bold text-[#ff8679]">
              <span>Pass Premium Individuel 30 Jours</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              {series.title}
            </h3>
          </div>
        </div>

        {/* Work Cover & Summary preview */}
        <div className="flex gap-4 p-4 rounded-2xl bg-[#181924] border border-[#2b2d42] mb-6 items-center">
          <img 
            src={series.coverUrl} 
            alt={series.title} 
            className="w-16 h-20 rounded-xl object-cover shadow-md shrink-0 border border-zinc-700/50" 
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-400 font-medium">Par {series.author || 'Artiste OZI'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-white">{PRICE_XOF.toLocaleString('fr-FR')} FCFA</span>
              <span className="text-xs text-zinc-400">/ 30 jours</span>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Accès immédiat dès confirmation Paystack</span>
            </p>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2.5 mb-6 text-xs text-zinc-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#ff8679] shrink-0 mt-0.5" />
            <span>Lecture illimitée de tous les chapitres actuels et à venir pendant 30 jours.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#ff8679] shrink-0 mt-0.5" />
            <span>Paiement sécurisé via Paystack (Cartes Bancaires, Mobile Money Wave, MTN, Orange, MoMo).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#ff8679] shrink-0 mt-0.5" />
            <span>Soutien direct aux créateurs et scénaristes de l'œuvre.</span>
          </div>
        </div>

        {/* Feedback / Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handlePaystackPayment}
          disabled={isLoading || !!successInfo}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ff8679] via-orange-500 to-amber-500 hover:from-[#f87567] hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connexion sécurisée Paystack...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>{currentUser ? `Payer ${PRICE_XOF.toLocaleString('fr-FR')} FCFA via Paystack` : 'Se connecter pour s\'abonner'}</span>
            </>
          )}
        </button>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Passerelle officielle Paystack • Chiffrement 256 bits</span>
        </div>
      </div>
    </div>
  );
};
