import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

export const TopBanner: React.FC = () => {
  const { series, openReader, siteBannerUrl } = useData();
  const bannerUrl = siteBannerUrl?.trim() || 'https://ozibd.net/REF.png';
  const [currentSrc, setCurrentSrc] = useState(bannerUrl);
  const [hasError, setHasError] = useState(false);

  // Synchronize when siteBannerUrl changes across devices via Firestore
  useEffect(() => {
    if (siteBannerUrl && siteBannerUrl.trim()) {
      setCurrentSrc(siteBannerUrl.trim());
      setHasError(false);
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
    if (!hasError) {
      setHasError(true);
      if (currentSrc.startsWith('https://ozibd.net/')) {
        setCurrentSrc(currentSrc.replace('https://', 'http://'));
      } else {
        setCurrentSrc('/images/ozi_mosaic_banner.jpg');
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
      {/* Full width panoramic container with 3:1 aspect ratio matching 1920x640 */}
      <div className="relative w-full aspect-[3/1] min-h-[140px] max-h-[460px] overflow-hidden bg-zinc-950 flex items-center justify-center">
        <img
          src={currentSrc}
          alt="Bannière OZI BD"
          onError={handleImageError}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="eager"
          decoding="async"
        />

        {/* Subtle top & bottom shadow gradient for smooth blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141418]/25 via-transparent to-black/10 pointer-events-none" />
      </div>
    </aside>
  );
};


