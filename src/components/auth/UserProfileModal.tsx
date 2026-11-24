import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  CreditCard, 
  Edit3, 
  Check, 
  Loader2,
  BookOpen,
  Palette,
  Download,
  Coins
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { 
  fetchUserSubscriptions, 
  fetchUserArtbookPurchases, 
  initiateCoinPackPurchase, 
  verifyPaystackPayment 
} from '../../services/paystackClientService';
import { SubscriptionRecord, ArtbookPurchaseRecord, CoinPack } from '../../types';
import { formatPriceXofWithEur } from '../../utils/currency';

export const UserProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    closeProfileModal, 
    currentUser, 
    readerProfile, 
    users,
    logoutReader, 
    updateReaderProfileData,
    monetization,
    adjustUserCoins,
    artbookPurchases: localArtbookPurchases
  } = useData();

  const userAccount = users?.find(u => u.id === currentUser?.uid || (currentUser?.email && u.email === currentUser.email));
  const userCoinsBalance = userAccount?.coinsBalance ?? readerProfile?.coinsBalance ?? 0;

  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'artbooks' | 'coins'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [artbooks, setArtbooks] = useState<ArtbookPurchaseRecord[]>([]);
  const [isLoadingArtbooks, setIsLoadingArtbooks] = useState(false);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [coinPurchaseSuccess, setCoinPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'subscriptions' && currentUser?.uid) {
      setIsLoadingSubs(true);
      fetchUserSubscriptions(currentUser.uid)
        .then(subs => setSubscriptions(subs))
        .catch(() => {})
        .finally(() => setIsLoadingSubs(false));
    } else if (activeTab === 'artbooks' && currentUser?.uid) {
      setIsLoadingArtbooks(true);
      const completedLocal = (localArtbookPurchases || []).filter(
        (p) => p.status === 'completed' && p.downloadAuthorized
      );
      fetchUserArtbookPurchases(currentUser.uid)
        .then((res) => {
          const merged = [...completedLocal, ...(Array.isArray(res) ? res : [])];
          const seen = new Set<string>();
          const unique = merged.filter((item: any) => {
            const ref = item.paymentReference || item.paystackReference || item.id || item.purchaseId;
            if (!ref) return true;
            if (seen.has(ref)) return false;
            seen.add(ref);
            return true;
          });
          setArtbooks(unique);
        })
        .catch(() => setArtbooks(completedLocal))
        .finally(() => setIsLoadingArtbooks(false));
    }
  }, [activeTab, currentUser?.uid, localArtbookPurchases]);

  useEffect(() => {
    if (readerProfile?.displayName) {
      setEditedName(readerProfile.displayName);
    } else if (currentUser?.displayName) {
      setEditedName(currentUser.displayName);
    }
  }, [readerProfile, currentUser]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    if (!isProfileModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, closeProfileModal]);

  if (!isProfileModalOpen || !currentUser) return null;

  const displayName = readerProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Lecteur OZI';
  const email = currentUser.email || readerProfile?.email || 'Non renseigné';
  const photoURL = currentUser.photoURL || readerProfile?.photoURL;
  const createdAt = readerProfile?.createdAt 
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(readerProfile.createdAt))
    : 'Récemment';

  const handleSaveName = async () => {
    const clean = editedName.trim();
    if (!clean) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await updateReaderProfileData({ displayName: clean });
      if (res.success) {
        setIsEditing(false);
        setFeedback('Pseudonyme mis à jour avec succès.');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(res.error || 'Erreur lors de la mise à jour.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutReader();
    closeProfileModal();
  };

  const handleBuyCoinPack = async (pack: CoinPack) => {
    if (!currentUser?.uid) return;
    setPurchasingPackId(pack.id);
    setCoinPurchaseSuccess(null);
    try {
      const totalCoins = pack.coins + (pack.bonusCoins || 0);
      const res = await initiateCoinPackPurchase({
        uid: currentUser.uid,
        packId: pack.id,
        packName: pack.name,
        coinsAmount: totalCoins,
        amount: pack.priceXof,
        email: currentUser.email || `${currentUser.uid}@ozibd.net`
      });

      if (res.success && res.authorizationUrl) {
        const width = 500;
        const height = 650;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const popup = window.open(
          res.authorizationUrl,
          'PaystackCoinCheckout',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const vRes = await verifyPaystackPayment(res.reference, currentUser.uid);
            if (vRes.verified && vRes.success) {
              clearInterval(interval);
              adjustUserCoins(currentUser.uid, totalCoins, `Achat ${pack.name} via Paystack`);
              setCoinPurchaseSuccess(`Félicitations ! +${totalCoins.toLocaleString('fr-FR')} Coins crédités sur votre compte !`);
              setPurchasingPackId(null);
              if (popup && !popup.closed) popup.close();
            }
          } catch {
            // Polling retry
          }

          if (attempts > 50 || (popup && popup.closed && attempts > 8)) {
            clearInterval(interval);
            setPurchasingPackId(null);
          }
        }, 3000);
      } else {
        setFeedback(res.message || 'Impossible d\'initialiser le paiement Paystack.');
        setPurchasingPackId(null);
      }
    } catch (err: any) {
      console.error('[UserProfileModal] Coin purchase error:', err);
      setFeedback('Erreur lors du traitement du paiement.');
      setPurchasingPackId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeProfileModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div 
        className="relative w-full max-w-md bg-[#141418] border border-[#242436] rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#ff8679]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Top */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5 shadow-xl mb-3">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={displayName} 
                className="w-full h-full object-cover rounded-full bg-zinc-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black text-[#ff8679]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Edit Form */}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1 mb-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-[#ff8679] text-white text-sm font-bold text-center focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-2 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white cursor-pointer disabled:opacity-50"
                title="Enregistrer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 id="profile-modal-title" className="text-xl font-black text-white tracking-tight">
                {displayName}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-zinc-400 hover:text-[#ff8679] transition-colors cursor-pointer"
                title="Modifier le pseudonyme"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-zinc-400 mt-0.5">{email}</p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compte Lecteur Vérifié</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Infos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'subscriptions' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pass 30j
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('artbooks')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'artbooks' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Artbooks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'coins' 
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-black' 
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Coins
          </button>
        </div>

        {feedback && (
          <div className="mb-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* TAB 1: Profile Information */}
        {activeTab === 'profile' && (
          <div className="space-y-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>Membre depuis</span>
              </span>
              <strong className="text-zinc-200">{createdAt}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-500" />
                <span>Statut plateforme</span>
              </span>
              <span className="text-zinc-300 font-medium">Lecteur OZI</span>
            </div>

            {/* Solde Coins OZI */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-amber-500/30 flex items-center justify-between text-xs shadow-inner">
              <span className="text-zinc-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Solde Coins OZI</span>
              </span>
              <div className="flex items-center gap-2">
                <strong className="text-amber-400 font-black text-sm">
                  {userCoinsBalance.toLocaleString('fr-FR')} Coins
                </strong>
                <button
                  type="button"
                  onClick={() => setActiveTab('coins')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] transition-all cursor-pointer"
                >
                  Recharger
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-500" />
                <span>Identifiant unique (UID)</span>
              </span>
              <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[140px]" title={currentUser.uid}>
                {currentUser.uid}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Subscriptions (Paystack 30 jours par œuvre) */}
        {activeTab === 'subscriptions' && (
          <div className="mb-6 space-y-3">
            {isLoadingSubs ? (
              <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#ff8679]" />
                <span>Vérification de vos abonnements auprès du serveur...</span>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {subscriptions.map((sub) => {
                  const isExpired = sub.status === 'expired' || new Date(sub.expirationDate).getTime() <= Date.now();
                  const remainingDays = Math.max(0, Math.ceil((new Date(sub.expirationDate).getTime() - Date.now()) / (24 * 3600 * 1000)));

                  return (
                    <div 
                      key={sub.subscriptionId} 
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 ${
                        isExpired 
                          ? 'bg-zinc-950/50 border-zinc-800/60 opacity-60' 
                          : 'bg-zinc-950 border-[#ff8679]/30 shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {sub.workTitle || sub.workId}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isExpired 
                              ? 'bg-zinc-800 text-zinc-400' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isExpired ? 'Expiré' : 'Actif • 30 Jours'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {isExpired 
                            ? `A expiré le ${new Date(sub.expirationDate).toLocaleDateString('fr-FR')}` 
                            : `Reste ${remainingDays} jour${remainingDays > 1 ? 's' : ''} (jusqu'au ${new Date(sub.expirationDate).toLocaleDateString('fr-FR')})`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-zinc-200">
                          {formatPriceXofWithEur(sub.amount || 2000)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ff8679]/10 border border-[#ff8679]/20 flex items-center justify-center text-[#ff8679] mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Pass Premium par Œuvre</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Débloquez l'accès illimité pendant 30 jours à n'importe quelle œuvre du catalogue via Paystack ({formatPriceXofWithEur(2000)}).
                  </p>
                </div>
                <div className="text-[11px] text-zinc-500 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                  Aucun abonnement actif pour le moment.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Artbooks Achetés via Paystack */}
        {activeTab === 'artbooks' && (
          <div className="mb-6 space-y-3">
            {isLoadingArtbooks ? (
              <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#ff8679]" />
                <span>Chargement de vos artbooks débloqués...</span>
              </div>
            ) : artbooks.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {artbooks.map((art) => (
                  <div 
                    key={art.id} 
                    className="p-3.5 rounded-2xl border bg-zinc-950 border-purple-500/30 text-left flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">
                          {art.artbookTitle}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        {art.artistName} • Réf : {(art.paymentReference || (art as any).paystackReference || '').slice(0, 16)}...
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        Payé & Actif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Recueils & Artbooks OZI</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Achetez les artbooks officiels de vos artistes favoris par Mobile Money ou Carte pour débloquer les galeries HD et le téléchargement PDF.
                  </p>
                </div>
                <div className="text-[11px] text-zinc-500 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                  Aucun artbook acheté pour le moment.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Packs de Coins (Recharge Paystack) */}
        {activeTab === 'coins' && (
          <div className="mb-6 space-y-3">
            {/* Balance Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Solde Actuel</div>
                  <div className="text-xl font-black text-amber-400 font-heading">
                    {userCoinsBalance.toLocaleString('fr-FR')} Coins
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 max-w-[120px] text-right font-medium">
                Débloquez vos chapitres favoris
              </span>
            </div>

            {coinPurchaseSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{coinPurchaseSuccess}</span>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(monetization?.coinPacks || []).map((pack) => {
                const isBuying = purchasingPackId === pack.id;
                const totalCoins = pack.coins + (pack.bonusCoins || 0);

                return (
                  <div
                    key={pack.id}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {pack.name}
                        </span>
                        {pack.isPopular && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
                            Populaire
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 font-bold">{totalCoins.toLocaleString('fr-FR')} Coins</span>
                        {pack.bonusCoins > 0 && (
                          <span className="text-emerald-400 text-[10px] font-semibold">(+{pack.bonusCoins} offerts)</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={purchasingPackId !== null}
                      onClick={() => handleBuyCoinPack(pack)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {isBuying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Paiement...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{formatPriceXofWithEur(pack.priceXof, pack.priceEur)}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
