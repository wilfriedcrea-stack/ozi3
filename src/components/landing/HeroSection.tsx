import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const HeroSection: React.FC = () => {
  const { appVersion, recordApkDownload } = useData();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPref = () => {
      const prefersReduced = mediaQuery.matches;
      setReducedMotion(prefersReduced);
      if (prefersReduced) {
        setIsInView(true);
        setScrollProgress(0);
      }
    };
    syncMotionPref();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMotionPref);
    }

    const stageEl = stageRef.current;
    if (!stageEl) {
      return () => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', syncMotionPref);
        }
      };
    }

    // Immediate viewport check so already-visible or scrolled-past elements stay visible
    const checkInitialVisibility = () => {
      const rect = stageEl.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh * 0.96 && rect.bottom > 0) {
        setIsInView(true);
      }
    };
    checkInitialVisibility();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight * 0.92) {
            setIsInView(true);
          }
        }
      },
      { threshold: [0.05, 0.2], rootMargin: '0px 0px -4% 0px' }
    );
    observer.observe(stageEl);

    let rafId = 0;
    const updateScroll3D = () => {
      rafId = 0;
      if (mediaQuery.matches || !stageRef.current) return;

      const rect = stageRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const center = rect.top + rect.height / 2;
      const normalized = clamp((center - vh * 0.5) / (vh * 0.65), -1, 1);

      setScrollProgress(normalized);

      if (rect.top < vh * 0.96 && rect.bottom > 0) {
        setIsInView(true);
      }
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateScroll3D);
    };

    updateScroll3D();
    // Capture scroll events from either window or any nested scroll container
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleScroll);
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', syncMotionPref);
      }
    };
  }, []);

  const apkUrl =
    appVersion.downloadUrl ||
    appVersion.apkDownloadUrl ||
    'https://ozibd.net/ozi-reader.apk';

  const handleDownloadApk = () => {
    setDownloading(true);
    recordApkDownload();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff8679', '#ffa296', '#F59E0B', '#ffffff'],
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);

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

  const p = reducedMotion ? 0 : scrollProgress;
  const visible = reducedMotion || isInView;

  const visualEntranceStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'perspective(1200px) translate3d(0px, 0px, 0px) rotateY(0deg) rotateX(0deg) scale(1)'
          : 'perspective(1200px) translate3d(32px, 56px, -90px) rotateY(-24deg) rotateX(12deg) scale(0.84)',
        transition:
          'transform 950ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, opacity 750ms ease-out 80ms',
        willChange: 'transform, opacity',
      };

  const visualScrollStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        transform: `perspective(1100px) translate3d(${(p * 10).toFixed(1)}px, ${(p * -16).toFixed(1)}px, ${(30 - Math.abs(p) * 20).toFixed(1)}px) rotateY(${(-4 + p * 14).toFixed(2)}deg) rotateX(${(p * -8).toFixed(2)}deg) rotateZ(${(p * 2).toFixed(2)}deg) scale(${(1.02 - Math.abs(p) * 0.04).toFixed(3)})`,
        willChange: 'transform',
      };

  const stage3DStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        transform: `perspective(1200px) rotateX(${(p * 6).toFixed(2)}deg) rotateY(${(p * -5).toFixed(2)}deg)`,
        willChange: 'transform',
      };

  const haloScrollStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: `translate3d(${(p * -12).toFixed(1)}px, ${(p * -16).toFixed(1)}px, -60px) scale(${visible ? (1.05 - Math.abs(p) * 0.12).toFixed(3) : 0.72})`,
        transition: 'opacity 900ms ease-out',
        willChange: 'transform, opacity',
      };

  return (
    <section
      id="section-accueil"
      aria-label="Télécharger l'application mobile OZI"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-[#07080c] border-b border-slate-800/80"
    >
      {/* Subtle Ambient Coral Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 right-[12%] -translate-y-1/2 w-[520px] h-[420px] bg-[#ff8679]/18 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 left-[8%] w-[380px] h-[320px] bg-[#ff8679]/10 rounded-full blur-[110px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Text & CTA Column: second on mobile (below visuals), first on desktop (left) */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="text-3xl sm:text-5xl xl:text-[3.25rem] font-black text-white tracking-tight leading-[1.08] font-almodobar text-balance mb-7">
              L'Univers des{' '}
              <span className="text-ozi-gradient">Webtoons & Mangas</span>{' '}
              sur votre Mobile.
            </h1>

            {/* Primary Call-To-Action Button */}
            <div className="flex items-center justify-center lg:justify-start w-full sm:w-auto">
              <button
                id="hero-apk-download-btn"
                type="button"
                onClick={handleDownloadApk}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-base shadow-xl glow-ozi hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-80 tap-active cursor-pointer whitespace-nowrap shrink-0 font-almodobar"
              >
                {downloading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                ) : downloadSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                ) : (
                  <Download className="w-5 h-5 shrink-0" />
                )}
                <span>
                  {downloading
                    ? 'Téléchargement...'
                    : downloadSuccess
                    ? 'Téléchargement lancé !'
                    : 'Télécharger'}
                </span>
              </button>
            </div>

            {/* Direct download confirmation */}
            {downloadSuccess && (
              <div className="mt-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in w-full max-w-xl font-body text-left">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Ouvrez le fichier téléchargé sur votre smartphone pour installer OZI.
                  </span>
                </div>
                <a
                  href={apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-xs shrink-0 text-white whitespace-nowrap"
                >
                  Lien direct
                </a>
              </div>
            )}
          </div>

          {/* Composed 3D Scroll Visual Column: first on mobile (above title), second on desktop (right) */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div
              ref={stageRef}
              style={stage3DStyle}
              className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px] h-[270px] sm:h-[350px] lg:h-[400px] flex items-end justify-center select-none"
            >
              {/* Soft Coral Backdrop Halo behind the composition */}
              <div
                aria-hidden="true"
                style={haloScrollStyle}
                className="absolute inset-x-8 bottom-4 top-8 rounded-full bg-gradient-to-tr from-[#ff8679]/25 via-[#ff8679]/10 to-transparent blur-2xl pointer-events-none"
              />

              {/* Combined OZI Character & 3D Phone Mockup */}
              <div
                style={visualEntranceStyle}
                className="relative h-full w-full flex items-end justify-center z-10 pointer-events-none"
              >
                <img
                  src="/assets/aistudio/PHONE_5d3c9f93.png"
                  alt="Personnage et application mobile OZI sur smartphone"
                  referrerPolicy="no-referrer"
                  style={visualScrollStyle}
                  className="h-full w-auto max-w-full object-contain pointer-events-none drop-shadow-[0_24px_45px_rgba(255,134,121,0.24)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
