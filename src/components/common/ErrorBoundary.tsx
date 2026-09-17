import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 text-red-500 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Une erreur temporaire est survenue</h1>
          <p className="text-zinc-400 max-w-md text-sm sm:text-base mb-6">
            L'affichage a été sécurisé. Cliquez ci-dessous pour réinitialiser l'interface et reprendre votre navigation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
                window.location.reload();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff5a50] text-white font-bold text-sm hover:bg-[#ff6b5b] transition-all shadow-lg shadow-[#ff5a50]/20 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger l'application
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '';
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-sm hover:bg-zinc-700 transition-all border border-zinc-700 active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Page d'accueil
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-500 font-mono max-w-lg overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
