import React from 'react';
import { Article } from '../../types';
import { ArticleDate } from './ArticleDate';
import { ImageFallback } from './ImageFallback';

interface FeaturedArticleProps {
  article: Article;
  onSelect?: (article: Article) => void;
}

export const FeaturedArticle: React.FC<FeaturedArticleProps> = ({ article, onSelect }) => {
  return (
    <article
      id={`featured-article-${article.id}`}
      onClick={() => onSelect?.(article)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(article);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Article vedette : ${article.title}`}
      className="group cursor-pointer select-none flex flex-col w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-sm"
    >
      {/* Wide Horizontal Banner Image */}
      <ImageFallback
        src={article.image}
        alt={article.alt || article.title}
        aspectRatioClass="aspect-[16/9] sm:aspect-[16/8] w-full"
        priority={true}
      />

      {/* Title and Date directly below image */}
      <div className="mt-2 sm:mt-2.5 flex flex-col gap-0.5 sm:gap-1">
        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug group-hover:text-zinc-300 transition-colors duration-200">
          {article.title}
        </h2>
        <ArticleDate date={article.publishedAt} />
      </div>
    </article>
  );
};
