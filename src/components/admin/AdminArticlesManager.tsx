import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  Save, 
  X, 
  Edit3, 
  Eye, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Image as ImageIcon,
  Upload,
  ImagePlus,
  Heading2,
  Heading3,
  Quote,
  Bold,
  Italic,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Article } from '../../types';
import { uploadToLWS, compressImageToWebP } from '../../services/lwsUploadService';
import { ArticleContentRenderer } from '../articles/ArticleContentRenderer';

export const AdminArticlesManager: React.FC = () => {
  const { articles, addArticle, updateArticle, deleteArticle, addLwsFile } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'preview'>('write');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [showImageInserter, setShowImageInserter] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineImageCaption, setInlineImageCaption] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    image: string;
    alt: string;
    author: string;
    readTime: string;
    excerpt: string;
    content: string;
    galleryImages: string[];
    publishedAt: string;
    featured: boolean;
    published: boolean;
  }>({
    title: '',
    category: 'Interview & Portrait',
    image: '',
    alt: '',
    author: 'Rédaction OZI',
    readTime: '5 min',
    excerpt: '',
    content: '',
    galleryImages: [],
    publishedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
    featured: false,
    published: true
  });

  const handleOpenNew = () => {
    setEditingArticle(null);
    setActiveEditorTab('write');
    setShowImageInserter(false);
    setUploadStatus(null);
    setFormData({
      title: '',
      category: 'Interview & Portrait',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
      alt: '',
      author: 'Rédaction OZI',
      readTime: '5 min',
      excerpt: '',
      content: '',
      galleryImages: [],
      publishedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
      featured: false,
      published: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setActiveEditorTab('write');
    setShowImageInserter(false);
    setUploadStatus(null);
    setFormData({
      title: art.title,
      category: art.category || 'Interview & Portrait',
      image: art.image,
      alt: art.alt || '',
      author: art.author || 'Rédaction OZI',
      readTime: art.readTime || '5 min',
      excerpt: art.excerpt || '',
      content: art.content || '',
      galleryImages: art.galleryImages || [],
      publishedAt: art.publishedAt || '',
      featured: !!art.featured,
      published: art.published !== false
    });
    setModalOpen(true);
  };

  // Helper to insert markdown or image into textarea at current cursor position
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${textToInsert}` : textToInsert
      }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = formData.content || '';
    const before = current.substring(0, start);
    const after = current.substring(end);

    const newContent = `${before}${textToInsert}${after}`;
    setFormData(prev => ({ ...prev, content: newContent }));

    // Reset cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + textToInsert.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 50);
  };

  // Upload cover image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setUploadStatus('Compression et téléversement de la couverture...');
    try {
      const compressed = await compressImageToWebP(file, 1200, 0.88);
      const res = await uploadToLWS(
        compressed.file,
        `art_cover_${Date.now()}.webp`,
        'articles'
      );
      const finalUrl = res.url || compressed.dataUrl;
      setFormData(prev => ({ ...prev, image: finalUrl }));
      if (res.fileInfo) addLwsFile(res.fileInfo);
      setUploadStatus('Couverture mise à jour !');
      setTimeout(() => setUploadStatus(null), 2500);
    } catch (err) {
      console.error('Cover upload error:', err);
      setUploadStatus('Erreur de téléversement');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Upload inline article image
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInline(true);
    setUploadStatus('Téléversement de l\'image d\'illustration...');
    try {
      const compressed = await compressImageToWebP(file, 1000, 0.88);
      const res = await uploadToLWS(
        compressed.file,
        `art_inline_${Date.now()}.webp`,
        'articles'
      );
      const finalUrl = res.url || compressed.dataUrl;
      setInlineImageUrl(finalUrl);
      if (res.fileInfo) addLwsFile(res.fileInfo);
      setUploadStatus('Image prête à être insérée !');
      setTimeout(() => setUploadStatus(null), 2500);
    } catch (err) {
      console.error('Inline image upload error:', err);
      setUploadStatus('Erreur lors du téléversement');
    } finally {
      setIsUploadingInline(false);
    }
  };

  // Confirm inline image insertion
  const handleConfirmInsertImage = () => {
    if (!inlineImageUrl.trim()) return;

    const caption = inlineImageCaption.trim() || 'Illustration article';
    const markdownImg = `\n\n![${caption}](${inlineImageUrl.trim()})\n\n`;
    insertTextAtCursor(markdownImg);

    // Save to gallery images if not already present
    setFormData(prev => {
      const exists = prev.galleryImages?.includes(inlineImageUrl.trim());
      return {
        ...prev,
        galleryImages: exists ? prev.galleryImages : [...(prev.galleryImages || []), inlineImageUrl.trim()]
      };
    });

    setInlineImageUrl('');
    setInlineImageCaption('');
    setShowImageInserter(false);
  };

  const handleInsertFromGallery = (url: string) => {
    insertTextAtCursor(`\n\n![Illustration](${url})\n\n`);
  };

  const handleRemoveFromGallery = (url: string) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter(u => u !== url)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image) return;

    if (editingArticle) {
      updateArticle(editingArticle.id, {
        ...formData,
        alt: formData.alt || formData.title
      });
    } else {
      addArticle({
        ...formData,
        alt: formData.alt || formData.title
      });
    }

    setModalOpen(false);
    setEditingArticle(null);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[#ff5a50] text-xs font-bold uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Magazine Éditorial OZI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestion des Articles ({articles.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Les articles créés ou modifiés ici sont immédiatement intégrés dans la page Articles avec disposition dynamique responsive.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Article</span>
        </button>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((art) => (
          <div 
            key={art.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-colors"
          >
            {/* Image Preview */}
            <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
              <img 
                src={art.image} 
                alt={art.alt || art.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                  {art.category || 'Article'}
                </span>
                {art.featured && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-[10px] font-bold text-black flex items-center gap-1 shadow">
                    <Star className="w-3 h-3 fill-current" />
                    <span>À la une</span>
                  </span>
                )}
              </div>

              <div className="absolute top-2.5 right-2.5">
                {art.published !== false ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-black font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Publié</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 font-bold text-[10px] border border-zinc-700">
                    <XCircle className="w-3 h-3 text-zinc-400" />
                    <span>Brouillon</span>
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1 justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] text-[#ff5a50] font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{art.publishedAt}</span>
                  {art.readTime && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400">{art.readTime}</span>
                    </>
                  )}
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug">
                  {art.title}
                </h3>
                {art.excerpt && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {art.excerpt}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="text-[11px] text-zinc-500 font-medium truncate max-w-[120px]">
                  Par {art.author || 'OZI'}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(art)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Modifier l'article"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement l'article "${art.title}" ?`)) {
                        deleteArticle(art.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Supprimer l'article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit/Add Article */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-[#ff5a50]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {editingArticle ? 'Modifier l\'Article' : 'Créer un Nouvel Article'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Titre de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Interview avec le créateur de Bloody Knight"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Interview & Portrait, Technique..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Auteur
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Ex: Rédaction OZI"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date de publication affichée
                  </label>
                  <input
                    type="text"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    placeholder="Ex: 01 JANVIER 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Temps de lecture estimé
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="Ex: 5 min"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Cover Image & Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Image de couverture *
                  </label>
                  {uploadStatus && (
                    <span className="text-[11px] font-semibold text-amber-400 animate-pulse">
                      {uploadStatus}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/... ou téléversez un fichier"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 shrink-0 transition-all">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>{isUploadingCover ? 'Téléversement...' : 'Téléverser photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2.5 relative aspect-[21/9] w-full max-h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img 
                      src={formData.image} 
                      alt="Aperçu couverture" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      Aperçu couverture
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Extrait / Chapô (court résumé d'introduction)
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Bref résumé accrocheur pour la grille d'articles..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Rich Content & Image Integration Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Contenu & Images de l'article
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Intégrez des illustrations, photos haute résolution et formatez le texte.
                    </p>
                  </div>

                  {/* Mode Tab Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeEditorTab === 'write'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✏️ Rédiger
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeEditorTab === 'preview'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👁️ Aperçu direct
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                {activeEditorTab === 'write' && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowImageInserter(!showImageInserter)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                        showImageInserter 
                          ? 'bg-amber-500 text-slate-950 shadow-md' 
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                      }`}
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Insérer une image</span>
                    </button>

                    <div className="w-[1px] h-5 bg-slate-800 mx-1 hidden sm:block" />

                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n\n## Titre de section\n\n')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800"
                      title="Ajouter un titre H2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n\n### Sous-titre\n\n')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800"
                      title="Ajouter un sous-titre H3"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('\n\n> Citation inspirante ici...\n\n')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800"
                      title="Ajouter une citation"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('**texte important**')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800"
                      title="Mettre en gras"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('*texte en italique*')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800"
                      title="Mettre en italique"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Inline Image Inserter Box */}
                {showImageInserter && activeEditorTab === 'write' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/30 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <ImagePlus className="w-4 h-4" />
                        <span>Intégrer une photo dans le corps de l'article</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowImageInserter(false)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          1. URL de l'image (ou téléversez ci-contre)
                        </label>
                        <input
                          type="url"
                          value={inlineImageUrl}
                          onChange={(e) => setInlineImageUrl(e.target.value)}
                          placeholder="https://... ou fichier local"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Téléversement direct
                        </label>
                        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isUploadingInline ? 'Téléversement...' : 'Choisir une photo locale'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleInlineImageUpload}
                            disabled={isUploadingInline}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        2. Légende / Description sous la photo (optionnel)
                      </label>
                      <input
                        type="text"
                        value={inlineImageCaption}
                        onChange={(e) => setInlineImageCaption(e.target.value)}
                        placeholder="Ex: Planche originale du tome 2, dessinée par l'auteur"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {inlineImageUrl && (
                      <div className="relative aspect-[16/9] max-h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img 
                          src={inlineImageUrl} 
                          alt="Prévisualisation" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowImageInserter(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Fermer
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmInsertImage}
                        disabled={!inlineImageUrl.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insérer dans l'article</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Area : Write or Preview */}
                {activeEditorTab === 'write' ? (
                  <div>
                    <textarea
                      ref={contentTextareaRef}
                      rows={10}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Rédigez l'article ici. Vous pouvez insérer des images n'importe où dans le texte via le bouton 'Insérer une image' ci-dessus (au format ![Légende](url))..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-xs leading-relaxed"
                    />
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>💡 Conseil : Placez votre curseur à l'endroit désiré puis cliquez sur « Insérer une image » pour l'intégrer entre deux paragraphes.</span>
                      <span>{(formData.content || '').length} caractères</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-h-[450px] overflow-y-auto">
                    {formData.content ? (
                      <ArticleContentRenderer content={formData.content} />
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs italic">
                        Aucun texte rédigé pour le moment. Basculez sur l'onglet « Rédiger » pour commencer à composer votre article.
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Gallery Images List */}
                {formData.galleryImages && formData.galleryImages.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-orange-400" />
                      <span>Photos intégrées / Galerie de l'article ({formData.galleryImages.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {formData.galleryImages.map((imgUrl, gIdx) => (
                        <div key={`gallery-${gIdx}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                          <img 
                            src={imgUrl} 
                            alt={`Illustration ${gIdx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            <button
                              type="button"
                              onClick={() => handleInsertFromGallery(imgUrl)}
                              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow"
                              title="Réinsérer dans le texte"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromGallery(imgUrl)}
                              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] shadow"
                              title="Supprimer de la galerie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-white">Mettre à la une (Hero)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-white">Publier immédiatement</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l'Article</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
