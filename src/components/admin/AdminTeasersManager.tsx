import React, { useState } from 'react';
import { 
  Film, 
  Plus, 
  Trash2, 
  Play, 
  Clock, 
  Eye, 
  Save, 
  X,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { VideoTeaser } from '../../types';

export const AdminTeasersManager: React.FC = () => {
  const { teasers, addTeaser, updateTeaser, deleteTeaser, openTeaserModal, series } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeaser, setEditingTeaser] = useState<VideoTeaser | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    seriesTitle: '',
    seriesId: '',
    duration: '01:30',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    type: 'trailer' as 'trailer' | 'motion_comic' | 'interview',
    description: ''
  });

  const handleOpenNew = () => {
    setEditingTeaser(null);
    setFormData({
      title: '',
      seriesTitle: series[0]?.title || '',
      seriesId: series[0]?.id || '',
      duration: '01:45',
      thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      type: 'trailer',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: VideoTeaser) => {
    setEditingTeaser(t);
    setFormData({
      title: t.title,
      seriesTitle: t.seriesTitle || '',
      seriesId: t.seriesId || '',
      duration: t.duration,
      thumbnailUrl: t.thumbnailUrl,
      videoUrl: t.videoUrl,
      type: t.type,
      description: t.description
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.thumbnailUrl) return;

    if (editingTeaser) {
      await updateTeaser(editingTeaser.id, formData);
    } else {
      await addTeaser({
        ...formData,
        viewsCount: Math.floor(Math.random() * 2000) + 1200
      });
    }

    setModalOpen(false);
    setEditingTeaser(null);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Gestion des Teasers & Motion Comics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Publiez des vidéos promotionnelles et des teasers pour booster les lectures de vos séries.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Teaser Vidéo</span>
        </button>
      </div>

      {/* Grid of teasers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teasers.map((t) => (
          <div key={t.id} className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between gap-4 shadow-xl">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950">
              <img src={t.thumbnailUrl} alt={t.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => openTeaserModal(t)}
                  className="w-12 h-12 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                </button>
              </div>
              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950/80 text-orange-400 border border-orange-500/30">
                {t.type === 'trailer' ? 'Trailer' : t.type === 'motion_comic' ? 'Motion Comic' : 'Interview'}
              </span>
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-zinc-950/80 text-[10px] font-mono text-zinc-300">
                {t.duration}
              </span>
            </div>

            <div>
              {t.seriesTitle && (
                <span className="text-[11px] font-semibold text-amber-400 block">{t.seriesTitle}</span>
              )}
              <h3 className="text-base font-bold text-white line-clamp-1">{t.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{t.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
              <span className="text-zinc-500">{t.viewsCount.toLocaleString()} vues</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  title="Modifier"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer le teaser "${t.title}" ?`)) deleteTeaser(t.id);
                  }}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-900/40 text-rose-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-700 p-6 sm:p-8 text-zinc-100 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white">
                {editingTeaser ? 'Modifier le Teaser' : 'Ajouter un Nouveau Teaser'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Titre de la vidéo *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Trailer Officiel - Saison 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Série Associée</label>
                  <select
                    value={formData.seriesId}
                    onChange={(e) => {
                      const sel = series.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        seriesId: e.target.value,
                        seriesTitle: sel ? sel.title : ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Aucune</option>
                    {series.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="trailer">Bande-Annonce</option>
                    <option value="motion_comic">Motion Comic</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Durée (MM:SS)</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="01:45"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">URL Vignette Image *</label>
                  <input
                    type="url"
                    required
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails du teaser..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 text-zinc-950 text-xs font-black"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
