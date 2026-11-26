import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Heart,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CommunitySpecialRole, resolveCommunitySpecialRole } from '../../services/discussionService';
import {
  deleteGalleryCreation,
  publishGalleryCreation,
  subscribeToUserGalleryCreations,
  updateGalleryCreationTitle,
  validateGalleryImageFile,
} from '../../services/galleryService';
import { GalleryCreation } from '../../types';

function formatCreationDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const PersonalCreationImage: React.FC<{ item: GalleryCreation }> = ({ item }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-zinc-900 via-[#151621] to-zinc-950 text-zinc-500 p-3 text-center">
        <ImageIcon className="w-7 h-7 text-zinc-600" />
        <span className="text-[11px] text-zinc-400 line-clamp-1">
          {item.title || 'Création OZI'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={item.imageUrl}
      alt={item.title || `Création de ${item.authorName}`}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
};

interface PersonalGalleryTabProps {
  onLightboxChange?: (open: boolean) => void;
}

export const PersonalGalleryTab: React.FC<PersonalGalleryTabProps> = ({
  onLightboxChange,
}) => {
  const {
    currentUser,
    readerProfile,
    users,
    adminAuth,
    closeProfileModal,
    setViewMode,
    setDiscussionChannel,
  } = useData();

  const [creations, setCreations] = useState<GalleryCreation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inline publisher state
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline title edit & delete confirmation state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const currentMemberName =
    readerProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Créateur OZI';
  const currentMemberPhoto = readerProfile?.photoURL || currentUser?.photoURL || '';

  const currentUserSpecialRole = useMemo<CommunitySpecialRole>(() => {
    if (!currentUser) return null;
    const email = (currentUser.email || readerProfile?.email || '').toLowerCase();
    const matchedRole = users?.find(
      (u) => u.id === currentUser.uid || (email && u.email?.toLowerCase() === email)
    )?.role;
    return resolveCommunitySpecialRole({
      email,
      userRole: matchedRole,
      isStudioAdminAuthenticated: adminAuth.isAuthenticated,
    });
  }, [currentUser, readerProfile?.email, users, adminAuth.isAuthenticated]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    setSyncError(null);
    const unsubscribe = subscribeToUserGalleryCreations(
      currentUser.uid,
      (items) => {
        setCreations(items);
        setIsLoading(false);
        setSyncError(null);
      },
      (err) => {
        setIsLoading(false);
        setSyncError(err);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    onLightboxChange?.(lightboxIndex !== null);
    return () => onLightboxChange?.(false);
  }, [lightboxIndex, onLightboxChange]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && creations.length > 0) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % creations.length));
      } else if (e.key === 'ArrowLeft' && creations.length > 0) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + creations.length) % creations.length
        );
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [lightboxIndex, creations.length]);

  const totalLikes = useMemo(
    () => creations.reduce((sum, item) => sum + item.likesCount, 0),
    [creations]
  );

  const handleOpenCommunityGallery = () => {
    setDiscussionChannel('galerie');
    setViewMode('discussion');
    window.location.hash = '#discussion';
    closeProfileModal();
  };

  const handleSelectFile = (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      validateGalleryImageFile(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image invalide.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetUploadBox = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    setTitleInput('');
    setUploadError(null);
    setUploadProgressText('');
    setShowUploadBox(false);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFile) {
      setUploadError('Veuillez sélectionner une image.');
      return;
    }

    setIsPublishing(true);
    setUploadError(null);
    const res = await publishGalleryCreation({
      file: selectedFile,
      title: titleInput,
      authorId: currentUser.uid,
      authorName: currentMemberName,
      authorPhotoURL: currentMemberPhoto,
      authorIsAdmin: Boolean(currentUserSpecialRole),
      authorRole: currentUserSpecialRole || undefined,
      onProgress: (_pct, txt) => setUploadProgressText(txt),
    });
    setIsPublishing(false);

    if (res.success) {
      resetUploadBox();
    } else {
      setUploadError(res.error || 'Publication impossible.');
    }
  };

  const handleStartEditTitle = (item: GalleryCreation) => {
    setEditingId(item.id);
    setEditingTitle(item.title || '');
    setConfirmDeleteId(null);
    setActionError(null);
  };

  const handleSaveTitle = async (creationId: string) => {
    setSavingTitleId(creationId);
    setActionError(null);
    const res = await updateGalleryCreationTitle(creationId, editingTitle);
    setSavingTitleId(null);
    if (res.success) {
      setEditingId(null);
    } else {
      setActionError(res.error || 'Impossible de modifier le titre.');
    }
  };

  const handleConfirmDelete = async (item: GalleryCreation) => {
    setDeletingId(item.id);
    setActionError(null);
    const res = await deleteGalleryCreation(item);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else if (lightboxIndex !== null && creations[lightboxIndex]?.id === item.id) {
      setLightboxIndex(null);
    }
  };

  const activeLightboxItem =
    lightboxIndex !== null ? creations[lightboxIndex] ?? null : null;

  return (
    <div className="mb-4 space-y-4">
      {/* Personal Gallery Stats & Primary Actions */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0c12] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="text-zinc-400 font-medium">Créations partagées</div>
            <div className="text-base font-black text-white tabular-nums font-mono">
              {creations.length}
            </div>
          </div>
          <span className="h-7 w-px bg-zinc-800" aria-hidden="true" />
          <div>
            <div className="text-zinc-400 font-medium">Likes reçus</div>
            <div className="text-base font-black text-[#ff8679] tabular-nums font-mono flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-[#ff8679]" />
              <span>{totalLikes}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (showUploadBox) resetUploadBox();
              else setShowUploadBox(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-xs shadow-md glow-ozi transition-all cursor-pointer whitespace-nowrap font-almodobar"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{showUploadBox ? 'Fermer l’ajout' : 'Ajouter une image'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCommunityGallery}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#ff8679]" />
            <span>Voir dans #galerie</span>
          </button>
        </div>
      </div>

      {/* Inline Image Publisher (syncs directly with #galerie) */}
      {showUploadBox && (
        <form
          onSubmit={handlePublish}
          className="p-4 rounded-2xl bg-[#0b0c12] border border-zinc-800 space-y-3 animate-in fade-in duration-150"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSelectFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !isPublishing && fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              isDragging
                ? 'border-[#ff8679] bg-[#ff8679]/10'
                : previewUrl
                ? 'border-zinc-700 bg-zinc-950'
                : 'border-zinc-700 hover:border-[#ff8679]/70 bg-zinc-950/60'
            }`}
          >
            {previewUrl ? (
              <div className="relative h-44 w-full flex items-center justify-center bg-zinc-950">
                <img
                  src={previewUrl}
                  alt="Aperçu de la création"
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-bold border border-white/10">
                  Changer
                </span>
              </div>
            ) : (
              <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
                <Upload className="w-5 h-5 text-[#ff8679] mb-2" />
                <p className="text-xs font-bold text-white">
                  Cliquez ou glissez une image ici (partagée aussi dans #galerie)
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  JPG, PNG, WEBP ou GIF · 15 Mo maximum
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              maxLength={80}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              disabled={isPublishing}
              placeholder="Titre de votre création (optionnel)"
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff8679] text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPublishing || !selectedFile}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-xs disabled:opacity-40 cursor-pointer whitespace-nowrap font-almodobar"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{uploadProgressText || 'Publication...'}</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Publier</span>
                </>
              )}
            </button>
          </div>

          {uploadError && (
            <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
          )}
        </form>
      )}

      {(syncError || actionError) && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
          {syncError || actionError}
        </div>
      )}

      {/* Creations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden bg-[#0b0c12] border border-zinc-800/80 animate-pulse"
            >
              <div className="aspect-[4/3] bg-zinc-800/70" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-28 bg-zinc-800 rounded" />
                <div className="h-2.5 w-20 bg-zinc-800/70 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : creations.length === 0 ? (
        <div className="p-7 rounded-2xl bg-[#0b0c12] border border-dashed border-zinc-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff8679] mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white font-almodobar">
              Votre galerie personnelle est vide
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
              Toutes les images que vous partagez dans <strong className="text-zinc-200">#galerie</strong> apparaissent automatiquement ici dans votre galerie personnelle.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadBox(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-xs cursor-pointer font-almodobar"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Publier ma première image</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[52vh] overflow-y-auto pr-1">
          {creations.map((item, idx) => (
            <article
              key={item.id}
              className="group rounded-2xl overflow-hidden bg-[#0b0c12] border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8679]"
                aria-label={item.title ? `Agrandir ${item.title}` : 'Agrandir cette création'}
              >
                <PersonalCreationImage item={item} />
              </button>

              <div className="p-3 space-y-2">
                {editingId === item.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={80}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveTitle(item.id);
                        } else if (e.key === 'Escape') {
                          e.stopPropagation();
                          setEditingId(null);
                        }
                      }}
                      placeholder="Titre de l’œuvre"
                      autoFocus
                      className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-zinc-950 border border-[#ff8679] text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTitle(item.id)}
                      disabled={savingTitleId === item.id}
                      className="p-1.5 rounded-lg bg-[#ff8679] text-white cursor-pointer disabled:opacity-50"
                      title="Enregistrer le titre"
                    >
                      {savingTitleId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 cursor-pointer"
                      title="Annuler"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item.title || 'Sans titre'}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <span className="tabular-nums font-mono text-[10px]">
                          {formatCreationDate(item.createdAt)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#ff8679] font-bold tabular-nums font-mono">
                          <Heart className="w-3 h-3 fill-[#ff8679]" />
                          {item.likesCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(item)}
                            disabled={deletingId === item.id}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === item.id ? '...' : 'Supprimer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded-lg bg-zinc-800 text-zinc-300 cursor-pointer"
                            aria-label="Annuler la suppression"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditTitle(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Modifier le titre"
                            aria-label="Modifier le titre"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setConfirmDeleteId(item.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Supprimer cette création"
                            aria-label="Supprimer cette création"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/70">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {activeLightboxItem.title || 'Sans titre'}
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-2 font-body">
                <span className="tabular-nums font-mono text-[11px]">
                  {formatCreationDate(activeLightboxItem.createdAt)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#ff8679] font-bold tabular-nums font-mono">
                  <Heart className="w-3.5 h-3.5 fill-[#ff8679]" />
                  {activeLightboxItem.likesCount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer"
              aria-label="Fermer l’aperçu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8">
            {creations.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev === null ? 0 : (prev - 1 + creations.length) % creations.length
                  )
                }
                className="absolute left-3 sm:left-6 z-10 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer"
                aria-label="Création précédente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={activeLightboxItem.imageUrl}
              alt={activeLightboxItem.title || 'Création personnelle'}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />

            {creations.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev === null ? 0 : (prev + 1) % creations.length
                  )
                }
                className="absolute right-3 sm:right-6 z-10 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer"
                aria-label="Création suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
