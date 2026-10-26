import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  X, 
  ExternalLink,
  Flame,
  ArrowRight,
  BookOpen,
  Layers,
  Play,
  Sliders,
  Maximize2,
  RefreshCw,
  Cloud,
  Smartphone
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { HomeHeroSlide } from '../../types';

export const AdminHeroSlidesManager: React.FC = () => {
  const { 
    heroSlides, 
    addHeroSlide, 
    updateHeroSlide, 
    deleteHeroSlide, 
    reorderHeroSlides,
    syncHeroSlidesToFirestoreNow,
    isSyncingHeroSlides,
    series 
  } = useData();

  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const result = await syncHeroSlidesToFirestoreNow();
    setSyncFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4500);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeHeroSlide | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    imageUrl: string;
    logoUrl: string;
    logoHeight: number;
    formatStatus: string;
    synopsis: string;
    buttonText: string;
    seriesId: string;
    active: boolean;
    order: number;
  }>({
    title: '',
    imageUrl: '',
    logoUrl: '',
    logoHeight: 150,
    formatStatus: 'WEBTOON • EN COURS',
    synopsis: '',
    buttonText: 'Voir le manhwa',
    seriesId: series[0]?.id || '',
    active: true,
    order: 1
  });

  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoSizeSuccess, setLogoSizeSuccess] = useState<string | null>(null);

  // Open modal for new slide
  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      title: 'Nouvelle Œuvre Vedette',
      imageUrl: '/assets/aistudio/Sans_titre-3_b6d37864.png',
      logoUrl: '/images/kamina-logo.svg',
      logoHeight: 150,
      formatStatus: 'WEBTOON • EN COURS',
      synopsis: "Dans un monde dystopique aux confins de la magie ancestrale et de la technologie occulte, une jeune guerrière se dresse seule contre l'ordre corrompu.",
      buttonText: 'Voir le manhwa',
      seriesId: series[0]?.id || '',
      active: true,
      order: (heroSlides?.length || 0) + 1
    });
    setModalOpen(true);
  };

  // Open modal for editing existing slide
  const handleOpenEdit = (slide: HomeHeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      imageUrl: slide.imageUrl,
      logoUrl: slide.logoUrl || '',
      logoHeight: slide.logoHeight || 150,
      formatStatus: slide.formatStatus || 'WEBTOON • EN COURS',
      synopsis: slide.synopsis,
      buttonText: slide.buttonText || 'Voir le manhwa',
      seriesId: slide.seriesId || (series[0]?.id || ''),
      active: slide.active,
      order: slide.order
    });
    setModalOpen(true);
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      alert("Veuillez renseigner au moins le titre et l'image d'arrière-plan.");
      return;
    }

    if (editingSlide) {
      updateHeroSlide(editingSlide.id, formData);
    } else {
      addHeroSlide(formData);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    setModalOpen(false);
  };

  // Quick adjust logo height on live preview
  const handleUpdateLiveLogoHeight = (height: number) => {
    if (previewSlide) {
      updateHeroSlide(previewSlide.id, { logoHeight: height });
    }
  };

  // Apply logo height to all slides
  const handleApplyLogoHeightToAll = (height: number) => {
    if (heroSlides.length === 0) return;
    const updated = heroSlides.map(s => ({ ...s, logoHeight: height }));
    reorderHeroSlides(updated);
    setLogoSizeSuccess(`Taille de ${height}px appliquée à toutes les bannières (${heroSlides.length}) !`);
    setTimeout(() => setLogoSizeSuccess(null), 3000);
  };

  // Handle local file uploads (converts to base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setFormData(prev => ({
            ...prev,
            [field]: uploadEvent.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Move slide up / down in order
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...heroSlides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    reorderHeroSlides(newSlides);
  };

  const previewSlide = heroSlides[selectedPreviewIndex] || heroSlides[0];
  const currentLogoHeight = previewSlide?.logoHeight || 150;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff7b6b]/10 border border-[#ff7b6b]/20 text-[#ff8679] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vitrine d'Accueil</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Showcase & Bannières d'Accueil
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Gérez la section majeure en haut de la page d'accueil : image de fond, logo détouré en surimpression à gauche, dégradé cinématique, résumé et bouton d'action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleManualSync}
            disabled={isSyncingHeroSlides}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold text-sm border border-zinc-700 hover:border-zinc-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Synchroniser avec le Cloud Firestore pour que toutes les bannières soient immédiatement visibles sur tous les appareils et téléphones"
          >
            <RefreshCw className={`w-4 h-4 text-[#ff8679] ${isSyncingHeroSlides ? 'animate-spin' : ''}`} />
            <span>{isSyncingHeroSlides ? 'Synchronisation...' : 'Synchroniser'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#ff7b6b] hover:bg-[#ff8679] text-white font-bold text-sm shadow-lg shadow-[#ff7b6b]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer font-almodobar shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ajouter une Bannière</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Feedback Notification */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in shadow-lg ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          {syncFeedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-bold">{syncFeedback.text}</span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Diffusé en direct sur ordinateurs, smartphones & tablettes.
            </span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>La bannière d'accueil a été enregistrée avec succès et est active !</span>
        </div>
      )}

      {/* Logo Size Global Notification */}
      {logoSizeSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{logoSizeSuccess}</span>
        </div>
      )}

      {/* Live Preview Box with Integrated Interactive Logo Size Controls */}
      {previewSlide && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Header info */}
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#ff7b6b]" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Aperçu Direct sur l'Accueil : {previewSlide.title}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Rendu temps réel de la disposition et de la taille du logo
              </span>
            </div>

            {/* Interactive Logo Size Toolbar */}
            <div className="p-4 bg-zinc-900/40 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ff7b6b]/15 text-[#ff8679] shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Taille du Logo :
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#ff7b6b]/20 border border-[#ff7b6b]/30 text-[#ff8679] text-xs font-mono font-bold">
                      {currentLogoHeight} px
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Cliquez sur un bouton ou glissez le curseur pour voir l'effet en direct ci-dessous
                  </p>
                </div>
              </div>

              {/* Size Buttons & Range Slider */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Preset Buttons */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                  {[
                    { label: 'Compact', size: 110 },
                    { label: 'Normal', size: 150 },
                    { label: 'Grand', size: 200 },
                    { label: 'Maxi', size: 260 },
                  ].map(p => (
                    <button
                      key={p.size}
                      type="button"
                      onClick={() => handleUpdateLiveLogoHeight(p.size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentLogoHeight === p.size
                          ? 'bg-[#ff7b6b] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      title={`Définir la hauteur du logo à ${p.size}px`}
                    >
                      {p.label} ({p.size}px)
                    </button>
                  ))}
                </div>

                {/* Precision Slider */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold">70px</span>
                  <input
                    type="range"
                    min="70"
                    max="320"
                    step="5"
                    value={currentLogoHeight}
                    onChange={(e) => handleUpdateLiveLogoHeight(parseInt(e.target.value) || 150)}
                    className="w-24 sm:w-28 accent-[#ff7b6b] cursor-pointer"
                    title="Ajustement fin de la taille du logo"
                  />
                  <span className="text-[10px] text-zinc-500 font-bold">320px</span>
                </div>

                {/* Apply to All Slides Button */}
                <button
                  type="button"
                  onClick={() => handleApplyLogoHeightToAll(currentLogoHeight)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer border border-zinc-700 hover:border-zinc-600 shrink-0"
                  title="Définir cette même taille sur toutes les bannières"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#ff8679]" />
                  <span>Appliquer à toutes</span>
                </button>
              </div>
            </div>

            {/* Mini Interactive Hero Visual with Real-Time Sized Logo */}
            <div className="relative w-full h-[340px] sm:h-[400px] bg-[#121316] overflow-hidden select-none">
              {/* Background Image */}
              <img
                src={previewSlide.imageUrl || '/assets/aistudio/Sans_titre-3_b6d37864.png'}
                alt={previewSlide.title}
                className="absolute inset-0 w-full h-full object-cover object-right brightness-100 contrast-[1.02]"
              />

              {/* Soft Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 via-50% to-transparent pointer-events-none" />

              {/* Subtle bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

              {/* Left Content Overlay */}
              <div className="relative z-10 h-full max-w-lg p-6 sm:p-10 flex flex-col justify-center items-start text-left">
                {/* 1. Overlaid Logo with Dynamic Height */}
                <div className="mb-3 flex items-center justify-start min-h-[60px]">
                  {previewSlide.logoUrl ? (
                    <img
                      src={previewSlide.logoUrl}
                      alt={previewSlide.title}
                      style={{
                        maxHeight: `${currentLogoHeight}px`,
                        maxWidth: `${Math.round(currentLogoHeight * 2.8)}px`
                      }}
                      className="w-auto object-contain object-left drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)] transition-all duration-200 select-none"
                    />
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-black text-white font-almodobar">
                      {previewSlide.title}
                    </h3>
                  )}
                </div>

                {/* 2. Format & Status Line */}
                <div className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-white/95 mb-3 drop-shadow">
                  {previewSlide.formatStatus || 'WEBTOON • EN COURS'}
                </div>

                {/* Block: Description & Button lower down */}
                <div className="flex flex-col items-start mt-1.5 space-y-4">
                  {/* 3. Synopsis - slightly smaller */}
                  <p className="text-white/90 text-[11px] sm:text-xs font-normal line-clamp-3 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                    {previewSlide.synopsis}
                  </p>

                  {/* 4. Action Button with subtle animated halo */}
                  <div className="relative inline-flex items-center">
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#f95e4e] via-[#8b5cf6] via-[#06b6d4] to-[#f59e0b] opacity-35 blur-md pointer-events-none" />
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#f95e4e] via-[#a855f7] via-[#38bdf8] to-[#fbbf24] p-[1px] opacity-75 pointer-events-none" />
                    <div className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f95e4e] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#f95e4e]/30">
                      <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                      <span>{previewSlide.buttonText || 'Voir le manhwa'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banners List Table */}
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Bannières configurées ({heroSlides.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            Glissez ou utilisez les flèches pour changer l'ordre d'affichage
          </span>
        </div>

        {heroSlides.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune bannière configurée.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
            >
              Créer la première bannière
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {heroSlides.map((slide, index) => {
              const linkedSeries = series.find(s => s.id === slide.seriesId || s.slug === slide.seriesId);
              return (
                <div
                  key={slide.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    selectedPreviewIndex === index ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Thumbnail preview */}
                    <div 
                      onClick={() => setSelectedPreviewIndex(index)}
                      className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-zinc-700 cursor-pointer group"
                      title="Cliquer pour prévisualiser ci-dessus"
                    >
                      <img
                        src={slide.imageUrl || '/assets/aistudio/Sans_titre-2_1c012a78.png'}
                        alt={slide.title}
                        className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform"
                      />
                      {slide.logoUrl && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                          <img
                            src={slide.logoUrl}
                            alt=""
                            className="max-h-8 sm:max-h-10 object-contain drop-shadow"
                          />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {slide.title}
                        </h4>
                        {slide.active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                            Masqué
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 max-w-md">
                        {slide.synopsis}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                        <span>Bouton : <strong className="text-zinc-300">"{slide.buttonText || 'Lire le premier chapitre'}"</strong></span>
                        <span>•</span>
                        <span>Série liée : <strong className="text-zinc-300">{linkedSeries ? linkedSeries.title : (slide.seriesId || 'Aucune')}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Preview Button */}
                    <button
                      onClick={() => setSelectedPreviewIndex(index)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Prévisualiser dans le panneau"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      title="Monter"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === heroSlides.length - 1}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      title="Descendre"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => updateHeroSlide(slide.id, { active: !slide.active })}
                      className={`p-2 rounded-xl transition-colors ${
                        slide.active
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title={slide.active ? "Désactiver de l'accueil" : "Activer sur l'accueil"}
                    >
                      {slide.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(slide)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-[#ff7b6b] text-zinc-300 hover:text-white transition-colors"
                      title="Modifier la bannière"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la bannière "${slide.title}" ?`)) {
                          deleteHeroSlide(slide.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                      title="Supprimer la bannière"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Slide */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ff7b6b]/15 text-[#ff8679]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {editingSlide ? 'Modifier la Bannière d\'Accueil' : 'Nouvelle Bannière d\'Accueil'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Définissez l'image, le logo et le résumé narratif.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* 1. Title / Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Titre de référence / Nom de l'œuvre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="ex: Kamina, Orisha Rebirth, Arcane..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                />
              </div>

              {/* 2. Background Image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Image d'arrière-plan / Illustration de l'œuvre *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    required
                    placeholder="URL de l'image (ex: /assets/aistudio/... ou https://...)"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'imageUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '/assets/aistudio/2026-10-25_13_36_26_40d98bf0.png' }))}
                    className="px-2.5 py-1 rounded-lg bg-[#ff7b6b]/20 hover:bg-[#ff7b6b]/30 text-[11px] text-[#ff8679] font-bold transition-colors"
                  >
                    Disposition Référence (Myst Might)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '/assets/aistudio/Sans_titre-3_b6d37864.png' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Capture Référence (Sans titre-3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '/assets/aistudio/Sans_titre-2_1c012a78.png' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Capture Référence (Sans titre-2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1920&q=85' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Cyberpunk
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1920&q=85' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Racing Dakar
                  </button>
                </div>
              </div>

              {/* 3. Logo Overlaid on the Left */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Logo de l'œuvre (en surimpression à gauche)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="URL du logo transparent (ex: /images/kamina-logo.svg ou PNG)"
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Téléverser Logo</span>
                    <input
                      type="file"
                      accept="image/*,.svg"
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Presets for Logo */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '/images/kamina-logo.svg' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Logo Kamina SVG officiel
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '/images/ozi-logo.svg' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                  >
                    Logo OZI
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-400 transition-colors"
                  >
                    Aucun (titre typographique)
                  </button>
                </div>

                {/* Logo Size Control within Form */}
                <div className="mt-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Taille du logo : <span className="text-[#ff8679] font-mono">{formData.logoHeight || 150} px</span>
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      Hauteur d'affichage du logo
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: 'Compact', size: 110 },
                      { label: 'Normal', size: 150 },
                      { label: 'Grand', size: 200 },
                      { label: 'Maxi', size: 260 },
                    ].map(p => (
                      <button
                        key={p.size}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoHeight: p.size }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (formData.logoHeight || 150) === p.size
                            ? 'bg-[#ff7b6b] text-white shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {p.label} ({p.size}px)
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      min="70"
                      max="320"
                      step="5"
                      value={formData.logoHeight || 150}
                      onChange={(e) => setFormData(prev => ({ ...prev, logoHeight: parseInt(e.target.value) || 150 }))}
                      className="flex-1 accent-[#ff7b6b] cursor-pointer"
                    />
                    <input
                      type="number"
                      min="70"
                      max="320"
                      value={formData.logoHeight || 150}
                      onChange={(e) => setFormData(prev => ({ ...prev, logoHeight: parseInt(e.target.value) || 150 }))}
                      className="w-16 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-center text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Instant mini preview inside form */}
                  {formData.logoUrl && (
                    <div className="mt-2 p-3 rounded-xl bg-[#121316] border border-zinc-800/80 flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">
                        Aperçu réel à {formData.logoHeight || 150}px :
                      </span>
                      <div className="flex items-center justify-start overflow-hidden py-1">
                        <img
                          src={formData.logoUrl}
                          alt="Aperçu du logo"
                          style={{
                            maxHeight: `${formData.logoHeight || 150}px`,
                            maxWidth: `${Math.round((formData.logoHeight || 150) * 2.8)}px`
                          }}
                          className="w-auto object-contain object-left filter drop-shadow transition-all duration-150"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Format & Status Metadata (ex: WEBTOON • EN COURS) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Format & Statut affiché sous le logo
                </label>
                <input
                  type="text"
                  value={formData.formatStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, formatStatus: e.target.value }))}
                  placeholder="ex: WEBTOON • EN COURS ou MANGA • TERMINÉ"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                />
              </div>

              {/* 5. Synopsis / Summary Text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Résumé / Synopsis narratif *
                </label>
                <textarea
                  rows={3}
                  value={formData.synopsis}
                  onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
                  required
                  placeholder="Texte de présentation de l'œuvre affiché sur le dégradé à gauche..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                />
              </div>

              {/* 6. Button Text & Target Series */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Texte du bouton d'action
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="ex: Voir le manhwa"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Œuvre liée (Catalogue)
                  </label>
                  <select
                    value={formData.seriesId}
                    onChange={(e) => setFormData(prev => ({ ...prev, seriesId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff7b6b] text-white text-sm focus:outline-none"
                  >
                    {series.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.genre})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. Active switch & Order */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="slide-active-checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 accent-[#ff7b6b] rounded cursor-pointer"
                  />
                  <label htmlFor="slide-active-checkbox" className="text-xs font-bold text-zinc-300 cursor-pointer">
                    Afficher immédiatement sur l'accueil
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Ordre :</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    className="w-16 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-center text-xs"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#ff7b6b] hover:bg-[#ff8679] text-white text-xs font-bold shadow-lg shadow-[#ff7b6b]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer font-almodobar"
                >
                  {editingSlide ? 'Enregistrer les modifications' : 'Créer la bannière'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
