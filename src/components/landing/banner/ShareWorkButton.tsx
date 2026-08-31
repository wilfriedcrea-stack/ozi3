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

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}#/oeuvre/${series.slug || series.id}`;
    }
    return `https://ozibd.net/#/oeuvre/${series.slug || series.id}`;
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getShareUrl();

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = encodeURIComponent(getShareUrl());
    const shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleShareTwitter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Découvrez le webtoon "${series.title}" sur @OZI_BD ! 📖✨`);
    const shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(shareLink, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleNativeOrCopyShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getShareUrl();
    const title = `${series.title} — OZI Webtoons`;
    const text = `Découvrez l'œuvre "${series.title}" par ${series.author} sur la plateforme OZI !`;

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
          aria-label="Partager cette œuvre"
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
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Facebook Button */}
      <button
        type="button"
        onClick={handleShareFacebook}
        aria-label="Partager sur Facebook"
        title="Partager sur Facebook"
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
        aria-label="Partager sur X (Twitter)"
        title="Partager sur X"
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
        aria-label={copied ? "Lien copié dans le presse-papier" : "Copier le lien direct"}
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
