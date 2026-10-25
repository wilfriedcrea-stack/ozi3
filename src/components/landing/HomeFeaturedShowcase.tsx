import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
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
    formatStatus: 'WEBTOON • EN COURS',
    synopsis: "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin.",
    buttonText: 'Voir le manhwa',
    seriesId: series[0]?.id || 'arcane-zaun-abidjan',
    active: true,
    order: 1
  };

  const slidesToRender = activeSlides.length > 0 ? activeSlides : [fallbackSlide];

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
  const handleReadClick = (slide: HomeHeroSlide) => {
    if (!slide) return;

    let targetSeries = series.find(
      s => s.id === slide.seriesId || s.slug === slide.seriesId
    );

    // If no exact match, fallback to first available series
    if (!targetSeries && series.length > 0) {
      targetSeries = series[0];
    }

    if (targetSeries) {
      if (targetSeries.chapters && targetSeries.chapters.length > 0) {
        // Direct jump into the first chapter reader!
        const targetChapter = slide.chapterId
          ? targetSeries.chapters.find(c => c.id === slide.chapterId) || targetSeries.chapters[0]
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
      aria-label="Vitrine des Oeuvres"
      className="relative w-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] bg-[#121316] overflow-hidden select-none border-b border-zinc-800/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Scoped Keyframes for distinct entrance animations: 1/ Description then 2/ Logo */}
      <style>{`
        @keyframes oziDescEntrance {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes oziLogoEntrance {
          0% {
            opacity: 0;
            transform: scale(0.88);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes oziFadeMeta {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-ozi-desc {
          animation: oziDescEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
        }

        .animate-ozi-logo {
          transform-origin: left center;
          animation: oziLogoEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.26s both;
        }

        .animate-ozi-meta {
          animation: oziFadeMeta 0.4s ease-out 0.04s both;
        }
      `}</style>

      {/* Slides with Identical Disposition and Smooth Cross-fade */}
      {slidesToRender.map((slide, idx) => {
        const isCurrent = idx === currentIndex;

        // Find linked series for format & status metadata
        const slideSeries = series.find(
          s => s.id === slide.seriesId || s.slug === slide.seriesId
        );

        const slideFormatStatus = slide.formatStatus || (
          slideSeries 
            ? `${(slideSeries.format || 'WEBTOON').toUpperCase()} • ${slideSeries.status === 'completed' ? 'TERMINÉ' : 'EN COURS'}`
            : 'WEBTOON • EN COURS'
        );

        const slideButtonText = (slide.buttonText && slide.buttonText !== 'Lire le premier chapitre')
          ? slide.buttonText
          : 'Voir le manhwa';

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
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

            {/* Soft left-to-right gradient overlay matching mockup */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 via-50% to-transparent pointer-events-none" 
            />

            {/* Subtle bottom & top vignette for seamless blending */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

            {/* Content Container (Left Aligned over the soft gradient - Identical on All Slides) */}
            <div className="relative z-20 max-w-7xl mx-auto h-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] px-5 sm:px-8 lg:px-12 flex flex-col justify-center">
              <div className="w-full max-w-lg sm:max-w-xl py-12 sm:py-16 flex flex-col items-start text-left">
                
                {/* 1. Large Title Logo Overlaid on the Left - Appears 2nd with Scale/Pop Animation */}
                <div 
                  key={isCurrent ? `logo-active-${idx}` : `logo-idle-${idx}`}
                  className={`mb-4 sm:mb-5 flex items-center justify-start w-full min-h-[70px] sm:min-h-[90px] ${
                    isCurrent ? 'animate-ozi-logo' : 'opacity-0'
                  }`}
                >
                  {slide.logoUrl && !logoError[slide.id] ? (
                    <img
                      src={slide.logoUrl}
                      alt={`Logo ${slide.title}`}
                      style={slide.logoHeight ? {
                        maxHeight: `${slide.logoHeight}px`,
                        maxWidth: `${Math.round(slide.logoHeight * 2.8)}px`
                      } : undefined}
                      className={`w-auto object-contain object-left filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] select-none transition-all duration-300 hover:scale-102 ${
                        slide.logoHeight ? 'max-w-full' : 'max-w-[280px] sm:max-w-[360px] md:max-w-[420px] max-h-36 sm:max-h-48 md:max-h-56'
                      }`}
                      onError={() => {
                        setLogoError(prev => ({ ...prev, [slide.id]: true }));
                      }}
                    />
                  ) : (
                    /* Stylized fallback Title Logo if no custom logo image provided */
                    <div className="py-2">
                      <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-almodobar drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        {slide.title}
                      </h2>
                    </div>
                  )}
                </div>

                {/* 2. Format & Status Metadata Line (e.g. WEBTOON • EN COURS) */}
                <div 
                  key={isCurrent ? `meta-active-${idx}` : `meta-idle-${idx}`}
                  className={`text-xs sm:text-sm font-bold tracking-wider uppercase text-white/95 mb-4 sm:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                    isCurrent ? 'animate-ozi-meta' : 'opacity-0'
                  }`}
                >
                  {slideFormatStatus}
                </div>

                {/* Block: Description & CTA Button shifted slightly lower */}
                <div className="flex flex-col items-start mt-2 sm:mt-4 space-y-6 sm:space-y-8">
                  {/* 3. Synopsis / Summary Text - Appears 1st with Smooth Slide-Up Animation */}
                  <p 
                    key={isCurrent ? `desc-active-${idx}` : `desc-idle-${idx}`}
                    className={`text-white/90 text-xs sm:text-[14px] leading-relaxed max-w-lg font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-3 sm:line-clamp-4 ${
                      isCurrent ? 'animate-ozi-desc' : 'opacity-0'
                    }`}
                  >
                    {slide.synopsis || "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin."}
                  </p>

                  {/* 4. Action Button: Strictly static position, NO movement */}
                  <div className="flex items-center">
                    <button
                      id={`hero-showcase-read-btn-${idx}`}
                      onClick={() => handleReadClick(slide)}
                      className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#ff5242] via-[#ff6b57] to-[#ff8353] hover:from-[#ff6253] hover:via-[#ff7c69] hover:to-[#ff9365] text-white font-bold text-sm sm:text-base shadow-[0_8px_25px_rgba(255,107,87,0.45)] hover:shadow-[0_12px_35px_rgba(255,107,87,0.65)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer font-sans"
                      title={`Voir ${slide.title}`}
                    >
                      <Play className="w-4 h-4 fill-white text-white shrink-0" />
                      <span>{slideButtonText}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

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
                  ? 'w-7 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

