import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ExternalLink, Instagram, Palette, Twitter, Youtube } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { formatPriceXofWithEur } from '../../utils/currency';

function sanitizeExternalUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export const HomeArtistsSection: React.FC = () => {
  const { artists, artbooks, openArtistPage, openArtbookPage, setViewMode } = useData();
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (artists.length > 0 && !artists.some((a) => a.id === selectedArtistId)) {
      setSelectedArtistId(artists[0].id);
    }
  }, [artists, selectedArtistId]);

  const activeArtist = useMemo(() => {
    if (!artists || artists.length === 0) return null;
    return artists.find((a) => a.id === selectedArtistId) || artists[0];
  }, [artists, selectedArtistId]);

  const artistArtbooks = useMemo(() => {
    if (!activeArtist || !artbooks) return [];
    const targetName = activeArtist.name.trim().toLowerCase();
    return artbooks.filter(
      (ab) =>
        ab.artistId === activeArtist.id ||
        (ab.artistName && ab.artistName.trim().toLowerCase() === targetName)
    );
  }, [activeArtist, artbooks]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  if (!activeArtist) {
    return (
      <section
        id="section-discover-artists"
        aria-label="Découvrir l'artiste"
        className="relative py-14 sm:py-20 bg-[#0b0c12] border-b border-zinc-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-zinc-800/70">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-almodobar text-balance">
                Découvrir l&apos;artiste
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-2 font-body max-w-xl">
                Les profils des artistes et créateurs enregistrés sur OZI apparaîtront ici dès leur publication.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('artistes')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>Espace Artistes</span>
              <ArrowRight className="w-4 h-4 text-[#ff8679]" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  const resolvedPhotoUrl = failedImages[activeArtist.id]
    ? ''
    : normalizeImageUrl(activeArtist.photoUrl || activeArtist.bannerAvatarUrl || '', '');

  const socialLinks = [
    {
      key: 'instagram',
      label: 'Instagram',
      url: sanitizeExternalUrl(activeArtist.socials?.instagram),
      icon: Instagram,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      url: sanitizeExternalUrl(activeArtist.socials?.youtube),
      icon: Youtube,
    },
    {
      key: 'twitter',
      label: 'X / Twitter',
      url: sanitizeExternalUrl(activeArtist.socials?.twitter),
      icon: Twitter,
    },
    {
      key: 'artstation',
      label: 'ArtStation',
      url: sanitizeExternalUrl(activeArtist.socials?.artstation),
      icon: ExternalLink,
    },
  ].filter((item) => Boolean(item.url));

  const metadataParts: string[] = [];
  if (activeArtist.country) metadataParts.push(activeArtist.country);
  if (activeArtist.specialties && activeArtist.specialties.length > 0) {
    metadataParts.push(...activeArtist.specialties.slice(0, 3));
  }
  if (artistArtbooks.length > 0) {
    metadataParts.push(
      `${artistArtbooks.length} artbook${artistArtbooks.length > 1 ? 's' : ''}`
    );
  }

  return (
    <section
      id="section-discover-artists"
      aria-label="Découvrir l'artiste enregistré sur le site"
      className="relative py-14 sm:py-20 lg:py-24 bg-[#0b0c12] border-b border-zinc-800/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-10 border-b border-zinc-800/80">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-almodobar text-balance">
              Découvrir <span className="text-ozi-gradient">l&apos;artiste</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-2 font-body max-w-2xl">
              Rencontrez {artists.length > 1 ? 'les créateurs enregistrés' : "l'artiste enregistré"} sur OZI et explorez son univers, ses planches et ses artbooks.
            </p>
          </div>

          {artists.length > 1 && (
            <button
              type="button"
              onClick={() => setViewMode('artistes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>Tous les artistes ({artists.length})</span>
              <ArrowRight className="w-4 h-4 text-[#ff8679]" />
            </button>
          )}
        </div>

        {/* Two-Column Editorial Artist Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Portrait Visual Column */}
          <div className="lg:col-span-5 flex">
            <button
              type="button"
              onClick={() => openArtistPage(activeArtist.slug || activeArtist.id)}
              aria-label={`Ouvrir le profil de ${activeArtist.name}`}
              className="group relative w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:min-h-[440px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/90 hover:border-[#ff8679]/50 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8679]"
            >
              {resolvedPhotoUrl ? (
                <img
                  src={resolvedPhotoUrl}
                  alt={activeArtist.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => handleImageError(activeArtist.id)}
                  className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full min-h-[340px] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 via-[#151621] to-zinc-950 p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl font-black text-[#ff8679] font-almodobar">
                    {activeArtist.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-body">
                    <Palette className="w-4 h-4 text-[#ff8679]" />
                    <span>{activeArtist.name}</span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Artist Details & Actions Column */}
          <div className="lg:col-span-7 flex flex-col justify-between py-1">
            <div>
              {/* Quiet Unboxed Metadata */}
              {metadataParts.length > 0 && (
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-400 font-body mb-3 tabular-nums">
                  {metadataParts.map((part, idx) => (
                    <React.Fragment key={`${part}-${idx}`}>
                      {idx > 0 && (
                        <span aria-hidden="true" className="text-zinc-600">
                          ·
                        </span>
                      )}
                      <span>{part}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.1] font-almodobar text-balance">
                {activeArtist.name}
              </h3>

              {activeArtist.featuredSeriesTitle && (
                <p className="mt-2.5 text-sm font-semibold text-[#ffa296] font-body">
                  Œuvre phare · {activeArtist.featuredSeriesTitle}
                </p>
              )}

              <p className="mt-5 text-sm sm:text-base text-zinc-300 leading-relaxed font-body max-w-2xl whitespace-pre-line line-clamp-6">
                {activeArtist.bio ||
                  `Découvrez l'univers graphique, les créations et les artbooks officiels de ${activeArtist.name} sur OZI.`}
              </p>

              {/* Related Artbooks Preview Strip (if artist has published artbooks) */}
              {artistArtbooks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-xs font-bold text-zinc-400 font-body">
                      Artbooks &amp; Éditions disponibles
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-500">
                      {artistArtbooks.length} titre{artistArtbooks.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {artistArtbooks.slice(0, 3).map((ab) => {
                      const isFree = Boolean(ab.isFree || !ab.price || ab.price === 0);
                      const coverUrl = failedImages[`ab-${ab.id}`]
                        ? ''
                        : normalizeImageUrl(ab.coverUrl, '');

                      return (
                        <button
                          key={ab.id}
                          type="button"
                          onClick={() => openArtbookPage(ab.slug || ab.id)}
                          className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#11121a] hover:bg-[#171824] border border-zinc-800/80 hover:border-zinc-700 transition-colors text-left cursor-pointer"
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0 flex items-center justify-center">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={ab.title}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={() => handleImageError(`ab-${ab.id}`)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <BookOpen className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ff8679] transition-colors">
                              {ab.title}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 tabular-nums font-body truncate">
                              {isFree ? 'Gratuit' : formatPriceXofWithEur(ab.price)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA & Social Links */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
              <button
                id="discover-artist-cta-btn"
                type="button"
                onClick={() => openArtistPage(activeArtist.slug || activeArtist.id)}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[46px] rounded-2xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-sm sm:text-base shadow-xl glow-ozi hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 font-almodobar"
              >
                <span>Découvrir {activeArtist.name}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.key}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} de ${activeArtist.name}`}
                        title={social.label}
                        className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff8679]/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Multi-Artist Selector (shown when more than 1 artist is registered) */}
        {artists.length > 1 && (
          <div
            className="mt-10 pt-6 border-t border-zinc-800/70 flex items-center gap-2.5 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Choisir un artiste à découvrir"
          >
            {artists.map((artist) => {
              const isSelected = artist.id === activeArtist.id;
              const thumbUrl = failedImages[`thumb-${artist.id}`]
                ? ''
                : normalizeImageUrl(artist.photoUrl || artist.bannerAvatarUrl || '', '');

              return (
                <button
                  key={artist.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedArtistId(artist.id)}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2 min-h-[44px] rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#1a1b26] border-[#ff8679]/60 text-white'
                      : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] font-black text-[#ff8679]">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(`thumb-${artist.id}`)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      artist.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span>{artist.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
