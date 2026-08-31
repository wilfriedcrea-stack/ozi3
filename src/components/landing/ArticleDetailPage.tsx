import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Check, 
  Sparkles, 
  BookOpen, 
  Heart, 
  MessageSquare, 
  Download,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Article } from '../../types';
import { ArticleDate } from '../articles/ArticleDate';
import { ImageFallback } from '../articles/ImageFallback';
import { ArticleCard } from '../articles/ArticleCard';

export const ArticleDetailPage: React.FC = () => {
  const { 
    articles, 
    selectedArticleId, 
    openArticlePage, 
    setViewMode,
    appVersion
  } = useData();

  const [copiedLink, setCopiedLink] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(42);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  // Find the target article by id or slug
  const currentArticle = useMemo(() => {
    if (!articles || articles.length === 0) return null;
    if (!selectedArticleId) return articles[0];
    
    return articles.find(
      a => a.id === selectedArticleId || a.slug === selectedArticleId
    ) || articles[0];
  }, [articles, selectedArticleId]);

  // Related articles (excluding the current one)
  const relatedArticles = useMemo(() => {
    if (!currentArticle || !articles) return [];
    return articles
      .filter(a => a.id !== currentArticle.id && a.published !== false)
      .slice(0, 3);
  }, [articles, currentArticle]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLikesCount(Math.floor(Math.random() * 30) + 25);
    setHasLiked(false);
  }, [currentArticle?.id]);

  if (!currentArticle) {
    return (
      <div className="min-h-[70vh] bg-[#0c0d12] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Article introuvable</h2>
        <p className="text-zinc-400 mb-6 max-w-md">L'article demandé n'existe pas ou a été déplacé.</p>
        <button
          onClick={() => setViewMode('articles')}
          className="px-6 py-2.5 rounded-full bg-[#ff5a50] text-white font-semibold hover:bg-[#ff6b5b] transition-colors"
        >
          Retour au magazine
        </button>
      </div>
    );
  }

  const handleShare = async (platform?: 'whatsapp' | 'facebook' | 'twitter') => {
    const url = window.location.href;
    const title = `${currentArticle.title} — OZI Magazine`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' : ' + url)}`, '_blank');
      return;
    }
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      return;
    }
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentArticle.title,
          text: currentArticle.excerpt || currentArticle.title,
          url: url,
        });
        return;
      } catch {
        // User cancelled or failed fallback
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Ignore
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const paragraphs = currentArticle.content 
    ? currentArticle.content.split('\n\n')
    : [
        currentArticle.excerpt || "Découvrez toute l'actualité, les analyses et les coulisses de la création chez OZI.",
        "Nos équipes travaillent chaque jour avec les meilleurs scénaristes et illustrateurs pour faire émerger une nouvelle génération d'œuvres fortes et authentiques.",
        "Retrouvez l'intégralité des chapitres et des séries exclusives en haute définition directement dans l'application mobile OZI."
      ];

  const apkUrl = appVersion?.downloadUrl || appVersion?.apkDownloadUrl || 'https://ozibd.net/ozi-reader.apk';

  return (
    <article id="article-standalone-page" className="min-h-screen bg-[#0a0b0f] text-white pt-4 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Breadcrumbs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 mb-4 border-b border-zinc-800/80">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-zinc-400 flex-wrap">
            <button 
              onClick={() => setViewMode('accueil')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Accueil
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <button 
              onClick={() => setViewMode('articles')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Magazine & Articles
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[#ff5a50] font-medium truncate max-w-[200px] sm:max-w-xs">
              {currentArticle.category || 'Article'}
            </span>
          </nav>

          <button
            id="back-to-articles-top-btn"
            onClick={() => setViewMode('articles')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tous les articles</span>
          </button>
        </div>

        {/* Article Meta Badges */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            {currentArticle.category && (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ff5a50]/15 border border-[#ff5a50]/30 text-[#ff6b5b]">
                {currentArticle.category}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <ArticleDate date={currentArticle.publishedAt} />
            </div>
            {currentArticle.readTime && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentArticle.readTime}</span>
              </div>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 font-almodobar">
            {currentArticle.title}
          </h1>

          {/* Author info & Quick Share */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 pb-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff5a50] to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {currentArticle.author ? currentArticle.author.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <p className="text-xs text-zinc-400">Rédigé par</p>
                <p className="text-sm font-bold text-zinc-100">{currentArticle.author || 'La Rédaction OZI'}</p>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShare('whatsapp')}
                aria-label="Partager sur WhatsApp"
                title="Partager sur WhatsApp"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-colors"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShare('facebook')}
                aria-label="Partager sur Facebook"
                title="Partager sur Facebook"
                className="px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-400 text-xs font-semibold hover:bg-blue-900/60 transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => handleShare()}
                aria-label="Copier le lien de l'article"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Big Hero Image */}
        <div className="relative aspect-[16/9] sm:aspect-[21/10] w-full rounded-2xl overflow-hidden mb-8 shadow-2xl bg-zinc-900 border border-zinc-800">
          <img
            src={currentArticle.image}
            alt={currentArticle.alt || currentArticle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Lead Excerpt */}
        {currentArticle.excerpt && (
          <div className="p-5 sm:p-7 rounded-2xl bg-[#14151e] border-l-4 border-[#ff5a50] shadow-lg mb-8">
            <p className="text-base sm:text-lg md:text-xl text-zinc-100 font-medium leading-relaxed italic">
              « {currentArticle.excerpt} »
            </p>
          </div>
        )}

        {/* Article Body Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-200 text-base sm:text-lg leading-relaxed mb-12">
          {paragraphs.map((p, idx) => (
            <p key={`para-${idx}`} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {/* Reaction & Engagement Bar */}
        <div className="p-6 rounded-2xl bg-[#12131b] border border-zinc-800 mb-14 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                hasLiked
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105'
                  : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>J'aime ({likesCount})</span>
            </button>
            <span className="text-xs text-zinc-400">
              Partagez cet article avec votre communauté !
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/90 text-zinc-200 hover:text-white hover:bg-zinc-700 border border-zinc-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#ff5a50]" />
              <span>Partager l'article</span>
            </button>
          </div>
        </div>

        {/* CTA Download APK App Banner */}
        <section className="mb-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1c1313] via-[#14141c] to-[#0c0d12] border border-[#ff5a50]/20 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ff5a50]/20 border border-[#ff5a50]/40 flex items-center justify-center shrink-0 shadow-inner text-[#ff5a50]">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white font-almodobar">
                Lisez vos Webtoons partout avec l'App OZI
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-md">
                Téléchargez l'application officielle Android pour profiter d'une lecture ultra-fluide et sans coupure.
              </p>
            </div>
          </div>
          <a
            href={apkUrl}
            download={`OZI-Reader-${appVersion?.version || 'v2.4.0'}.apk`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff5a50] hover:bg-[#ff6b5b] text-white font-bold text-sm transition-all shadow-lg shadow-[#ff5a50]/25 hover:scale-105 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger l'APK ({appVersion?.version || 'v2.4.0'})</span>
          </a>
        </section>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white font-almodobar">
                À lire aussi dans le Magazine
              </h2>
              <button
                onClick={() => setViewMode('articles')}
                className="text-xs sm:text-sm font-semibold text-[#ff5a50] hover:text-[#ff6b5b] flex items-center gap-1"
              >
                <span>Voir tout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {relatedArticles.map(rel => (
                <div key={rel.id} className="w-full">
                  <ArticleCard
                    article={rel}
                    onSelect={(a) => openArticlePage(a.slug || a.id)}
                    aspectRatioClass="aspect-[16/10]"
                    titleClassName="text-sm font-bold text-white"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Back Button */}
        <div className="mt-14 text-center">
          <button
            onClick={() => setViewMode('articles')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:text-white transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des articles</span>
          </button>
        </div>

      </div>
    </article>
  );
};
