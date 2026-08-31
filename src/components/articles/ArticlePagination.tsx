import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ArticlePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalArticles?: number;
  itemsPerPage?: number;
}

export const ArticlePagination: React.FC<ArticlePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalArticles,
  itemsPerPage = 6
}) => {
  if (totalPages <= 1) return null;

  // Generate page numbers with smart ellipsis for larger sets
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalArticles ? Math.min(currentPage * itemsPerPage, totalArticles) : currentPage * itemsPerPage;

  return (
    <nav
      id="articles-pagination-nav"
      aria-label="Pagination des articles"
      className="mt-10 sm:mt-14 mb-4 flex flex-col items-center justify-center gap-3.5 select-none"
    >
      {/* Numbered Controls Row */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
        {/* First Page (if totalPages > 4) */}
        {totalPages > 4 && (
          <button
            id="pagination-first-btn"
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            aria-label="Première page"
            title="Première page"
            className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page Button */}
        <button
          id="pagination-prev-btn"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 sm:gap-1.5 mx-1">
          {pages.map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-zinc-500 font-bold text-xs sm:text-sm select-none"
                >
                  •••
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={`page-${page}`}
                id={`pagination-page-${page}`}
                onClick={() => handlePageClick(page)}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#ff5a50] text-white shadow-md shadow-[#ff5a50]/20 scale-105 border border-[#ff5a50]'
                    : 'bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          id="pagination-next-btn"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page (if totalPages > 4) */}
        {totalPages > 4 && (
          <button
            id="pagination-last-btn"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Dernière page"
            title="Dernière page"
            className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Informative Subtitle */}
      {totalArticles && totalArticles > 0 && (
        <p className="text-[11px] sm:text-xs text-zinc-500 font-medium tracking-wide">
          Articles {startItem} à {endItem} sur {totalArticles} • Page {currentPage} sur {totalPages}
        </p>
      )}
    </nav>
  );
};
