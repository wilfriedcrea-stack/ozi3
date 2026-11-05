import React, { useEffect } from 'react';
import { useData } from '../../context/DataContext';

export const ArtistsPage: React.FC = () => {
  const { artists, openArtistPage } = useData();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return (
    <div id="section-artists" className="bg-[#000000] min-h-screen w-full text-white">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Grille CSS Grid : 5 colonnes sur ordinateur, 3 sur tablette, 2 sur mobile */}
        {/* Espacement horizontal : 18-20px | Espacement vertical : ~60px */}
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-[18px] sm:gap-x-5 gap-y-[60px]"
          style={{
            gridAutoRows: 'max-content'
          }}
        >
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => openArtistPage(artist.slug || artist.id)}
              className="group cursor-pointer select-none flex flex-col"
            >
              {/* Conteneur d'image : hauteur fixe commune augmentée pour un format portrait élancé et élégant */}
              <div className="relative w-full h-[270px] xs:h-[300px] sm:h-[360px] md:h-[400px] lg:h-[440px] xl:h-[480px] 2xl:h-[510px] overflow-hidden rounded-none bg-black">
                <img
                  src={artist.photoUrl}
                  alt={artist.name}
                  loading="lazy"
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
          ))}
        </div>

      </div>
    </div>
  );
};
