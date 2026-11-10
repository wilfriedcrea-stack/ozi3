import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles, BookOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const PaystackToast: React.FC = () => {
  const { paystackToast, setPaystackToast, openProfileModal } = useData();

  useEffect(() => {
    if (paystackToast?.visible) {
      const timer = setTimeout(() => {
        setPaystackToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [paystackToast, setPaystackToast]);

  if (!paystackToast || !paystackToast.visible) {
    return null;
  }

  const isSuccess = paystackToast.type === 'success';

  return (
    <aside 
      aria-label="Notification de paiement"
      className="fixed top-5 right-4 sm:right-6 z-[9999] max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div 
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
          isSuccess 
            ? 'bg-zinc-900/95 border-emerald-500/50 shadow-emerald-500/20 text-white' 
            : 'bg-zinc-900/95 border-amber-500/50 shadow-amber-500/20 text-white'
        }`}
      >
        {/* Top glow accent */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 ${
            isSuccess 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 animate-pulse' 
              : 'bg-gradient-to-r from-amber-500 to-rose-500'
          }`} 
        />

        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isSuccess ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isSuccess ? 'Paiement Confirmé' : 'Information Paiement'}
              </span>
            </div>

            <p className="text-sm font-semibold text-zinc-100 leading-snug">
              {paystackToast.message}
            </p>

            {paystackToast.workTitle && (
              <p className="text-xs text-amber-300 font-medium mt-1 truncate">
                Œuvre : <span className="font-bold underline">{paystackToast.workTitle}</span>
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaystackToast(null);
                  openProfileModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Voir mes abonnements
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPaystackToast(null)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
