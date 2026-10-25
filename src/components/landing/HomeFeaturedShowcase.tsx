import React, { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
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
    imageUrl: '/assets/aistudio/Sans_titre-3_b6d37864.png',
    logoUrl: '/images/kamina-logo.svg',
    synopsis: "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin.",
    buttonText: 'Lire le premier chapitre',
    seriesId: series[0]?.id || 'arcane-zaun-abidjan',
    active: true,
    order: 1
  };

  const slidesToRender = activeSlides.length > 0 ? activeSlides : [fallbackSlide];
  const currentSlide = slidesToRender[currentIndex] || slidesToRender[0] || fallbackSlide;

  // Auto-advance slides every 8 seconds if more than 1
  useEffect(() => {
    if (slidesToRender.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slidesToRender.length);
    }, 8000);

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

  return (
    <section 
      id="section-featured-showcase" 
      aria-label="Vitrine des Oeuvres Vedettes"
      className="relative w-full min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] bg-[#121316] overflow-hidden select-none border-b border-zinc-800/40"
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
                src={slide.imageUrl || '/assets/aistudio/Sans_titre-3_b6d37864.png'}
                alt={slide.title}
                className="w-full h-full object-cover object-right sm:object-center brightness-100 contrast-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Sans_titre-3_b6d37864.png';
                }}
              />
            </div>

            {/* Soft, translucent left-to-right gradient overlay matching screenshot */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 via-55% to-transparent pointer-events-none" 
            />

            {/* Subtle bottom & top vignette for seamless blending */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
          </div>
        );
      })}

      {/* Content Container (Left Aligned over the soft gradient) */}
      <div className="relative z-20 max-w-7xl mx-auto h-full min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] px-5 sm:px-8 lg:px-12 flex flex-col justify-center">
        <div className="w-full max-w-xl sm:max-w-2xl py-12 sm:py-16 flex flex-col items-start text-left">
          
          {/* 1. Large Title Logo Overlaid on the Left */}
          <div className="mb-5 sm:mb-7 flex items-center justify-start w-full">
            {currentSlide.logoUrl && !logoError[currentSlide.id] ? (
              <img
                src={currentSlide.logoUrl}
                alt={`Logo ${currentSlide.title}`}
                className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] max-h-40 sm:max-h-52 md:max-h-60 object-contain object-left filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] select-none transition-transform duration-300 hover:scale-102"
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
          <p className="text-white text-base sm:text-lg md:text-xl font-bold leading-relaxed tracking-normal max-w-lg mb-8 sm:mb-10 text-zinc-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            {currentSlide.synopsis || "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin."}
          </p>

          {/* 3. Action Button (Pill-shaped coral/orange matching mockup) - Single button, no 'En savoir plus' */}
          <div className="flex items-center">
            <button
              id="hero-showcase-read-btn"
              onClick={handleReadClick}
              className="inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#ff7b6b] hover:bg-[#ff8a7b] text-white font-bold text-base sm:text-lg shadow-[0_8px_30px_rgba(255,123,107,0.45)] hover:shadow-[0_12px_40px_rgba(255,123,107,0.65)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer font-almodobar"
              title={`Lire ${currentSlide.title}`}
            >
              <span>{currentSlide.buttonText || 'Lire le premier chapitre'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle indicator dots if multiple slides exist (no arrow icons) */}
      {slidesToRender.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
          {slidesToRender.map((slide, idx) => (
            <button
              key={slide.id || idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Aller au slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-7 h-2 bg-[#ff7b6b] shadow-[0_0_10px_rgba(255,123,107,0.8)]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

