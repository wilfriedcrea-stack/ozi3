import React, { useEffect } from 'react';
import { X, Calendar, Clock, User, Share2, Sparkles, BookOpen } from 'lucide-react';
import { Article } from '../../types';
import { ArticleDate } from './ArticleDate';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose }) => {
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [article]);

  if (!article) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141418] rounded-xl shadow-2xl text-white border border-[#24242e] p-5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer l'article"
          className="absolute top-4 right-4 p-2 rounded-full bg-[#202028] hover:bg-[#2c2c38] text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden mb-5 bg-[#1a1a22]">
          <img
            src={article.image}
            alt={article.alt || article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Category & Date */}
        <div className="flex items-center gap-3 mb-2">
          {article.category && (
            <span className="text-[11px] font-bold text-[#ff5a50] bg-[#ff5a50]/10 border border-[#ff5a50]/30 px-2 py-0.5 rounded uppercase tracking-wider">
              {article.category}
            </span>
          )}
          <ArticleDate date={article.publishedAt} />
          {article.readTime && (
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              {article.readTime}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 id="article-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-3">
          {article.title}
        </h2>

        {/* Author */}
        {article.author && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-5 pb-3 border-b border-[#24242e]">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span>Par <strong className="text-zinc-200 font-semibold">{article.author}</strong></span>
          </div>
        )}

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed mb-4 italic bg-[#1c1c24] p-3.5 rounded-lg border-l-3 border-[#ff5a50]">
            {article.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="text-sm sm:text-base text-zinc-300 leading-relaxed space-y-4 whitespace-pre-line font-body">
          {article.content || article.excerpt || "Contenu détaillé de l'article."}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-[#24242e] flex items-center justify-between">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-300 bg-[#202028] hover:bg-[#2c2c38] rounded-md transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            Partager l'article
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#ff5a50] hover:bg-[#ff4538] text-white text-xs font-bold rounded-md transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
