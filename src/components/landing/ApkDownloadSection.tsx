import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  ChevronRight, 
  Copy, 
  Check,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { ApkDownloadModal } from './ApkDownloadModal';

export const ApkDownloadSection: React.FC = () => {
  const { appVersion, recordApkDownload } = useData();
  const { isInstallable, installPwa } = usePwaInstall();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const apkUrl = appVersion.downloadUrl || appVersion.apkDownloadUrl || 'https://ozibd.net/ozi-reader.apk';

  const handleDownload = () => {
    setDownloading(true);
    recordApkDownload();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#FF5A50', '#FF6B5B', '#F59E0B', '#ffffff']
      });
    } catch {}

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);

      // Trigger real file download or link
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = `OZI-Reader-${appVersion.version}.apk`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 7000);
    }, 800);
  };

  const copyChecksum = () => {
    navigator.clipboard.writeText(appVersion.checksumSha256);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 3000);
  };

  return (
    <section id="section-download" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#ff5a50]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4 font-almodobar">
            <Smartphone className="w-4 h-4" />
            <span>Distribution Officielle Android & PWA</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-almodobar">
            Téléchargez l'Application OZI
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-body">
            Profitez d'une expérience de lecture fluide, instantanée et pensée pour consommer un minimum de données mobiles.
          </p>
        </div>

        {/* Main Download Card & QR Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          
          {/* Left Column: Direct APK Download Main Action Box */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0d0e15] border border-slate-800 p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff5a50]/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Version & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white font-almodobar">APK Officiel</span>
                  <span className="px-3 py-1 rounded-full bg-ozi-primary text-white font-black text-xs font-almodobar">
                    {appVersion.version}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 font-heading">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certifié Sans Publicité Nocive</span>
                </div>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#07080c] border border-slate-800 mb-6">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium font-body">Taille du fichier</span>
                  <div className="text-base font-black text-[#ff6b5b] font-almodobar">{appVersion.apkSizeMb} Mo</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium font-body">Compatibilité</span>
                  <div className="text-base font-bold text-slate-200 font-heading">Android 6.0+</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 font-medium font-body">Téléchargements</span>
                  <div className="text-base font-black text-emerald-400 font-almodobar">{appVersion.downloadsCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Changelog highlights */}
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-heading">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff5a50]" />
                  <span>Nouveautés de la version {appVersion.version}</span>
                </h4>
                <ul className="space-y-2 font-body">
                  {appVersion.changelog.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-[#ff5a50] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Download CTA Buttons */}
            <div className="space-y-3">
              {downloadSuccess && (
                <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Téléchargement initié ! Cliquez sur la notification de votre téléphone pour installer l'APK.</span>
                  </div>
                  <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-xs shrink-0 text-white">
                    Lien direct
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="main-apk-download-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-ozi-primary hover:opacity-95 text-white font-black text-base shadow-2xl glow-ozi hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-80 font-almodobar tap-active cursor-pointer"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>
                    {downloading ? 'Téléchargement...' : `Télécharger l'APK (${appVersion.apkSizeMb} Mo)`}
                  </span>
                </button>

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#181926] hover:bg-[#222436] text-slate-200 hover:text-white font-bold text-sm border border-slate-700 transition-all font-almodobar cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-[#ff5a50]" />
                  <span>Options d'Installation</span>
                </button>
              </div>

              {/* SHA256 Checksum verify tool */}
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-800 font-mono">
                <span className="truncate max-w-xs sm:max-w-sm">
                  SHA-256 : {appVersion.checksumSha256.slice(0, 16)}...{appVersion.checksumSha256.slice(-8)}
                </span>
                <button
                  onClick={copyChecksum}
                  className="flex items-center gap-1 text-[#ff6b5b] hover:text-[#ff8a7d] font-bold tap-active cursor-pointer"
                >
                  {copiedChecksum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedChecksum ? 'Copié !' : 'Copier Checksum'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: QR Code Mobile Scan & PWA Guide */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* QR Code Card */}
            <div className="rounded-3xl bg-[#0d0e15] border border-slate-800 p-6 sm:p-8 flex flex-col items-center text-center shadow-xl">
              <div className="p-4 rounded-2xl bg-white shadow-xl shadow-white/5 mb-4">
                {/* Visual SVG QR Code generator */}
                <div className="w-40 h-40 flex items-center justify-center bg-[#07080c] rounded-xl p-2 relative">
                  <div className="w-full h-full bg-white p-2 rounded flex flex-col items-center justify-between">
                    <div className="flex justify-between w-full">
                      <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center p-1"><div className="w-4 h-4 bg-white rounded-xs" /></div>
                      <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center p-1"><div className="w-4 h-4 bg-white rounded-xs" /></div>
                    </div>
                    <div className="font-black text-[13px] text-[#ff5a50] tracking-tighter font-almodobar">OZI APK</div>
                    <div className="flex justify-between w-full">
                      <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center p-1"><div className="w-4 h-4 bg-white rounded-xs" /></div>
                      <div className="grid grid-cols-2 gap-1 w-8 h-8"><div className="bg-black"/><div className="bg-black"/><div className="bg-black"/></div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-black text-white mb-1 font-almodobar">
                Scannez avec votre Smartphone
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-body">
                Pointez l'appareil photo de votre téléphone Android pour lancer directement le téléchargement de l'APK.
              </p>
            </div>

            {/* PWA / Web App Option */}
            <div className="rounded-3xl bg-gradient-to-br from-[#0d0e15] to-[#07080c] border border-slate-800 p-6 flex flex-col justify-between flex-1 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-2 font-heading">
                  <Globe className="w-4 h-4" />
                  <span>Version Web App / PWA (iOS & Android)</span>
                </div>
                <h4 className="text-base font-black text-white mb-2 font-almodobar">
                  Installation Instantanée sans fichier APK
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 font-body">
                  OZI fonctionne aussi sous forme de Progressive Web App. Ajoutez l'application en 1 clic sur votre écran d'accueil sans occuper de stockage lourd.
                </p>
              </div>

              {isInstallable ? (
                <button
                  onClick={() => installPwa()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors tap-active font-heading cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Installer l'App sur l'écran d'accueil</span>
                </button>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161724] hover:bg-[#1f2033] text-sky-400 font-bold text-xs border border-slate-800 transition-colors tap-active font-heading cursor-pointer"
                >
                  <span>Voir le guide d'installation PWA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* 3 Simple Installation Steps Guide */}
        <div className="rounded-3xl bg-[#0d0e15] border border-slate-800 p-8 shadow-xl">
          <h3 className="text-xl font-black text-white text-center mb-8 font-almodobar">
            Comment installer l'APK sur Android en 3 étapes simples :
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ff5a50]/10 border border-[#ff5a50]/20 text-[#ff6b5b] font-black text-lg flex items-center justify-center mb-4 font-almodobar">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1.5 font-heading">Télécharger le fichier APK</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-body">
                Cliquez sur le bouton de téléchargement ci-dessus pour enregistrer le paquet officiel OZI sur votre appareil.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ff5a50]/10 border border-[#ff5a50]/20 text-[#ff6b5b] font-black text-lg flex items-center justify-center mb-4 font-almodobar">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1.5 font-heading">Autoriser la source</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-body">
                Si demandé, activez « Autoriser l'installation depuis cette source » dans les paramètres de sécurité Android.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ff5a50]/10 border border-[#ff5a50]/20 text-[#ff6b5b] font-black text-lg flex items-center justify-center mb-4 font-almodobar">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1.5 font-heading">Ouvrir & Lire</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-body">
                Lancez l'icône OZI depuis votre écran d'accueil et profitez immédiatement de tous vos webtoons favoris !
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* APK & App Modal */}
      <ApkDownloadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
