import React from 'react';
import { Newspaper, Sparkles } from 'lucide-react';

interface EmptyArticlesProps {
  onRefresh?: () => void;
}

export const EmptyArticles: React.FC<EmptyArticlesProps> = ({ onRefresh }) => {
  return (
    <div className="w-full max-w-[860px] mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-xl">
        <Newspaper className="w-8 h-8 text-[#ff5a50]" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Aucun article pour le moment
      </h3>
      <p className="text-sm text-zinc-400 mt-2 max-w-md leading-relaxed">
        Les actualités, interviews d'artistes et chroniques éditoriales seront publiées très prochainement sur OZI.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff5a50]" />
          <span>Actualiser les articles</span>
        </button>
      )}
    </div>
  );
};
