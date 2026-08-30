import React, { useState } from 'react';
import { OZI_LOGO_URL } from '../../assets/oziLogoBase64';

interface OziLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
}

export const OziLogo: React.FC<OziLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = false,
  showSubtitle = false,
  showBadge = false
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'h-7 sm:h-8 w-auto max-w-[100px]',
    sm: 'h-9 sm:h-10 w-auto max-w-[130px]',
    md: 'h-12 sm:h-14 w-auto max-w-[190px]',
    lg: 'h-16 sm:h-18 w-auto max-w-[260px]',
    xl: 'h-22 sm:h-26 w-auto max-w-[360px]',
  }[size];

  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-22 h-22',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {!imgError ? (
        <img
          src={OZI_LOGO_URL || '/images/ozi-logo.png'}
          alt="OZI Logo"
          onError={() => setImgError(true)}
          className={`${sizeClasses} object-contain transition-transform hover:scale-105 duration-200 shrink-0 drop-shadow-md`}
          loading="eager"
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <div className={`${iconSizes} rounded-xl bg-gradient-to-br from-[#FF6B5B] to-[#FF3829] flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0`}>
            <div className="w-2/3 h-2/3 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          <span className="font-black text-white text-xl tracking-tight font-almodobar">
            O<span className="text-[#FF5A50]">Z</span>I
          </span>
        </div>
      )}

      {/* Optional Brand Text Stack when enabled */}
      {(showText || showSubtitle || showBadge) && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {showText && (
              <span className="font-black tracking-tight text-white font-almodobar text-lg leading-none">
                OZI<span className="text-[#ff5a50] font-normal text-xs ml-1 font-sans">Webtoon</span>
              </span>
            )}
            {showBadge && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#ff5a50]/15 text-[#ff6b5b] border border-[#ff5a50]/30 tracking-wider">
                OFFICIEL
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className="text-[11px] font-medium text-slate-400 tracking-wide mt-0.5">
              Webtoons & Bandes Dessinées
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OziLogo;
