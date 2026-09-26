import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Lock, 
  Unlock, 
  Clock, 
  Sparkles,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Series, Chapter } from '../../types';
import { AdminSeriesModal } from './AdminSeriesModal';
import { AdminChapterEditorModal } from './AdminChapterEditorModal';

export const AdminSeriesManager: React.FC = () => {
  const { 
    series, 
    addSeries, 
    updateSeries, 
    deleteSeries, 
    addChapter, 
    updateChapter, 
    deleteChapter,
    openReader,
    openOeuvrePage,
    refreshCatalogueFromFirestore,
    isRefreshingCatalogue
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tous');
  const [selectedFormat, setSelectedFormat] = useState('Tous');
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(series[0]?.id || null);
  const [refreshedNotice, setRefreshedNotice] = useState(false);

  // Modals state
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [targetSeriesForChapter, setTargetSeriesForChapter] = useState<Series | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Reliable In-App Confirmation Modal (no blocked window.confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { type: 'series'; id: string; title: string }
    | { type: 'chapter'; seriesId: string; chapterId: string; title: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleManualRefresh = async () => {
    await refreshCatalogueFromFirestore();
    setRefreshedNotice(true);
    setTimeout(() => setRefreshedNotice(false), 2500);
  };

  const filteredSeries = series.filter(s => {
    const matchesGenre = selectedGenre === 'Tous' || s.genre === selectedGenre || (s.secondaryGenres && s.secondaryGenres.includes(selectedGenre as any));
    const itemFormat = (s.format || (s.chaptersCount > 1 ? 'série' : 'film')).toLowerCase();
    const matchesFormat = selectedFormat === 'Tous' || itemFormat === selectedFormat.toLowerCase();
    const cleanSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !cleanSearch ||
      (s.title || '').toLowerCase().includes(cleanSearch) ||
      (s.author || '').toLowerCase().includes(cleanSearch) ||
      (s.artist || '').toLowerCase().includes(cleanSearch) ||
      (s.slug || '').toLowerCase().includes(cleanSearch) ||
      (s.country || '').toLowerCase().includes(cleanSearch) ||
      (s.synopsis || '').toLowerCase().includes(cleanSearch) ||
      (s.tags || []).some(t => t.toLowerCase().includes(cleanSearch));
    return matchesGenre && matchesFormat && matchesSearch;
  });

  const handleOpenNewSeries = () => {
    setEditingSeries(null);
    setSeriesModalOpen(true);
  };

  const handleOpenEditSeries = (s: Series) => {
    setEditingSeries(s);
    setSeriesModalOpen(true);
  };

  const handleSaveSeries = async (data: Partial<Series>) => {
    if (editingSeries) {
      await updateSeries(editingSeries.id, data);
    } else {
      await addSeries(data as any);
    }
    setSeriesModalOpen(false);
    setEditingSeries(null);
  };

  const handleDeleteSeries = (id: string, title: string) => {
    setDeleteConfirmTarget({ type: 'series', id, title });
  };

  const handleOpenNewChapter = (s: Series) => {
    setTargetSeriesForChapter(s);
    setEditingChapter(null);
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (s: Series, ch: Chapter) => {
    setTargetSeriesForChapter(s);
    setEditingChapter(ch);
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async (chapterData: Partial<Chapter>) => {
    if (!targetSeriesForChapter) return;

    if (editingChapter) {
      await updateChapter(targetSeriesForChapter.id, editingChapter.id, chapterData);
    } else {
      await addChapter(targetSeriesForChapter.id, chapterData as any);
    }
    setChapterModalOpen(false);
    setTargetSeriesForChapter(null);
    setEditingChapter(null);
  };

  const handleDeleteChapter = (seriesId: string, chapterId: string, title: string) => {
    setDeleteConfirmTarget({ type: 'chapter', seriesId, chapterId, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'series') {
        await deleteSeries(deleteConfirmTarget.id);
      } else {
        await deleteChapter(deleteConfirmTarget.seriesId, deleteConfirmTarget.chapterId);
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Catalogue & Studio des Épisodes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400">
              {filteredSeries.length} / {series.length} œuvres
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gérez vos séries et films, vérifiez leur statut en ligne et programmez les parutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshingCatalogue}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs font-semibold transition-all"
            title="Recharger le catalogue depuis Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingCatalogue ? 'animate-spin' : ''}`} />
            <span>{refreshedNotice ? 'Synchronisé !' : 'Actualiser'}</span>
          </button>

          <button
            onClick={handleOpenNewSeries}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Nouvelle Série</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur, artiste, tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Tous les genres ({series.length})</option>
            <option value="Afro-Fantasy">Afro-Fantasy</option>
            <option value="Sci-Fi & Cyberpunk">Sci-Fi & Cyberpunk</option>
            <option value="Action & Shonen">Action & Shonen</option>
            <option value="Romance & Drame">Romance & Drame</option>
            <option value="Mythologie & Histoire">Mythologie & Histoire</option>
            <option value="Thriller & Mystère">Thriller & Mystère</option>
            <option value="Arts Martiaux">Arts Martiaux</option>
            <option value="Comédie">Comédie</option>
            <option value="Jeunesse & Aventure">Jeunesse & Aventure</option>
            <option value="Horreur">Horreur</option>
            <option value="Seinen">Seinen</option>
            <option value="Tranche de vie">Tranche de vie</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Tous les formats</option>
            <option value="série">Séries</option>
            <option value="film">Films</option>
          </select>
        </div>
      </div>

      {/* Series List Accordion */}
      <div className="space-y-4">
        {filteredSeries.map((s) => {
          const isExpanded = expandedSeriesId === s.id;
          const chapters = s.chapters || [];

          return (
            <div
              key={s.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                isExpanded 
                  ? 'bg-zinc-900 border-amber-500/50 shadow-2xl' 
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Series Summary Bar */}
              <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <img 
                    src={s.coverUrl} 
                    alt={s.title} 
                    className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl object-cover border border-zinc-700 shrink-0 shadow-md"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                        {s.genre}
                      </span>
                      {s.format && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                          {s.format}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        En ligne
                      </span>
                      {s.isExclusive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/90 text-white">
                          Exclu OZI
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {s.country} • Par <strong className="text-zinc-200">{s.author}</strong>
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {s.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{s.rating} ({s.reviewsCount} avis)</span>
                      </div>
                      <span>•</span>
                      <span>{chapters.length} chapitres</span>
                      <span>•</span>
                      <span>{s.totalReads.toLocaleString()} lectures</span>
                    </div>
                  </div>
                </div>

                {/* Series Action Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => openOeuvrePage(s.id)}
                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Voir la page de l'œuvre sur le site public"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Sur le site</span>
                  </button>

                  <button
                    onClick={() => openReader(s.id)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Aperçu du lecteur"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Lecteur</span>
                  </button>

                  <button
                    onClick={() => handleOpenNewChapter(s)}
                    className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Ajouter un chapitre à cette série"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter Épisode</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditSeries(s)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold"
                    title="Modifier les métadonnées de la série"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteSeries(s.id, s.title)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 text-xs font-semibold"
                    title="Supprimer la série"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setExpandedSeriesId(isExpanded ? null : s.id)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* Expandable Chapter List */}
              {isExpanded && (
                <div className="p-4 sm:p-6 bg-zinc-950/80 border-t border-zinc-800 flex flex-col gap-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Épisodes Publiés ({chapters.length})</span>
                    </h4>
                    <button
                      onClick={() => handleOpenNewChapter(s)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Publier le Chapitre {chapters.length + 1}</span>
                    </button>
                  </div>

                  {chapters.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {chapters.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-amber-400 border border-zinc-700">
                              {ch.chapterNumber}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  {ch.title}
                                </span>
                                {ch.isFree ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    Gratuit
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                    {ch.coinsRequired} Pièces
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{ch.readTimeMinutes} min</span>
                                <span>•</span>
                                <span>{ch.pages.length} planches</span>
                                <span>•</span>
                                <span>{ch.releaseDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openReader(s.id, ch.id)}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                              title="Lire ce chapitre"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditChapter(s, ch)}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                              title="Modifier planches & accès"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(s.id, ch.id, ch.title)}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400"
                              title="Supprimer le chapitre"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400">
                      Aucun épisode publié pour cette série. Cliquez sur « Ajouter Épisode » pour uploader vos premières planches.
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Series Modal */}
      {seriesModalOpen && (
        <AdminSeriesModal
          series={editingSeries}
          onClose={() => { setSeriesModalOpen(false); setEditingSeries(null); }}
          onSave={handleSaveSeries}
        />
      )}

      {/* Chapter Modal */}
      {chapterModalOpen && targetSeriesForChapter && (
        <AdminChapterEditorModal
          series={targetSeriesForChapter}
          chapter={editingChapter}
          onClose={() => { setChapterModalOpen(false); setTargetSeriesForChapter(null); setEditingChapter(null); }}
          onSave={handleSaveChapter}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12131a] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {deleteConfirmTarget.type === 'series' ? 'Supprimer cette œuvre ?' : 'Supprimer cet épisode ?'}
                </h3>
                <p className="text-xs text-zinc-400">Cette action est définitive et synchronisée avec le cloud</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-6 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-white">« {deleteConfirmTarget.title} »</strong> ?{' '}
              {deleteConfirmTarget.type === 'series' && "Tous les épisodes associés seront également retirés définitivement du site et de l'application."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-rose-900/40 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
