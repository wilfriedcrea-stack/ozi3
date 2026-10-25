import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Play, 
  Sparkles, 
  Flame, 
  ArrowRight,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { HomeHeroSlide } from '../../types';

export const HomeFeaturedShowcase: React.FC = () => {
  const { 
    heroSlides, 
    series, 
    openReader, 
    openOeuvrePage,
    setViewMode 
  } = useData();

  // Filter only active slides, sorted by order
  const activeSlides = (heroSlides && heroSlides.length > 0)
    ? heroSlides.filter(s => s.active).sort((a, b) => a.order - b.order)
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [logoError, setLogoError] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback slide if none active
  const fallbackSlide: HomeHeroSlide = {
    id: 'kamina-default',
    title: 'Kamina',
    imageUrl: '/assets/aistudio/Sans_titre-2_1c012a78.png',
    logoUrl: '/images/kamina-logo.svg',
    synopsis: "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin.",
    buttonText: 'Lire le premier chapitre',
    seriesId: series[0]?.id || 'arcane-zaun-abidjan',
    active: true,
    order: 1
  };

  const slidesToRender = activeSlides.length > 0 ? activeSlides : [fallbackSlide];
  const currentSlide = slidesToRender[currentIndex] || slidesToRender[0] || fallbackSlide;

  // Auto-advance slides every 7 seconds if more than 1
  useEffect(() => {
    if (slidesToRender.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slidesToRender.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slidesToRender.length, isPaused]);

  // Handle CTA button click
  const handleReadClick = () => {
    if (!currentSlide) return;

    // Find linked series
    let targetSeries = series.find(
      s => s.id === currentSlide.seriesId || s.slug === currentSlide.seriesId
    );

    // If no exact match, fallback to first available series
    if (!targetSeries && series.length > 0) {
      targetSeries = series[0];
    }

    if (targetSeries) {
      if (targetSeries.chapters && targetSeries.chapters.length > 0) {
        // Direct jump into the first chapter reader!
        const targetChapter = currentSlide.chapterId
          ? targetSeries.chapters.find(c => c.id === currentSlide.chapterId) || targetSeries.chapters[0]
          : targetSeries.chapters[0];

        openReader(targetSeries.id, targetChapter.id);
      } else {
        // Navigate to the oeuvre presentation page
        openOeuvrePage(targetSeries.id);
      }
    } else {
      // Default to catalogue
      setViewMode('oeuvres');
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + slidesToRender.length) % slidesToRender.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % slidesToRender.length);
  };

  return (
    <section 
      id="section-featured-showcase" 
      aria-label="Vitrine des Oeuvres Vedettes"
      className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] bg-[#07080c] overflow-hidden select-none border-b border-zinc-800/60"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      {slidesToRender.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Artwork Image */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={slide.imageUrl || '/assets/aistudio/Sans_titre-2_1c012a78.png'}
                alt={slide.title}
                className="w-full h-full object-cover object-right sm:object-center brightness-[0.88] contrast-[1.05]"
                onError={(e) => {
                  // Fallback to sample artwork if custom image link fails
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Sans_titre-2_1c012a78.png';
                }}
              />
            </div>

            {/* Left-to-Right Cinematic Gradient Mask (Identical to reference mockup) */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/85 via-50% sm:via-45% to-transparent pointer-events-none" 
            />

            {/* Subtle bottom & top vignette for seamless navbar & content blending */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07080c]/70 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07080c] via-[#07080c]/60 to-transparent pointer-events-none" />
          </div>
        );
      })}

      {/* Content Container (Left Aligned over the dark gradient) */}
      <div className="relative z-20 max-w-7xl mx-auto h-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] px-5 sm:px-8 lg:px-12 flex flex-col justify-center">
        <div className="w-full max-w-xl sm:max-w-xl lg:max-w-2xl py-12 sm:py-16 flex flex-col items-start text-left">
          
          {/* 1. Title Logo Overlaid on the Left */}
          <div className="mb-6 sm:mb-8 flex items-center justify-start min-h-[90px] sm:min-h-[120px]">
            {currentSlide.logoUrl && !logoError[currentSlide.id] ? (
              <img
                src={currentSlide.logoUrl}
                alt={`Logo ${currentSlide.title}`}
                className="max-h-24 sm:max-h-32 md:max-h-38 w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] select-none transition-transform duration-300 hover:scale-105"
                onError={() => {
                  setLogoError(prev => ({ ...prev, [currentSlide.id]: true }));
                }}
              />
            ) : (
              /* Stylized fallback Title Logo if no custom logo image provided */
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff7b6b]/15 border border-[#ff7b6b]/30 text-[#ff8679] text-xs font-black tracking-wider uppercase mb-2">
                  <Flame className="w-3.5 h-3.5 text-[#ff8679]" />
                  <span>Œuvre Vedette OZI</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-almodobar drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  {currentSlide.title}
                </h2>
              </div>
            )}
          </div>

          {/* 2. Synopsis / Summary Text */}
          <p className="text-white text-base sm:text-lg md:text-xl font-semibold leading-relaxed tracking-normal max-w-lg mb-8 sm:mb-10 text-zinc-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            {currentSlide.synopsis || "Découvrez une histoire captivante mêlant aventures palpitantes, personnages inoubliables et combats grandioses."}
          </p>

          {/* 3. Action Button (Pill-shaped coral/orange matching mockup) */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              id="hero-showcase-read-btn"
              onClick={handleReadClick}
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#ff7b6b] hover:bg-[#ff8679] text-white font-bold text-base sm:text-lg shadow-[0_8px_30px_rgba(255,123,107,0.45)] hover:shadow-[0_12px_40px_rgba(255,123,107,0.65)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer font-almodobar"
              title={`Lire ${currentSlide.title}`}
            >
              <span>{currentSlide.buttonText || 'Lire le premier chapitre'}</span>
              <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
            </button>

            {/* Quick Series Detail Link (secondary subtle action) */}
            {currentSlide.seriesId && (
              <button
                onClick={() => openOeuvrePage(currentSlide.seriesId!)}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-black/40 hover:bg-black/60 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 text-sm font-semibold backdrop-blur-sm transition-all duration-200 cursor-pointer"
                title="Consulter les détails de la série"
              >
                <Info className="w-4 h-4 text-zinc-300" />
                <span>En savoir plus</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls (Visible if multiple slides exist) */}
      {slidesToRender.length > 1 && (
        <>
          {/* Previous Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Bannière précédente"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-[#ff7b6b] text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-transparent transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Bannière suivante"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-[#ff7b6b] text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-transparent transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Indicators Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            {slidesToRender.map((slide, idx) => (
              <button
                key={slide.id || idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Aller au slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 h-2 bg-[#ff7b6b] shadow-[0_0_12px_rgba(255,123,107,0.8)]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
