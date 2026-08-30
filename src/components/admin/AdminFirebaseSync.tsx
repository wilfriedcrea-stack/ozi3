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
  Globe
} from 'lucide-react';
import { useData } from '../../context/DataContext';

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
    submissions 
  } = useData();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'mobile' | 'rules' | 'backup'>('status');

  // Edit config state
  const [editProjectId, setEditProjectId] = useState(firebaseConfig.projectId);
  const [editDatabaseId, setEditDatabaseId] = useState(firebaseConfig.databaseId || '');
  const [editAuthDomain, setEditAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [editStorageBucket, setEditStorageBucket] = useState(firebaseConfig.storageBucket || '');
  const [configSaved, setConfigSaved] = useState(false);

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
    setSyncMessage('Synchronisation des collections Firestore en cours...');
    await triggerManualSync();
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage('Toutes les collections Firestore sont à jour et synchronisées avec l\'application mobile !');
      setTimeout(() => setSyncMessage(null), 5000);
    }, 1200);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      firebaseProjectId: firebaseConfig.projectId,
      series,
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
    
    // Séries & Chapitres : Lecture publique pour l'App Mobile & la Vitrine Web
    match /series/{seriesId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      match /chapters/{chapterId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // Bandes-Annonces & Teasers Vidéo
    match /teasers/{teaserId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Espace Presse & Communiqués Officiels
    match /press_releases/{pressId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Distribution de la version APK Android
    match /app_version/{versionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Candidatures des Créateurs & Auteurs (création publique, lecture admin)
    match /creator_submissions/{subId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-colors"
          >
            <Server className={`w-3.5 h-3.5 text-sky-400 ${testing ? 'animate-pulse' : ''}`} />
            <span>{testing ? 'Test en cours...' : 'Tester Connexion'}</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
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
                  <span className="text-xs text-zinc-400">Séries & Épisodes publiés</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">{series.length} documents</span>
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
