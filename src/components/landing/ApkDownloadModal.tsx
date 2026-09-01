import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Info,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { appVersion, recordApkDownload, setViewMode } = useData();
  const { isInstallable, installPwa } = usePwaInstall();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [pwaInstalledSuccess, setPwaInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const apkUrl = appVersion.downloadUrl || appVersion.apkDownloadUrl || 'http://ozibd.net/ozi-reader.apk';

  const triggerDirectDownload = () => {
    recordApkDownload();
    setDownloadStarted(true);

    // Create real direct download link
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = `OZI-Reader-${appVersion.version}.apk`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 6000);
  };

  const handleInstallPwa = async () => {
    const success = await installPwa();
    if (success) {
      setPwaInstalledSuccess(true);
      setTimeout(() => {
        setPwaInstalledSuccess(false);
        onClose();
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0e0f17] border border-slate-800 p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff5a50]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/40 hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-[#ff5a50]/10 border border-[#ff5a50]/30 text-[#ff6b5b]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-almodobar">Télécharger l'Application OZI</h3>
            <p className="text-xs text-slate-400 font-body">Version officielle {appVersion.version} ({appVersion.apkSizeMb} Mo)</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          
          {/* Option 1: Direct APK Download */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141522] border border-slate-700/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#ff5a50] text-white text-[11px] font-bold font-almodobar">
                  Android APK
                </span>
                <span className="text-xs text-slate-300 font-semibold font-body">Fichier d'installation direct</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certifié OZI</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-body">
              Installez l'application Android complète sans passer par le Play Store.
            </p>

            <button
              onClick={triggerDirectDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5a50] to-[#ff7b6b] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#ff5a50]/20 transition-all font-almodobar cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStarted ? 'Téléchargement lancé...' : `Télécharger le fichier APK (${appVersion.apkSizeMb} Mo)`}</span>
            </button>

            {downloadStarted && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Si le téléchargement ne démarre pas automatiquement, <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">cliquez ici</a>.</span>
              </div>
            )}
          </div>

          {/* Option 2: Instant PWA Install */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141522] border border-slate-700/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[11px] font-bold font-almodobar">
                  PWA Web App
                </span>
                <span className="text-xs text-slate-300 font-semibold font-body">Sans téléchargement de fichier</span>
              </div>
              <span className="text-[11px] text-sky-400 font-bold">Android & iOS</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-body">
              Ajoutez l'icône OZI instantanément sur votre écran d'accueil sans occuper d'espace de stockage.
            </p>

            {isInstallable ? (
              <button
                onClick={handleInstallPwa}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all font-almodobar cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Installer sur mon écran d'accueil</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>Installation manuelle :</span>
                </div>
                <p>• <strong>Sur Android Chrome :</strong> Menu ⋮ &gt; « Ajouter à l'écran d'accueil »</p>
                <p>• <strong>Sur iPhone Safari :</strong> Bouton Partager ⎋ &gt; « Sur l'écran d'accueil »</p>
              </div>
            )}

            {pwaInstalledSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Application installée avec succès sur votre écran d'accueil !</span>
              </div>
            )}
          </div>

        </div>

        {/* Admin note */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Vous êtes l'administrateur ?</span>
          <button
            onClick={() => {
              onClose();
              setViewMode('admin');
            }}
            className="flex items-center gap-1 text-[#ff6b5b] hover:text-[#ff8a7d] font-bold cursor-pointer font-almodobar"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Changer le lien APK dans le Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
