import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Star, 
  SlidersHorizontal,
  Play,
  Film,
  Tv,
  Sparkles
} from 'lucide-react';
import { Series, SeriesGenre } from '../../types';
import { useData } from '../../context/DataContext';
import { SeriesDetailModal } from './SeriesDetailModal';

const GENRES: Array<'Tous' | SeriesGenre> = [
  'Tous',
  'Afro-Fantasy',
  'Sci-Fi & Cyberpunk',
  'Action & Shonen',
  'Romance & Drame',
  'Mythologie & Histoire',
  'Arts Martiaux',
  'Comédie'
];

type FormatFilter = 'all' | 'série' | 'film';

export const SeriesCatalog: React.FC = () => {
  const { series, openReader } = useData();
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('all');
  const [selectedGenre, setSelectedGenre] = useState<'Tous' | SeriesGenre>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular');
  const [selectedSeriesForDetail, setSelectedSeriesForDetail] = useState<Series | null>(null);

  const filteredSeries = useMemo(() => {
    return series.filter(s => {
      // Format filter
      const itemFormat = s.format || (s.chaptersCount > 1 ? 'série' : 'film');
      const matchesFormat = selectedFormat === 'all' || itemFormat === selectedFormat;

      // Genre filter
      const matchesGenre = selectedGenre === 'Tous' || s.genre === selectedGenre || s.secondaryGenres?.includes(selectedGenre as SeriesGenre);

      // Search query
      const matchesQuery = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFormat && matchesGenre && matchesQuery;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.totalReads - a.totalReads;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
  }, [series, selectedFormat, selectedGenre, searchQuery, sortBy]);

  return (
    <section id="section-oeuvres" className="py-12 sm:py-16 bg-[#06070a] min-h-[85vh] text-white relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header & Search Bar */}
        <div className="flex flex-col gap-6 mb-8">
          
          {/* Header title & counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1.5 font-heading">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Catalogue & Oeuvres</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-almodobar">
                Toutes les Oeuvres
              </h1>
            </div>

            {/* Quick format selector pills (Tous / Films / Séries) */}
            <div className="flex items-center gap-1.5 p-1 bg-[#10121a] border border-white/10 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setSelectedFormat('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFormat === 'all'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({series.length})
              </button>
              <button
                onClick={() => setSelectedFormat('film')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFormat === 'film'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Films</span>
              </button>
              <button
                onClick={() => setSelectedFormat('série')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFormat === 'série'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3 h-3" />
                <span>Séries</span>
              </button>
            </div>
          </div>

          {/* Search, Sort & Genre Filters */}
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="sm:col-span-8 lg:col-span-9 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="search-series-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un film, une série, un auteur..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f1118] border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="sm:col-span-4 lg:col-span-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  id="sort-series-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0f1118] border border-white/10 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="popular">🔥 Plus populaires</option>
                  <option value="rating">⭐ Mieux notés</option>
                  <option value="recent">⚡ Nouveautés</option>
                </select>
              </div>
            </div>

            {/* Genre Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  id={`genre-pill-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 tap-active ${
                    selectedGenre === genre
                      ? 'bg-white text-zinc-950 shadow-md font-bold'
                      : 'bg-[#10121a] hover:bg-[#181a26] text-slate-300 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Poster Cards Grid (7 columns on wide screens, matching the reference image) */}
        {filteredSeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5 lg:gap-6">
            {filteredSeries.map((s) => {
              const displayFormat = s.format || (s.chaptersCount > 1 ? 'série' : 'film');

              return (
                <div
                  key={s.id}
                  id={`series-poster-${s.id}`}
                  onClick={() => setSelectedSeriesForDetail(s)}
                  className="group flex flex-col items-center cursor-pointer select-none"
                >
                  {/* Poster Card Container */}
                  <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg transition-all duration-300 transform group-hover:scale-[1.03] group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:border-purple-500/80">
                    
                    {/* Poster Cover Image */}
                    <img 
                      src={s.coverUrl} 
                      alt={s.title}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Top-Left Pill Badge ("film" or "série" like in reference) */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold tracking-wide shadow-md">
                      {displayFormat}
                    </div>

                    {/* Top-Right Rating Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-amber-400 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{s.rating}</span>
                    </div>

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Découvrir</span>
                      </div>
                    </div>
                  </div>

                  {/* Centered Title below the poster (matching reference image) */}
                  <h3 className="text-white text-center font-bold text-xs sm:text-sm mt-3 leading-snug line-clamp-2 px-1 group-hover:text-purple-300 transition-colors w-full">
                    {s.title}
                  </h3>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-[#0f1118] rounded-3xl border border-white/10 max-w-md mx-auto my-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1 font-almodobar">Aucune oeuvre trouvée</h3>
            <p className="text-sm text-slate-400 mb-5 font-body">
              Essayez de modifier votre recherche ou de sélectionner une autre catégorie.
            </p>
            <button
              onClick={() => {
                setSelectedFormat('all');
                setSelectedGenre('Tous');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

      </div>

      {/* Series Detail Modal */}
      <SeriesDetailModal 
        series={selectedSeriesForDetail} 
        onClose={() => setSelectedSeriesForDetail(null)} 
      />
    </section>
  );
};

