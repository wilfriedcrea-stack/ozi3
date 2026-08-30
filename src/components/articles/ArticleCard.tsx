import React from 'react';
import { Article } from '../../types';
import { ArticleDate } from './ArticleDate';
import { ImageFallback } from './ImageFallback';

interface ArticleCardProps {
  article: Article;
  onSelect?: (article: Article) => void;
  aspectRatioClass?: string;
  titleClassName?: string;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelect,
  aspectRatioClass = 'aspect-[4/3]',
  titleClassName = 'text-xs sm:text-sm font-bold text-white',
  className = ''
}) => {
  return (
    <article
      id={`article-card-${article.id}`}
      onClick={() => onSelect?.(article)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(article);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={article.title}
      className={`group cursor-pointer select-none flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-sm ${className}`}
    >
      {/* Cover Image */}
      <ImageFallback
        src={article.image}
        alt={article.alt || article.title}
        aspectRatioClass={aspectRatioClass}
      />

      {/* Content Meta below image */}
      <div className="mt-1 sm:mt-1.5 flex flex-col gap-0.5 sm:gap-1">
        <h3 className={`${titleClassName} leading-snug line-clamp-2 group-hover:text-zinc-300 transition-colors duration-200`}>
          {article.title}
        </h3>
        <ArticleDate date={article.publishedAt} />
      </div>
    </article>
  );
};
