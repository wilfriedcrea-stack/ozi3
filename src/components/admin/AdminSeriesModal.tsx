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
  Star,
  Upload,
  Loader2,
  CheckCircle2,
  User,
  ShoppingBag,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Series, SeriesGenre, SeriesStatus, SeriesShopItem } from '../../types';
import { useData } from '../../context/DataContext';
import { compressImageToWebP, uploadToLWS } from '../../services/lwsUploadService';

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
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState(series?.authorPhotoUrl || '');
  const [authorBio, setAuthorBio] = useState(series?.authorBio || '');
  const [genre, setGenre] = useState<SeriesGenre>(series?.genre || 'Afro-Fantasy');
  const [country, setCountry] = useState(series?.country || 'Côte d\'Ivoire');
  const [releaseYear, setReleaseYear] = useState(series?.releaseYear || new Date().getFullYear());
  const [ageRating, setAgeRating] = useState<Series['ageRating']>(series?.ageRating || 'Tous publics');
  const [status, setStatus] = useState<SeriesStatus>(series?.status || 'ongoing');
  const [isExclusive, setIsExclusive] = useState(series?.isExclusive ?? true);
  const [synopsis, setSynopsis] = useState(series?.synopsis || '');
  const [coverUrl, setCoverUrl] = useState(series?.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80');
  const [bannerUrl, setBannerUrl] = useState(series?.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [tagsInput, setTagsInput] = useState(series?.tags?.join(', ') || 'Afro-Futurisme, Webtoon, Épique');

  // Shop Articles State
  const [shopArticles, setShopArticles] = useState<SeriesShopItem[]>(series?.shopArticles || []);
  const [isAddingShopItem, setIsAddingShopItem] = useState(false);
  const [newShopTitle, setNewShopTitle] = useState('');
  const [newShopImage, setNewShopImage] = useState('');
  const [newShopLink, setNewShopLink] = useState('');
  const [newShopPriceCfa, setNewShopPriceCfa] = useState<number>(10000);
  const [newShopPriceEur, setNewShopPriceEur] = useState<number>(15);
  const [newShopCategory, setNewShopCategory] = useState('Article Officiel');
  const [newShopDescription, setNewShopDescription] = useState('');

  const { addLwsFile } = useData();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingAuthorPhoto, setIsUploadingAuthorPhoto] = useState(false);
  const [isUploadingShopImage, setIsUploadingShopImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleUploadAuthorPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAuthorPhoto(true);
    try {
      setUploadStatus("Optimisation photo de profil de l'auteur...");
      const compressed = await compressImageToWebP(file, 400, 0.88);
      const res = await uploadToLWS(
        compressed.file,
        `author_${Date.now()}.webp`,
        'authors',
        { workId: series?.id }
      );
      const finalUrl = res.url || compressed.dataUrl;
      setAuthorPhotoUrl(finalUrl);
      if (res.fileInfo) addLwsFile(res.fileInfo);
      setUploadStatus("Photo de profil de l'auteur mise à jour !");
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error("Upload author photo error:", err);
      setUploadStatus("Erreur lors du transfert de la photo.");
    } finally {
      setIsUploadingAuthorPhoto(false);
    }
  };

  const handleUploadShopImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingShopImage(true);
    try {
      setUploadStatus("Optimisation de la photo du produit...");
      const compressed = await compressImageToWebP(file, 800, 0.88);
      const res = await uploadToLWS(
        compressed.file,
        `shop_${Date.now()}.webp`,
        'shop',
        { workId: series?.id }
      );
      const finalUrl = res.url || compressed.dataUrl;
      setNewShopImage(finalUrl);
      if (res.fileInfo) addLwsFile(res.fileInfo);
      setUploadStatus("Image du produit prête !");
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error("Upload shop image error:", err);
      setUploadStatus("Erreur lors du transfert de l'image.");
    } finally {
      setIsUploadingShopImage(false);
    }
  };

  const handleAddShopArticle = () => {
    if (!newShopTitle.trim() || !newShopImage.trim()) return;

    const newItem: SeriesShopItem = {
      id: `shop-${Date.now()}`,
      title: newShopTitle.trim(),
      category: newShopCategory.trim() || 'Article Officiel',
      image: newShopImage.trim(),
      linkUrl: newShopLink.trim() || undefined,
      priceCfa: Number(newShopPriceCfa) || 0,
      priceEur: Number(newShopPriceEur) || 0,
      description: newShopDescription.trim() || undefined
    };

    setShopArticles(prev => [...prev, newItem]);
    setNewShopTitle('');
    setNewShopImage('');
    setNewShopLink('');
    setNewShopDescription('');
    setIsAddingShopItem(false);
  };

  const handleRemoveShopArticle = (id: string) => {
    setShopArticles(prev => prev.filter(item => item.id !== id));
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'cover' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cover') setIsUploadingCover(true);
    else setIsUploadingBanner(true);

    try {
      setUploadStatus(`Optimisation WebP ${type === 'cover' ? 'couverture' : 'bannière'}...`);
      const width = type === 'cover' ? 800 : 1600;
      const compressed = await compressImageToWebP(file, width, 0.88);

      setUploadStatus(`Transfert vers stockage LWS (ozibd.net)...`);
      const res = await uploadToLWS(
        compressed.file,
        `${type}_${Date.now()}.webp`,
        type === 'cover' ? 'covers' : 'banners',
        { workId: series?.id }
      );

      if (res.success && res.url) {
        if (type === 'cover') setCoverUrl(res.url);
        else setBannerUrl(res.url);
        addLwsFile(res.fileInfo);
        setUploadStatus(`Image transférée avec succès sur LWS !`);
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } catch (err) {
      console.error(`Upload ${type} error:`, err);
      setUploadStatus(`Erreur lors du transfert du fichier.`);
    } finally {
      if (type === 'cover') setIsUploadingCover(false);
      else setIsUploadingBanner(false);
    }
  };

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
      authorPhotoUrl: authorPhotoUrl.trim(),
      authorBio: authorBio.trim(),
      shopArticles,
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
          seriesId: series?.id || 'new-series',
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

            {/* Author Profile Photo & Bio Fields */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <User className="w-4 h-4" />
                <span>Profil & Biographie de l'Auteur</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Photo de profil de l'auteur</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition-all">
                      {isUploadingAuthorPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      <span>{isUploadingAuthorPhoto ? 'Upload...' : 'Téléverser photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingAuthorPhoto}
                        onChange={handleUploadAuthorPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={authorPhotoUrl}
                    onChange={(e) => setAuthorPhotoUrl(e.target.value)}
                    placeholder="https://... ou téléversez ci-dessus"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-center p-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-lg bg-zinc-950 flex items-center justify-center">
                    {authorPhotoUrl ? (
                      <img 
                        src={authorPhotoUrl} 
                        alt="Photo auteur" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <User className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Texte de biographie de l'auteur
                </label>
                <textarea
                  rows={3}
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  placeholder="Parcours de l'auteur, influences artistiques, mot personnel pour la communauté OZI..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>
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
                onChange={(e) => setAgeRating(e.target.value as any)}
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

          {/* Media Links & LWS File Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Couverture (Portrait) *</label>
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition-all">
                  {isUploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  <span>{isUploadingCover ? 'Upload...' : 'Fichier vers LWS'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingCover}
                    onChange={(e) => handleUploadFile(e, 'cover')}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="url"
                required
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://ozibd.net/uploads/covers/... ou URL externe"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />

              {coverUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={coverUrl}
                    alt="Preview couverture"
                    className="w-12 h-16 object-cover rounded-lg border border-zinc-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] text-zinc-400 truncate">
                    <span className="text-emerald-400 font-semibold block">Aperçu couverture</span>
                    <span className="truncate block opacity-75">{coverUrl}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Bannière (Paysage) *</label>
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold cursor-pointer transition-all">
                  {isUploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  <span>{isUploadingBanner ? 'Upload...' : 'Fichier vers LWS'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingBanner}
                    onChange={(e) => handleUploadFile(e, 'banner')}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="url"
                required
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://ozibd.net/uploads/banners/... ou URL externe"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />

              {bannerUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={bannerUrl}
                    alt="Preview bannière"
                    className="w-24 h-12 object-cover rounded-lg border border-zinc-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] text-zinc-400 truncate">
                    <span className="text-emerald-400 font-semibold block">Aperçu bannière</span>
                    <span className="truncate block opacity-75">{bannerUrl}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {uploadStatus && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {/* Boutique & Articles Dérivés de l'œuvre */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Articles & Produits de la Boutique ({shopArticles.length})</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Associez des produits dérivés (Artbooks, T-shirts, Goodies) directement à cette œuvre.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingShopItem(!isAddingShopItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingShopItem ? 'Fermer le formulaire' : 'Ajouter un produit'}</span>
              </button>
            </div>

            {/* List of existing shop articles */}
            {shopArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shopArticles.map((art) => (
                  <div key={art.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between group">
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                        <img 
                          src={art.image} 
                          alt={art.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-orange-400 font-mono block truncate">
                          {art.category || 'Article'}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{art.title}</h4>
                        <p className="text-[11px] font-bold text-emerald-400 font-mono mt-0.5">
                          {art.priceCfa?.toLocaleString('fr-FR')} FCFA{' '}
                          <span className="text-zinc-500 text-[10px]">({art.priceEur} €)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
                      {art.linkUrl ? (
                        <a 
                          href={art.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold truncate max-w-[170px]"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">Lien boutique</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Pas de lien externe</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveShopArticle(art.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Supprimer ce produit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isAddingShopItem && (
                <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  Aucun produit dérivé configuré pour cette œuvre. Cliquez sur « Ajouter un produit » pour en créer un.
                </div>
              )
            )}

            {/* Form to add a new shop article */}
            {isAddingShopItem && (
              <div className="p-4 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/40 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                  <span className="text-xs font-bold text-white">Nouveau Produit de la Boutique</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingShopItem(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Nom / Titre de l'article *
                    </label>
                    <input
                      type="text"
                      value={newShopTitle}
                      onChange={(e) => setNewShopTitle(e.target.value)}
                      placeholder="Ex: Artbook Collector Tome 1"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={newShopCategory}
                      onChange={(e) => setNewShopCategory(e.target.value)}
                      placeholder="Ex: Livre & Édition, Vêtements..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Photo & Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-300">Photo du produit *</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[10px] font-bold cursor-pointer transition-all">
                      {isUploadingShopImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      <span>{isUploadingShopImage ? 'Upload...' : 'Téléverser photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingShopImage}
                        onChange={handleUploadShopImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={newShopImage}
                    onChange={(e) => setNewShopImage(e.target.value)}
                    placeholder="https://... ou téléversez ci-dessus"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                  {newShopImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={newShopImage} 
                        alt="Aperçu produit" 
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-700" 
                      />
                      <span className="text-[10px] text-emerald-400 font-semibold">Photo prête</span>
                    </div>
                  )}
                </div>

                {/* Boutique Link */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    Lien vers la boutique / page d'achat
                  </label>
                  <input
                    type="url"
                    value={newShopLink}
                    onChange={(e) => setNewShopLink(e.target.value)}
                    placeholder="https://ozibd.net/boutique/... ou lien externe de paiement"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={newShopPriceCfa}
                      onChange={(e) => setNewShopPriceCfa(Number(e.target.value))}
                      placeholder="10000"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Prix (EUR €)</label>
                    <input
                      type="number"
                      value={newShopPriceEur}
                      onChange={(e) => setNewShopPriceEur(Number(e.target.value))}
                      placeholder="15"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Description courte (optionnelle)</label>
                  <input
                    type="text"
                    value={newShopDescription}
                    onChange={(e) => setNewShopDescription(e.target.value)}
                    placeholder="Ex: T-shirt 100% coton bio collector avec sérigraphie haute définition"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingShopItem(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddShopArticle}
                    disabled={!newShopTitle.trim() || !newShopImage.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter cet article</span>
                  </button>
                </div>
              </div>
            )}
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
