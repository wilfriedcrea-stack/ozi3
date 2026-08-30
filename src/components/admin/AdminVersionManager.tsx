import React, { useState } from 'react';
import { 
  Smartphone, 
  Save, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Download, 
  Globe, 
  CheckCircle2, 
  Sparkles,
  FileCode,
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AdminVersionManager: React.FC = () => {
  const { appVersion, updateAppVersion } = useData();
  
  const [version, setVersion] = useState(appVersion.version);
  const [buildNumber, setBuildNumber] = useState(appVersion.buildNumber);
  const [apkSizeMb, setApkSizeMb] = useState(appVersion.apkSizeMb);
  const [downloadUrl, setDownloadUrl] = useState(appVersion.downloadUrl || './ozi-reader.apk');
  const [pwaUrl, setPwaUrl] = useState(appVersion.pwaUrl);
  const [minAndroidVersion, setMinAndroidVersion] = useState(appVersion.minAndroidVersion);
  const [checksumSha256, setChecksumSha256] = useState(appVersion.checksumSha256);
  const [changelog, setChangelog] = useState<string[]>([...appVersion.changelog]);
  const [newChangeItem, setNewChangeItem] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddChange = () => {
    if (!newChangeItem.trim()) return;
    setChangelog([...changelog, newChangeItem.trim()]);
    setNewChangeItem('');
  };

  const handleRemoveChange = (index: number) => {
    setChangelog(changelog.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAppVersion({
      version,
      buildNumber: Number(buildNumber),
      apkSizeMb: Number(apkSizeMb),
      downloadUrl,
      apkDownloadUrl: downloadUrl,
      pwaUrl,
      minAndroidVersion,
      checksumSha256,
      changelog,
      releaseDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const testDownloadLink = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Distribution APK & Mises à Jour
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Configurez la version officielle de l'APK Android et l'installation PWA distribuées sur votre vitrine LWS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {appVersion.downloadsCount.toLocaleString()} Téléchargements
          </span>
        </div>
      </div>

      {/* Guide Hébergement APK */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/30 text-xs text-zinc-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>Comment faire fonctionner le téléchargement de votre APK sur LWS ?</span>
        </div>
        <p className="leading-relaxed">
          Pour que vos utilisateurs puissent télécharger et installer l'APK sur Android, vous avez <strong>2 méthodes très simples</strong> :
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-400">
          <li>
            <strong className="text-zinc-200">Méthode 1 (Sur LWS) :</strong> Dans le gestionnaire de fichiers LWS (dossier <code className="text-amber-300">htdocs</code>), téléversez votre fichier compilé <code className="text-amber-300">ozi-reader.apk</code> et laissez le lien ci-dessous sur <code className="text-emerald-400">./ozi-reader.apk</code>.
          </li>
          <li>
            <strong className="text-zinc-200">Méthode 2 (Lien externe) :</strong> Hébergez votre APK sur Google Drive, Mediafire ou GitHub Releases et collez l'URL directe dans le champ ci-dessous.
          </li>
          <li>
            <strong className="text-zinc-200">Bonus PWA :</strong> Même sans fichier APK, les utilisateurs peuvent déjà installer l'application OZI en 1 clic grâce à la version Progressive Web App !
          </li>
        </ul>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Configuration de la version {version} enregistrée et synchronisée avec la landing page et Firestore !
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Version details (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Paramètres de l'APK Android</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Version Nom (ex: 2.4.0)</label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Numéro de Build</label>
              <input
                type="number"
                required
                value={buildNumber}
                onChange={(e) => setBuildNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Taille APK (Mo)</label>
              <input
                type="number"
                step="0.1"
                required
                value={apkSizeMb}
                onChange={(e) => setApkSizeMb(parseFloat(e.target.value) || 10)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-400">Lien ou Fichier APK (ex: ./ozi-reader.apk ou https://...)</label>
              <button
                type="button"
                onClick={testDownloadLink}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Tester le lien</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="./ozi-reader.apk ou https://mon-serveur.com/app.apk"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Lien Web App PWA (Navigateur)</label>
            <input
              type="text"
              required
              value={pwaUrl}
              onChange={(e) => setPwaUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Version Android Minimale</label>
              <input
                type="text"
                value={minAndroidVersion}
                onChange={(e) => setMinAndroidVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Signature SHA-256 Checksum</label>
              <input
                type="text"
                value={checksumSha256}
                onChange={(e) => setChecksumSha256(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Changelog (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Changelog / Nouveautés de la Version</span>
            </h3>

            {/* Add item */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newChangeItem}
                onChange={(e) => setNewChangeItem(e.target.value)}
                placeholder="Ex: Mode lecture nocturne haute performance..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddChange}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {changelog.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                  <span className="truncate pr-2">• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChange(idx)}
                    className="text-zinc-500 hover:text-rose-400 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Version APK</span>
          </button>
        </div>

      </form>
    </div>
  );
};
