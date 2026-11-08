import React, { useState } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';

interface ImageFallbackProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  priority?: boolean;
}

export const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'aspect-square',
  priority = false
}) => {
  const [hasError, setHasError] = useState(false);

  const fallbackSrc = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80';
  const safeSrc = hasError ? fallbackSrc : normalizeImageUrl(src, fallbackSrc);

  return (
    <div className={`relative w-full overflow-hidden bg-[#18181f] ${aspectRatioClass}`}>
      <img
        src={safeSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03] ${className}`}
      />
    </div>
  );
};
