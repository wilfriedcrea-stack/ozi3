import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Lock, 
  FileCode, 
  Sparkles,
  Server,
  Zap,
  Globe,
  Image as ImageIcon,
  Palette,
  BookOpen,
  Smartphone,
  Laptop,
  Tablet,
  Check,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { compressImageToWebP, uploadToLWS } from '../../services/lwsUploadService';

export const AdminFirebaseSync: React.FC = () => {
  const { 
    firebaseConfig, 
    triggerManualSync, 
    testFirebaseConnection, 
    updateFirebaseConfig,
    series, 
    teasers, 
    pressReleases, 
    appVersion, 
    submissions,
    siteBannerUrl,
    updateSiteBannerUrl,
    addLwsFile,
    artists,
    artbooks,
    artbookDownloads,
    artbookPurchases,
    syncAllArtistsToFirestoreNow,
    syncAllArtbooksToFirestoreNow,
    isSyncingArtists,
    isSyncingArtbooks,
    articles,
    syncAllArticlesToFirestoreNow,
    isSyncingArticlesCloud
  } = useData();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'banner' | 'artists_sync' | 'config' | 'mobile' | 'rules' | 'backup'>('status');

  // Edit config state
  const [editProjectId, setEditProjectId] = useState(firebaseConfig.projectId);
  const [editDatabaseId, setEditDatabaseId] = useState(firebaseConfig.databaseId || '');
  const [editAuthDomain, setEditAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [editStorageBucket, setEditStorageBucket] = useState(firebaseConfig.storageBucket || '');
  const [configSaved, setConfigSaved] = useState(false);

  // Banner State
  const [customBannerUrl, setCustomBannerUrl] = useState(siteBannerUrl || '');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerSaveStatus, setBannerSaveStatus] = useState<string | null>(null);

  const handleUploadBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setBannerSaveStatus('Compression WebP et transfert vers LWS (ozibd.net)...');
    try {
      const compressed = await compressImageToWebP(file, 1920, 0.88);
      const res = await uploadToLWS(
        compressed.file,
        `banner_mosaic_${Date.now()}.webp`,
        'banners'
      );

      if (res.success && res.url) {
        setCustomBannerUrl(res.url);
        addLwsFile(res.fileInfo);
        await updateSiteBannerUrl(res.url);
        setBannerSaveStatus('Bannière transférée sur LWS et synchronisée en direct sur tous les appareils !');
        setTimeout(() => setBannerSaveStatus(null), 4000);
      } else {
        setBannerSaveStatus('Échec du transfert vers LWS.');
      }
    } catch (err) {
      console.error('Banner upload error:', err);
      setBannerSaveStatus('Erreur lors du transfert de la bannière.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!customBannerUrl.trim()) return;
    setBannerSaveStatus('Synchronisation en cours avec Firestore...');
    const ok = await updateSiteBannerUrl(customBannerUrl.trim());
    if (ok) {
      setBannerSaveStatus('Bannière enregistrée et diffusée sur tous les appareils !');
      setTimeout(() => setBannerSaveStatus(null), 4000);
    } else {
      setBannerSaveStatus('Erreur de synchronisation Firestore.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateFirebaseConfig({
      projectId: editProjectId.trim(),
      databaseId: editDatabaseId.trim() || undefined,
      authDomain: editAuthDomain.trim() || `${editProjectId.trim()}.firebaseapp.com`,
      storageBucket: editStorageBucket.trim() || `${editProjectId.trim()}.appspot.com`,
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testFirebaseConnection();
    setTesting(false);
    setTestResult(result);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMessage('Synchronisation globale de toutes les collections Firestore (Séries, Artistes, Artbooks, Paramètres)...');
    await triggerManualSync();
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage('Toutes les collections Firestore (y compris Artistes et Artbooks) sont synchronisées avec succès sur l\'ensemble des appareils !');
      setTimeout(() => setSyncMessage(null), 5000);
    }, 1200);
  };

  const handleSyncArtists = async () => {
    setSyncMessage('Synchronisation des artistes vers Firestore...');
    const res = await syncAllArtistsToFirestoreNow();
    setSyncMessage(res.message);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleSyncArtbooks = async () => {
    setSyncMessage('Synchronisation des artbooks vers Firestore...');
    const res = await syncAllArtbooksToFirestoreNow();
    setSyncMessage(res.message);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleSyncArticles = async () => {
    setSyncMessage('Synchronisation des articles vers Firestore...');
    const res = await syncAllArticlesToFirestoreNow();
    setSyncMessage(res.message);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      firebaseProjectId: firebaseConfig.projectId,
      series,
      artists,
      artbooks,
      artbookDownloads,
      artbookPurchases,
      articles,
      teasers,
      pressReleases,
      appVersion,
      submissions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OZI-Firestore-Backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const FIRESTORE_RULES_SAMPLE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'wilfriedcrea@gmail.com' ||
        (request.auth.token.keys().hasAny(['role']) && 
         (request.auth.token.role == 'super_admin' || request.auth.token.role == 'admin'))
      );
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    // Séries & Chapitres : Lecture publique, écriture réservée à l'administrateur
    match /series/{seriesId} {
      allow read: if true;
      allow write: if isAdmin();
      
      match /chapters/{chapterId} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    // Artistes & Artbooks : Modifications réservées à l'administrateur
    match /artists/{artistId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /artbooks/{artbookId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Téléchargements gratuits & Achats vérifiés
    match /artbook_downloads/{downloadId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
    
    match /artbook_purchases/{purchaseId} {
      allow create: if true;
      allow read: if isAdmin() || (isAuthenticated() && (request.auth.uid == resource.data.userId || request.auth.token.email == resource.data.customerEmail));
      allow update, delete: if isAdmin();
    }
    
    // Actualités, Teasers, Presse & Bannières
    match /articles/{articleId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /teasers/{teaserId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /press_releases/{pressId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /hero_slides/{slideId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Configuration & Monétisation
    match /config/{configId} {
      allow read: if configId != 'admin_security' || isAdmin();
      allow write: if isAdmin();
    }
    
    // Candidatures des Créateurs
    match /creator_submissions/{subId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    // Profils Lecteurs : Protection stricte contre l'usurpation et modifications de privilèges
    match /users/{userId} {
      allow read: if isAdmin() || (isAuthenticated() && request.auth.uid == userId);
      allow create: if isAdmin() || (isAuthenticated() && request.auth.uid == userId && request.resource.data.uid == userId && (!('role' in request.resource.data) || request.resource.data.role == 'reader') && (!('isVip' in request.resource.data) || request.resource.data.isVip == false));
      allow update: if isAdmin() || (isAuthenticated() && request.auth.uid == userId && request.resource.data.uid == resource.data.uid && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'uid', 'email', 'isVip', 'vipExpiresAt', 'coinsBalance', 'isBanned']));
      allow delete: if isAdmin();
    }
  }
}`;

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Base de Données Firestore & Synchronisation
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Connecteur temps réel partagé entre la vitrine web et l'application mobile des lecteurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Server className={`w-3.5 h-3.5 text-sky-400 ${testing ? 'animate-pulse' : ''}`} />
            <span>{testing ? 'Test en cours...' : 'Tester Connexion'}</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronisation...' : 'Synchroniser Tout Maintenant'}</span>
          </button>
        </div>
      </div>

      {/* Test feedback */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 animate-in fade-in ${
          testResult.success 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {syncMessage && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'status' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          État des Collections
        </button>
        <button
          onClick={() => setActiveTab('artists_sync')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'artists_sync' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Artistes & Artbooks Cloud ({artists.length + artbooks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('banner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'banner' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Bannière Header Web & App</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'config' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Modifier Clés & Projet
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'mobile' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Connexion APK Mobile (Code & Collections)
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rules' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Règles de Sécurité
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'backup' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Sauvegarde & Export
        </button>
      </div>

      {/* Tab: Collections Status */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Firestore Target Configuration (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Base Firestore Active</span>
                </div>
                <h3 className="text-xl font-black text-white mb-4">
                  Paramètres du Projet Cloud
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Project ID</span>
                    <span className="font-mono text-amber-400 font-bold">{firebaseConfig.projectId}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Database ID</span>
                    <span className="font-mono text-xs text-amber-300 truncate max-w-[200px]" title={firebaseConfig.databaseId}>{firebaseConfig.databaseId || '(default)'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Auth Domain</span>
                    <span className="font-mono text-zinc-300">{firebaseConfig.authDomain}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Storage Bucket</span>
                    <span className="font-mono text-zinc-300">{firebaseConfig.storageBucket}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                💡 <strong className="text-zinc-200">Fonctionnement Panafricain :</strong> Toutes les données modifiées ici sont instantanément synchronisées avec la PWA et les builds Android grâce au SDK Firebase Firestore.
              </div>
            </div>

            {/* Collections Table (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Collections Firestore Synchronisées</span>
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">/series</span>
                    <span className="text-xs text-zinc-400">Séries & Épisodes (Mobile & Web)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{series.length} documents</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">/works</span>
                    <span className="text-xs text-zinc-400">Catalogue Œuvres (Miroir & Web)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{series.length} documents</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">/config/site_settings</span>
                    <span className="text-xs text-zinc-400">Bannière Mosaïque & Paramètres globaux</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">Actif</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-orange-400">/teasers</span>
                    <span className="text-xs text-zinc-400">Bandes-annonces & vidéos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{teasers.length} documents</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-sky-400">/press_releases</span>
                    <span className="text-xs text-zinc-400">Communiqués & dossiers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{pressReleases.length} documents</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-400">/app_version</span>
                    <span className="text-xs text-zinc-400">Distribution APK ({appVersion.version})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">1 document</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-purple-400">/creator_submissions</span>
                    <span className="text-xs text-zinc-400">Candidatures reçues</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{submissions.length} documents</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">/artists</span>
                    <span className="text-xs text-zinc-400">Profils Artistes & Réseaux (Web & Mobile)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{artists.length} documents</span>
                    <button
                      onClick={handleSyncArtists}
                      disabled={isSyncingArtists}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                      title="Synchroniser uniquement les artistes"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncingArtists ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400">/artbooks</span>
                    <span className="text-xs text-zinc-400">Artbooks & Liens Directs (Web & Mobile)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{artbooks.length} documents</span>
                    <button
                      onClick={handleSyncArtbooks}
                      disabled={isSyncingArtbooks}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                      title="Synchroniser uniquement les artbooks"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncingArtbooks ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-teal-400">/artbook_downloads</span>
                    <span className="text-xs text-zinc-400">Téléchargements Gratuits & Leads Capturés</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{artbookDownloads.length} enregistrements</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-yellow-400">/artbook_purchases</span>
                    <span className="text-xs text-zinc-400">Achats Paystack & Commandes Enregistrées</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white">{artbookPurchases.length} enregistrements</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Audit visuel des couvertures synchronisées */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Vérification des Photos de Couverture Synchronisées sur Firestore</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Les images ci-dessous sont diffusées en direct sur le site web et l'application mobile de tous les appareils.
                </p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Re-synchroniser Tout</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {series.map((s) => (
                <div key={s.id} className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col gap-2 group hover:border-amber-500/50 transition-all">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                    <img 
                      src={s.coverUrl} 
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).classList.add('opacity-30');
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950" title="Synchronisé" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate" title={s.title}>{s.title}</span>
                    <span className="text-[10px] text-zinc-500 truncate" title={s.coverUrl}>
                      {s.coverUrl.startsWith('http') ? new URL(s.coverUrl).hostname : 'Image locale'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit visuel des Artistes et Artbooks Synchronisés */}
          <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Vérification des Artistes & Artbooks Actifs sur Firestore</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Tous les profils, planches et liens de téléchargement sont synchronisés en temps réel (<code className="text-emerald-400">onSnapshot</code>) sur smartphones, tablettes et ordinateurs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncArtists}
                  disabled={isSyncingArtists}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingArtists ? 'animate-spin' : ''}`} />
                  <span>Sync Artistes</span>
                </button>
                <button
                  onClick={handleSyncArtbooks}
                  disabled={isSyncingArtbooks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingArtbooks ? 'animate-spin' : ''}`} />
                  <span>Sync Artbooks</span>
                </button>
              </div>
            </div>

            {/* Artistes en direct */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Artistes ({artists.length})</span>
                </span>
                <span className="text-[11px] text-zinc-500">Collection <code className="text-zinc-400">/artists</code></span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {artists.map((artist) => (
                  <div key={artist.id} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center text-center gap-2 hover:border-amber-500/40 transition-all">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-900 border border-zinc-700/80">
                      <img 
                        src={artist.photoUrl} 
                        alt={artist.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).classList.add('opacity-30');
                        }}
                      />
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" title="Synchronisé Firestore" />
                    </div>
                    <span className="text-xs font-bold text-white truncate w-full" title={artist.name}>{artist.name}</span>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {artist.artbookIds?.length || 0} artbook{(artist.artbookIds?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Artbooks en direct */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Artbooks ({artbooks.length})</span>
                </span>
                <span className="text-[11px] text-zinc-500">Collection <code className="text-zinc-400">/artbooks</code></span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {artbooks.map((artbook) => (
                  <div key={artbook.id} className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col gap-2 hover:border-amber-500/40 transition-all">
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                      <img 
                        src={artbook.coverUrl} 
                        alt={artbook.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).classList.add('opacity-30');
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950" title="Synchronisé Firestore" />
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          artbook.price === 0 
                            ? 'bg-emerald-500 text-zinc-950' 
                            : 'bg-amber-500 text-zinc-950'
                        }`}>
                          {artbook.price === 0 ? 'Gratuit' : `${artbook.price} F`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate" title={artbook.title}>{artbook.title}</span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                        {artbook.downloadUrl ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>Lien direct actif</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500">PDF généré auto</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Artists & Artbooks Real-time Synchronization Center */}
      {activeTab === 'artists_sync' && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          
          {/* Header & Multi-Device sync status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Mise à jour en temps réel active sur tous les appareils</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Centre de Synchronisation Artistes & Artbooks
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                Toute modification apportée à un artiste ou un artbook est immédiatement synchronisée sur Firestore et diffusée instantanément sur tous les smartphones Android, tablettes et ordinateurs des lecteurs via le protocole Firestore <code className="text-amber-400">onSnapshot</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncArtists}
                disabled={isSyncingArtists}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingArtists ? 'animate-spin' : ''}`} />
                <span>Synchroniser Artistes ({artists.length})</span>
              </button>

              <button
                onClick={handleSyncArtbooks}
                disabled={isSyncingArtbooks}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingArtbooks ? 'animate-spin' : ''}`} />
                <span>Synchroniser Artbooks ({artbooks.length})</span>
              </button>
            </div>
          </div>

          {/* Multi-Device Guarantee Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white">{artists.length}</span>
                <p className="text-xs text-zinc-400">Artistes Actifs</p>
                <span className="text-[10px] text-emerald-400 font-medium">Collection /artists</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white">{artbooks.length}</span>
                <p className="text-xs text-zinc-400">Artbooks Disponibles</p>
                <span className="text-[10px] text-emerald-400 font-medium">Collection /artbooks</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  {artbooks.filter(a => a.downloadUrl && a.downloadUrl.trim() !== '').length} / {artbooks.length}
                </span>
                <p className="text-xs text-zinc-400">Avec Lien Direct</p>
                <span className="text-[10px] text-sky-400 font-medium">Téléchargement instantané</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  {artbookDownloads.length + artbookPurchases.length}
                </span>
                <p className="text-xs text-zinc-400">Téléchargements & Achats</p>
                <span className="text-[10px] text-emerald-400 font-medium">Traçabilité complète</span>
              </div>
            </div>
          </div>

          {/* Device Sync Architecture Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span title="Web & PC"><Laptop className="w-5 h-5 text-zinc-300" /></span>
                <span title="Tablettes"><Tablet className="w-5 h-5 text-amber-400" /></span>
                <span title="Smartphones & APK"><Smartphone className="w-5 h-5 text-emerald-400" /></span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Architecture Multi-Appareils OZI</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aucun redémarrage requis. Les écouteurs Firestore <code className="text-amber-400">onSnapshot</code> maintiennent la vitrine et l'APK parfaitement synchronisés sans friction.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Device Sync : 100% OK</span>
            </div>
          </div>

          {/* Detailed Artists Roster with Cloud Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Artistes Enregistrés sur Firestore ({artists.length})</span>
              </h4>
              <span className="text-xs text-zinc-500">Chaque profil possède sa propre page <code className="text-zinc-400">#/artiste/slug</code></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {artists.map((artist) => {
                const artistArtbooks = artbooks.filter(ab => ab.artistId === artist.id || artist.artbookIds?.includes(ab.id));
                return (
                  <div key={artist.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3.5 hover:border-amber-500/30 transition-all">
                    <img 
                      src={artist.photoUrl} 
                      alt={artist.name} 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{artist.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Cloud OK
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{artist.bio || 'Aucune biographie'}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                        <span className="text-amber-400/90 font-medium">{artistArtbooks.length} artbook{artistArtbooks.length > 1 ? 's' : ''}</span>
                        <span>•</span>
                        {artist.socials?.youtube && <span className="text-rose-400">YouTube</span>}
                        {artist.socials?.artstation && <span className="text-sky-400">ArtStation</span>}
                        {artist.socials?.instagram && <span className="text-pink-400">Instagram</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Artbooks Roster with Direct Download Links Status */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span>Artbooks et Liens de Téléchargement Direct ({artbooks.length})</span>
              </h4>
              <span className="text-xs text-zinc-500">Chaque artbook possède sa propre page <code className="text-zinc-400">#/artbook/slug</code></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {artbooks.map((artbook) => (
                <div key={artbook.id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3.5 hover:border-amber-500/30 transition-all">
                  <div className="w-14 h-18 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                    <img 
                      src={artbook.coverUrl} 
                      alt={artbook.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{artbook.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        artbook.price === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {artbook.price === 0 ? 'Gratuit' : `${artbook.price} FCFA`}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 truncate">{artbook.artistName}</span>
                    <div className="mt-1.5">
                      {artbook.downloadUrl && artbook.downloadUrl.trim() !== '' ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[200px]" title={artbook.downloadUrl}>Lien direct configuré</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Générateur PDF automatique</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab: Banner Management */}
      {activeTab === 'banner' && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-w-4xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Gestion Temps-Réel Cross-Device</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Bannière Mosaïque du Header du Site Web & Application
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Cette bannière panoramique est affichée en haut de la page d'accueil. Toute modification effectuée ici est immédiatement enregistrée dans Firestore et répercutée en direct sur tous les ordinateurs, smartphones et tablettes de vos visiteurs.
            </p>
          </div>

          {bannerSaveStatus && (
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{bannerSaveStatus}</span>
            </div>
          )}

          {/* Aperçu en direct */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Aperçu en direct (tel que visible par vos utilisateurs) :</span>
              <span className="text-[11px] text-zinc-500 font-mono">Format panoramique conseillé : 1920x350</span>
            </label>
            <div className="relative w-full h-[180px] sm:h-[220px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
              <img 
                src={customBannerUrl || siteBannerUrl || 'https://ozibd.net/REF.png'} 
                alt="Aperçu Bannière Header"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/ozi_mosaic_banner.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Bannière Active</span>
              </div>
            </div>
          </div>

          {/* Actions d'upload et d'URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Téléversement direct LWS */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Téléverser une nouvelle image</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Sélectionnez un fichier PNG ou JPG. Il sera automatiquement converti en WebP ultra-rapide et stocké sur le serveur LWS (ozibd.net).
                </p>
              </div>

              <div>
                <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 cursor-pointer transition-all">
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimisation et envoi...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Choisir une image panoramique</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBanner}
                    onChange={handleUploadBannerFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Saisie ou modification manuelle de l'URL */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Ou coller directement une URL</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Exemple : https://ozibd.net/REF.png ou https://ozibd.net/banners/ma-banniere.webp
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="url"
                  value={customBannerUrl}
                  onChange={(e) => setCustomBannerUrl(e.target.value)}
                  placeholder="https://ozibd.net/REF.png"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Enregistrer & Diffuser sur tous les appareils
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Modify Config & Keys */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-w-4xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Paramètres du Projet Firebase / Firestore</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Renseignez ici les identifiants de votre projet Firebase. Ces mêmes paramètres doivent être partagés avec votre développeur d'application mobile APK.
            </p>
          </div>

          {configSaved && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Configuration Firebase mise à jour avec succès !</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Project ID (Obligatoire)</label>
              <input
                type="text"
                required
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
                placeholder="ex: ozi-webtoons-africa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Database ID (Optionnel, ou laisser vide pour default)</label>
              <input
                type="text"
                value={editDatabaseId}
                onChange={(e) => setEditDatabaseId(e.target.value)}
                placeholder="(default) ou nom_database"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Auth Domain</label>
              <input
                type="text"
                value={editAuthDomain}
                onChange={(e) => setEditAuthDomain(e.target.value)}
                placeholder="ex: ozi-webtoons.firebaseapp.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Storage Bucket</label>
              <input
                type="text"
                value={editStorageBucket}
                onChange={(e) => setEditStorageBucket(e.target.value)}
                placeholder="ex: ozi-webtoons.appspot.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              Enregistrer les Nouveaux Paramètres
            </button>
          </div>
        </form>
      )}

      {/* Tab: Mobile APK Integration Guide */}
      {activeTab === 'mobile' && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Comment brancher votre APK Android sur ces données en temps réel</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Voici exactement comment l'application mobile (APK) et ce Studio Web partagent la même base de données.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Guide Flutter / Kotlin */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400 font-bold text-[11px] uppercase tracking-wider">
                Exemple Flutter / Dart
              </span>
              <pre className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
{`// 1. Initialiser Firebase avec le même Project ID :
// Project ID: "${firebaseConfig.projectId}"

// 2. Écouter la collection des séries en temps réel :
FirebaseFirestore.instance
  .collection('series')
  .snapshots()
  .listen((snapshot) {
    for (var doc in snapshot.docs) {
      print('Titre: ' + doc.data()['title']);
      print('Chapitres: ' + doc.data()['chapters'].length.toString());
    }
  });`}
              </pre>
            </div>

            {/* Guide React Native / Capacitor */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                Exemple React Native / Capacitor
              </span>
              <pre className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // Même config

// Écoute automatique : Dès qu'une BD est ajoutée au Studio,
// l'APK mobile la charge instantanément !
onSnapshot(collection(db, 'series'), (snapshot) => {
  const seriesList = snapshot.docs.map(d => d.data());
  setSeries(seriesList);
});`}
              </pre>
            </div>

          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
            <strong className="text-white">Règle d'or :</strong> Dès que vous ajoutez ou modifiez une BD dans l'onglet <strong>« Gestion des Séries »</strong>, elle est envoyée sur Firestore dans la collection <code className="text-amber-400">/series</code>. Toute application mobile connectée au projet Firebase <strong className="text-white font-mono">{firebaseConfig.projectId}</strong> reçoit immédiatement l'œuvre sans avoir besoin de mettre à jour l'APK.
          </div>
        </div>
      )}

      {/* Tab: Security Rules */}
      {activeTab === 'rules' && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Règles de Sécurité Firestore (firestore.rules)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Règles garantissant la lecture fluide pour l'application mobile et l'écriture sécurisée pour le Studio Admin.
              </p>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {FIRESTORE_RULES_SAMPLE}
          </pre>
        </div>
      )}

      {/* Tab: Backup */}
      {activeTab === 'backup' && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export & Sauvegarde Complète de la Base</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Téléchargez un instantané JSON complet contenant toutes les séries, chapitres, teasers et candidatures pour archivage ou déploiement.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Exporter l'Instantane JSON</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
