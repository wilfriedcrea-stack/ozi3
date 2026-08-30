import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Star, 
  Flame, 
  Eye, 
  SlidersHorizontal,
  Info
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
  'Arts Martiaux'
];

export const SeriesCatalog: React.FC = () => {
  const { series, openReader } = useData();
  const [selectedGenre, setSelectedGenre] = useState<'Tous' | SeriesGenre>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular');
  const [selectedSeriesForDetail, setSelectedSeriesForDetail] = useState<Series | null>(null);

  const filteredSeries = useMemo(() => {
    return series.filter(s => {
      const matchesGenre = selectedGenre === 'Tous' || s.genre === selectedGenre || s.secondaryGenres?.includes(selectedGenre as SeriesGenre);
      const matchesQuery = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesGenre && matchesQuery;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.totalReads - a.totalReads;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
  }, [series, selectedGenre, searchQuery, sortBy]);

  return (
    <section id="section-oeuvres" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff5a50]/15 border border-[#ff5a50]/30 text-[#ff6b5b] text-xs font-bold uppercase tracking-wider mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-almodobar">Catalogue Officiel OZI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-almodobar">
              Explorez Nos Séries & Webtoons
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl font-body">
              Plongez dans des épopées originales, des mangas passionnants et des récits conçus spécialement pour la lecture sur smartphone.
            </p>
          </div>

          {/* Quick stats badge */}
          <div className="flex items-center gap-3 bg-[#0d0e15] border border-slate-800 rounded-2xl p-3.5 shrink-0 shadow-lg">
            <div className="flex flex-col pr-4 border-r border-slate-800">
              <span className="text-xs text-slate-400 font-medium font-body">Séries au catalogue</span>
              <span className="text-lg font-black text-[#ff6b5b] font-almodobar">{series.length} séries</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium font-body">Lectures totales</span>
              <span className="text-lg font-black text-white font-almodobar">
                {(series.reduce((acc, s) => acc + s.totalReads, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-4 mb-10">
          
          {/* Top Row: Search & Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="search-series-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une série, un auteur, un tag ou un mot-clé..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#0d0e15] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#ff5a50] focus:ring-1 focus:ring-[#ff5a50] transition-all font-body"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>

            <div className="sm:col-span-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="sort-series-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-3 px-4 rounded-2xl bg-[#0d0e15] border border-slate-800 text-xs sm:text-sm font-bold text-slate-200 focus:outline-none focus:border-[#ff5a50] font-heading"
              >
                <option value="popular">🔥 Plus populaires (Lectures)</option>
                <option value="rating">⭐ Mieux notés</option>
                <option value="recent">⚡ Récemment mis à jour</option>
              </select>
            </div>
          </div>

          {/* Genre Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENRES.map((genre) => (
              <button
                key={genre}
                id={`genre-pill-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 font-heading tap-active ${
                  selectedGenre === genre
                    ? 'bg-ozi-primary text-white shadow-lg glow-ozi scale-[1.02]'
                    : 'bg-[#0d0e15] hover:bg-[#161724] text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Series Cards Grid */}
        {filteredSeries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((s) => (
              <div
                key={s.id}
                id={`series-card-${s.id}`}
                className="group relative rounded-3xl bg-[#0d0e15] border border-slate-800 hover:border-[#ff5a50]/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Cover & Thumbnail Header */}
                <div 
                  className="relative h-64 w-full overflow-hidden cursor-pointer"
                  onClick={() => setSelectedSeriesForDetail(s)}
                >
                  <img 
                    src={s.coverUrl} 
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/30 to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-ozi-primary text-white shadow-md font-almodobar">
                      {s.genre}
                    </span>
                    {s.isExclusive && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-heading">
                        Exclu OZI
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#07080c]/85 backdrop-blur-md border border-slate-800 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{s.rating}</span>
                  </div>

                  {/* Quick Preview Badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[11px] font-bold text-[#ff6b5b] uppercase tracking-wider">
                      {s.country} • Par {s.author}
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight leading-snug group-hover:text-[#ffd4cf] transition-colors font-almodobar">
                      {s.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-body">
                    {s.synopsis}
                  </p>

                  {/* Metadata line */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-800/80 text-xs text-slate-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#ff5a50]" />
                      <span>{s.chaptersCount} chapitres</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ff5a50]" />
                      <span>{s.totalReads.toLocaleString()} lectures</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id={`card-read-btn-${s.id}`}
                      onClick={() => openReader(s.id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-ozi-primary hover:opacity-95 text-white font-black text-xs shadow-md glow-ozi transition-all hover:scale-[1.02] tap-active font-almodobar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lire Ch. 1</span>
                    </button>

                    <button
                      id={`card-detail-btn-${s.id}`}
                      onClick={() => setSelectedSeriesForDetail(s)}
                      className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#161724] hover:bg-[#1f2033] text-slate-200 font-bold text-xs border border-slate-800 transition-colors tap-active font-heading"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Détails</span>
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-[#0d0e15] rounded-3xl border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200 mb-1 font-almodobar">Aucune série trouvée</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4 font-body">
              Essayez de modifier votre recherche ou de sélectionner une autre catégorie.
            </p>
            <button
              onClick={() => {
                setSelectedGenre('Tous');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-ozi-primary text-white font-bold text-xs font-almodobar"
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
