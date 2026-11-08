import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { RefreshCw } from 'lucide-react';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

export const ArtistsPage: React.FC = () => {
  const { artists, openArtistPage } = useData();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleImageError = (artistId: string) => {
    setFailedImages(prev => ({ ...prev, [artistId]: true }));
  };

  return (
    <div id="section-artists" className="bg-[#000000] min-h-screen w-full text-white">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin mb-4" />
            <p className="text-zinc-400 text-base mb-2 font-light">Chargement des artistes...</p>
            <p className="text-zinc-600 text-xs">Synchronisation en direct avec la base de données cloud.</p>
          </div>
        ) : (
          /* Grille CSS Grid : 5 colonnes sur ordinateur, 3 sur tablette, 2 sur mobile */
          /* Espacement horizontal : 18-20px | Espacement vertical : ~60px */
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-[18px] sm:gap-x-5 gap-y-[60px]"
            style={{
              gridAutoRows: 'max-content'
            }}
          >
            {artists.map((artist) => {
              const hasFailed = failedImages[artist.id];
              const safeImgUrl = hasFailed 
                ? FALLBACK_PHOTO 
                : normalizeImageUrl(artist.photoUrl, FALLBACK_PHOTO);

              return (
                <div
                  key={artist.id}
                  onClick={() => openArtistPage(artist.slug || artist.id)}
                  className="group cursor-pointer select-none flex flex-col"
                >
                  {/* Conteneur d'image : hauteur fixe commune augmentée pour un format portrait élancé et élégant */}
                  <div className="relative w-full h-[270px] xs:h-[300px] sm:h-[360px] md:h-[400px] lg:h-[440px] xl:h-[480px] 2xl:h-[510px] overflow-hidden rounded-none bg-zinc-950">
                    <img
                      src={safeImgUrl}
                      alt={artist.name}
                      loading="lazy"
                      onError={() => handleImageError(artist.id)}
                      className="w-full h-full object-cover block rounded-none transition-opacity duration-200 group-hover:opacity-90"
                    />
                  </div>

                  {/* Légende : nom centré directement sous l'image, typographie sans-serif moderne, 18px, blanc, marge 11px */}
                  <div className="mt-[11px] text-center">
                    <span className="text-white font-sans text-[17px] sm:text-[18px] font-normal tracking-normal block leading-tight">
                      {artist.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
