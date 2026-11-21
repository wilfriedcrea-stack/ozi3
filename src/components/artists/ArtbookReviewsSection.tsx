import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  Heart,
  Send,
  CheckCircle2,
  Trash2,
  User,
  Loader2,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ArtbookReview } from '../../types';
import {
  subscribeToArtbookReviews,
  submitArtbookReview,
  toggleArtbookReviewLike,
  deleteArtbookReview
} from '../../services/artbookReviewService';

interface ArtbookReviewsSectionProps {
  artbookId: string;
  artbookTitle: string;
  onStatsChange?: (stats: { averageRating: number | null; ratedCount: number; totalCount: number }) => void;
}

const STAR_LABELS: Record<number, string> = {
  0: 'Aucune étoile (commentaire uniquement)',
  1: '1/5 — Décevant',
  2: '2/5 — Moyen',
  3: '3/5 — Bien',
  4: '4/5 — Très bon',
  5: '5/5 — Chef-d’œuvre',
};

export const ArtbookReviewsSection: React.FC<ArtbookReviewsSectionProps> = ({
  artbookId,
  artbookTitle,
  onStatsChange
}) => {
  const { currentUser, readerProfile, adminAuth, openAuthModal } = useData();

  const [reviews, setReviews] = useState<ArtbookReview[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'rated' | '5' | '4plus'>('all');

  // Form state (0 = aucune étoile attribuée, 1..5 = étoiles sur 5)
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToArtbookReviews(artbookId, (fetched) => {
      setReviews(fetched);
    });
    return () => unsubscribe();
  }, [artbookId]);

  const { averageRating, ratedCount, totalCount, fiveStarCount, fourPlusCount } = useMemo(() => {
    const rated = reviews.filter((r) => typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5);
    const sum = rated.reduce((acc, r) => acc + r.rating, 0);
    const avg = rated.length > 0 ? Math.round((sum / rated.length) * 10) / 10 : null;
    const five = rated.filter((r) => r.rating === 5).length;
    const fourPlus = rated.filter((r) => r.rating >= 4).length;

    return {
      averageRating: avg,
      ratedCount: rated.length,
      totalCount: reviews.length,
      fiveStarCount: five,
      fourPlusCount: fourPlus,
    };
  }, [reviews]);

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({ averageRating, ratedCount, totalCount });
    }
  }, [averageRating, ratedCount, totalCount, onStatsChange]);

  const filteredReviews = useMemo(() => {
    if (filterMode === 'rated') return reviews.filter((r) => r.rating >= 1);
    if (filterMode === '5') return reviews.filter((r) => r.rating === 5);
    if (filterMode === '4plus') return reviews.filter((r) => r.rating >= 4);
    return reviews;
  }, [reviews, filterMode]);

  const handleStarClick = (starValue: number) => {
    // Clicking the already-selected star resets to 0 (optional rating)
    setSelectedStars((prev) => (prev === starValue ? 0 : starValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (!commentText.trim()) {
      setErrorMessage('Veuillez écrire un commentaire avant de publier.');
      return;
    }

    setIsSubmitting(true);
    const res = await submitArtbookReview({
      artbookId,
      artbookTitle,
      userId: currentUser.uid,
      userName: readerProfile?.displayName || currentUser.displayName || 'Lecteur OZI',
      userAvatar: readerProfile?.photoURL || currentUser.photoURL || undefined,
      rating: selectedStars,
      commentText,
    });
    setIsSubmitting(false);

    if (res.success) {
      setCommentText('');
      setSelectedStars(0);
      setSuccessMessage('Votre avis a été publié avec succès.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Impossible de publier votre avis.');
    }
  };

  const handleLike = async (review: ArtbookReview) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    await toggleArtbookReviewLike(review, currentUser.uid);
  };

  const handleDelete = async (review: ArtbookReview) => {
    await deleteArtbookReview(review);
  };

  const displayStarValue = hoverStars !== null ? hoverStars : selectedStars;

  return (
    <section
      id="artbook-reviews"
      aria-label="Avis et notes des lecteurs sur l'artbook"
      className="mb-14 p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm"
    >
      {/* Header + Global 5/5 Rating Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#e14f41] uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Communauté OZI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 font-almodobar">
            Avis & Notes des Lecteurs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            Donnez votre avis sur cet artbook et attribuez une note en étoiles sur 5/5.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl shrink-0">
          <div className="text-center">
            <div className="text-3xl font-black text-zinc-950 tabular-nums leading-none">
              {averageRating !== null ? averageRating.toFixed(1) : '—'}
            </div>
            <span className="text-[11px] text-zinc-600 font-semibold mt-1 block tabular-nums">
              sur 5
            </span>
          </div>

          <div className="h-10 w-px bg-zinc-200" />

          <div>
            <div className="flex items-center gap-1" aria-label={averageRating ? `Note moyenne ${averageRating} sur 5` : 'Aucune note'}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    averageRating !== null && s <= Math.round(averageRating)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-zinc-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-600 mt-1 block tabular-nums">
              {totalCount} commentaire{totalCount > 1 ? 's' : ''} · {ratedCount} note{ratedCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Form: Give Star Rating (5/5) + Comment */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 p-5 sm:p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentUser ? (
              <img
                src={
                  readerProfile?.photoURL ||
                  currentUser.photoURL ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`
                }
                alt={readerProfile?.displayName || currentUser.displayName || 'Lecteur'}
                className="w-10 h-10 rounded-full border border-zinc-300 object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-zinc-950">
                {currentUser
                  ? readerProfile?.displayName || currentUser.displayName || 'Lecteur OZI'
                  : 'Laisser un commentaire'}
              </div>
              <div className="text-xs text-zinc-600">
                {currentUser
                  ? 'Choisissez votre note (optionnel) et rédigez votre avis'
                  : 'Connexion requise au moment de publier votre avis'}
              </div>
            </div>
          </div>

          {/* 5/5 Interactive Star Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-zinc-200">
            <span className="text-xs font-medium text-zinc-600 mr-1">Note :</span>
            <div className="flex items-center gap-0.5" role="group" aria-label="Note en étoiles sur 5">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= displayStarValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverStars(starValue)}
                    onMouseLeave={() => setHoverStars(null)}
                    onClick={() => handleStarClick(starValue)}
                    aria-label={`Attribuer ${starValue} étoile${starValue > 1 ? 's' : ''} sur 5`}
                    aria-pressed={selectedStars === starValue}
                    className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        isFilled ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-amber-700 tabular-nums ml-1">
              {displayStarValue > 0 ? `${displayStarValue}/5` : '0/5'}
            </span>

            {selectedStars > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStars(0)}
                className="ml-1 p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                title="Retirer la note"
                aria-label="Retirer la note en étoiles"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-zinc-600">
          {STAR_LABELS[displayStarValue]}
        </div>

        {/* Comment Input */}
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Partagez votre avis sur cet artbook (planches, couleurs, univers, mise en page)..."
            className="w-full p-4 rounded-xl bg-white border border-zinc-300 focus:border-black text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition-colors resize-y"
          />
          <span className="absolute bottom-2.5 right-3 text-[10px] text-zinc-500 font-mono tabular-nums">
            {commentText.length}/2000
          </span>
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-600 font-semibold">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {!currentUser ? (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-xs text-[#e14f41] hover:text-black underline cursor-pointer font-medium"
            >
              Se connecter / Créer un compte lecteur
            </button>
          ) : (
            <span className="text-xs text-zinc-600">
              {selectedStars > 0
                ? `Votre note (${selectedStars}/5) s'affichera au-dessus de votre commentaire.`
                : 'Vous pouvez commenter avec ou sans note en étoiles.'}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publication...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{currentUser ? 'Publier mon avis' : 'Se connecter pour publier'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pb-3 border-b border-zinc-200">
        <span className="text-xs font-semibold text-zinc-600 tabular-nums">
          {filteredReviews.length} commentaire{filteredReviews.length > 1 ? 's' : ''} affiché{filteredReviews.length > 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'all' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            Tous ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('rated')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === 'rated' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            Avec note ({ratedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('5')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === '5' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            5/5 ({fiveStarCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('4plus')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              filterMode === '4plus' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
            }`}
          >
            4+/5 ({fourPlusCount})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 text-sm">
            Aucun commentaire pour le moment. Soyez le premier à donner votre avis sur cet artbook !
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isLiked = currentUser ? (rev.likedBy || []).includes(currentUser.uid) : false;
            const canDelete =
              adminAuth?.isAuthenticated ||
              (currentUser && currentUser.uid === rev.userId);
            const hasRating = typeof rev.rating === 'number' && rev.rating >= 1;

            return (
              <article
                key={rev.id}
                className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 transition-colors hover:border-zinc-300"
              >
                {/* Author Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        rev.userAvatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.userId}`
                      }
                      alt={rev.userName}
                      className="w-9 h-9 rounded-full border border-zinc-300 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-zinc-950 truncate">
                        {rev.userName}
                      </div>
                      <time className="text-[11px] text-zinc-500 block">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(rev.createdAt))}
                      </time>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(rev)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Supprimer ce commentaire"
                      aria-label="Supprimer ce commentaire"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Note attribuée en étoiles AU-DESSUS du commentaire (si attribuée) */}
                {hasRating && (
                  <div
                    className="flex items-center gap-2 mt-3"
                    aria-label={`Note attribuée : ${rev.rating} sur 5`}
                  >
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-700 tabular-nums">
                      {rev.rating}/5
                    </span>
                  </div>
                )}

                {/* Commentaire */}
                <p className="mt-2.5 text-sm text-zinc-800 leading-relaxed whitespace-pre-line">
                  {rev.commentText}
                </p>

                {/* Like Action */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200/80">
                  <button
                    type="button"
                    onClick={() => handleLike(rev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      isLiked
                        ? 'bg-rose-50 text-rose-600 font-bold'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? 'fill-rose-600 text-rose-600' : ''
                      }`}
                    />
                    <span className="tabular-nums">{rev.likesCount || 0}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
