import React, { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Series } from '../../../types';

interface ShareWorkButtonProps {
  series: Series;
  className?: string;
  variant?: 'icons-row' | 'mobile-grouped';
}

export const ShareWorkButton: React.FC<ShareWorkButtonProps> = ({
  series,
  className = '',
  variant = 'icons-row'
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct internal route for web users
  const getDirectOeuvreUrl = () => {
    const slug = series.slug || series.id;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}#/oeuvre/${slug}`;
    }
    return `https://ozibd.net/#/oeuvre/${slug}`;
  };

  // Helper to pick a valid public HTTP(S) image URL (never base64 data: URLs which break query strings)
  const getValidPublicImageUrl = () => {
    const candidates = [series.coverUrl, series.bannerUrl];
    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === 'string' &&
        !candidate.startsWith('data:') &&
        candidate.length < 600
      ) {
        return candidate.replace(/^http:\/\/ozibd\.net/i, 'https://ozibd.net');
      }
    }
    return 'https://ozibd.net/REF.png';
  };

  // Social scraper URL with dedicated dynamic metadata (OpenGraph for Facebook / Twitter / WhatsApp)
  const getSocialShareUrl = () => {
    const slug = series.slug || series.id;
    const title = encodeURIComponent(series.title || '');
    const cover = encodeURIComponent(getValidPublicImageUrl());
    const author = encodeURIComponent(series.author || '');
    const shortDesc = encodeURIComponent((series.synopsis || '').slice(0, 160));
    // Cache-buster so Facebook scraper always fetches fresh Open Graph tags for the work
    const cacheBuster = Math.floor(Date.now() / 60000);

    const isLocalOrPreview =
      typeof window === 'undefined' ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1');

    const origin = isLocalOrPreview ? 'https://ozibd.net' : window.location.origin;
    return `${origin}/share.php?oeuvre=${encodeURIComponent(slug)}&title=${title}&cover=${cover}&author=${author}&desc=${shortDesc}&v=${cacheBuster}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getDirectOeuvreUrl();
    const shareMessage = `Allez découvrir "${series.title}" sur OZI : ${url}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast(`Lien et message copiés pour "${series.title}" !`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareFacebook = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const inviteMessage = `Allez découvrir "${series.title}" sur OZI !`;
    const socialUrl = getSocialShareUrl();

    // Copy invitation message to clipboard so user can also paste directly into the Facebook post field
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteMessage);
      }
    } catch {}

    showToast(`Invitation copiée : "${inviteMessage}"`);

    // Facebook Sharer with targeted work URL & quote parameter
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(socialUrl)}&quote=${encodeURIComponent(inviteMessage)}`;
    window.open(fbShareUrl, '_blank', 'noopener,noreferrer,width=620,height=580');
  };

  const handleShareTwitter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const socialUrl = getSocialShareUrl();
    const text = encodeURIComponent(`Allez découvrir "${series.title}" sur @OZI_BD ! 📖✨`);
    const shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(socialUrl)}&text=${text}`;
    window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleNativeOrCopyShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getDirectOeuvreUrl();
    const title = `Allez découvrir "${series.title}" sur OZI !`;
    const text = `Allez découvrir "${series.title}" de ${series.author || 'OZI'} sur la plateforme OZI !`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Fallback to copy link
      }
    }

    handleCopyLink(e);
  };

  if (variant === 'mobile-grouped') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={handleNativeOrCopyShare}
          aria-label={`Partager "${series.title}"`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold min-h-[40px] transition-all cursor-pointer active:scale-95 shadow-md"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Lien copié !</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-zinc-300" />
              <span>Partager</span>
            </>
          )}
        </button>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-zinc-700 shadow-xl pointer-events-none z-50 animate-fade-in">
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900/95 text-white text-[11px] font-medium px-3 py-1 rounded-full border border-zinc-700/80 shadow-2xl pointer-events-none z-50">
          {toastMessage}
        </div>
      )}

      {/* Facebook Button */}
      <button
        type="button"
        onClick={handleShareFacebook}
        aria-label={`Partager ${series.title} sur Facebook`}
        title={`Partager "${series.title}" sur Facebook`}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-[#1877F2] text-white border border-white/15 hover:border-transparent flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md active:scale-90"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>

      {/* X (Twitter) Button */}
      <button
        type="button"
        onClick={handleShareTwitter}
        aria-label={`Partager ${series.title} sur X`}
        title={`Partager "${series.title}" sur X`}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black text-white border border-white/15 hover:border-white/40 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md active:scale-90"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label={copied ? "Lien copié dans le presse-papier" : `Copier le lien pour ${series.title}`}
        title={copied ? "Lien copié !" : "Copier le lien"}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md active:scale-90 ${
          copied 
            ? 'bg-emerald-600 border-emerald-400 text-white' 
            : 'bg-black/60 hover:bg-zinc-800 text-white border-white/15 hover:border-white/40'
        }`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        ) : (
          <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
        )}
      </button>
    </div>
  );
};
