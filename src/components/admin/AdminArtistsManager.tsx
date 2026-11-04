import React, { useState } from 'react';
import { 
  Palette, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Globe, 
  Sparkles, 
  Download, 
  DollarSign, 
  Check, 
  X, 
  Search, 
  User, 
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Phone,
  Mail,
  Calendar,
  Layers,
  Star,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  Youtube,
  Instagram,
  Twitter
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Artist, Artbook } from '../../types';

export const AdminArtistsManager: React.FC = () => {
  const { 
    artists, 
    artbooks, 
    artbookDownloads, 
    artbookPurchases, 
    addArtist, 
    updateArtist, 
    deleteArtist, 
    addArtbook, 
    updateArtbook, 
    deleteArtbook, 
    openArtistPage, 
    openArtbookPage 
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'artists' | 'artbooks' | 'activity'>('artists');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const [artbookModalOpen, setArtbookModalOpen] = useState(false);
  const [editingArtbook, setEditingArtbook] = useState<Artbook | null>(null);
  const [artbookModalTab, setArtbookModalTab] = useState<'general' | 'preview' | 'link'>('general');
  const [copiedArtbookLinkId, setCopiedArtbookLinkId] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'artist' | 'artbook' | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Artist Form State
  const [artistForm, setArtistForm] = useState<{
    name: string;
    photoUrl: string;
    bannerUrl: string;
    country: string;
    bio: string;
    specialties: string[];
    featuredSeriesTitle: string;
    instagram: string;
    twitter: string;
    artstation: string;
    youtube: string;
  }>({
    name: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bannerUrl: '',
    country: 'Côte d\'Ivoire',
    bio: '',
    specialties: ['Concept Art', 'Illustration'],
    featuredSeriesTitle: '',
    instagram: '',
    twitter: '',
    artstation: '',
    youtube: ''
  });

  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  // Artbook Form State
  const [artbookForm, setArtbookForm] = useState<{
    artistId: string;
    artistName: string;
    title: string;
    description: string;
    coverUrl: string;
    previewImages: [string, string, string, string, string];
    price: number;
    isFree: boolean;
    pageCount: number;
    releaseYear: number;
    tags: string[];
    fileSizeFormatted: string;
    downloadUrl: string;
    rating: number;
  }>({
    artistId: artists[0]?.id || '',
    artistName: artists[0]?.name || '',
    title: '',
    description: '',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 0,
    isFree: true,
    pageCount: 64,
    releaseYear: new Date().getFullYear(),
    tags: ['Artbook', 'Concept Art'],
    fileSizeFormatted: '45 Mo',
    downloadUrl: '',
    rating: 4.9
  });

  const [newTagInput, setNewTagInput] = useState('');

  // Total stats
  const totalArtbookDownloadsCount = artbookDownloads.length + artbooks.reduce((acc, a) => acc + (a.downloadsCount || 0), 0);
  const totalPurchasesRevenueXof = artbookPurchases
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + (p.priceXof || 0), 0);

  // Open modal handlers
  const handleOpenAddArtist = () => {
    setEditingArtist(null);
    setArtistForm({
      name: '',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bannerUrl: '',
      country: 'Côte d\'Ivoire',
      bio: '',
      specialties: ['Concept Art', 'Peinture Digitale'],
      featuredSeriesTitle: '',
      instagram: '',
      twitter: '',
      artstation: '',
      youtube: ''
    });
    setArtistModalOpen(true);
  };

  const handleOpenEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setArtistForm({
      name: artist.name,
      photoUrl: artist.photoUrl,
      bannerUrl: artist.bannerUrl || '',
      country: artist.country || 'Côte d\'Ivoire',
      bio: artist.bio,
      specialties: artist.specialties || [],
      featuredSeriesTitle: artist.featuredSeriesTitle || '',
      instagram: artist.socials?.instagram || '',
      twitter: artist.socials?.twitter || '',
      artstation: artist.socials?.artstation || '',
      youtube: artist.socials?.youtube || ''
    });
    setArtistModalOpen(true);
  };

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistForm.name.trim()) return;

    if (editingArtist) {
      await updateArtist(editingArtist.id, {
        name: artistForm.name.trim(),
        photoUrl: artistForm.photoUrl.trim(),
        bannerUrl: artistForm.bannerUrl.trim() || undefined,
        country: artistForm.country.trim(),
        bio: artistForm.bio.trim(),
        specialties: artistForm.specialties,
        featuredSeriesTitle: artistForm.featuredSeriesTitle.trim() || undefined,
        socials: {
          instagram: artistForm.instagram.trim() || undefined,
          twitter: artistForm.twitter.trim() || undefined,
          artstation: artistForm.artstation.trim() || undefined,
          youtube: artistForm.youtube.trim() || undefined
        }
      });
      setSaveNotice(`Artiste "${artistForm.name}" mis à jour avec succès.`);
    } else {
      await addArtist({
        name: artistForm.name.trim(),
        photoUrl: artistForm.photoUrl.trim(),
        bannerUrl: artistForm.bannerUrl.trim() || undefined,
        country: artistForm.country.trim(),
        bio: artistForm.bio.trim(),
        specialties: artistForm.specialties,
        artbookIds: [],
        featuredSeriesTitle: artistForm.featuredSeriesTitle.trim() || undefined,
        socials: {
          instagram: artistForm.instagram.trim() || undefined,
          twitter: artistForm.twitter.trim() || undefined,
          artstation: artistForm.artstation.trim() || undefined,
          youtube: artistForm.youtube.trim() || undefined
        }
      });
      setSaveNotice(`Nouvel artiste "${artistForm.name}" ajouté avec succès.`);
    }

    setArtistModalOpen(false);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleOpenAddArtbook = () => {
    setEditingArtbook(null);
    setArtbookModalTab('general');
    const defaultArtist = artists[0];
    setArtbookForm({
      artistId: defaultArtist?.id || '',
      artistName: defaultArtist?.name || 'Artiste OZI',
      title: '',
      description: '',
      coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
      previewImages: [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'
      ],
      price: 0,
      isFree: true,
      pageCount: 64,
      releaseYear: new Date().getFullYear(),
      tags: ['Artbook', 'Concept Art'],
      fileSizeFormatted: '45 Mo',
      downloadUrl: '',
      rating: 4.9
    });
    setArtbookModalOpen(true);
  };

  const handleOpenEditArtbook = (artbook: Artbook, initialTab: 'general' | 'preview' | 'link' = 'general') => {
    setEditingArtbook(artbook);
    setArtbookModalTab(initialTab);
    setArtbookForm({
      artistId: artbook.artistId,
      artistName: artbook.artistName,
      title: artbook.title,
      description: artbook.description,
      coverUrl: artbook.coverUrl,
      previewImages: [
        artbook.previewImages[0] || '',
        artbook.previewImages[1] || '',
        artbook.previewImages[2] || '',
        artbook.previewImages[3] || '',
        artbook.previewImages[4] || ''
      ],
      price: artbook.price || 0,
      isFree: artbook.isFree,
      pageCount: artbook.pageCount,
      releaseYear: artbook.releaseYear,
      tags: artbook.tags || [],
      fileSizeFormatted: artbook.fileSizeFormatted,
      downloadUrl: artbook.downloadUrl || artbook.pdfDownloadUrl || '',
      rating: artbook.rating || 4.9
    });
    setArtbookModalOpen(true);
  };

  const handleSaveArtbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artbookForm.title.trim()) return;

    const selectedArtObj = artists.find(a => a.id === artbookForm.artistId);
    const finalArtistName = selectedArtObj?.name || artbookForm.artistName || 'Artiste OZI';
    const cleanDownloadUrl = artbookForm.downloadUrl.trim();

    if (editingArtbook) {
      await updateArtbook(editingArtbook.id, {
        artistId: artbookForm.artistId,
        artistName: finalArtistName,
        title: artbookForm.title.trim(),
        description: artbookForm.description.trim(),
        coverUrl: artbookForm.coverUrl.trim(),
        previewImages: artbookForm.previewImages,
        price: Number(artbookForm.price),
        isFree: Number(artbookForm.price) === 0,
        pageCount: Number(artbookForm.pageCount),
        releaseYear: Number(artbookForm.releaseYear),
        tags: artbookForm.tags,
        fileSizeFormatted: artbookForm.fileSizeFormatted.trim(),
        downloadUrl: cleanDownloadUrl || undefined,
        pdfDownloadUrl: cleanDownloadUrl || undefined,
        rating: Number(artbookForm.rating)
      });
      setSaveNotice(`Artbook "${artbookForm.title}" mis à jour.`);
    } else {
      await addArtbook({
        artistId: artbookForm.artistId,
        artistName: finalArtistName,
        title: artbookForm.title.trim(),
        description: artbookForm.description.trim(),
        coverUrl: artbookForm.coverUrl.trim(),
        previewImages: artbookForm.previewImages,
        price: Number(artbookForm.price),
        isFree: Number(artbookForm.price) === 0,
        pageCount: Number(artbookForm.pageCount),
        releaseYear: Number(artbookForm.releaseYear),
        tags: artbookForm.tags,
        fileSizeFormatted: artbookForm.fileSizeFormatted.trim(),
        downloadUrl: cleanDownloadUrl || undefined,
        pdfDownloadUrl: cleanDownloadUrl || undefined,
        rating: Number(artbookForm.rating)
      });
      setSaveNotice(`Nouvel artbook "${artbookForm.title}" publié avec succès.`);
    }

    setArtbookModalOpen(false);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || !deleteType) return;
    if (deleteType === 'artist') {
      await deleteArtist(deleteConfirmId);
      setSaveNotice('Artiste supprimé.');
    } else if (deleteType === 'artbook') {
      await deleteArtbook(deleteConfirmId);
      setSaveNotice('Artbook supprimé.');
    }
    setDeleteConfirmId(null);
    setDeleteType(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Filtered artists
  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.country && a.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered artbooks
  const filteredArtbooks = artbooks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-[#090a0f] min-h-screen text-slate-100">
      
      {/* Top Notification */}
      {saveNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{saveNotice}</span>
          </div>
          <button onClick={() => setSaveNotice(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artistes Actifs</div>
            <div className="text-2xl font-black text-white mt-1 font-almodobar">{artists.length}</div>
            <div className="text-[11px] text-purple-400 mt-1">Illustrateurs & Créateurs</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Palette className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artbooks Publiés</div>
            <div className="text-2xl font-black text-white mt-1 font-almodobar">{artbooks.length}</div>
            <div className="text-[11px] text-[#ff8679] mt-1">{artbooks.filter(a => a.isFree).length} Gratuits • {artbooks.filter(a => !a.isFree).length} Payants</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#ff8679]/10 border border-[#ff8679]/30 flex items-center justify-center text-[#ff8679]">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Téléchargements PDF</div>
            <div className="text-2xl font-black text-white mt-1 font-almodobar">{totalArtbookDownloadsCount.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 mt-1">{artbookDownloads.length} formulaires enregistrés</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Download className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes & Commandes</div>
            <div className="text-2xl font-black text-white mt-1 font-almodobar">{totalPurchasesRevenueXof.toLocaleString()} FCFA</div>
            <div className="text-[11px] text-amber-400 mt-1">{artbookPurchases.length} transactions Paystack/Mobile</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tabs and Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#11121c] border border-slate-800">
          <button
            onClick={() => setActiveSubTab('artists')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'artists'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Artistes ({artists.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('artbooks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'artbooks'
                ? 'bg-[#ff8679] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Artbooks ({artbooks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Téléchargements & Ventes ({artbookDownloads.length + artbookPurchases.length})</span>
          </button>
        </div>

        {/* Search & New buttons */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#11121c] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff8679]"
            />
          </div>

          {activeSubTab === 'artists' && (
            <button
              onClick={handleOpenAddArtist}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Artiste</span>
            </button>
          )}

          {activeSubTab === 'artbooks' && (
            <button
              onClick={handleOpenAddArtbook}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white text-xs font-bold transition-all shadow-md shadow-[#ff8679]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Artbook</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ARTISTS LIST VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'artists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map(artist => {
            const artistArtbooksCount = artbooks.filter(b => b.artistId === artist.id || b.artistName.toLowerCase() === artist.name.toLowerCase()).length;
            return (
              <div 
                key={artist.id}
                className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#ff8679] to-purple-600 shrink-0">
                        <img 
                          src={artist.photoUrl} 
                          alt="" 
                          className="w-full h-full object-cover rounded-full bg-slate-900" 
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{artist.name}</span>
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{artist.country || 'Non spécifié'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-bold">
                      {artistArtbooksCount} {artistArtbooksCount > 1 ? 'Artbooks' : 'Artbook'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {artist.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {artist.specialties?.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                        {s}
                      </span>
                    ))}
                  </div>

                  {artist.featuredSeriesTitle && (
                    <div className="text-xs text-slate-400 mb-2">
                      Univers phare : <strong className="text-white">{artist.featuredSeriesTitle}</strong>
                    </div>
                  )}

                  {/* Social links mini strip */}
                  {(artist.socials?.youtube || artist.socials?.instagram || artist.socials?.twitter || artist.socials?.artstation) && (
                    <div className="flex items-center gap-1.5 mb-3 pt-1">
                      {artist.socials?.youtube && (
                        <a
                          href={artist.socials.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
                          title="Chaîne YouTube"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {artist.socials?.instagram && (
                        <a
                          href={artist.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-pink-400 hover:text-pink-300 hover:border-pink-500/40 transition-colors"
                          title="Instagram"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {artist.socials?.twitter && (
                        <a
                          href={artist.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 hover:border-sky-500/40 transition-colors"
                          title="X / Twitter"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {artist.socials?.artstation && (
                        <a
                          href={artist.socials.artstation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                          title="Artstation"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openArtistPage(artist.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Voir sur la vitrine publique"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                    <span>Page Publique</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditArtist(artist)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      title="Modifier l'artiste"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteConfirmId(artist.id);
                        setDeleteType('artist');
                      }}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Supprimer l'artiste"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ARTBOOKS LIST VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'artbooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtbooks.map(artbook => {
            return (
              <div 
                key={artbook.id}
                className="p-5 rounded-2xl bg-[#11121c] border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={artbook.coverUrl} 
                      alt="" 
                      className="w-20 h-28 object-cover rounded-xl border border-slate-800 shrink-0 shadow-md" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          artbook.isFree 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-[#ff8679]/20 text-[#ff8679] border border-[#ff8679]/30'
                        }`}>
                          {artbook.isFree ? 'Gratuit' : `${artbook.price.toLocaleString()} FCFA`}
                        </span>
                        <span className="text-[10px] text-slate-500">{artbook.releaseYear}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white truncate font-almodobar mb-1">
                        {artbook.title}
                      </h3>

                      <div className="text-xs text-purple-400 font-semibold truncate mb-1">
                        Par {artbook.artistName}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {artbook.pageCount} p. • PDF {artbook.fileSizeFormatted}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {artbook.description}
                  </p>

                  {/* 5 Preview Images strip */}
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>5 Aperçus HD intégrés :</span>
                      <span className="text-emerald-400">Complet</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {artbook.previewImages?.slice(0, 5).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download Link Status Strip */}
                  <div className="mb-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <LinkIcon className={`w-3.5 h-3.5 shrink-0 ${(artbook.downloadUrl || artbook.pdfDownloadUrl) ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Lien Téléchargement</span>
                        {(artbook.downloadUrl || artbook.pdfDownloadUrl) ? (
                          <span className="text-emerald-300 font-mono text-[11px] truncate block" title={artbook.downloadUrl || artbook.pdfDownloadUrl}>
                            {artbook.downloadUrl || artbook.pdfDownloadUrl}
                          </span>
                        ) : (
                          <span className="text-amber-400/90 italic text-[11px] block">
                            Non configuré (cliquez pour ajouter)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(artbook.downloadUrl || artbook.pdfDownloadUrl) ? (
                        <>
                          <a
                            href={artbook.downloadUrl || artbook.pdfDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Tester le lien en direct ↗"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(artbook.downloadUrl || artbook.pdfDownloadUrl || '');
                              setCopiedArtbookLinkId(artbook.id);
                              setTimeout(() => setCopiedArtbookLinkId(null), 2000);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Copier le lien"
                          >
                            {copiedArtbookLinkId === artbook.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditArtbook(artbook, 'link')}
                          className="px-2 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-[10px] font-bold transition-all"
                        >
                          + Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openArtbookPage(artbook.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Voir sur la vitrine publique"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#ff8679]" />
                    <span>Vitrine & Aperçu</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditArtbook(artbook, 'link')}
                      className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 transition-colors cursor-pointer"
                      title="Gérer le lien de téléchargement direct"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEditArtbook(artbook, 'general')}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      title="Modifier l'artbook"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteConfirmId(artbook.id);
                        setDeleteType('artbook');
                      }}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                      title="Supprimer l'artbook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DOWNLOADS & PURCHASES ACTIVITY VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'activity' && (
        <div className="space-y-6">
          {/* Purchases Table */}
          <div className="p-6 rounded-2xl bg-[#11121c] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>Achats & Commandes Paystack / Mobile Money ({artbookPurchases.length})</span>
            </h3>

            {artbookPurchases.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                Aucune transaction d'artbook enregistrée pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Référence</th>
                      <th className="p-3">Artbook</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Passerelle</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {artbookPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-white">{p.paymentReference}</td>
                        <td className="p-3 font-semibold text-slate-200">{p.artbookTitle}</td>
                        <td className="p-3">{p.userName}</td>
                        <td className="p-3 text-[11px] text-slate-400">{p.userEmail} • {p.userPhone}</td>
                        <td className="p-3 uppercase font-bold text-slate-400">{p.paymentGateway}</td>
                        <td className="p-3 font-bold text-amber-400">{p.priceXof?.toLocaleString()} FCFA</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {p.status === 'completed' ? 'Validé' : 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Downloads Table */}
          <div className="p-6 rounded-2xl bg-[#11121c] border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Formulaires de Téléchargement Gratuit ({artbookDownloads.length})</span>
            </h3>

            {artbookDownloads.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                Aucun formulaire de téléchargement gratuit enregistré pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Artbook</th>
                      <th className="p-3">Nom & Prénom</th>
                      <th className="p-3">Adresse Email</th>
                      <th className="p-3">Téléphone</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {artbookDownloads.map(d => (
                      <tr key={d.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">{d.artbookTitle}</td>
                        <td className="p-3">{d.userName}</td>
                        <td className="p-3 text-slate-400">{d.userEmail}</td>
                        <td className="p-3 font-mono">{d.userPhone}</td>
                        <td className="p-3 text-[11px] text-slate-500">{new Date(d.downloadedAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT / CREATE ARTIST */}
      {/* ======================================================== */}
      {artistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#12131d] border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setArtistModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-6 font-almodobar flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <span>{editingArtist ? 'Modifier l\'Artiste' : 'Ajouter un Nouvel Artiste'}</span>
            </h3>

            <form onSubmit={handleSaveArtist} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nom de l'artiste <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artistForm.name}
                    onChange={e => setArtistForm({ ...artistForm, name: e.target.value })}
                    placeholder="Ex: Kofi Mensah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pays d'origine
                  </label>
                  <input
                    type="text"
                    value={artistForm.country}
                    onChange={e => setArtistForm({ ...artistForm, country: e.target.value })}
                    placeholder="Ex: Sénégal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL Photo de Profil <span className="text-purple-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={artistForm.photoUrl}
                    onChange={e => setArtistForm({ ...artistForm, photoUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none"
                  />
                  {artistForm.photoUrl && (
                    <img src={artistForm.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Biographie / Démarche artistique
                </label>
                <textarea
                  rows={3}
                  value={artistForm.bio}
                  onChange={e => setArtistForm({ ...artistForm, bio: e.target.value })}
                  placeholder="Présentation de l'artiste, de son style et de ses inspirations..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Spécialités & Styles
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {artistForm.specialties.map(spec => (
                    <span key={spec} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs flex items-center gap-1.5 text-slate-200">
                      <span>{spec}</span>
                      <button 
                        type="button" 
                        onClick={() => setArtistForm({ ...artistForm, specialties: artistForm.specialties.filter(s => s !== spec) })}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSpecialtyInput}
                    onChange={e => setNewSpecialtyInput(e.target.value)}
                    placeholder="Ajouter une spécialité (ex: Afro-Fantasy, Mecha)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSpecialtyInput.trim() && !artistForm.specialties.includes(newSpecialtyInput.trim())) {
                        setArtistForm({ ...artistForm, specialties: [...artistForm.specialties, newSpecialtyInput.trim()] });
                        setNewSpecialtyInput('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Univers ou Série Phare
                </label>
                <input
                  type="text"
                  value={artistForm.featuredSeriesTitle}
                  onChange={e => setArtistForm({ ...artistForm, featuredSeriesTitle: e.target.value })}
                  placeholder="Ex: La Légende de Kemet"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-500" />
                    <span>YouTube URL</span>
                  </label>
                  <input
                    type="text"
                    value={artistForm.youtube}
                    onChange={e => setArtistForm({ ...artistForm, youtube: e.target.value })}
                    placeholder="https://youtube.com/@..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-red-500 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Instagram URL</label>
                  <input
                    type="text"
                    value={artistForm.instagram}
                    onChange={e => setArtistForm({ ...artistForm, instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-pink-500 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Twitter / X URL</label>
                  <input
                    type="text"
                    value={artistForm.twitter}
                    onChange={e => setArtistForm({ ...artistForm, twitter: e.target.value })}
                    placeholder="https://twitter.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Artstation URL</label>
                  <input
                    type="text"
                    value={artistForm.artstation}
                    onChange={e => setArtistForm({ ...artistForm, artstation: e.target.value })}
                    placeholder="https://artstation.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArtistModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
                >
                  {editingArtist ? 'Enregistrer les modifications' : 'Créer l\'Artiste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT / CREATE ARTBOOK */}
      {/* ======================================================== */}
      {artbookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#12131d] border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setArtbookModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-4 font-almodobar flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ff8679]" />
              <span>{editingArtbook ? 'Modifier l\'Artbook' : 'Publier un Nouvel Artbook'}</span>
            </h3>

            {/* TAB NAVIGATION IN MODAL */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
              <button
                type="button"
                onClick={() => setArtbookModalTab('general')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  artbookModalTab === 'general'
                    ? 'bg-[#ff8679] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Général & Tarif</span>
              </button>

              <button
                type="button"
                onClick={() => setArtbookModalTab('preview')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  artbookModalTab === 'preview'
                    ? 'bg-[#ff8679] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>2. Planches d'Aperçu (5)</span>
              </button>

              <button
                type="button"
                onClick={() => setArtbookModalTab('link')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  artbookModalTab === 'link'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-800/40'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>3. Onglet Lien (Téléchargement)</span>
                {artbookForm.downloadUrl ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Lien configuré" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Non configuré" />
                )}
              </button>
            </div>

            <form onSubmit={handleSaveArtbook} className="space-y-4">
              
              {/* TAB 1: GENERAL & PRICING */}
              {artbookModalTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Titre de l'artbook <span className="text-[#ff8679]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={artbookForm.title}
                        onChange={e => setArtbookForm({ ...artbookForm, title: e.target.value })}
                        placeholder="Ex: Chroniques Célestes de Kemet"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#ff8679] text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Artiste auteur <span className="text-[#ff8679]">*</span>
                      </label>
                      <select
                        value={artbookForm.artistId}
                        onChange={e => {
                          const selected = artists.find(a => a.id === e.target.value);
                          setArtbookForm({ 
                            ...artbookForm, 
                            artistId: e.target.value,
                            artistName: selected?.name || ''
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#ff8679] text-sm text-white focus:outline-none"
                      >
                        {artists.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.country})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Description & Présentation
                    </label>
                    <textarea
                      rows={3}
                      value={artbookForm.description}
                      onChange={e => setArtbookForm({ ...artbookForm, description: e.target.value })}
                      placeholder="Détaillez le contenu de ce recueil d'art, planches préparatoires, décors..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#ff8679] text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Image de Couverture (URL) <span className="text-[#ff8679]">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        required
                        value={artbookForm.coverUrl}
                        onChange={e => setArtbookForm({ ...artbookForm, coverUrl: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#ff8679] text-sm text-white focus:outline-none"
                      />
                      {artbookForm.coverUrl && (
                        <img src={artbookForm.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg border border-slate-700" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Prix (FCFA) — <span className="text-emerald-400">0 = Gratuit</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={artbookForm.price}
                        onChange={e => setArtbookForm({ ...artbookForm, price: Number(e.target.value), isFree: Number(e.target.value) === 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Nombre de pages
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={artbookForm.pageCount}
                        onChange={e => setArtbookForm({ ...artbookForm, pageCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Taille du fichier
                      </label>
                      <input
                        type="text"
                        value={artbookForm.fileSizeFormatted}
                        onChange={e => setArtbookForm({ ...artbookForm, fileSizeFormatted: e.target.value })}
                        placeholder="Ex: 48 Mo"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PREVIEW IMAGES */}
              {artbookModalTab === 'preview' && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Galerie d'Aperçu (Exactement 5 planches obligatoires) :</span>
                    <span className="text-[11px] text-slate-400">Haute Définition</span>
                  </div>

                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 w-6">0{index + 1}</span>
                        <input
                          type="text"
                          required
                          value={artbookForm.previewImages[index]}
                          onChange={e => {
                            const updated = [...artbookForm.previewImages] as [string, string, string, string, string];
                            updated[index] = e.target.value;
                            setArtbookForm({ ...artbookForm, previewImages: updated });
                          }}
                          placeholder={`URL de la planche d'aperçu ${index + 1}...`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                        {artbookForm.previewImages[index] && (
                          <img 
                            src={artbookForm.previewImages[index]} 
                            alt="" 
                            className="w-7 h-7 object-cover rounded border border-slate-700 shrink-0" 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DEDICATED ONGLETS LIEN (TÉLÉCHARGEMENT DIRECT) */}
              {artbookModalTab === 'link' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  
                  {/* Explanatory banner */}
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs leading-relaxed flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white mb-1">Configuration du Lien de Téléchargement Direct</div>
                      <span>
                        Ajoutez ici l'URL directe du fichier de l'artbook (PDF haute résolution, lien direct Google Drive, Dropbox, Mega ou hébergement LWS CDN). Lorsque l'utilisateur cliquera sur <strong>« Télécharger »</strong>, il lui sera demandé de remplir son <strong>e-mail et numéro de téléphone</strong>, puis le téléchargement de ce lien sera déclenché automatiquement pour lui.
                      </span>
                    </div>
                  </div>

                  {/* Main Link Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Lien de l'Artbook (URL de téléchargement direct) :</span>
                      </label>
                      {artbookForm.downloadUrl && (
                        <a
                          href={artbookForm.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 underline"
                        >
                          <span>Tester le lien en direct</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={artbookForm.downloadUrl}
                        onChange={e => setArtbookForm({ ...artbookForm, downloadUrl: e.target.value })}
                        placeholder="https://... (ex: https://monsite.com/mon-artbook.pdf ou lien Google Drive)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-sm text-white focus:outline-none font-mono"
                      />
                      {artbookForm.downloadUrl && (
                        <button
                          type="button"
                          onClick={() => setArtbookForm({ ...artbookForm, downloadUrl: '' })}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Effacer le lien"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                      Raccourcis & Exemples d'hébergement :
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setArtbookForm({ ...artbookForm, downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf' })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        📄 Fichier PDF Démo
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtbookForm({ ...artbookForm, downloadUrl: 'https://drive.google.com/uc?export=download&id=DEMO_ID' })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        📁 Modèle Google Drive Direct
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtbookForm({ ...artbookForm, downloadUrl: `https://ozibd.net/artbooks/${(artbookForm.title || 'recueil').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf` })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        🌐 Modèle LWS CDN OZI
                      </button>
                    </div>
                  </div>

                  {/* Status Box */}
                  {artbookForm.downloadUrl ? (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <div>
                        <span className="font-bold">Lien configuré avec succès !</span> Les utilisateurs recevront ce fichier immédiatement après saisie de leur e-mail et numéro de téléphone.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <div>
                        <span className="font-bold">Aucun lien direct externe n'est renseigné.</span> Le site générera automatiquement un PDF interactif officiel par défaut.
                      </div>
                    </div>
                  )}

                  {/* Google Drive / Cloud tip */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300">💡 Astuce Google Drive :</div>
                    <p>
                      Pour Google Drive, assurez-vous de partager le fichier en « Tous les utilisateurs disposant du lien : Lecteur ». Remplacez ensuite <code className="text-purple-300 font-mono">/file/d/ID/view</code> par <code className="text-emerald-300 font-mono">https://drive.google.com/uc?export=download&id=ID</code> pour que le téléchargement se lance automatiquement sans ouvrir la page Google Drive.
                    </p>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {artbookModalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setArtbookModalTab(artbookModalTab === 'link' ? 'preview' : 'general')}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300"
                    >
                      ← Étape précédente
                    </button>
                  )}
                  {artbookModalTab !== 'link' && (
                    <button
                      type="button"
                      onClick={() => setArtbookModalTab(artbookModalTab === 'general' ? 'preview' : 'link')}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-purple-300"
                    >
                      Étape suivante →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setArtbookModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white text-xs font-bold shadow-lg shadow-[#ff8679]/20 cursor-pointer"
                  >
                    {editingArtbook ? 'Enregistrer les modifications' : 'Publier l\'Artbook'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#12131d] border border-rose-800/60 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Confirmer la suppression ?
            </h3>

            <p className="text-xs text-slate-400">
              Cette action est irréversible. L'élément sera retiré du catalogue et synchronisé avec la base Firestore.
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteType(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
