import React from 'react';
import { Article } from '../../types';
import { ArticleCard } from './ArticleCard';

interface AsymmetricArticleSectionProps {
  dominantArticle: Article;
  secondaryArticle: Article;
  onSelect?: (article: Article) => void;
  reverse?: boolean;
}

export const AsymmetricArticleSection: React.FC<AsymmetricArticleSectionProps> = ({
  dominantArticle,
  secondaryArticle,
  onSelect,
  reverse = false
}) => {
  return (
    <section aria-label="Sélection éditoriale" className="w-full">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 items-start">
        {/* Dominant Large Article (~2/3 width) */}
        <div className={reverse ? "col-span-2 order-2" : "col-span-2 order-1"}>
          <ArticleCard
            article={dominantArticle}
            onSelect={onSelect}
            aspectRatioClass="aspect-[4/5] sm:aspect-[3/4]"
            titleClassName="text-xs sm:text-base md:text-lg font-bold text-white"
          />
        </div>

        {/* Secondary Article (~1/3 width) */}
        <div className={reverse ? "col-span-1 order-1" : "col-span-1 order-2"}>
          <ArticleCard
            article={secondaryArticle}
            onSelect={onSelect}
            aspectRatioClass="aspect-square sm:aspect-[4/5]"
            titleClassName="text-[11px] sm:text-xs md:text-sm font-bold text-white"
          />
        </div>
      </div>
    </section>
  );
};
