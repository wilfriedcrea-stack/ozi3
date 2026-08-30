import React, { useState } from 'react';
import { 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Database,
  Eye,
  Plus
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminHeaderProps {
  activeTab: string;
  onNewSeriesClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onNewSeriesClick }) => {
  const { setViewMode, firebaseConfig, triggerManualSync, testFirebaseConnection, adminUser } = useData();
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    setSyncing(true);
    setSyncFeedback('Synchronisation en cours avec Firestore...');
    await triggerManualSync();
    setTimeout(() => {
      setSyncing(false);
      setSyncFeedback('Base de données Firestore synchronisée en direct !');
      setTimeout(() => setSyncFeedback(null), 4000);
    }, 1000);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord & Analytics';
      case 'series': return 'Gestion des Séries & Éditeur de Chapitres Webtoon';
      case 'monetization': return 'Monétisation, Tarifs Coins & Payouts Mobile Money';
      case 'moderation': return 'Modération des Commentaires & Salubrité';
      case 'teasers': return 'Gestion des Teasers & Vidéos';
      case 'press': return 'Espace Presse & Communiqués';
      case 'version': return 'Distribution APK & Versions Mobiles';
      case 'submissions': return 'Candidatures & Projets Créateurs';
      case 'firebase': return 'Configuration Firestore & Synchronisation Temps Réel';
      default: return 'Studio Administrateur OZI';
    }
  };

  return (
    <header className="h-18 bg-[#09090e] border-b border-[#1a1a28] px-6 sm:px-8 flex items-center justify-between z-30 shrink-0">
      
      {/* Tab Title & Status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight font-heading">
            {getTabTitle()}
          </h1>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-body">
            <span>Studio Grand Écran</span>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base Firestore connectée : {firebaseConfig.projectId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-3">
        {syncFeedback && (
          <span className="hidden md:inline-flex text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl animate-in fade-in">
            {syncFeedback}
          </span>
        )}

        {/* Sync with Firestore button */}
        <button
          id="admin-header-sync-btn"
          onClick={handleSyncClick}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12121c] hover:bg-[#1c1c2b] text-zinc-200 border border-[#242436] text-xs font-bold transition-colors disabled:opacity-50 font-heading"
          title="Synchroniser immédiatement toutes les données vers Firestore"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncing ? 'Sync...' : 'Sync Firestore'}</span>
        </button>

        {activeTab === 'series' && (
          <button
            id="admin-header-add-series-btn"
            onClick={onNewSeriesClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff6600] to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-orange-500/25 transition-all hover:scale-105 font-heading"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Série</span>
          </button>
        )}

        {/* Admin profile indicator */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-[10px]">
            WC
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-white leading-tight">{adminUser.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono leading-tight">{adminUser.email}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-1">
            {adminUser.role}
          </span>
        </div>

        {/* Download LWS package */}
        <a
          id="admin-header-download-lws-btn"
          href="/ozibd-lws-dist.zip"
          download="ozibd-lws-dist.zip"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors font-heading"
          title="Télécharger le fichier zip prêt pour votre hébergement LWS"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Pack LWS (.zip)</span>
        </a>

        {/* Back to Live Landing Page */}
        <button
          id="admin-header-exit-btn"
          onClick={() => setViewMode('accueil')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors font-heading"
          title="Retourner à la vitrine publique du site"
        >
          <Eye className="w-4 h-4" />
          <span>Voir Vitrine Web</span>
        </button>
      </div>

    </header>
  );
};
