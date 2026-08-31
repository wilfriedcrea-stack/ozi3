import React from 'react';
import { X, User, Sparkles, BookOpen, Globe, Award } from 'lucide-react';
import { Series } from '../../../types';

interface AuthorInfoModalProps {
  series: Series;
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorInfoModal: React.FC<AuthorInfoModalProps> = ({
  series,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="author-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-[#0f1017] border border-zinc-800 text-white p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#ff5a50]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre d'information"
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff5a50] to-orange-500 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg">
            <User className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 id="author-modal-title" className="text-lg font-black text-white font-almodobar">
              {series.author}
            </h3>
            <p className="text-xs text-orange-400 font-medium">
              Créateur & Auteur officiel
            </p>
          </div>
        </div>

        {/* Information Grid */}
        <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500" />
              Origine / Pays
            </span>
            <span className="font-semibold text-white">{series.country || 'International'}</span>
          </div>

          {series.artist && series.artist !== series.author && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-500" />
                Dessinateur / Illustrateur
              </span>
              <span className="font-semibold text-white">{series.artist}</span>
            </div>
          )}

          {series.studio && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-zinc-500" />
                Studio de production
              </span>
              <span className="font-semibold text-orange-400">{series.studio}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-500" />
              Œuvre certifiée OZI
            </span>
            <span className="font-semibold text-emerald-400">Catalogue Officiel</span>
          </div>
        </div>

        {/* Footer info note */}
        <p className="text-[11px] text-zinc-500 mt-4 text-center leading-relaxed">
          Toutes les œuvres de {series.author} publiées sur OZI sont protégées par les droits d'auteur de leurs créateurs et studios partenaires.
        </p>

        {/* Dismiss Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer border border-zinc-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
