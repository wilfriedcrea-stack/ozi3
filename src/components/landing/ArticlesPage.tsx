import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Article } from '../../types';
import { FeaturedArticle } from '../articles/FeaturedArticle';
import { ArticleCard } from '../articles/ArticleCard';
import { ArticleDetailModal } from '../articles/ArticleDetailModal';
import { ArticleSkeleton } from '../articles/ArticleSkeleton';
import { EmptyArticles } from '../articles/EmptyArticles';
import { ChevronDown, Sparkles } from 'lucide-react';

const INITIAL_PAGE_SIZE = 12;
const PAGE_INCREMENT = 9;

export const ArticlesPage: React.FC = () => {
  const { articles } = useData();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // 1. Filter only published articles and sort by publishedAt descending
  const sortedArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];

    // Filter published articles (defaulting to true if not defined)
    const valid = articles.filter(a => a.published !== false);

    // Sort descending by date
    return [...valid].sort((a, b) => {
      // Check for custom priority or featured flag first if same date
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }

      // Fallback comparison for strings like "01 JANVIER 2026" or ids
      return b.id.localeCompare(a.id);
    });
  }, [articles]);

  // 2. Extract single hero article and remaining grid articles
  const { heroArticle, remainingArticles } = useMemo(() => {
    if (sortedArticles.length === 0) {
      return { heroArticle: null, remainingArticles: [] };
    }

    // Identify hero article: explicitly featured or first available item
    const heroIndex = sortedArticles.findIndex(a => a.featured);
    const hero = heroIndex !== -1 ? sortedArticles[heroIndex] : sortedArticles[0];

    // Never duplicate the hero in the grid
    const remaining = sortedArticles.filter(a => a.id !== hero.id);

    return { heroArticle: hero, remainingArticles: remaining };
  }, [sortedArticles]);

  // 3. Paginated slice of remaining articles
  const paginatedArticles = useMemo(() => {
    return remainingArticles.slice(0, visibleCount);
  }, [remainingArticles, visibleCount]);

  const hasMore = remainingArticles.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_INCREMENT);
  };

  if (isLoading) {
    return (
      <main id="articles-page" className="min-h-screen bg-[#0e0e12] text-white pt-4 pb-20">
        <ArticleSkeleton />
      </main>
    );
  }

  if (!heroArticle && remainingArticles.length === 0) {
    return (
      <main id="articles-page" className="min-h-screen bg-[#0e0e12] text-white pt-4 pb-20">
        <EmptyArticles onRefresh={() => setVisibleCount(INITIAL_PAGE_SIZE)} />
      </main>
    );
  }

  return (
    <main 
      id="articles-page" 
      className="min-h-screen bg-[#0e0e12] text-white pt-3 sm:pt-5 pb-20 transition-colors duration-200"
    >
      {/* Centered Editorial Container with responsive margins */}
      <div className="w-full max-w-[860px] mx-auto px-2.5 sm:px-4 md:px-6">
        
        {/* 1. Dynamic Featured Top Hero (No duplication in grid) */}
        {heroArticle && (
          <section aria-label="Article à la une" className="w-full pb-4 sm:pb-6">
            <FeaturedArticle
              article={heroArticle}
              onSelect={(art) => setSelectedArticle(art)}
            />
          </section>
        )}

        {/* 2. Dynamically Flowing Magazine Grid */}
        {paginatedArticles.length > 0 && (
          <section aria-label="Tous les articles récents" className="w-full">
            {/* 
              Responsive CSS Grid:
              - Mobile: 2 columns (grid-cols-2)
              - Tablet / Desktop: 3 columns (sm:grid-cols-3)
              - Rhythm: every 7th item takes col-span-2 on desktop, col-span-1 on mobile
            */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4 items-start">
              {paginatedArticles.map((article, index) => {
                // Editorial rhythm: inject a wide 2-column card every 7th item (e.g. index 4, 11, etc.) on desktop
                const isWideOnDesktop = index % 7 === 4;

                return (
                  <div
                    key={article.id}
                    className={`w-full ${
                      isWideOnDesktop 
                        ? 'col-span-1 sm:col-span-2' 
                        : 'col-span-1'
                    }`}
                  >
                    <ArticleCard
                      article={article}
                      onSelect={(art) => setSelectedArticle(art)}
                      aspectRatioClass={
                        isWideOnDesktop 
                          ? 'aspect-[4/3] sm:aspect-[16/10]' 
                          : 'aspect-[4/3]'
                      }
                      titleClassName={
                        isWideOnDesktop
                          ? 'text-xs sm:text-base font-bold text-white'
                          : 'text-[11px] sm:text-xs md:text-sm font-bold text-white'
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. Pagination / "Charger plus d'articles" */}
        {hasMore && (
          <div className="mt-10 sm:mt-12 text-center flex flex-col items-center justify-center">
            <button
              id="load-more-articles-btn"
              onClick={handleLoadMore}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-[#ff5a50] transition-transform group-hover:rotate-12" />
              <span>Afficher plus d'articles</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-bold border border-zinc-700">
                +{remainingArticles.length - visibleCount}
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

      </div>

      {/* Reader Modal for full article reading */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </main>
  );
};

export default ArticlesPage;
