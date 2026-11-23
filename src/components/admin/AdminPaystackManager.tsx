import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  DollarSign,
  Coins,
  Palette,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SubscriptionRecord } from '../../types';
import { 
  fetchAdminSubscriptions, 
  fetchAdminSubscriptionStats, 
  fetchAdminPaystackConfig,
  saveAdminPaystackConfig,
  AdminStatsData,
  PaystackAdminConfig,
  simulateWorkSubscription 
} from '../../services/paystackClientService';

export const AdminPaystackManager: React.FC = () => {
  const { series, currentUser } = useData();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [paystackConfig, setPaystackConfig] = useState<PaystackAdminConfig | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [publicKeyInput, setPublicKeyInput] = useState<string>('');
  const [showSecretInput, setShowSecretInput] = useState<boolean>(false);
  const [isSavingKeys, setIsSavingKeys] = useState<boolean>(false);
  const [keysFeedback, setKeysFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending'>('all');
  const [workFilter, setWorkFilter] = useState<string>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subs, st, cfgRes] = await Promise.all([
        fetchAdminSubscriptions(),
        fetchAdminSubscriptionStats(),
        fetchAdminPaystackConfig()
      ]);
      setSubscriptions(subs);
      setStats(st);
      if (cfgRes.success && cfgRes.config) {
        setPaystackConfig(cfgRes.config);
        setPublicKeyInput(cfgRes.config.publicKey || '');
      }
    } catch (err) {
      console.error('[AdminPaystackManager] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePaystackKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysFeedback(null);

    const trimmedSecret = secretKeyInput.trim();
    const trimmedPublic = publicKeyInput.trim();

    if (!trimmedSecret && !paystackConfig?.hasSecretKey && !trimmedPublic) {
      setKeysFeedback({
        type: 'error',
        message: 'Collez d\'abord votre clé secrète Paystack (sk_live_... ou sk_test_...) avant d\'enregistrer.'
      });
      return;
    }

    setIsSavingKeys(true);
    try {
      const res = await saveAdminPaystackConfig({
        secretKey: trimmedSecret || undefined,
        publicKey: trimmedPublic,
      });

      if (res.success && res.config) {
        setPaystackConfig(res.config);
        setSecretKeyInput('');
        setPublicKeyInput(res.config.publicKey || '');
        setKeysFeedback({
          type: 'success',
          message: res.config.mode === 'live'
            ? 'Clés Paystack enregistrées ! Les vrais paiements Mobile Money & Carte sont maintenant activés sur votre site.'
            : 'Clés de Test Paystack enregistrées ! Vous pouvez maintenant tester les paiements en toute sécurité.'
        });
      } else {
        setKeysFeedback({
          type: 'error',
          message: res.error || 'Impossible d\'enregistrer les clés Paystack.'
        });
      }
    } catch (err: any) {
      setKeysFeedback({
        type: 'error',
        message: err?.message || 'Erreur lors de l\'enregistrement.'
      });
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleCopyWebhook = () => {
    const url = paystackConfig?.webhookUrlSuggested || `${window.location.origin}/api/paystack.php?action=webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleSimulateQuick = async () => {
    if (series.length === 0) return;
    setIsSimulating(true);
    setActionNotice(null);

    const randomSeries = series[0];
    const uid = currentUser?.uid || `sim_user_${Date.now().toString().slice(-4)}`;

    try {
      const res = await simulateWorkSubscription(uid, randomSeries.id, randomSeries.title);
      if (res.success) {
        setActionNotice({
          type: 'success',
          message: `Simulation réussie : 1 Pass 30 Jours activé pour « ${randomSeries.title} » !`
        });
        await loadData();
      }
    } catch (err: any) {
      console.error('[AdminPaystackManager] Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportCsv = () => {
    if (subscriptions.length === 0) return;

    const headers = ['ID', 'Reference Paystack', 'Oeuvre ID', 'Oeuvre Titre', 'UID Lecteur', 'Email', 'Montant', 'Devise', 'Statut', 'Date Debut', 'Date Expiration'];
    const rows = subscriptions.map(s => [
      s.subscriptionId,
      s.paystackReference,
      s.workId,
      `"${(s.workTitle || '').replace(/"/g, '""')}"`,
      s.uid,
      s.customerEmail || '',
      s.amount,
      s.currency,
      s.status,
      s.startDate,
      s.expirationDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ozibd_paystack_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscriptions.filter(sub => {
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesWork = workFilter === 'all' || sub.workId === workFilter;
      const matchesSearch = !q ||
        (sub.paystackReference || '').toLowerCase().includes(q) ||
        (sub.workTitle || '').toLowerCase().includes(q) ||
        (sub.customerEmail || '').toLowerCase().includes(q) ||
        (sub.uid || '').toLowerCase().includes(q);
      return matchesStatus && matchesWork && matchesSearch;
    });
  }, [subscriptions, searchQuery, statusFilter, workFilter]);

  // Compute remaining days helper
  const getRemainingDays = (expirationDate: string, status: string): number => {
    if (status !== 'active') return 0;
    const expMs = new Date(expirationDate).getTime();
    const nowMs = Date.now();
    if (expMs <= nowMs) return 0;
    return Math.max(1, Math.ceil((expMs - nowMs) / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      
      {/* Top Banner & Quick Controls */}
      <div className="rounded-3xl bg-gradient-to-r from-[#17130a] via-[#141006] to-[#0a0a0f] border border-[#382b10] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Monétisation Paystack • Pass 30 Jours par Œuvre</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
            Tableau de Bord Financier Paystack
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl font-body">
            Suivi temps réel des abonnements lecteurs de 30 jours (2 000 FCFA), chiffre d'affaires Mobile Money & Carte, ventilation par œuvre et état des expirations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={subscriptions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Exporter les transactions au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateQuick}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 font-heading"
            title="Simuler un paiement Paystack réussi (Bac à sable)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Activation...' : 'Tester Vente (Simu)'}</span>
          </button>
        </div>

        <div className="absolute top-0 right-0 w-96 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Paystack API Keys & Webhook Direct Configuration Card */}
      <div className="rounded-3xl bg-zinc-900/95 border border-zinc-800 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black text-white font-heading">
                  Connexion Paystack (Clés API)
                </h3>
                {paystackConfig?.configured ? (
                  paystackConfig.mode === 'live' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Actif • Mode Réel (Live)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Actif • Mode Test
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                    <AlertCircle className="w-3 h-3" />
                    Non configuré (Paiements bloqués)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                Collez simplement vos clés depuis votre compte <strong className="text-zinc-200">dashboard.paystack.com</strong> (menu <strong className="text-zinc-200">Settings → API Keys & Webhooks</strong>). Vos clés restent protégées sur votre hébergement LWS.
              </p>
            </div>
          </div>

          <a
            href="https://dashboard.paystack.com/#/settings/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors shrink-0 self-start lg:self-auto"
          >
            <span>Ouvrir mon compte Paystack</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>

        <form onSubmit={handleSavePaystackKeys} className="mt-5 space-y-5">
          {keysFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                keysFeedback.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              }`}
            >
              {keysFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{keysFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clé Secrète */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200">
                  Clé Secrète Paystack (Secret Key) <span className="text-amber-400">*</span>
                </label>
                {paystackConfig?.hasSecretKey && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    Enregistrée : {paystackConfig.secretKeyMasked}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showSecretInput ? 'text' : 'password'}
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder={
                    paystackConfig?.hasSecretKey
                      ? 'Déjà enregistrée (collez une nouvelle clé pour remplacer)'
                      : 'Ex : sk_live_... ou sk_test_...'
                  }
                  autoComplete="off"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretInput(!showSecretInput)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Afficher ou masquer la clé secrète"
                >
                  {showSecretInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Commence par <code className="text-zinc-300">sk_live_</code> (paiements réels) ou <code className="text-zinc-300">sk_test_</code> (tests gratuits).
              </p>
            </div>

            {/* Clé Publique */}
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                Clé Publique Paystack (Public Key)
              </label>
              <input
                type="text"
                value={publicKeyInput}
                onChange={(e) => setPublicKeyInput(e.target.value)}
                placeholder="Ex : pk_live_... ou pk_test_..."
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Commence par <code className="text-zinc-300">pk_live_</code> ou <code className="text-zinc-300">pk_test_</code>.
              </p>
            </div>
          </div>

          {/* Adresse Webhook à copier dans Paystack */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 mb-1">
                <Link2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Lien Webhook à coller dans Paystack (case « Webhook URL ») :</span>
              </div>
              <div className="text-xs font-mono text-amber-300 truncate">
                {paystackConfig?.webhookUrlSuggested || (typeof window !== 'undefined' ? `${window.location.origin}/api/paystack.php?action=webhook` : 'https://ozibd.net/api/paystack.php?action=webhook')}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white shrink-0 cursor-pointer transition-colors"
            >
              {copiedWebhook ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Copier le lien Webhook</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>La clé secrète est stockée uniquement côté serveur et n'est jamais renvoyée aux visiteurs.</span>
            </div>

            <button
              type="submit"
              disabled={isSavingKeys}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 font-heading shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingKeys ? 'Enregistrement...' : 'Enregistrer mes clés Paystack'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Revenu Total Paystack</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-heading">
              {((stats?.totalRevenueXof || 0)).toLocaleString('fr-FR')} FCFA
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Abonnements 30 jours validés</span>
            </div>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pass Actifs en ce Moment</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
              {stats?.activeCount || 0}
            </div>
            <div className="text-[11px] text-zinc-400 font-medium mt-1">
              Lecteurs avec accès illimité 30 jours
            </div>
          </div>
        </div>

        {/* Expired Subscriptions */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pass Expirés</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-300 tracking-tight font-heading">
              {stats?.expiredCount || 0}
            </div>
            <div className="text-[11px] text-zinc-400 font-medium mt-1">
              Accès clos après 30 jours révolus
            </div>
          </div>
        </div>

        {/* Total Transactions & Pending */}
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Transactions</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
              {stats?.totalTransactionsCount || 0}
            </div>
            <div className="text-[11px] text-amber-400 font-semibold mt-1">
              {stats?.pendingCount || 0} transaction(s) en attente
            </div>
          </div>
        </div>

      </div>

      {/* 3 Unified Monetization Streams (Pass Webtoon, Artbooks, Coins) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Stream 1: Pass 30 Jours */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300">Pass 30 Jours Webtoon</div>
              <div className="text-lg font-black text-amber-400 font-heading">
                {(stats?.workPassRevenueXof ?? stats?.totalRevenueXof ?? 0).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
            {stats?.activeCount ?? 0} actif(s)
          </span>
        </div>

        {/* Stream 2: Artbooks Payants */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300">Artbooks & Recueils HD</div>
              <div className="text-lg font-black text-purple-400 font-heading">
                {(stats?.artbooksRevenueXof ?? 0).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold">
            {stats?.artbooksSalesCount ?? 0} vente(s)
          </span>
        </div>

        {/* Stream 3: Packs de Coins */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300">Packs de Coins Rechargés</div>
              <div className="text-lg font-black text-emerald-400 font-heading">
                {(stats?.coinsRevenueXof ?? 0).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            {stats?.coinsSalesCount ?? 0} recharge(s)
          </span>
        </div>

      </div>

      {/* 2-Column Analytics: Top Works by Revenue & Monthly Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Works (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Revenus par Œuvre (Top Séries)
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                {stats?.byWork.length || 0} œuvre(s) monétisée(s)
              </span>
            </div>

            {(!stats?.byWork || stats.byWork.length === 0) ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Aucune vente enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.byWork.slice(0, 5).map((w, idx) => {
                  const maxRev = stats.byWork[0]?.revenueXof || 1;
                  const percent = Math.min(100, Math.round((w.revenueXof / maxRev) * 100));
                  return (
                    <div key={w.workId || idx} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white truncate max-w-[220px] sm:max-w-[320px]">
                            {w.workTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-zinc-400 text-[11px]">{w.count} Pass</span>
                          <span className="font-black text-amber-400">{w.revenueXof.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Monthly Timeline (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Ventes par Mois
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Historique</span>
            </div>

            {(!stats?.byMonth || stats.byMonth.length === 0) ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Aucun historique mensuel disponible.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.byMonth.slice(0, 6).map((m, idx) => (
                  <div key={m.month || idx} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200">
                      {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(`${m.month}-01`))}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px]">
                        {m.count} vente{m.count > 1 ? 's' : ''}
                      </span>
                      <span className="font-black text-emerald-400">
                        {m.revenueXof.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Transactions Table Section */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl flex flex-col gap-5">
        
        {/* Table Controls (Search, Status Filter, Work Filter) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence, email lecteur, titre d'œuvre..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  statusFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tous ({subscriptions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  statusFilter === 'active' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Actifs ({stats?.activeCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  statusFilter === 'expired' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Expirés ({stats?.expiredCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                En attente ({stats?.pendingCount || 0})
              </button>
            </div>

            {/* Work dropdown */}
            <select
              value={workFilter}
              onChange={(e) => setWorkFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="all">Toutes les œuvres</option>
              {series.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Chargement des transactions Paystack...</span>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
            <CreditCard className="w-8 h-8 stroke-1 text-zinc-600" />
            <span>Aucune transaction ne correspond à vos critères de recherche.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Œuvre</th>
                  <th className="py-3 px-3">Lecteur</th>
                  <th className="py-3 px-3">Montant</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3">Validité</th>
                  <th className="py-3 px-3 text-right">Référence Paystack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSubscriptions.map((sub) => {
                  const remaining = getRemainingDays(sub.expirationDate, sub.status);
                  const isCopied = copiedRef === sub.paystackReference;

                  return (
                    <tr key={sub.subscriptionId} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-zinc-300 font-medium">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(sub.startDate || sub.createdAt))}
                      </td>

                      {/* Work */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block max-w-[180px] sm:max-w-[240px] truncate">
                          {sub.workTitle || 'Œuvre OZI'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {sub.workId.slice(0, 14)}...
                        </span>
                      </td>

                      {/* Reader */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-zinc-200 block truncate max-w-[160px]">
                          {sub.customerEmail || 'Lecteur OZI'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          UID: {sub.uid.slice(0, 10)}...
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-black text-amber-400">
                        {(sub.amount || 2000).toLocaleString('fr-FR')} {sub.currency || 'XOF'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {sub.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Actif
                          </span>
                        )}
                        {sub.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold">
                            Expiré
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Remaining Days */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {sub.status === 'active' ? (
                          <span className="text-emerald-400 font-bold">
                            {remaining} jour{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
                          </span>
                        ) : sub.status === 'expired' ? (
                          <span className="text-zinc-500">Clôturé</span>
                        ) : (
                          <span className="text-amber-400/80">Non activé</span>
                        )}
                      </td>

                      {/* Paystack Reference */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.paystackReference)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
                          title="Copier la référence Paystack"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span>{sub.paystackReference.slice(0, 16)}...</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
