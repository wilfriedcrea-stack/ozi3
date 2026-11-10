import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside 
      aria-label="État de la connexion"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[9998] animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-xl">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Mode Hors-Ligne OZI
          </div>
          <p className="text-[11px] text-zinc-300 leading-snug truncate">
            Connexion coupée. Vous lisez les données et planches en cache local.
          </p>
        </div>
      </div>
    </aside>
  );
};
