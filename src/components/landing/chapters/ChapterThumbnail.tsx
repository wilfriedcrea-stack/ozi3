import React, { useState } from 'react';

interface ChapterThumbnailProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

export const ChapterThumbnail: React.FC<ChapterThumbnailProps> = ({
  src,
  fallbackSrc,
  alt,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const displaySrc = (!imageError && src) ? src : (fallbackSrc || '/images/ozi_mosaic_banner.jpg');

  return (
    <div className={`relative bg-[#000000] shrink-0 overflow-hidden select-none ${className}`}>
      <img
        src={displaySrc}
        alt={alt || 'Miniature du chapitre'}
        loading="lazy"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover bg-[#000000]"
      />
    </div>
  );
};
