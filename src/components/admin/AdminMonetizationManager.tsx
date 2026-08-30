import React, { useState } from 'react';
import { 
  Coins, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  DollarSign, 
  Sparkles, 
  Sliders, 
  ArrowUpRight, 
  Calculator, 
  Clock, 
  ShieldCheck, 
  Smartphone,
  Tag,
  Zap,
  Lock,
  Flame
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CoinPack, CreatorPayout, PaymentGateway } from '../../types';

export const AdminMonetizationManager: React.FC = () => {
  const { 
    monetization, 
    updateMonetizationSettings,
    updateCoinPack,
    addCoinPack,
    deleteCoinPack,
    togglePaymentGateway,
    creatorPayouts,
    approvePayout,
    rejectPayout,
    createPayoutRequest,
    adminUser
  } = useData();

  const [activeTab, setActiveTab] = useState<'payouts' | 'coinPacks' | 'vipRules' | 'gateways' | 'simulator'>('payouts');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'processing' | 'paid'>('all');

  // New Pack Modal
  const [isAddingPack, setIsAddingPack] = useState(false);
  const [newPack, setNewPack] = useState<Omit<CoinPack, 'id'>>({
    name: '',
    coins: 500,
    bonusCoins: 50,
    priceXof: 2500,
    priceEur: 3.80,
    isPopular: false,
    badge: ''
  });

  // Simulator state
  const [simMonthlyReads, setSimMonthlyReads] = useState<number>(100000);
  const [simPaidRatio, setSimPaidRatio] = useState<number>(35); // 35% paid
  const [simCoinsPerChapter, setSimCoinsPerChapter] = useState<number>(monetization.defaultPaidChapterCoins || 15);

  const filteredPayouts = creatorPayouts.filter(p => payoutFilter === 'all' || p.status === payoutFilter);
  const pendingPayoutsCount = creatorPayouts.filter(p => p.status === 'pending').length;

  const handleCreatePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPack.name || newPack.coins <= 0) return;
    addCoinPack(newPack);
    setIsAddingPack(false);
    setNewPack({
      name: '',
      coins: 500,
      bonusCoins: 50,
      priceXof: 2500,
      priceEur: 3.80,
      isPopular: false,
      badge: ''
    });
  };

  // Simulator calculations
  const totalSimPaidChapters = Math.round((simMonthlyReads * simPaidRatio) / 100);
  const totalSimCoinsSpent = totalSimPaidChapters * simCoinsPerChapter;
  const grossRevenueXof = totalSimCoinsSpent * monetization.coinRateXof;
  const creatorShareXof = (grossRevenueXof * monetization.creatorRevenueSharePercent) / 100;
  const platformShareXof = grossRevenueXof - creatorShareXof;

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Top Banner with Financial Overview */}
      <div className="rounded-3xl bg-gradient-to-r from-[#17130a] via-[#141006] to-[#0a0a0f] border border-[#382b10] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Coins className="w-3.5 h-3.5" />
            <span>Monétisation & Économie Créateurs OZI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestion Financière & Reversements Mobile Money
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
            Gestion des versements aux auteurs africains (Wave, Orange, MTN MoMo, Flooz), tarification des Coins OZI et abonnement Pass VIP.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Chiffre d'Affaires Global</div>
            <div className="text-lg font-black text-amber-400">
              {(monetization.totalPlatformRevenueXof || 54900000).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Reversé aux Créateurs</div>
            <div className="text-lg font-black text-emerald-400">
              {(monetization.totalPaidToCreatorsXof || 38450000).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Quick KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Partage Créateur</div>
            <div className="text-xl font-black text-white">{monetization.creatorRevenueSharePercent}%</div>
            <div className="text-[10px] text-emerald-400 font-bold">70% reversés net</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Taux de Coin</div>
            <div className="text-xl font-black text-white">1 Coin = {monetization.coinRateXof} F</div>
            <div className="text-[10px] text-zinc-400">Stable indexé XOF</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Virements en attente</div>
            <div className="text-xl font-black text-white">{pendingPayoutsCount}</div>
            <div className="text-[10px] text-rose-400 font-bold">À valider ce mois</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase">Pass VIP Actif</div>
            <div className="text-xl font-black text-white">{monetization.vipMonthlyPriceXof} F/mois</div>
            <div className="text-[10px] text-blue-400 font-bold">Accès illimité</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202030] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'payouts'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Versements Créateurs</span>
          {pendingPayoutsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/20 text-zinc-950 font-bold">
              {pendingPayoutsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('coinPacks')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'coinPacks'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Packs de Coins & Tarifs</span>
        </button>

        <button
          onClick={() => setActiveTab('vipRules')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'vipRules'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pass VIP & Règles</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'gateways'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Passerelles & Mobile Money</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'simulator'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulateur de Gains</span>
        </button>
      </div>

      {/* TAB 1: Payouts */}
      {activeTab === 'payouts' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 mr-2">Filtrer par état :</span>
              {(['all', 'pending', 'processing', 'paid'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setPayoutFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    payoutFilter === st
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st === 'all' && 'Tous les versements'}
                  {st === 'pending' && `En attente (${creatorPayouts.filter(p => p.status === 'pending').length})`}
                  {st === 'processing' && 'En cours'}
                  {st === 'paid' && 'Payés'}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              Opérateur autorisé : <strong className="text-amber-400">{adminUser.email}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredPayouts.map((payout) => (
              <div
                key={payout.id}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      payout.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : payout.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {payout.status === 'pending' ? 'En attente' : payout.status === 'paid' ? 'Versé avec succès' : payout.status === 'processing' ? 'En traitement' : 'Rejeté'}
                    </span>
                    <strong className="text-white text-base">{payout.creatorName}</strong>
                    <span className="text-xs text-amber-400">({payout.seriesTitle})</span>
                    <span className="text-zinc-500 text-xs">• Période : {payout.period}</span>
                  </div>

                  <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-4">
                    <span>Lectures totales : <strong className="text-zinc-200">{payout.totalReads.toLocaleString('fr-FR')}</strong></span>
                    <span>Coins générés : <strong className="text-amber-400">{payout.coinsEarned.toLocaleString('fr-FR')}</strong></span>
                    <span>Compte de réception : <strong className="text-zinc-200">{payout.paymentMethod}</strong></span>
                  </div>

                  <div className="text-[11px] text-zinc-500">
                    Demande soumise le {new Date(payout.requestedAt).toLocaleString('fr-FR')}
                    {payout.processedAt && ` • Traitée le ${new Date(payout.processedAt).toLocaleString('fr-FR')}`}
                  </div>
                </div>

                {/* Amount & CTA */}
                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-400">
                      {payout.amountXof.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-[10px] text-zinc-400">Net créateur (70%)</div>
                  </div>

                  {payout.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approvePayout(payout.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider Virement</span>
                      </button>
                      <button
                        onClick={() => rejectPayout(payout.id, 'Informations bancaires à corriger')}
                        className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 text-xs font-bold transition-all"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Coin Packs */}
      {activeTab === 'coinPacks' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Grille Tarifaire des Packs de Coins</h3>
              <p className="text-xs text-zinc-400">Les lecteurs achètent des Coins pour débloquer les chapitres premium en avant-première.</p>
            </div>
            <button
              onClick={() => setIsAddingPack(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Pack</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {monetization.coinPacks.map((pack) => (
              <div
                key={pack.id}
                className={`p-6 rounded-3xl bg-zinc-900 border flex flex-col justify-between gap-6 relative shadow-xl ${
                  pack.isPopular ? 'border-amber-500 shadow-amber-500/10' : 'border-zinc-800'
                }`}
              >
                {pack.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-md">
                    {pack.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Coins className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{pack.name}</h4>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {pack.coins} <span className="text-xs text-zinc-400 font-normal">Coins</span>
                      {pack.bonusCoins > 0 && (
                        <span className="text-xs font-black text-emerald-400 ml-1.5">
                          +{pack.bonusCoins} offerts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Prix FCFA :</span>
                      <strong className="text-white">{pack.priceXof.toLocaleString('fr-FR')} F</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Prix EUR (Diaspora) :</span>
                      <strong className="text-zinc-300">{pack.priceEur.toFixed(2)} €</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => updateCoinPack(pack.id, { isPopular: !pack.isPopular })}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      pack.isPopular ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {pack.isPopular ? '★ Vedette' : 'Standard'}
                  </button>

                  <button
                    onClick={() => deleteCoinPack(pack.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VIP Rules */}
      {activeTab === 'vipRules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Paramètres de Lecture & Verrouillage</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configurez les seuils gratuits et les conditions de déverrouillage pour fidéliser la communauté.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold block">
                  Chapitres Gratuits de Découverte par Série :
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={monetization.freeChaptersThreshold || 3}
                    onChange={(e) => updateMonetizationSettings({ freeChaptersThreshold: parseInt(e.target.value) || 3 })}
                    className="w-24 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-zinc-400">Les {monetization.freeChaptersThreshold || 3} premiers chapitres sont en accès libre pour attirer les lecteurs.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold block">
                  Coût Standard d'un Chapitre Verrouillé (en Coins) :
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={monetization.defaultPaidChapterCoins || 15}
                    onChange={(e) => updateMonetizationSettings({ defaultPaidChapterCoins: parseInt(e.target.value) || 15 })}
                    className="w-24 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-zinc-400">Soit {(monetization.defaultPaidChapterCoins * monetization.coinRateXof)} FCFA par épisode.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold block">
                  Pourcentage de Reversement aux Créateurs (%) :
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={monetization.creatorRevenueSharePercent}
                    onChange={(e) => updateMonetizationSettings({ creatorRevenueSharePercent: parseInt(e.target.value) || 70 })}
                    className="w-24 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-emerald-400 font-black focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-zinc-400">OZI reverse {monetization.creatorRevenueSharePercent}% net sur chaque lecture payante.</span>
                </div>
              </div>
            </div>
          </div>

          {/* VIP Pass Card */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Abonnement OZI Pass VIP</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Accès illimité à l'ensemble du catalogue sans publicité avec lecture hors-ligne prioritaire.</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-zinc-950 border border-purple-900/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-purple-300">Tarif Mensuel Pass VIP</span>
                <span className="text-2xl font-black text-white">{monetization.vipMonthlyPriceXof} FCFA / mois</span>
              </div>
              <input
                type="range"
                min="1500"
                max="5000"
                step="100"
                value={monetization.vipMonthlyPriceXof}
                onChange={(e) => updateMonetizationSettings({ vipMonthlyPriceXof: parseInt(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="text-[11px] text-zinc-400 flex justify-between">
                <span>1 500 F</span>
                <span>Idéal : 2 900 F</span>
                <span>5 000 F</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Gateways */}
      {activeTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monetization.supportedPaymentGateways.map((gw) => (
            <div
              key={gw.id}
              className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between gap-4 shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-400">{gw.provider}</span>
                  <button
                    onClick={() => togglePaymentGateway(gw.id)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                      gw.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {gw.isActive ? '● Activé' : 'Désactivé'}
                  </button>
                </div>

                <h4 className="text-base font-black text-white mb-2">{gw.name}</h4>

                <div className="space-y-1 text-xs text-zinc-400">
                  <div>Commission : <strong className="text-zinc-200">{gw.feePercent}%</strong></div>
                  <div>Pays couverts : <span className="text-zinc-300">{gw.countries.join(', ')}</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-mono">ID: {gw.id}</span>
                <span className="text-emerald-400 font-bold">Instantané</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Revenue Simulator */}
      {activeTab === 'simulator' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <span>Simulateur Prévisionnel d'Économie Plateforme & Créateurs</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Ajustez le volume d'audience mensuelle pour observer la répartition instantanée des revenus.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-zinc-300 mb-1">
                  <span>Lectures Mensuelles Globales :</span>
                  <span className="text-amber-400 font-black">{simMonthlyReads.toLocaleString('fr-FR')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={simMonthlyReads}
                  onChange={(e) => setSimMonthlyReads(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-zinc-300 mb-1">
                  <span>Ratio de Chapitres Payants (Coins) :</span>
                  <span className="text-amber-400 font-black">{simPaidRatio}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={simPaidRatio}
                  onChange={(e) => setSimPaidRatio(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-zinc-300 mb-1">
                  <span>Coins par Chapitre Payant :</span>
                  <span className="text-amber-400 font-black">{simCoinsPerChapter} Coins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={simCoinsPerChapter}
                  onChange={(e) => setSimCoinsPerChapter(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-xs text-zinc-400 font-bold uppercase">Chiffre d'Affaires Brut Estimé</div>
                <div className="text-2xl font-black text-amber-400">
                  {grossRevenueXof.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-zinc-500">
                  Basé sur {totalSimCoinsSpent.toLocaleString('fr-FR')} Coins consommés à 5 FCFA/Coin.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="text-xs text-emerald-300 font-bold uppercase">Reversement Créateurs ({monetization.creatorRevenueSharePercent}%)</div>
                <div className="text-2xl font-black text-emerald-400">
                  {creatorShareXof.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-emerald-500/80">
                  Distribué directement sur les comptes Wave & MoMo des auteurs.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2 sm:col-span-2">
                <div className="text-xs text-blue-300 font-bold uppercase">Marge Plateforme OZI ({100 - monetization.creatorRevenueSharePercent}%)</div>
                <div className="text-2xl font-black text-blue-400">
                  {platformShareXof.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-zinc-400">
                  Financement des serveurs Firestore, CDN bande passante Webtoon et développement continu.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pack Modal */}
      {isAddingPack && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsAddingPack(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 text-zinc-100 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white">Nouveau Pack de Coins</h3>
              <button onClick={() => setIsAddingPack(false)} className="p-1 rounded-full text-zinc-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-bold block mb-1">Nom du Pack :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pack Champion, Pack Ultime"
                  value={newPack.name}
                  onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Coins :</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={newPack.coins}
                    onChange={(e) => setNewPack({ ...newPack, coins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Bonus offert :</label>
                  <input
                    type="number"
                    min="0"
                    value={newPack.bonusCoins}
                    onChange={(e) => setNewPack({ ...newPack, bonusCoins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Prix (FCFA) :</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newPack.priceXof}
                    onChange={(e) => setNewPack({ ...newPack, priceXof: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-bold block mb-1">Prix (€ Diaspora) :</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={newPack.priceEur}
                    onChange={(e) => setNewPack({ ...newPack, priceEur: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Badge promotionnel (Optionnel) :</label>
                <input
                  type="text"
                  placeholder="Ex: Le + Populaire, +20% Bonus"
                  value={newPack.badge}
                  onChange={(e) => setNewPack({ ...newPack, badge: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingPack(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20"
                >
                  Ajouter le Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
