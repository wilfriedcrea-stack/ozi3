import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Image as ImageIcon, 
  Globe, 
  BookOpen, 
  Tag, 
  ShieldCheck,
  Star
} from 'lucide-react';
import { Series, SeriesGenre } from '../../types';

interface AdminSeriesModalProps {
  series: Series | null;
  onClose: () => void;
  onSave: (data: Partial<Series>) => void;
}

const ALL_GENRES: SeriesGenre[] = [
  'Afro-Fantasy',
  'Sci-Fi & Cyberpunk',
  'Action & Shonen',
  'Romance & Drame',
  'Mythologie & Histoire',
  'Thriller & Mystère',
  'Arts Martiaux',
  'Jeunesse & Aventure'
];

export const AdminSeriesModal: React.FC<AdminSeriesModalProps> = ({ series, onClose, onSave }) => {
  const [title, setTitle] = useState(series?.title || '');
  const [author, setAuthor] = useState(series?.author || '');
  const [artist, setArtist] = useState(series?.artist || '');
  const [genre, setGenre] = useState<SeriesGenre>(series?.genre || 'Afro-Fantasy');
  const [country, setCountry] = useState(series?.country || 'Côte d\'Ivoire');
  const [releaseYear, setReleaseYear] = useState(series?.releaseYear || new Date().getFullYear());
  const [ageRating, setAgeRating] = useState(series?.ageRating || 'Tous publics');
  const [status, setStatus] = useState<'ongoing' | 'completed'>(series?.status || 'ongoing');
  const [isExclusive, setIsExclusive] = useState(series?.isExclusive ?? true);
  const [synopsis, setSynopsis] = useState(series?.synopsis || '');
  const [coverUrl, setCoverUrl] = useState(series?.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80');
  const [bannerUrl, setBannerUrl] = useState(series?.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [tagsInput, setTagsInput] = useState(series?.tags?.join(', ') || 'Afro-Futurisme, Webtoon, Épique');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !synopsis.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      author: author.trim(),
      artist: artist.trim() || author.trim(),
      genre,
      country,
      releaseYear: Number(releaseYear),
      ageRating,
      status,
      isExclusive,
      synopsis: synopsis.trim(),
      coverUrl: coverUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      tags: tags.length > 0 ? tags : ['Webtoon', 'OZI'],
      rating: series?.rating || 4.9,
      reviewsCount: series?.reviewsCount || 120,
      totalReads: series?.totalReads || 1500,
      totalLikes: series?.totalLikes || 450,
      chaptersCount: series?.chaptersCount || (series?.chapters?.length || 1),
      chapters: series?.chapters || [
        {
          id: `ch-1-${Date.now()}`,
          chapterNumber: 1,
          title: 'Prologue : L\'Appel des Racines',
          pages: [
            'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80'
          ],
          isFree: true,
          coinsRequired: 0,
          readTimeMinutes: 4,
          releaseDate: new Date().toISOString().split('T')[0],
          likesCount: 150,
          viewsCount: 1200,
          summary: 'Le commencement de la légende.'
        }
      ]
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 sm:p-8 text-zinc-100 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Éditeur de Séries OZI
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {series ? `Modifier : ${series.title}` : 'Créer une Nouvelle Série'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Titre de la Série *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: La Légende de Kemet"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Auteur / Scénariste *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Kofi Mensah"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Dessinateur / Artiste</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Kwame Diawara"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Genre Principal *</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as SeriesGenre)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {ALL_GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Pays d'Origine</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ex: Côte d'Ivoire, Sénégal, Bénin..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="ongoing">En cours de parution</option>
                <option value="completed">Série Terminée</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Classification d'âge</label>
              <select
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Tous publics">Tous publics</option>
                <option value="12+">12+ (Ados)</option>
                <option value="16+">16+ (Jeunes Adultes)</option>
                <option value="18+">18+ (Public Averti)</option>
              </select>
            </div>
          </div>

          {/* Exclusivity switch */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Exclusivité OZI Original</span>
              <span className="text-[11px] text-zinc-400">
                Affiche le badge d'exclusivité violet et met en avant la série sur l'application.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExclusive(!isExclusive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isExclusive ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isExclusive ? 'Oui (Exclusivité)' : 'Non (Standard)'}
            </button>
          </div>

          {/* Synopsis */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Synopsis & Histoire Complète *</label>
            <textarea
              rows={4}
              required
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Racontez le synopsis captivant de la série..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Media Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">URL Image de Couverture (Portrait) *</label>
              <input
                type="url"
                required
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">URL Bannière Haute Résolution *</label>
              <input
                type="url"
                required
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Action, Magie, Royaumes, Guerriers..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la Série & Sync Firestore</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
