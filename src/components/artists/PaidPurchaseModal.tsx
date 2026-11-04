import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Lock, 
  Loader2, 
  Smartphone, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Artbook } from '../../types';
import { useData } from '../../context/DataContext';
import { generateAndDownloadArtbookPdf } from '../../utils/pdfGenerator';

interface PaidPurchaseModalProps {
  artbook: Artbook;
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'details' | 'processing' | 'confirmed' | 'failed';

interface PaymentProviderOption {
  id: string;
  name: string;
  type: 'mobile_money' | 'card';
  badge: string;
  iconColor: string;
}

const PAYMENT_PROVIDERS: PaymentProviderOption[] = [
  { id: 'wave', name: 'Wave Mobile Money', type: 'mobile_money', badge: '1% frais', iconColor: 'text-sky-400' },
  { id: 'orange', name: 'Orange Money Afrique', type: 'mobile_money', badge: 'Instantané', iconColor: 'text-orange-400' },
  { id: 'mtn', name: 'MTN Mobile Money (MoMo)', type: 'mobile_money', badge: 'Instantané', iconColor: 'text-yellow-400' },
  { id: 'moov', name: 'Moov Africa Flooz', type: 'mobile_money', badge: 'Instantané', iconColor: 'text-blue-400' },
  { id: 'paystack_card', name: 'Carte Bancaire / Paystack (Visa, Mastercard)', type: 'card', badge: 'Sécurisé 3D Secure', iconColor: 'text-emerald-400' }
];

export const PaidPurchaseModal: React.FC<PaidPurchaseModalProps> = ({
  artbook,
  isOpen,
  onClose
}) => {
  const { currentUser, readerProfile, recordArtbookPurchase, verifyArtbookPurchase } = useData();

  const [step, setStep] = useState<CheckoutStep>('details');
  const [selectedProvider, setSelectedProvider] = useState<string>('wave');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadAuthorized, setDownloadAuthorized] = useState(false);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setErrorMsg('');
      setDownloadAuthorized(false);
      setTransactionRef('');
      if (readerProfile?.displayName || currentUser?.displayName) {
        setName(readerProfile?.displayName || currentUser?.displayName || '');
      }
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    }
  }, [isOpen, currentUser, readerProfile]);

  if (!isOpen) return null;

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Veuillez renseigner une adresse e-mail valide.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    setStep('processing');

    const generatedRef = `OZI-ART-${Math.floor(100000 + Math.random() * 900000)}`;
    setTransactionRef(generatedRef);
    const purchaseId = `purchase-${Date.now()}`;

    try {
      // 1. Record purchase initiation in Firestore
      await recordArtbookPurchase({
        id: purchaseId,
        artbookId: artbook.id,
        artbookTitle: artbook.title,
        artistName: artbook.artistName,
        priceXof: artbook.price,
        userName: name.trim(),
        userEmail: email.trim().toLowerCase(),
        userPhone: cleanPhone,
        paymentGateway: selectedProvider,
        paymentReference: generatedRef,
        status: 'pending',
        purchasedAt: new Date().toISOString(),
        downloadAuthorized: false,
        userId: currentUser?.uid
      });

      // 2. Simulate server-side payment verification (2.5 seconds)
      setTimeout(async () => {
        try {
          const verification = await verifyArtbookPurchase(purchaseId, generatedRef);
          if (verification.verified && verification.downloadAuthorized) {
            setDownloadAuthorized(true);
            setStep('confirmed');

            // Trigger celebration
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 }
            });

            // Automatically trigger first PDF download
            generateAndDownloadArtbookPdf({
              artbook,
              userName: name.trim(),
              userEmail: email.trim().toLowerCase(),
              isPaid: true,
              transactionRef: generatedRef
            });
          } else {
            setStep('failed');
            setErrorMsg('La passerelle de paiement n\'a pas validé la transaction.');
          }
        } catch (err) {
          setStep('failed');
          setErrorMsg('Échec de la validation sécurisée du paiement.');
        }
      }, 2600);
    } catch (err) {
      setStep('failed');
      setErrorMsg('Erreur lors de la communication avec le serveur de paiement.');
    }
  };

  const handleDownloadPurchasedPdf = async () => {
    if (!downloadAuthorized) return;
    setIsDownloadingPdf(true);
    try {
      await generateAndDownloadArtbookPdf({
        artbook,
        userName: name.trim(),
        userEmail: email.trim().toLowerCase(),
        isPaid: true,
        transactionRef
      });
    } finally {
      setIsDownloadingPdf(false);
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
                  <div className="text-[11px] text-zinc-400 mt-0.5">Format PDF Haute Définition ({artbook.pageCount} p.)</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base sm:text-lg font-black text-[#ff8679] font-almodobar">
                  {artbook.price.toLocaleString()} FCFA
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

            <form onSubmit={handleStartPayment} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nom & Prénom <span className="text-[#ff8679]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex : Moussa Koné"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Numéro Mobile / Compte <span className="text-[#ff8679]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex : +225 05 00 00 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Adresse e-mail (pour réception de facture & PDF) <span className="text-[#ff8679]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex : moussa@exemple.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Payment Gateway Picker */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Sélectionnez votre moyen de paiement :
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {PAYMENT_PROVIDERS.map(p => {
                    const isSelected = selectedProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#ff8679]/10 border-[#ff8679] text-white shadow-sm shadow-[#ff8679]/10'
                            : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {p.type === 'mobile_money' ? (
                            <Smartphone className={`w-4 h-4 ${p.iconColor}`} />
                          ) : (
                            <CreditCard className={`w-4 h-4 ${p.iconColor}`} />
                          )}
                          <span className="text-xs font-bold">{p.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold">
                          {p.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff8679] to-[#fb923c] hover:from-[#eb6e60] hover:to-[#ea580c] text-white font-bold text-sm shadow-lg shadow-[#ff8679]/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmer & Payer {artbook.price.toLocaleString()} FCFA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paiement chiffré 256 bits • Téléchargement certifié après vérification</span>
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
              Nous traitons votre paiement via la passerelle sécurisée. Ne fermez pas cette fenêtre.
            </p>

            <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
              Réf : {transactionRef || 'Génération...'}
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
                <span className="font-bold text-emerald-400">{artbook.price.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Titulaire :</span>
                <span className="font-semibold text-zinc-200">{name} ({email})</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleDownloadPurchasedPdf}
                disabled={isDownloadingPdf}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Télécharger mon Artbook (PDF)</span>
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
