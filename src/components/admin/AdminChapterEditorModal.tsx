import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Music, 
  Volume2, 
  Play, 
  Pause, 
  Sparkles, 
  Coins, 
  Save, 
  Layers, 
  FileCheck, 
  Radio, 
  CheckCircle2
} from 'lucide-react';
import { Chapter, Series, AmbientAudioConfig, AmbientAudioPreset } from '../../types';
import { useData } from '../../context/DataContext';
import { ambientAudio } from '../../lib/ambientAudioEngine';
import { compressImageToWebP, uploadToLWS, formatBytes } from '../../services/lwsUploadService';

interface AdminChapterEditorModalProps {
  series: Series;
  chapter: Chapter | null;
  onClose: () => void;
  onSave: (chapterData: Partial<Chapter>) => void;
}

const PRESET_OPTIONS: { id: AmbientAudioPreset; name: string; desc: string; icon: string; bg: string }[] = [
  { id: 'epic_action', name: 'Action Épique', desc: 'Percussions guerrières, cuivres ambrés et montées d\'adrénaline', icon: '⚔️', bg: 'from-red-950/40 to-amber-950/40 border-red-500/30' },
  { id: 'cyberpunk_urban', name: 'Cyberpunk Futuriste', desc: 'Basses synthwave, nappes néon et atmosphère high-tech', icon: '⚡', bg: 'from-cyan-950/40 to-blue-950/40 border-cyan-500/30' },
  { id: 'traditional_fantasy', name: 'Afro-Fantasy Ancestrale', desc: 'Kora envoûtante, balafon céleste et chants des ancêtres', icon: '🏺', bg: 'from-amber-950/40 to-orange-950/40 border-amber-500/30' },
  { id: 'mystery_suspense', name: 'Mystère & Ténèbres', desc: 'Nappes spectrales, grondements profonds et tension psychologique', icon: '🔮', bg: 'from-purple-950/40 to-indigo-950/40 border-purple-500/30' },
  { id: 'romance_soft', name: 'Romance & Émotion', desc: 'Mélodies douces, piano chaud et atmosphère poétique', icon: '🌸', bg: 'from-pink-950/40 to-rose-950/40 border-pink-500/30' },
  { id: 'none', name: 'Aucune Musique (Silencieux)', desc: 'Lecture standard sans ambiance sonore', icon: '🔇', bg: 'from-slate-950 to-slate-900 border-slate-800' }
];

export const AdminChapterEditorModal: React.FC<AdminChapterEditorModalProps> = ({
  series,
  chapter,
  onClose,
  onSave
}) => {
  const { addLwsFile } = useData();

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'pages' | 'audio' | 'monetization'>('pages');

  // Form State
  const [chapterNumber, setChapterNumber] = useState<number>(chapter?.chapterNumber || (series.chapters ? series.chapters.length + 1 : 1));
  const [title, setTitle] = useState<string>(chapter?.title || '');
  const [summary, setSummary] = useState<string>(chapter?.summary || '');
  const [isFree, setIsFree] = useState<boolean>(chapter ? chapter.isFree : (chapterNumber <= 3));
  const [coinsRequired, setCoinsRequired] = useState<number>(chapter?.coinsRequired !== undefined ? chapter.coinsRequired : 15);
  const [readTimeMinutes, setReadTimeMinutes] = useState<number>(chapter?.readTimeMinutes || 6);

  // Pages State
  const [pages, setPages] = useState<string[]>(chapter?.pages || []);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; text: string } | null>(null);
  const [optimizationStats, setOptimizationStats] = useState<{ originalTotal: number; compressedTotal: number }>({
    originalTotal: 0,
    compressedTotal: 0
  });

  // Audio State
  const defaultAudio: AmbientAudioConfig = {
    enabled: true,
    preset: 'epic_action',
    volume: 0.7,
    loop: true,
    autoPlayOnScroll: true
  };
  const [audioConfig, setAudioConfig] = useState<AmbientAudioConfig>(chapter?.audioConfig || defaultAudio);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string>(audioConfig.customAudioUrl || '');

  // Visualizer Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-cleanup audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Real-time canvas audio visualization
  useEffect(() => {
    if (!isPlayingAudio) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const freqData = ambientAudio.getWaveformData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / freqData.length) * 2.2;
      let x = 0;

      for (let i = 0; i < freqData.length; i++) {
        const barHeight = (freqData[i] / 255) * canvas.height * 0.9;

        // Gradient from amber-500 to orange-600
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#ea580c');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
        if (x > canvas.width) break;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlayingAudio]);

  // Handle Bulk Image Upload with WebP Optimizer
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    let newOriginalTotal = optimizationStats.originalTotal;
    let newCompressedTotal = optimizationStats.compressedTotal;
    const uploadedUrls: string[] = [];

    const fileList: File[] = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const stepPercent = Math.round(((i + 1) / fileList.length) * 100);
      setUploadProgress({
        percent: stepPercent,
        text: `Optimisation WebP & Upload page ${i + 1}/${fileList.length} (${file.name})...`
      });

      try {
        // Compress to WebP
        const compression = await compressImageToWebP(file, 1400, 0.88);
        newOriginalTotal += compression.originalSize;
        newCompressedTotal += compression.compressedSize;

        // Upload to LWS
        const uploadRes = await uploadToLWS(
          compression.file,
          `ch${chapterNumber}_p${pages.length + uploadedUrls.length + 1}_${Date.now()}.webp`,
          'chapters',
          { workId: series.id, chapterNumber }
        );

        uploadedUrls.push(uploadRes.url);
        addLwsFile(uploadRes.fileInfo);
      } catch (err) {
        console.error('Error processing page:', err);
      }
    }

    setPages(prev => [...prev, ...uploadedUrls]);
    setOptimizationStats({
      originalTotal: newOriginalTotal,
      compressedTotal: newCompressedTotal
    });
    setIsCompressing(false);
    setUploadProgress(null);
  };

  // Reorder and delete pages
  const movePage = (index: number, direction: 'up' | 'down') => {
    const newPages = [...pages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;

    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
  };

  const removePage = (index: number) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  // Audio Playback Test
  const handleToggleAudioPlay = () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      if (customAudioUrl.trim()) {
        ambientAudio.playCustomUrl(customAudioUrl.trim(), audioConfig.volume, audioConfig.loop);
      } else {
        ambientAudio.playPreset(audioConfig.preset, audioConfig.volume, audioConfig.loop);
      }
      setIsPlayingAudio(true);
    }
  };

  const handlePresetSelect = (preset: AmbientAudioPreset) => {
    const updated: AmbientAudioConfig = { ...audioConfig, preset, enabled: preset !== 'none' };
    setAudioConfig(updated);
    if (isPlayingAudio) {
      if (customAudioUrl.trim()) {
        ambientAudio.playCustomUrl(customAudioUrl.trim(), updated.volume, updated.loop);
      } else {
        ambientAudio.playPreset(preset, updated.volume, updated.loop);
      }
    }
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pages.length === 0) {
      alert('Veuillez ajouter au moins une planche (page) pour ce chapitre.');
      setActiveTab('pages');
      return;
    }

    const finalAudio: AmbientAudioConfig = {
      ...audioConfig,
      customAudioUrl: customAudioUrl.trim() || undefined
    };

    onSave({
      chapterNumber: Number(chapterNumber),
      title: title.trim() || `Chapitre ${chapterNumber}`,
      summary: summary.trim(),
      isFree,
      coinsRequired: isFree ? 0 : Number(coinsRequired),
      readTimeMinutes: Number(readTimeMinutes),
      pages,
      audioConfig: finalAudio
    });

    ambientAudio.stop();
  };

  const savingsPercent = optimizationStats.originalTotal > 0 
    ? Math.round((1 - optimizationStats.compressedTotal / optimizationStats.originalTotal) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/40 my-auto overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {series.title}
                </span>
                <span className="text-slate-400 text-xs font-medium">Éditeur de Chapitre</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {chapter ? `Édition : Chapitre ${chapter.chapterNumber} - ${chapter.title}` : `Nouveau Chapitre #${chapterNumber}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le Chapitre</span>
            </button>
            <button
              onClick={() => {
                ambientAudio.stop();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex gap-2">
          <button
            onClick={() => setActiveTab('pages')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'pages'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Planches & Pages Webtoon ({pages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'audio'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Bande-Son & OST Immersive</span>
            {audioConfig.enabled && audioConfig.preset !== 'none' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('monetization')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'monetization'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Tarification & Détails</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: PAGES & PLANCHES */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Numéro de Chapitre</label>
                  <input
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Titre du Chapitre</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: L'Éveil de la Flamme Sacrée"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 text-center bg-slate-950/50 transition-all group">
                <input
                  type="file"
                  id="chapter-images-input"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageUpload}
                  disabled={isCompressing}
                  className="hidden"
                />
                <label
                  htmlFor="chapter-images-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-3"
                >
                  <div className="p-4 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      Cliquez pour importer des planches ou glissez-déposez ici
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Support multi-fichiers JPEG, PNG, WebP • Conversion WebP HD automatique (88% qualité, max 1400px) • Cible <code className="text-amber-400">ozibd.net/api/upload.php</code>
                    </p>
                  </div>
                </label>

                {/* Progress bar */}
                {uploadProgress && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>{uploadProgress.text}</span>
                      <span className="text-amber-400 font-bold">{uploadProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Optimization stats banner */}
              {optimizationStats.originalTotal > 0 && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <FileCheck className="w-4 h-4" />
                    <span>Compression WebP Réussie : Gain de bande passante</span>
                  </div>
                  <div className="text-slate-300">
                    {formatBytes(optimizationStats.originalTotal)} ➔ <strong className="text-emerald-400">{formatBytes(optimizationStats.compressedTotal)}</strong> ({savingsPercent}% d'économie)
                  </div>
                </div>
              )}

              {/* Pages Grid / List with Reordering */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Pages du Chapitre ({pages.length})</span>
                    <span className="text-xs text-slate-400 font-normal">Format Webtoon Vertical</span>
                  </h3>
                  {pages.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Voulez-vous supprimer toutes les pages de ce chapitre ?')) {
                          setPages([]);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Tout effacer</span>
                    </button>
                  )}
                </div>

                {pages.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
                    Aucune page importée pour l'instant. Utilisez la zone d'upload ci-dessus.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {pages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl overflow-hidden shadow-lg transition-all"
                      >
                        <div className="aspect-[3/4] bg-slate-900 overflow-hidden relative">
                          <img
                            src={url}
                            alt={`Page ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm rounded text-[11px] font-bold text-amber-400 border border-amber-500/30">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Actions overlay / footer */}
                        <div className="p-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => movePage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Monter"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => movePage(idx, 'down')}
                              disabled={idx === pages.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Descendre"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removePage(idx)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40"
                            title="Supprimer la page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AMBIENT AUDIO ENGINE */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Audio Header Card */}
              <div className="p-5 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Moteur Audio Immersif OZI Webtoon</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold rounded">
                        Synthesizer & Streaming
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Diffusez une bande-son synthétisée adaptative ou un flux audio hébergé lors du défilement du chapitre.
                    </p>
                  </div>
                </div>

                {/* Play / Test Button */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleToggleAudioPlay}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Mettre en Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Tester la Bande-Son</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Visualizer Canvas */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visualiseur de Fréquences (Web Audio API)</span>
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">
                    {isPlayingAudio ? '● Signal Actif' : 'En attente'}
                  </span>
                </div>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={80}
                  className="w-full h-20 bg-slate-900/80 rounded-xl border border-slate-800/80"
                />
              </div>

              {/* Audio Presets Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-3">
                  1. Choisissez un Préréglage d'Ambiance Sonore :
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESET_OPTIONS.map((preset) => {
                    const isSelected = audioConfig.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetSelect(preset.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden bg-gradient-to-br ${preset.bg} ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-amber-400 shadow-lg shadow-amber-500/20'
                            : 'hover:border-slate-600 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{preset.icon}</span>
                          <div>
                            <div className="font-bold text-white text-sm">{preset.name}</div>
                            <div className="text-xs text-slate-400 mt-1 leading-snug">{preset.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Audio URL if selected */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  URL du Fichier Audio MP3 / OGG / WAV (Hébergement LWS ou Externe)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAudioUrl}
                    onChange={(e) => setCustomAudioUrl(e.target.value)}
                    placeholder="https://ozibd.net/uploads/audio/mon_ost.mp3"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Audio Fine-Tuning Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                {/* Volume Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Volume</span>
                    </span>
                    <span className="text-white font-bold">{Math.round(audioConfig.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioConfig.volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setAudioConfig(prev => ({ ...prev, volume: vol }));
                      ambientAudio.setVolume(vol);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Switches */}
                <div className="flex flex-col justify-center space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={audioConfig.loop}
                      onChange={(e) => setAudioConfig(prev => ({ ...prev, loop: e.target.checked }))}
                      className="accent-amber-500 rounded"
                    />
                    <span>Boucler en continu (Loop)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={audioConfig.autoPlayOnScroll}
                      onChange={(e) => setAudioConfig(prev => ({ ...prev, autoPlayOnScroll: e.target.checked }))}
                      className="accent-amber-500 rounded"
                    />
                    <span>Lancer automatiquement au scroll</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MONETIZATION & CHAPTER DETAILS */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">
              {/* Access Mode */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Modèle d'Accès au Chapitre</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFree(true)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isFree
                        ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-emerald-400 mb-1">Chapitre Gratuit (Accès Libre)</div>
                    <div className="text-xs text-slate-400">
                      Accessible immédiatement à tous les lecteurs sans dépense de Coins. Idéal pour les chapitres 1 à 3 d'accroche.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFree(false)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      !isFree
                        ? 'border-amber-500 bg-amber-950/30 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-amber-400 mb-1">Chapitre Payant (Verrouillé par Coins)</div>
                    <div className="text-xs text-slate-400">
                      Nécessite des Coins OZI pour être débloqué. Génère des revenus pour le créateur (Part 70%).
                    </div>
                  </button>
                </div>

                {!isFree && (
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Coins Requis pour Débloquer</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={coinsRequired}
                          onChange={(e) => setCoinsRequired(Math.max(1, parseInt(e.target.value) || 15))}
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold text-center focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-amber-400 font-semibold">Coins (~ {coinsRequired * 5} FCFA)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Extra Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Temps de Lecture Estimé (Minutes)</label>
                  <input
                    type="number"
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pitch / Résumé d'Accroche</label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Courte phrase résumant l'enjeu du chapitre..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {pages.length} page(s) • OST: <strong className="text-amber-400">{audioConfig.enabled ? audioConfig.preset : 'Silencieux'}</strong> • Accès: <strong className={isFree ? 'text-emerald-400' : 'text-amber-400'}>{isFree ? 'Gratuit' : `${coinsRequired} Coins`}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                ambientAudio.stop();
                onClose();
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le Chapitre</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
