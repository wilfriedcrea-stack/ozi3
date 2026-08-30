import React from 'react';
import { Article } from '../../types';
import { ArticleCard } from './ArticleCard';

interface ArticleGridProps {
  articles: Article[];
  onSelect?: (article: Article) => void;
}

export const ArticleGrid: React.FC<ArticleGridProps> = ({ articles, onSelect }) => {
  return (
    <section aria-label="Grille d'articles récents" className="w-full">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSelect={onSelect}
            aspectRatioClass="aspect-square"
            titleClassName="text-[11px] sm:text-xs md:text-sm font-bold text-white"
          />
        ))}
      </div>
    </section>
  );
};
