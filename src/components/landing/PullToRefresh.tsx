import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const { refreshCatalogueFromFirestore, isRefreshingCatalogue } = useData();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const startYRef = useRef<number>(0);
  const pullThreshold = 75;

  useEffect(() => {
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 5) {
        startY = e.touches[0].clientY;
        startYRef.current = startY;
        isTracking = true;
      } else {
        isTracking = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || isRefreshingCatalogue) return;
      if (window.scrollY > 5) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        // Apply resistance curve
        const distance = Math.min(diff * 0.45, 110);
        setPullDistance(distance);
        setIsPulling(true);
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isTracking) return;
      isTracking = false;

      if (pullDistance >= pullThreshold && !isRefreshingCatalogue) {
        setPullDistance(pullThreshold);
        await refreshCatalogueFromFirestore();
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2000);
      }

      setIsPulling(false);
      setPullDistance(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshingCatalogue, refreshCatalogueFromFirestore]);

  const rotation = Math.min((pullDistance / pullThreshold) * 360, 360);
  const opacity = Math.min(pullDistance / 40, 1);

  return (
    <div className="relative w-full">
      {/* Pull Indicator */}
      <div 
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200"
        style={{
          transform: `translate(-50%, ${pullDistance > 10 || isRefreshingCatalogue || justRefreshed ? Math.min(pullDistance, 45) : -60}px)`,
          opacity: pullDistance > 10 || isRefreshingCatalogue || justRefreshed ? 1 : 0
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/95 border border-amber-500/40 text-amber-400 text-xs font-bold shadow-2xl backdrop-blur-md">
          {justRefreshed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">Catalogue actualisé !</span>
            </>
          ) : isRefreshingCatalogue ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              <span className="text-amber-300">Synchronisation Firestore...</span>
            </>
          ) : (
            <>
              <RefreshCw 
                className="w-4 h-4 text-amber-400 shrink-0"
                style={{ transform: `rotate(${rotation}deg)` }} 
              />
              <span className="text-zinc-200">
                {pullDistance >= pullThreshold ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
