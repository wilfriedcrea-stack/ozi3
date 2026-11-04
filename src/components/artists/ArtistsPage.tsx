import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Palette, 
  BookOpen, 
  Globe, 
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Artist } from '../../types';
import { useData } from '../../context/DataContext';

export const ArtistsPage: React.FC = () => {
  const { artists, artbooks, openArtistPage } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Tous');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Compute all available specialties
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    artists.forEach(a => {
      a.specialties?.forEach(s => set.add(s));
    });
    return ['Tous', ...Array.from(set)];
  }, [artists]);

  // Filtered artists
  const filteredArtists = useMemo(() => {
    return artists.filter(artist => {
      const matchesSearch = 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artist.country && artist.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (artist.featuredSeriesTitle && artist.featuredSeriesTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty = 
        selectedSpecialty === 'Tous' ||
        (artist.specialties && artist.specialties.includes(selectedSpecialty));

      return matchesSearch && matchesSpecialty;
    });
  }, [artists, searchQuery, selectedSpecialty]);

  // Compute number of artbooks per artist
  const getArtistArtbookCount = (artistId: string, artistName: string) => {
    return artbooks.filter(
      a => a.artistId === artistId || a.artistName.toLowerCase() === artistName.toLowerCase()
    ).length;
  };

  return (
    <section id="section-artists" className="py-12 sm:py-16 bg-[#06070a] min-h-[85vh] text-white relative">
      {/* Background ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff8679]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header & Title */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ff8679] uppercase tracking-widest mb-1.5 font-heading">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Créateurs & Univers Graphiques</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-almodobar">
                Artistes & Artbooks
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl font-body">
                Explorez l'univers visuel des meilleurs illustrateurs et concept artists d'OZI. Découvrez leurs carnets de croquis, peintures numériques et recueils d'art exclusifs.
              </p>
            </div>

            {/* Total Counter badge */}
            <div className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-[#12131d] border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff8679]" />
              <span className="font-bold text-white">{artists.length} Artistes</span>
              <span className="text-zinc-600">•</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">{artbooks.length} Artbooks</span>
            </div>
          </div>

          {/* Search bar & Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un artiste, un univers, un pays..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#12131d] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff8679] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Specialties scroll pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {allSpecialties.map(spec => {
                const isActive = selectedSpecialty === spec;
                return (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ff8679] text-white shadow-md shadow-[#ff8679]/20'
                        : 'bg-[#12131d] text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ARTISTS GALLERY (VISUAL GRID) */}
        {filteredArtists.length === 0 ? (
          /* Empty search result */
          <div className="p-16 rounded-3xl bg-[#0f1019] border border-zinc-800 text-center flex flex-col items-center">
            <Palette className="w-12 h-12 text-zinc-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Aucun artiste trouvé</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-4">
              Aucun créateur ne correspond à votre recherche "{searchQuery}".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSpecialty('Tous'); }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredArtists.map(artist => {
              const artbookCount = getArtistArtbookCount(artist.id, artist.name);

              return (
                <div
                  key={artist.id}
                  onClick={() => openArtistPage(artist.id)}
                  className="group relative rounded-3xl bg-[#0f1019] border border-zinc-800/90 hover:border-[#ff8679]/60 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff8679]/10 flex flex-col justify-between"
                >
                  {/* Card Header with Artist Picture */}
                  <div className="p-6 flex flex-col items-center text-center">
                    
                    {/* Portrait Photo */}
                    <div className="relative mb-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#ff8679] via-[#fb923c] to-purple-600 group-hover:scale-105 transition-transform duration-300 shadow-xl">
                        <img 
                          src={artist.photoUrl} 
                          alt={artist.name} 
                          className="w-full h-full object-cover rounded-full bg-zinc-900" 
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white shadow-md border-2 border-[#0f1019]" title="Vérifié OZI">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Artist Name */}
                    <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#ff8679] transition-colors font-almodobar mb-1">
                      {artist.name}
                    </h3>

                    {/* Country Badge */}
                    {artist.country && (
                      <div className="flex items-center gap-1 text-xs text-zinc-400 mb-3">
                        <Globe className="w-3 h-3 text-zinc-500" />
                        <span>{artist.country}</span>
                      </div>
                    )}

                    {/* Short Bio */}
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4 font-body">
                      {artist.bio}
                    </p>

                    {/* Specialties tags */}
                    <div className="flex flex-wrap justify-center gap-1 mb-2">
                      {artist.specialties?.slice(0, 2).map(spec => (
                        <span 
                          key={spec}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer Bar */}
                  <div className="p-4 bg-[#141522] border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <BookOpen className="w-3.5 h-3.5 text-[#ff8679]" />
                      <span className="font-semibold text-white">{artbookCount} {artbookCount > 1 ? 'Artbooks' : 'Artbook'}</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#ff8679] group-hover:translate-x-1 transition-transform">
                      <span>Voir la page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
