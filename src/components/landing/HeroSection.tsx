import React, { useState } from 'react';
import { 
  Download, 
  Play, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  Flame, 
  CheckCircle2, 
  BookOpen,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { ApkDownloadModal } from './ApkDownloadModal';

export const HeroSection: React.FC = () => {
  const { series, appVersion, recordApkDownload, openReader, openTeaserModal, teasers, setViewMode, openOeuvrePage } = useData();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [apkModalOpen, setApkModalOpen] = useState(false);

  const featuredSeries = series.filter(s => s.isFeatured).slice(0, 3);
  const currentHero = featuredSeries[activeHeroIndex] || series[0];

  const apkUrl = appVersion.downloadUrl || appVersion.apkDownloadUrl || 'https://ozibd.net/ozi-reader.apk';

  const handleDownloadApk = () => {
    setDownloading(true);
    recordApkDownload();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5A50', '#FF6B5B', '#F59E0B', '#ffffff']
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      
      // Trigger real download
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
      }, 6000);
    }, 800);
  };

  const handleWatchTrailer = () => {
    if (teasers.length > 0) {
      openTeaserModal(teasers[0]);
    }
  };

  return (
    <section id="section-accueil" className="relative min-h-[85vh] pt-12 sm:pt-16 pb-20 flex items-center justify-center overflow-hidden bg-[#07080c]">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-gradient-to-tr from-[#ff5a50]/20 via-amber-500/10 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-[#ff6b5b]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-rose-700/10 rounded-full blur-[110px]" />
        
        {/* Subtle geometric grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy, Tagline & Main CTAs (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">

            {/* Main Punchy Heading */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.08] font-almodobar mb-6">
              L'Univers des <br />
              <span className="text-gradient">Webtoons & Mangas</span> <br />
              sur votre Mobile.
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mb-8 font-body">
              Lisez les meilleures séries originales, webtoons et bandes dessinées africaines et internationales avec un lecteur immersif ultra-rapide et optimisé hors-ligne.
            </p>

            {/* Action Buttons Hub */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
              
              {/* Main APK Download Button */}
              <button
                id="hero-apk-download-btn"
                onClick={handleDownloadApk}
                disabled={downloading}
                className="relative group overflow-hidden flex items-center justify-center gap-3.5 px-7 py-4 rounded-2xl bg-ozi-primary hover:opacity-95 text-white font-black text-base shadow-xl glow-ozi hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-80 tap-active cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-black/20 text-white">
                  {downloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : downloadSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Download className="w-5 h-5 animate-bounce" />
                  )}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[11px] uppercase font-black tracking-wider opacity-90">
                    {downloadSuccess ? 'Téléchargé !' : 'Téléchargement Direct'}
                  </span>
                  <span className="text-base font-black tracking-tight font-almodobar">
                    {downloading ? 'Téléchargement...' : `Télécharger l'APK (${appVersion.version})`}
                  </span>
                </div>
              </button>

              {/* Install / Options Button */}
              <button
                onClick={() => setApkModalOpen(true)}
                className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl bg-[#0d0e15] hover:bg-[#161724] text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 font-bold text-sm transition-all duration-200 shadow-lg tap-active cursor-pointer"
                title="Options d'installation PWA ou APK"
              >
                <Smartphone className="w-4 h-4 text-[#ff5a50]" />
                <span className="font-heading">Options d'installation</span>
              </button>

              {/* Watch Trailer / Teaser Button */}
              <button
                id="hero-trailer-btn"
                onClick={handleWatchTrailer}
                className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl bg-[#0d0e15] hover:bg-[#161724] text-slate-200 hover:text-white border border-slate-800 hover:border-[#ff5a50]/50 font-bold text-sm transition-all duration-200 group shadow-lg tap-active cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-[#ff5a50]/20 text-[#ff5a50] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-[#ff5a50] ml-0.5" />
                </div>
                <span className="font-heading">Teasers</span>
              </button>
            </div>

            {/* Quick Status / Trust Proof */}
            {downloadSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between gap-3 animate-in fade-in w-full max-w-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="font-bold text-emerald-200">Téléchargement lancé !</strong> Ouvrez le fichier sur votre smartphone pour installer OZI.
                  </div>
                </div>
                <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-xs shrink-0 text-white">
                  Lien direct
                </a>
              </div>
            )}

            {/* Live Metrics Strip */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-[#ff6b5b] tracking-tight font-almodobar">
                  +54 000
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">Lecteurs actifs</span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-almodobar">
                  +1.08M
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">Chapitres lus</span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-almodobar">
                  4.9 ★
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">Note globale</span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-almodobar flex items-center gap-1">
                  100%
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">Gratuit & VIP</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Featured Series Card & Hero Showcase (5 cols) */}
          <div className="lg:col-span-5 relative">
            
            {/* Glow backing */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff5a50] to-amber-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse" />

            <div className="relative rounded-3xl bg-[#0d0e15] border border-slate-800 overflow-hidden shadow-2xl">
              
              {/* Series Poster Showcase */}
              <div 
                onClick={() => openOeuvrePage(currentHero.slug || currentHero.id)}
                className="relative h-96 sm:h-[420px] overflow-hidden group cursor-pointer"
              >
                <img
                  src={currentHero.bannerUrl || currentHero.coverUrl}
                  alt={currentHero.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/40 to-transparent" />

                {/* Genre & Tag badges overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-[#ff5a50] text-white text-xs font-black uppercase tracking-wider font-almodobar shadow-lg">
                    {currentHero.genre}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold font-heading border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentHero.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Bottom Quick Info inside image */}
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-1">
                    <span>Par {currentHero.author}</span>
                    <span>•</span>
                    <span>{currentHero.country}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-almodobar line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {currentHero.title}
                  </h3>
                </div>
              </div>

              {/* Card Bottom: Synopsis + Direct Read Action */}
              <div className="p-6 bg-[#0d0e15] flex flex-col gap-4 text-left">
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-body">
                  {currentHero.synopsis}
                </p>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-heading">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#ff6b5b]" />
                      <span>{currentHero.chaptersCount} chapitres</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentHero.totalReads.toLocaleString()} lectures</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="hero-read-chapter1-btn"
                      onClick={() => openOeuvrePage(currentHero.slug || currentHero.id)}
                      className="flex items-center justify-center gap-1.5 py-3 px-5 rounded-xl bg-ozi-primary hover:opacity-95 text-white font-bold text-xs shadow-lg glow-ozi transition-all tap-active font-almodobar cursor-pointer"
                    >
                      <span>Fiche Oeuvre</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id="hero-explore-catalog-btn"
                      onClick={() => {
                        setViewMode('oeuvres');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#161724] hover:bg-[#1f2033] text-slate-200 font-bold text-xs border border-slate-800 transition-colors tap-active font-heading cursor-pointer"
                    >
                      <span>Catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Series Switcher Tabs */}
                <div className="px-5 py-3 bg-[#07080c] border-t border-slate-800 flex items-center justify-between rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Séries en vedette ({activeHeroIndex + 1}/{featuredSeries.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {featuredSeries.map((s, idx) => (
                      <button
                        key={s.id}
                        id={`hero-tab-${idx}`}
                        onClick={() => setActiveHeroIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          activeHeroIndex === idx 
                            ? 'w-6 bg-[#ff5a50]' 
                            : 'w-2 bg-slate-700 hover:bg-slate-500'
                        }`}
                        title={s.title}
                        aria-label={`Afficher ${s.title}`}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* APK & PWA Download Modal */}
      <ApkDownloadModal isOpen={apkModalOpen} onClose={() => setApkModalOpen(false)} />
    </section>
  );
};
