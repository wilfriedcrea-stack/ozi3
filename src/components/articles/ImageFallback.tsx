import React, { useState } from 'react';

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

  return (
    <div className={`relative w-full overflow-hidden bg-[#18181f] ${aspectRatioClass}`}>
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03] ${className}`}
      />
    </div>
  );
};
