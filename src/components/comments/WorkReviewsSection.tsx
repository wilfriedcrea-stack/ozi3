import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  Heart, 
  Flag, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Filter,
  User,
  ThumbsUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ChapterReview } from '../../types';
import { 
  subscribeToReviews, 
  submitReaderReview, 
  toggleReviewLike, 
  reportReviewToAdmin 
} from '../../services/reviewService';

interface WorkReviewsSectionProps {
  seriesId: string;
  seriesTitle?: string;
  chapterId?: string;
  chapterNumber?: number;
  className?: string;
}

export const WorkReviewsSection: React.FC<WorkReviewsSectionProps> = ({
  seriesId,
  seriesTitle,
  chapterId,
  chapterNumber,
  className = ''
}) => {
  const { currentUser, readerProfile, openAuthModal } = useData();

  const [reviews, setReviews] = useState<ChapterReview[]>([]);
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | 'recent'>('all');
  
  // New review form state
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reporting state
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'inappropriate' | 'spoiler' | 'hate_speech'>('inappropriate');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Subscribe in real-time
  useEffect(() => {
    const unsubscribe = subscribeToReviews(seriesId, chapterId, (fetched) => {
      setReviews(fetched);
    });
    return () => unsubscribe();
  }, [seriesId, chapterId]);

  // Compute average rating and count
  const { averageRating, totalCount, ratingDistribution } = useMemo(() => {
    if (reviews.length === 0) {
      return { averageRating: 5.0, totalCount: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const val = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      dist[val] = (dist[val] || 0) + 1;
    }

    return { averageRating: avg, totalCount: reviews.length, ratingDistribution: dist };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (filterRating === 'all') return reviews;
    if (filterRating === '5') return reviews.filter((r) => r.rating === 5);
    if (filterRating === '4') return reviews.filter((r) => r.rating >= 4);
    if (filterRating === 'recent') {
      return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return reviews;
  }, [reviews, filterRating]);

  // Handle post review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (!commentText.trim()) {
      setErrorMessage('Veuillez écrire un commentaire avant de publier.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitReaderReview({
      seriesId,
      seriesTitle,
      chapterId,
      chapterNumber,
      uid: currentUser.uid,
      userName: readerProfile?.displayName || currentUser.displayName || 'Lecteur OZI',
      userAvatar: readerProfile?.photoURL || currentUser.photoURL || undefined,
      userEmail: currentUser.email || undefined,
      rating: selectedStars,
      commentText
    });

    setIsSubmitting(false);

    if (res.success) {
      setCommentText('');
      setSelectedStars(5);
      setSuccessMessage('🎉 Votre avis a été publié avec succès !');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Erreur lors de la publication.');
    }
  };

  // Handle like review
  const handleLike = async (review: ChapterReview) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    await toggleReviewLike(review.id, currentUser.uid);
  };

  // Handle report
  const handleConfirmReport = async () => {
    if (!reportingReviewId) return;
    const rev = reviews.find((r) => r.id === reportingReviewId);
    if (rev) {
      await reportReviewToAdmin({
        review: rev,
        reason: reportReason,
        reporterEmail: currentUser?.email || undefined
      });
      setReportSuccess('Signalement envoyé aux modérateurs.');
      setReportingReviewId(null);
      setTimeout(() => setReportSuccess(null), 3000);
    }
  };

  const starLabels = ['', 'Décevant', 'Moyen', 'Bien', 'Très bon', 'Chef-d’œuvre'];

  return (
    <section 
      aria-label="Avis et commentaires des lecteurs"
      className={`w-full bg-[#0d0d14] border border-[#202030] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Stats Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#202030]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-heading">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Communauté & Lecteurs OZI</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
            Avis & Évaluations {chapterNumber ? `— Chapitre ${chapterNumber}` : ''}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-body">
            Partagez vos impressions et échangez avec les passionnés et créateurs de cette œuvre.
          </p>
        </div>

        {/* Global Rating Score */}
        <div className="flex items-center gap-4 bg-[#141420] border border-[#26263a] px-5 py-3.5 rounded-2xl shrink-0">
          <div className="text-center">
            <div className="text-3xl font-black text-amber-400 font-heading leading-none">
              {averageRating.toFixed(1)}
            </div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1 block">
              sur 5
            </span>
          </div>

          <div className="h-10 w-[1px] bg-zinc-800" />

          <div>
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-400 font-medium mt-1 block">
              {totalCount} avis certifié{totalCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Success / Report Notice */}
      {successMessage && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {reportSuccess && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* Post Review Box */}
      <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#141422] border border-[#26263a]">
        {currentUser ? (
          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={readerProfile?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                  alt={currentUser.displayName || 'Avatar'}
                  className="w-10 h-10 rounded-full border border-amber-500/40 object-cover"
                />
                <div>
                  <span className="text-sm font-bold text-white block">
                    {readerProfile?.displayName || currentUser.displayName || 'Lecteur OZI'}
                  </span>
                  <span className="text-xs text-zinc-400">Votre évaluation :</span>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div className="flex items-center gap-1.5 bg-[#1a1a2b] px-3 py-1.5 rounded-xl border border-zinc-800">
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = hoverStars ? s <= hoverStars : s <= selectedStars;
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(null)}
                      onClick={() => setSelectedStars(s)}
                      className="p-1 text-zinc-600 hover:scale-125 transition-transform cursor-pointer"
                      title={starLabels[s]}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          active ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-amber-400 ml-1.5 w-24">
                  {starLabels[hoverStars || selectedStars]}
                </span>
              </div>
            </div>

            {/* Comment Text Input */}
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Rédigez votre avis sur cette œuvre... Que pensez-vous du scénario, du dessin et de l'émotion transmise ?"
                className="w-full p-4 rounded-xl bg-[#0d0d17] border border-[#2b2b40] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none font-body"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-zinc-500 font-mono">
                {commentText.length}/2000
              </span>
            </div>

            {errorMessage && (
              <span className="text-xs text-rose-400 font-bold">{errorMessage}</span>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40 font-heading"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publication...' : 'Publier mon avis'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block font-heading">
                  Rejoignez la discussion
                </span>
                <p className="text-xs text-zinc-400 font-body">
                  Connectez-vous pour laisser votre note (étoiles) et soutenir les artistes africains.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 font-heading"
            >
              Se connecter pour noter
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mt-8 pb-3 border-b border-[#202030] flex-wrap">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
          {filteredReviews.length} avis affiché{filteredReviews.length > 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterRating === 'all'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Tous ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRating('5')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterRating === '5'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            5 ★ ({ratingDistribution[5] || 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterRating('4')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterRating === '4'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            4+ ★ ({ (ratingDistribution[5] || 0) + (ratingDistribution[4] || 0) })
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-6 flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Aucun avis dans cette catégorie pour le moment. Soyez le premier à commenter !
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isLiked = currentUser ? (rev.likedBy || []).includes(currentUser.uid) : false;

            return (
              <div 
                key={rev.id} 
                className="p-5 rounded-2xl bg-[#12121d] border border-[#222234] flex flex-col gap-3 transition-colors hover:border-[#32324a]"
              >
                {/* Author Info & Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.uid}`}
                      alt={rev.userName}
                      className="w-9 h-9 rounded-full border border-zinc-700 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm font-heading">
                          {rev.userName}
                        </span>
                        {rev.chapterNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                            Ch. {rev.chapterNumber}
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] text-zinc-500 block">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }).format(new Date(rev.createdAt))}
                      </time>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-zinc-200 font-body leading-relaxed whitespace-pre-line">
                  {rev.commentText}
                </p>

                {/* Footer Actions: Like & Report */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleLike(rev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      isLiked 
                        ? 'bg-rose-500/20 text-rose-400 font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{rev.likesCount || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportingReviewId(rev.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors text-[11px] flex items-center gap-1"
                    title="Signaler ce commentaire"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Signaler</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reporting Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2 font-heading">
              Signaler ce commentaire
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Veuillez indiquer le motif du signalement aux modérateurs :
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 mb-5 focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="inappropriate">Contenu inapproprié ou offensant</option>
              <option value="spoiler">Divulgâchis (Spoiler) non masqué</option>
              <option value="spam">Spam ou publicité non sollicitée</option>
              <option value="hate_speech">Propos haineux ou harcèlement</option>
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportingReviewId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Confirmer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
