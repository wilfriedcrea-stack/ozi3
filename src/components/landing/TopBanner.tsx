import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

export const TopBanner: React.FC = () => {
  const { series, openReader, siteBannerUrl } = useData();
  const [currentSrc, setCurrentSrc] = useState(siteBannerUrl || 'https://ozibd.net/REF.png');
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Synchronize when siteBannerUrl changes across devices via Firestore
  useEffect(() => {
    if (siteBannerUrl && siteBannerUrl.trim()) {
      setCurrentSrc(siteBannerUrl);
      setFallbackIndex(0);
    }
  }, [siteBannerUrl]);

  const handleBannerClick = () => {
    const featured = series[0];
    if (featured && featured.chapters && featured.chapters.length > 0) {
      openReader(featured.id, featured.chapters[0].id);
    } else {
      const el = document.getElementById('section-oeuvres');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleImageError = () => {
    const fallbacks = [
      'https://ozibd.net/REF.png',
      'http://ozibd.net/REF.png',
      '/REF.png',
      'https://ozibd.net/testo.png',
      '/images/ozi_mosaic_banner.jpg'
    ];

    if (fallbackIndex < fallbacks.length) {
      const nextSrc = fallbacks[fallbackIndex];
      setFallbackIndex(prev => prev + 1);
      if (nextSrc !== currentSrc) {
        setCurrentSrc(nextSrc);
      }
    } else {
      setCurrentSrc('/images/ozi_mosaic_banner.jpg');
    }
  };

  return (
    <aside 
      id="top-image-banner"
      aria-label="Bannière Mosaïque Manga & Webtoon OZI"
      className="relative w-full bg-[#101014] cursor-pointer group select-none overflow-hidden border-b border-[#22232b]"
      onClick={handleBannerClick}
      title="OZI - Cliquez pour explorer le catalogue"
    >
      {/* Full width panoramic container */}
      <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] lg:h-[340px] xl:h-[380px] overflow-hidden bg-zinc-950 flex items-center justify-center">
        <img
          src={currentSrc}
          alt="Bannière OZI BD"
          onError={handleImageError}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Subtle top & bottom shadow gradient for smooth blend with reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141418]/20 via-transparent to-black/10 pointer-events-none" />
      </div>
    </aside>
  );
};


