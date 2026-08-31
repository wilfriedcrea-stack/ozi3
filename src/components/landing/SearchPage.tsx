import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  BookOpen, 
  Newspaper, 
  Star, 
  ArrowRight, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  Flame, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Series, Article, SeriesGenre } from '../../types';

type SearchCategoryFilter = 'all' | 'oeuvres' | 'articles';

const POPULAR_SUGGESTIONS = [
  'Neo Abidjan',
  'Anansi',
  'Afrofuturisme',
  'Sci-Fi',
  'Action',
  'Fantastique',
  'Webtoon',
  'Côte d\'Ivoire',
  'APK'
];

export const SearchPage: React.FC = () => {
  const { series, articles, openOeuvrePage, openArticlePage, setViewMode } = useData();
  
  // Search query state
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tous');
  const [selectedFormat, setSelectedFormat] = useState<string>('Tous');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on page load and initialize from URL query if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlQuery = searchParams.get('q') || searchParams.get('search');
      if (urlQuery) {
        setQuery(urlQuery);
      }
    }
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Filter Series matching search query
  const matchingSeries = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    
    return series.filter((s) => {
      // Genre filter
      if (selectedGenre !== 'Tous') {
        const hasGenre = s.genres && s.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
        if (!hasGenre) return false;
      }

      // Format filter
      if (selectedFormat !== 'Tous') {
        const fmt = (s.format || '').toLowerCase();
        if (selectedFormat === 'film' && fmt !== 'film') return false;
        if (selectedFormat === 'série' && fmt !== 'série' && fmt !== 'serie') return false;
        if (selectedFormat === 'webtoon' && !fmt.includes('webtoon') && !s.type?.includes('webtoon')) return false;
      }

      if (!cleanQuery) return true;

      const titleMatch = (s.title || '').toLowerCase().includes(cleanQuery);
      const authorMatch = (s.author || '').toLowerCase().includes(cleanQuery);
      const artistMatch = (s.artist || '').toLowerCase().includes(cleanQuery);
      const synopsisMatch = (s.synopsis || '').toLowerCase().includes(cleanQuery);
      const countryMatch = (s.country || '').toLowerCase().includes(cleanQuery);
      const genreMatch = (s.genres || []).some(g => g.toLowerCase().includes(cleanQuery));
      const tagsMatch = (s.tags || []).some(t => t.toLowerCase().includes(cleanQuery));
      const studioMatch = (s.studio || '').toLowerCase().includes(cleanQuery);

      return titleMatch || authorMatch || artistMatch || synopsisMatch || countryMatch || genreMatch || tagsMatch || studioMatch;
    });
  }, [series, query, selectedGenre, selectedFormat]);

  // Filter Articles matching search query
  const matchingArticles = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return articles.filter((a) => {
      if (a.status === 'draft') return false;

      if (!cleanQuery) return true;

      const titleMatch = (a.title || '').toLowerCase().includes(cleanQuery);
      const excerptMatch = (a.excerpt || '').toLowerCase().includes(cleanQuery);
      const contentMatch = (a.content || '').toLowerCase().includes(cleanQuery);
      const categoryMatch = (a.category || '').toLowerCase().includes(cleanQuery);
      const authorMatch = (a.author?.name || '').toLowerCase().includes(cleanQuery);
      const tagsMatch = (a.tags || []).some(t => t.toLowerCase().includes(cleanQuery));

      return titleMatch || excerptMatch || contentMatch || categoryMatch || authorMatch || tagsMatch;
    });
  }, [articles, query]);

  const totalResultsCount = matchingSeries.length + matchingArticles.length;
  const isQueryEmpty = query.trim().length === 0;

  // Available unique genres from series
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    series.forEach(s => (s.genres || []).forEach(g => set.add(g)));
    return ['Tous', ...Array.from(set)];
  }, [series]);

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre('Tous');
    setSelectedFormat('Tous');
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    searchInputRef.current?.focus();
  };

  return (
    <div id="search-page-container" className="min-h-screen bg-[#0e0f14] text-zinc-100 pb-20">
      
      {/* Top Header & Search Hero */}
      <section className="relative pt-8 pb-10 sm:pt-12 sm:pb-14 px-4 sm:px-6 lg:px-8 border-b border-zinc-800/80 bg-gradient-to-b from-[#161720] to-[#0e0f14]">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-4 self-start sm:self-center">
            <button 
              onClick={() => setViewMode('accueil')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Accueil
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[#ff5a50] font-semibold">Recherche globale</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 font-almodobar">
            Rechercher sur <span className="text-[#ff5a50]">OZI</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-8">
            Explorez l'univers des bandes dessinées africaines, webtoons, actualités et articles exclusifs.
          </p>

          {/* Prominent Search Input Bar */}
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff5a50] via-purple-600 to-amber-500 rounded-2xl opacity-40 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
            
            <div className="relative flex items-center w-full bg-[#14151c] border border-zinc-700/80 group-focus-within:border-[#ff5a50] rounded-2xl shadow-2xl transition-all">
              <div className="pl-4 sm:pl-5 pr-3 text-zinc-400">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 group-focus-within:text-[#ff5a50] transition-colors" />
              </div>
              
              <input
                ref={searchInputRef}
                id="search-main-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titre, créateur, genre, mot-clé, univers..."
                className="w-full py-4 sm:py-5 pr-12 bg-transparent text-white placeholder-zinc-500 text-base sm:text-lg font-medium focus:outline-none"
              />

              {query && (
                <button
                  id="search-clear-btn"
                  onClick={clearSearch}
                  aria-label="Effacer la recherche"
                  className="absolute right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Suggestions Pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 mr-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Populaire :
            </span>
            {POPULAR_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSuggestionClick(sug)}
                className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 hover:border-zinc-500 transition-all cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Filter Tabs & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              id="search-tab-all"
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-[#ff5a50] text-white shadow-lg shadow-[#ff5a50]/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tout</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {totalResultsCount}
              </span>
            </button>

            <button
              id="search-tab-oeuvres"
              onClick={() => setActiveCategory('oeuvres')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeCategory === 'oeuvres'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Œuvres</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                activeCategory === 'oeuvres' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {matchingSeries.length}
              </span>
            </button>

            <button
              id="search-tab-articles"
              onClick={() => setActiveCategory('articles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeCategory === 'articles'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Articles</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                activeCategory === 'articles' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {matchingArticles.length}
              </span>
            </button>
          </div>

          {/* Result Count Info */}
          <div className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5">
            {query.trim() ? (
              <>
                <span>Résultats pour</span>
                <span className="font-semibold text-white">"{query}"</span>
                <span>({totalResultsCount})</span>
              </>
            ) : (
              <span>Affichage de tous les contenus disponibles ({totalResultsCount})</span>
            )}
          </div>
        </div>

        {/* Secondary Filters (Genre & Format) for Oeuvres */}
        {(activeCategory === 'all' || activeCategory === 'oeuvres') && (
          <div className="py-4 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-zinc-800/60 mb-6">
            <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filtrer les œuvres :
            </span>

            {/* Genre filter dropdown or chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {allGenres.slice(0, 7).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedGenre === genre
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Format Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => setSelectedFormat(selectedFormat === 'film' ? 'Tous' : 'film')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selectedFormat === 'film'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Films
              </button>
              <button
                onClick={() => setSelectedFormat(selectedFormat === 'série' ? 'Tous' : 'série')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selectedFormat === 'série'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Séries
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SECTIONS */}

        {/* 1. Empty Results State */}
        {totalResultsCount === 0 && (
          <div className="py-16 sm:py-20 text-center flex flex-col items-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aucun résultat trouvé</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Nous n'avons trouvé aucun contenu correspondant à "{query}". Essayez avec un autre mot-clé ou réinitialisez les filtres.
            </p>
            <button
              onClick={clearSearch}
              className="px-5 py-2.5 rounded-xl bg-[#ff5a50] hover:bg-[#ff5a50]/90 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* 2. OEUVRES RESULTS GRID */}
        {(activeCategory === 'all' || activeCategory === 'oeuvres') && matchingSeries.length > 0 && (
          <section className="mb-14" aria-label="Résultats des œuvres">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar tracking-tight">
                  Œuvres & Webtoons
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-purple-400">
                  {matchingSeries.length}
                </span>
              </div>

              {activeCategory === 'all' && matchingSeries.length > 6 && (
                <button
                  onClick={() => setActiveCategory('oeuvres')}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Voir toutes ({matchingSeries.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {(activeCategory === 'all' ? matchingSeries.slice(0, 6) : matchingSeries).map((s) => (
                <div
                  key={s.id}
                  id={`search-series-${s.id}`}
                  onClick={() => openOeuvrePage(s.slug || s.id)}
                  className="group flex flex-col items-center cursor-pointer select-none"
                >
                  {/* Poster Card */}
                  <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-md group-hover:shadow-2xl group-hover:border-purple-500/50 group-hover:scale-[1.03] transition-all duration-300 ease-out">
                    <img
                      src={s.coverUrl}
                      alt={s.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Top-Right Rating Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-amber-400 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{s.rating ? s.rating.toFixed(1) : '4.8'}</span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <span>Fiche complète</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata below poster */}
                  <div className="w-full mt-2.5 text-center px-1">
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                      {s.genres && s.genres.length > 0 ? s.genres.join(' • ') : (s.author || 'OZI Studio')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-zinc-500 font-medium">
                      <span>{s.chaptersCount || s.chapters?.length || 0} ch.</span>
                      {s.country && (
                        <>
                          <span>•</span>
                          <span>{s.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. ARTICLES RESULTS LIST / GRID */}
        {(activeCategory === 'all' || activeCategory === 'articles') && matchingArticles.length > 0 && (
          <section className="mb-14" aria-label="Résultats des articles">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar tracking-tight">
                  Articles & Actualités
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-400">
                  {matchingArticles.length}
                </span>
              </div>

              {activeCategory === 'all' && matchingArticles.length > 4 && (
                <button
                  onClick={() => setActiveCategory('articles')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Voir tous ({matchingArticles.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {(activeCategory === 'all' ? matchingArticles.slice(0, 6) : matchingArticles).map((article) => (
                <article
                  key={article.id}
                  id={`search-article-${article.id}`}
                  onClick={() => openArticlePage(article.slug || article.id)}
                  className="group flex flex-col bg-[#14151c] border border-zinc-800/80 hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  {/* Article Thumbnail */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={article.coverUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Category pill */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold">
                      {article.category || 'Actualité'}
                    </div>

                    {article.readTime && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-zinc-300 text-[11px] font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Article Content Preview */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Meta info */}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-500" />
                          {article.author?.name || 'Rédaction OZI'}
                        </span>
                        <span>•</span>
                        <span>{article.publishedAt || 'Récemment'}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">
                        {article.excerpt || article.content?.slice(0, 120)}
                      </p>
                    </div>

                    {/* Read more CTA */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                      <span>Lire l'article</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
