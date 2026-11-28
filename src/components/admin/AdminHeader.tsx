import React, { useState } from 'react';
import { 
  Layers, 
  RefreshCw, 
  Eye,
  Plus,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminHeaderProps {
  activeTab: string;
  onNewSeriesClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onNewSeriesClick }) => {
  const { 
    setViewMode, 
    triggerManualSync, 
    adminUser, 
    logoutAdmin,
    openPasswordModal
  } = useData();
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [downloadingLws, setDownloadingLws] = useState(false);

  const handleDownloadLwsPack = async () => {
    if (downloadingLws) return;
    setDownloadingLws(true);
    setSyncFeedback('Préparation du Pack LWS (.zip)...');
    try {
      const response = await fetch('/api/lws-pack/download', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        throw new Error('Le fichier reçu n\'est pas un ZIP valide (HTML/proxy intercepté).');
      }
      const blob = new Blob([buffer], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = 'ozibd-lws-dist.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 1500);
      setSyncFeedback('Pack LWS téléchargé avec succès !');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(`Erreur Pack LWS : ${err?.message || 'Téléchargement impossible'}`);
      setTimeout(() => setSyncFeedback(null), 6000);
    } finally {
      setDownloadingLws(false);
    }
  };

  const handleSyncClick = async () => {
    setSyncing(true);
    setSyncFeedback('Sauvegarde globale en cours...');
    await triggerManualSync();
    setTimeout(() => {
      setSyncing(false);
      setSyncFeedback('Studio & serveur LWS synchronisés !');
      setTimeout(() => setSyncFeedback(null), 4000);
    }, 600);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord & Analytics';
      case 'hero-slides': return 'Vitrine & Bannières d\'Accueil';
      case 'series': return 'Gestion des Séries & Éditeur de Chapitres Webtoon';
      case 'artists': return 'Gestion des Artistes, Illustrateurs & Artbooks';
      case 'articles': return 'Articles & Carnets de Création';
      case 'paystack': return 'Paystack • Clés API, Pass & Paiements';
      case 'monetization': return 'Monétisation, Tarifs Coins & Payouts Mobile Money';
      case 'users': return 'Utilisateurs, Lecteurs & Statuts VIP';
      case 'admins': return 'Gestion des Administrateurs & Permissions';
      case 'moderation': return 'Modération des Messages, Commentaires & Salubrité';
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
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>⚡ Sauvegarde Studio & LWS active</span>
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

        {/* Sync Studio & LWS button */}
        <button
          id="admin-header-sync-btn"
          onClick={handleSyncClick}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12121c] hover:bg-[#1c1c2b] text-zinc-200 border border-[#242436] text-xs font-bold transition-colors disabled:opacity-50 font-heading"
          title="Synchroniser immédiatement toutes les données sur le serveur Studio & LWS"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncing ? 'Sync...' : 'Synchroniser'}</span>
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

        {/* Change Password Button */}
        <button
          id="admin-header-change-pwd-btn"
          onClick={openPasswordModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors font-heading"
          title="Modifier le mot de passe administrateur"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Mot de passe</span>
        </button>

        {/* Download LWS package */}
        <button
          type="button"
          id="admin-header-download-lws-btn"
          onClick={handleDownloadLwsPack}
          disabled={downloadingLws}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors font-heading cursor-pointer disabled:opacity-50"
          title="Télécharger le fichier zip prêt pour votre hébergement LWS"
        >
          <Layers className={`w-3.5 h-3.5 text-amber-400 ${downloadingLws ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{downloadingLws ? 'Génération...' : 'Pack LWS (.zip)'}</span>
        </button>

        {/* Back to Live Landing Page */}
        <button
          id="admin-header-exit-btn"
          onClick={() => setViewMode('accueil')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12121c] hover:bg-[#1c1c2b] text-zinc-300 border border-[#242436] text-xs font-bold transition-colors font-heading"
          title="Consulter la vitrine publique du site sans fermer la session"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Voir Vitrine</span>
        </button>

        {/* Secure Logout */}
        <button
          id="admin-header-logout-btn"
          onClick={logoutAdmin}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors font-heading"
          title="Fermer la session administrateur et verrouiller le Studio"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>

    </header>
  );
};
