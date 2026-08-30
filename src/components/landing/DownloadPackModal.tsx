import React, { useState } from 'react';
import { Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const DownloadPackModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      const response = await fetch('/ozibd-lws-dist.zip', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = 'ozibd-lws-dist.zip';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 1000);

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full p-6 text-zinc-100 shadow-2xl relative">
        <h3 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Téléchargement Pack LWS (ozibd.net)
        </h3>
        
        <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
          Ce pack ZIP contient tous les fichiers compilés de votre site et le fichier 
          <code className="bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded mx-1 text-xs">.htaccess</code> 
          prêt à être envoyé dans le dossier <code className="bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded mx-1 text-xs">htdocs</code> de votre hébergement LWS.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Le fichier ZIP propre et valide a été téléchargé avec succès dans vos téléchargements !</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Fermer
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Téléchargement...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger le ZIP (3.9 Mo)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
