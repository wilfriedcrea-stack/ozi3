import React, { useState } from 'react';
import { 
  Newspaper, 
  Plus, 
  Trash2, 
  Calendar, 
  Save, 
  X, 
  FileText, 
  Download, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PressRelease, MediaKitAsset } from '../../types';

export const AdminPressManager: React.FC = () => {
  const { pressReleases, addPressRelease, updatePressRelease, deletePressRelease, mediaKit } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPress, setEditingPress] = useState<PressRelease | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    category: 'Lancement',
    summary: '',
    content: '',
    author: 'Direction de la Communication OZI'
  });

  const handleOpenNew = () => {
    setEditingPress(null);
    setFormData({
      title: '',
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: 'Annonce Stratégique',
      summary: '',
      content: '',
      author: 'Direction de la Communication OZI'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: PressRelease) => {
    setEditingPress(p);
    setFormData({
      title: p.title,
      date: p.date,
      category: p.category,
      summary: p.summary,
      content: p.content,
      author: p.author
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    if (editingPress) {
      await updatePressRelease(editingPress.id, formData);
    } else {
      await addPressRelease(formData);
    }

    setModalOpen(false);
    setEditingPress(null);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Espace Presse & Media Kit
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Publiez vos communiqués officiels et gérez les ressources pour les journalistes et partenaires.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Publier un Communiqué</span>
        </button>
      </div>

      {/* Press Releases List */}
      <div className="space-y-4">
        {pressReleases.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {p.category}
                </span>
                <span className="text-xs text-zinc-500">{p.date}</span>
                <span className="text-xs text-zinc-600">• {p.author}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">{p.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{p.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenEdit(p)}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer le communiqué "${p.title}" ?`)) deletePressRelease(p.id);
                }}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700 p-6 sm:p-8 text-zinc-100 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white">
                {editingPress ? 'Modifier le Communiqué' : 'Nouveau Communiqué de Presse'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Titre du Communiqué *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: OZI boucle son tour d'amorçage pour accélérer la BD panafricaine"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Lancement, Partenariat, Édition..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Date de parution</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Résumé / Chapô *</label>
                <input
                  type="text"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="En une ou deux phrases percutantes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Corps Complet du Communiqué *</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Texte intégral du communiqué..."
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
                  className="px-5 py-2 rounded-xl bg-sky-500 text-zinc-950 text-xs font-black"
                >
                  Enregistrer & Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
