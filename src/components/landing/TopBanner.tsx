import React, { useState } from 'react';
import { useData } from '../../context/DataContext';

export const TopBanner: React.FC = () => {
  const { series, openReader } = useData();
  const [imgSrc, setImgSrc] = useState('https://ozibd.net/ban.jpg');

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
    if (imgSrc === 'https://ozibd.net/ban.jpg') {
      setImgSrc('/ban.jpg');
    } else if (imgSrc === '/ban.jpg') {
      setImgSrc('/images/ozi_mosaic_banner.jpg');
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
          src={imgSrc}
          alt="Bannière OZI BD"
          onError={handleImageError}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Subtle top & bottom shadow gradient for smooth blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141418]/60 via-transparent to-black/30 pointer-events-none" />
      </div>
    </aside>
  );
};


