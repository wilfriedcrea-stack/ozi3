import React, { useState } from 'react';
import { 
  HardDrive, 
  Folder, 
  Image as ImageIcon, 
  Music, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { LwsStorageFile } from '../../types';
import { compressImageToWebP, uploadToLWS, generateLwsHtaccess, formatBytes } from '../../services/lwsUploadService';

export const AdminStorageManager: React.FC = () => {
  const { lwsFiles, addLwsFile, deleteLwsFile } = useData();

  const [activeFolder, setActiveFolder] = useState<'all' | 'covers' | 'banners' | 'chapters' | 'audio'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showHtaccessModal, setShowHtaccessModal] = useState(false);

  const filteredFiles = lwsFiles.filter(f => {
    const matchesFolder = activeFolder === 'all' || f.directory === activeFolder;
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const totalStorageBytes = lwsFiles.reduce((acc, f) => acc + f.size, 0);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Upload en cours de ${file.name}...`);

      try {
        let uploadBlob: Blob = file;
        let category: 'covers' | 'banners' | 'chapters' | 'audio' = 'covers';

        if (file.type.startsWith('audio/')) {
          category = 'audio';
        } else if (activeFolder === 'banners') {
          category = 'banners';
          const comp = await compressImageToWebP(file, 1600, 0.9);
          uploadBlob = comp.file;
        } else {
          const comp = await compressImageToWebP(file, 1400, 0.88);
          uploadBlob = comp.file;
        }

        const res = await uploadToLWS(
          uploadBlob,
          file.name.replace(/\.[^/.]+$/, "") + (category === 'audio' ? '.mp3' : '.webp'),
          category
        );

        addLwsFile(res.fileInfo);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setIsUploading(false);
    setUploadStatus(null);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Serveur Stockage LWS & CDN OZI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explorateur Médias LWS (ozibd.net)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Gestionnaire des fichiers statiques hébergés sur l'infrastructure LWS. Stockage WebP haute performance et streaming audio MP3.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHtaccessModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité .htaccess</span>
          </button>

          <label className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Importer des Médias</span>
            <input
              type="file"
              multiple
              onChange={handleDirectUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Storage Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Volume Total Utilisé</div>
          <div className="text-xl font-black text-amber-400 mt-1">{formatBytes(totalStorageBytes)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Fichiers Indexés</div>
          <div className="text-xl font-black text-white mt-1">{lwsFiles.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Format Préféré</div>
          <div className="text-xl font-black text-emerald-400 mt-1">WebP (88%)</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold uppercase">Endpoint Serveur</div>
          <div className="text-xs font-mono font-bold text-slate-300 mt-2 truncate">ozibd.net/api/upload.php</div>
        </div>
      </div>

      {/* Folders & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['all', 'covers', 'chapters', 'audio', 'banners'] as const).map((folder) => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeFolder === folder
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span className="capitalize">{folder === 'all' ? 'Tous les Dossiers' : folder}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer les fichiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.path}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-amber-500/50 transition-all flex flex-col group"
          >
            <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden flex items-center justify-center">
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-amber-400">
                  <Music className="w-10 h-10" />
                </div>
              )}

              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-amber-500/30">
                {file.directory}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-white text-xs truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{file.sizeFormatted}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => handleCopy(file.url)}
                  className="text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[11px]"
                >
                  {copiedUrl === file.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === file.url ? 'Copié !' : 'Copier CDN'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer ${file.name} de l'index LWS ?`)) {
                        deleteLwsFile(file.path);
                      }
                    }}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security .htaccess Modal */}
      {showHtaccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Configuration de Sécurité .htaccess (LWS /uploads/)</span>
              </h3>
              <button onClick={() => setShowHtaccessModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Copiez ce contenu dans le fichier <code className="text-amber-400">htdocs/uploads/.htaccess</code> de votre hébergement LWS pour bloquer l'exécution de scripts malveillants et activer CORS pour le streaming audio et WebP.
            </p>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {generateLwsHtaccess()}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateLwsHtaccess());
                  alert('Contenu du .htaccess copié dans le presse-papier !');
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md"
              >
                Copier le .htaccess
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
