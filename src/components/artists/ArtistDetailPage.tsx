import React, { useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Globe, 
  ExternalLink, 
  Instagram, 
  Twitter, 
  Youtube,
  Palette, 
  Download, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import { Artist, Artbook } from '../../types';
import { useData } from '../../context/DataContext';

export const ArtistDetailPage: React.FC = () => {
  const { 
    artists, 
    artbooks, 
    selectedArtistId, 
    openArtbookPage, 
    setViewMode 
  } = useData();

  // Find target artist
  const currentArtist = useMemo(() => {
    if (!artists || artists.length === 0) return null;
    if (!selectedArtistId) return artists[0];
    return artists.find(a => a.id === selectedArtistId || a.slug === selectedArtistId) || artists[0];
  }, [artists, selectedArtistId]);

  // Find artbooks by this artist
  const artistArtbooks = useMemo(() => {
    if (!currentArtist || !artbooks) return [];
    return artbooks.filter(
      a => a.artistId === currentArtist.id || a.artistName.toLowerCase() === currentArtist.name.toLowerCase()
    );
  }, [currentArtist, artbooks]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentArtist?.id]);

  if (!currentArtist) {
    return (
      <div className="min-h-[70vh] bg-[#06070a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-3 font-almodobar">Artiste introuvable</h2>
        <p className="text-zinc-400 mb-6 max-w-md">L'artiste demandé n'existe pas ou a été déplacé.</p>
        <button
          onClick={() => setViewMode('artistes')}
          className="px-6 py-2.5 rounded-xl bg-[#ff8679] text-white font-bold hover:bg-[#eb6e60] transition-colors"
        >
          Retour aux artistes
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 bg-[#06070a] min-h-screen text-white relative">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#ff8679]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back Link */}
        <div className="mb-8">
          <button
            onClick={() => setViewMode('artistes')}
            className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 hover:text-[#ff8679] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à la galerie des Artistes</span>
          </button>
        </div>

        {/* ARTIST HERO PROFILE CARD */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#0f1019] border border-zinc-800/90 shadow-2xl mb-12 relative overflow-hidden">
          
          {/* Subtle banner watermark if available */}
          {currentArtist.bannerUrl && (
            <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none">
              <img src={currentArtist.bannerUrl} alt="" className="w-full h-full object-cover filter blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1019] via-[#0f1019]/70 to-transparent" />
            </div>
          )}

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
            
            {/* Artist Profile Photo */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#ff8679] via-[#fb923c] to-purple-600 shadow-2xl shadow-[#ff8679]/20">
                <img 
                  src={currentArtist.photoUrl} 
                  alt={currentArtist.name} 
                  className="w-full h-full object-cover rounded-full bg-zinc-900" 
                />
              </div>
              <div className="absolute bottom-1 right-1 p-2 rounded-full bg-emerald-500 text-white shadow-lg border-2 border-[#0f1019]" title="Artiste Certifié OZI">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info & Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ff8679] font-heading flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Artiste & Créateur OZI</span>
                </span>
                {currentArtist.country && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-zinc-400" />
                    <span>{currentArtist.country}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-almodobar mb-3">
                {currentArtist.name}
              </h1>

              {/* Bio */}
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-5 max-w-2xl font-body">
                {currentArtist.bio}
              </p>

              {/* Specialties / Tags */}
              {currentArtist.specialties && currentArtist.specialties.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-5">
                  {currentArtist.specialties.map(spec => (
                    <span 
                      key={spec}
                      className="text-xs px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links & Featured series */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                {currentArtist.featuredSeriesTitle && (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <BookOpen className="w-3.5 h-3.5 text-[#ff8679]" />
                    <span>Univers phare : <strong className="text-white">{currentArtist.featuredSeriesTitle}</strong></span>
                  </div>
                )}

                {currentArtist.socials?.youtube && (
                  <a 
                    href={currentArtist.socials.youtube} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm group"
                    title="Chaîne YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span>YouTube</span>
                  </a>
                )}

                {currentArtist.socials?.instagram && (
                  <a 
                    href={currentArtist.socials.instagram} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm group"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
                    <span>Instagram</span>
                  </a>
                )}

                {currentArtist.socials?.twitter && (
                  <a 
                    href={currentArtist.socials.twitter} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm group"
                  >
                    <Twitter className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>X / Twitter</span>
                  </a>
                )}

                {currentArtist.socials?.artstation && (
                  <a 
                    href={currentArtist.socials.artstation} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>Artstation</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ARTBOOKS SECTION */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#ff8679] uppercase tracking-wider font-heading mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publications & Recueils</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar">
                Artbooks de {currentArtist.name} ({artistArtbooks.length})
              </h2>
            </div>
          </div>

          {artistArtbooks.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-12 rounded-3xl bg-[#10111a] border border-zinc-800/80 text-center flex flex-col items-center">
              <BookOpen className="w-12 h-12 text-zinc-600 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Aucun artbook disponible</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-4">
                Cet artiste prépare actuellement de nouveaux recueils d'art et carnets de croquis.
              </p>
            </div>
          ) : (
            /* ARTBOOKS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {artistArtbooks.map(artbook => {
                return (
                  <div
                    key={artbook.id}
                    onClick={() => openArtbookPage(artbook.id)}
                    className="group rounded-3xl bg-[#12131d] border border-zinc-800/90 hover:border-[#ff8679]/60 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
                  >
                    {/* Cover Image Container */}
                    <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
                      <img 
                        src={artbook.coverUrl} 
                        alt={artbook.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Price / Free Badge */}
                      <div className="absolute top-3 right-3">
                        {artbook.isFree ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg">
                            Gratuit
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff8679] to-[#fb923c] text-white font-black text-xs uppercase tracking-wider shadow-lg">
                            {artbook.price.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>

                      {/* 5 Preview Images indicator pill */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[11px] font-semibold text-zinc-300 border border-white/10 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#ff8679]" />
                        <span>5 Aperçus HD</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ff8679] transition-colors font-almodobar mb-2 line-clamp-2">
                          {artbook.title}
                        </h3>

                        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                          {artbook.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                        <span>{artbook.pageCount} pages</span>
                        <span className="font-semibold text-white group-hover:text-[#ff8679] transition-colors flex items-center gap-1">
                          <span>Consulter</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
