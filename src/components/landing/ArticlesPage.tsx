import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Article } from '../../types';
import { FeaturedArticle } from '../articles/FeaturedArticle';
import { ArticleCard } from '../articles/ArticleCard';
import { ArticleDetailModal } from '../articles/ArticleDetailModal';
import { ArticleSkeleton } from '../articles/ArticleSkeleton';
import { EmptyArticles } from '../articles/EmptyArticles';
import { ArticlePagination } from '../articles/ArticlePagination';

const ITEMS_PER_PAGE = 6;

export const ArticlesPage: React.FC = () => {
  const { articles } = useData();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const gridTopRef = useRef<HTMLDivElement | null>(null);

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
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;

      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }

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

  // 3. Total pages calculation and page clamping
  const totalPages = Math.max(1, Math.ceil(remainingArticles.length / ITEMS_PER_PAGE));

  // Reset page if filtered results decrease
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 4. Paginated slice of remaining articles for current page
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return remainingArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [remainingArticles, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Smooth scroll to top of articles grid
    if (gridTopRef.current) {
      const rect = gridTopRef.current.getBoundingClientRect();
      const offsetTop = window.pageYOffset + rect.top - 80;
      window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        <EmptyArticles onRefresh={() => setCurrentPage(1)} />
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
        
        {/* 1. Dynamic Featured Top Hero (Displayed on Page 1 or with subtle badge) */}
        {heroArticle && currentPage === 1 && (
          <section aria-label="Article à la une" className="w-full pb-4 sm:pb-6">
            <FeaturedArticle
              article={heroArticle}
              onSelect={(art) => setSelectedArticle(art)}
            />
          </section>
        )}

        {/* Scroll anchor for pagination transitions */}
        <div ref={gridTopRef} id="articles-grid-anchor" className="scroll-mt-20" />

        {/* 2. Dynamically Flowing Magazine Grid */}
        {paginatedArticles.length > 0 && (
          <section aria-label="Tous les articles récents" className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4 items-start">
              {paginatedArticles.map((article, index) => {
                // Editorial rhythm: wide 2-column card for visual interest
                const isWideOnDesktop = index % 5 === 2;

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

        {/* 3. Numbered Page Pagination */}
        {totalPages > 1 && (
          <ArticlePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalArticles={remainingArticles.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
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
