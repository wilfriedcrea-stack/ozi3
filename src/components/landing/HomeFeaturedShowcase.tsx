import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [logoError, setLogoError] = useState<Record<string, boolean>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transition controller with debounce & state protection
  const changeSlide = useCallback((nextIndex: number) => {
    if (nextIndex === currentIndex || isTransitioning) return;
    
    setPrevIndex(currentIndex);
    setCurrentIndex(nextIndex);
    setIsTransitioning(true);

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setPrevIndex(null);
      setIsTransitioning(false);
    }, 900);
  }, [currentIndex, isTransitioning]);

  // Preload upcoming slides' background and logo
  useEffect(() => {
    if (slidesToRender.length <= 1) return;
    const nextIdx = (currentIndex + 1) % slidesToRender.length;
    const nextSlide = slidesToRender[nextIdx];
    if (nextSlide?.imageUrl) {
      const img = new Image();
      img.src = nextSlide.imageUrl;
    }
    if (nextSlide?.logoUrl) {
      const logo = new Image();
      logo.src = nextSlide.logoUrl;
    }
  }, [currentIndex, slidesToRender]);

  // Pause rotation when browser tab is inactive / hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-advance rotation (4 seconds cycle - reduced by 3s) with reset on manual interaction
  useEffect(() => {
    if (slidesToRender.length <= 1 || isPaused || isDocumentHidden) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex(current => {
        const next = (current + 1) % slidesToRender.length;
        setPrevIndex(current);
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setPrevIndex(null);
          setIsTransitioning(false);
        }, 900);
        return next;
      });
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, isDocumentHidden, slidesToRender.length]);

  // Handle CTA button click
  const handleReadClick = (slide: HomeHeroSlide) => {
    if (!slide) return;

    let targetSeries = series.find(
      s => s.id === slide.seriesId || s.slug === slide.seriesId
    );

    if (!targetSeries && series.length > 0) {
      targetSeries = series[0];
    }

    if (targetSeries) {
      if (targetSeries.chapters && targetSeries.chapters.length > 0) {
        const targetChapter = slide.chapterId
          ? targetSeries.chapters.find(c => c.id === slide.chapterId) || targetSeries.chapters[0]
          : targetSeries.chapters[0];

        openReader(targetSeries.id, targetChapter.id);
      } else {
        openOeuvrePage(targetSeries.id);
      }
    } else {
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
      {/* Animation Styles tailored for fluid sequenced entrance & exit */}
      <style>{`
        /* 1. Visual transitions (background artwork + gradient overlays) */
        @keyframes oziSlideInRight {
          0% {
            opacity: 0;
            transform: translate3d(50px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes oziSlideOutLeft {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
          100% {
            opacity: 0;
            transform: translate3d(-40px, 0, 0);
          }
        }

        /* 2. Title / Logo animation (starts after background, horizontal glide 30-50px) */
        @keyframes oziTitleSlideIn {
          0% {
            opacity: 0;
            transform: translate3d(40px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        /* 3. Metadata & Description (discrete glide 8-16px) */
        @keyframes oziMetaSlideIn {
          0% {
            opacity: 0;
            transform: translate3d(12px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes oziDescSlideIn {
          0% {
            opacity: 0;
            transform: translate3d(14px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        /* Button subtle entrance */
        @keyframes oziButtonIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 6px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        /* Content exit on outgoing slide (disappears quickly to avoid overlap) */
        @keyframes oziContentExit {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
          100% {
            opacity: 0;
            transform: translate3d(-18px, 0, 0);
          }
        }

        /* 4. Button continuous slow animated halo & diffuse glow */
        @keyframes oziHaloMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Animation class bindings */
        .anim-slide-in {
          animation: oziSlideInRight 850ms cubic-bezier(0.25, 1, 0.5, 1) both;
        }

        .anim-slide-out {
          animation: oziSlideOutLeft 850ms cubic-bezier(0.25, 1, 0.5, 1) both;
        }

        .anim-title-in {
          animation: oziTitleSlideIn 550ms cubic-bezier(0.25, 1, 0.5, 1) 180ms both;
        }

        .anim-meta-in {
          animation: oziMetaSlideIn 450ms cubic-bezier(0.25, 1, 0.5, 1) 320ms both;
        }

        .anim-desc-in {
          animation: oziDescSlideIn 480ms cubic-bezier(0.25, 1, 0.5, 1) 440ms both;
        }

        .anim-button-in {
          animation: oziButtonIn 420ms cubic-bezier(0.25, 1, 0.5, 1) 560ms both;
        }

        .anim-content-exit {
          animation: oziContentExit 260ms ease-in both;
        }

        .animate-btn-halo {
          background-size: 300% 300%;
          animation: oziHaloMove 6s ease infinite;
        }

        .animate-btn-glow {
          background-size: 250% 250%;
          animation: oziHaloMove 7s ease infinite;
        }

        /* Responsive fine-tuning for smaller screens */
        @media (max-width: 640px) {
          @keyframes oziSlideInRight {
            0% {
              opacity: 0;
              transform: translate3d(25px, 0, 0);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @keyframes oziTitleSlideIn {
            0% {
              opacity: 0;
              transform: translate3d(24px, 0, 0);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
        }

        /* Accessibility: respect user prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .anim-slide-in,
          .anim-slide-out,
          .anim-title-in,
          .anim-meta-in,
          .anim-desc-in,
          .anim-button-in,
          .anim-content-exit,
          .animate-btn-halo,
          .animate-btn-glow {
            animation: none !important;
            transform: none !important;
            transition: opacity 250ms ease !important;
          }
        }
      `}</style>

      {/* Render Carousel Slides */}
      {slidesToRender.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrev = idx === prevIndex;

        // Skip slides that are neither active nor departing
        if (!isCurrent && !isPrev) {
          return null;
        }

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
            className={`absolute inset-0 w-full h-full ${
              isCurrent 
                ? 'z-20 pointer-events-auto' 
                : 'z-10 pointer-events-none'
            }`}
          >
            {/* Visual Layer (Background Artwork + Gradients) - Animated smoothly with superposition */}
            <div 
              className={`absolute inset-0 w-full h-full ${
                isCurrent 
                  ? 'anim-slide-in' 
                  : (isPrev ? 'anim-slide-out' : '')
              }`}
            >
              {/* Background Artwork Image */}
              <img
                src={slide.imageUrl || '/assets/aistudio/Sans_titre-3_b6d37864.png'}
                alt={slide.title}
                className="w-full h-full object-cover object-right sm:object-center brightness-100 contrast-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Sans_titre-3_b6d37864.png';
                }}
              />

              {/* Soft left-to-right gradient overlay matching mockup */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 via-50% to-transparent pointer-events-none" 
              />

              {/* Subtle top & bottom vignettes */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
            </div>

            {/* Content Container (Left Aligned over the soft gradient - Identical on All Slides) */}
            <div className="relative z-20 max-w-7xl mx-auto h-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] px-5 sm:px-8 lg:px-12 flex flex-col justify-center">
              <div 
                className={`w-full max-w-lg sm:max-w-xl py-12 sm:py-16 flex flex-col items-start text-left ${
                  isPrev ? 'anim-content-exit' : ''
                }`}
              >
                {/* 1. Title / Logo: Animates independently with glide from right (30-50px) */}
                <div 
                  key={isCurrent ? `logo-active-${idx}-${currentIndex}` : `logo-prev-${idx}`}
                  className={`mb-4 sm:mb-5 flex items-center justify-start w-full min-h-[70px] sm:min-h-[90px] ${
                    isCurrent ? 'anim-title-in' : ''
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

                {/* 2. Format & Status Metadata Line (8-16px discrete glide) */}
                <div 
                  key={isCurrent ? `meta-active-${idx}-${currentIndex}` : `meta-prev-${idx}`}
                  className={`text-xs sm:text-sm font-bold tracking-wider uppercase text-white/95 mb-4 sm:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
                    isCurrent ? 'anim-meta-in' : ''
                  }`}
                >
                  {slideFormatStatus}
                </div>

                {/* Block: Description & CTA Button */}
                <div className="flex flex-col items-start mt-2 sm:mt-4 space-y-6 sm:space-y-8">
                  {/* 3. Synopsis / Summary Text (discrete glide following metadata) */}
                  <p 
                    key={isCurrent ? `desc-active-${idx}-${currentIndex}` : `desc-prev-${idx}`}
                    className={`text-white/90 text-xs sm:text-[14px] leading-relaxed max-w-lg font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-3 sm:line-clamp-4 ${
                      isCurrent ? 'anim-desc-in' : ''
                    }`}
                  >
                    {slide.synopsis || "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu pour libérer son peuple des chaînes du destin."}
                  </p>

                  {/* 4. Action Button: Color #f95e4e + subtle multicolor halo & diffuse glow + active scale 0.97 */}
                  <div 
                    key={isCurrent ? `btn-active-${idx}-${currentIndex}` : `btn-prev-${idx}`}
                    className={`flex items-center ${isCurrent ? 'anim-button-in' : ''}`}
                  >
                    <div className="relative group inline-flex items-center">
                      {/* Diffuse glow underneath the button */}
                      <div 
                        className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-[#f95e4e] via-[#8b5cf6] via-[#06b6d4] to-[#f59e0b] opacity-35 group-hover:opacity-55 blur-lg transition-opacity duration-700 animate-btn-glow pointer-events-none"
                      />

                      {/* Fine animated multicolor halo outline around button */}
                      <div 
                        className="absolute -inset-[1.5px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#f95e4e] via-[#a855f7] via-[#38bdf8] to-[#fbbf24] p-[1.5px] opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-btn-halo pointer-events-none"
                      />

                      {/* Button itself: keeps exact #f95e4e background, clean legible text, smooth 0.97 click scale */}
                      <button
                        id={`hero-showcase-read-btn-${idx}`}
                        onClick={() => handleReadClick(slide)}
                        className="relative z-10 inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#f95e4e] hover:bg-[#fa6f60] text-white font-bold text-sm sm:text-base shadow-[0_4px_16px_rgba(249,94,78,0.35)] active:scale-[0.97] transition-all duration-200 cursor-pointer font-sans"
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
          </div>
        );
      })}

      {/* Synchronized indicator dots for carousel navigation */}
      {slidesToRender.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          {slidesToRender.map((slide, idx) => (
            <button
              key={slide.id || idx}
              onClick={() => {
                if (idx !== currentIndex && !isTransitioning) {
                  changeSlide(idx);
                }
              }}
              disabled={isTransitioning}
              aria-label={`Aller au slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer disabled:cursor-default ${
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
