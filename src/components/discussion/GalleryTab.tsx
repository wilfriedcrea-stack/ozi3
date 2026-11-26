import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  ImagePlus,
  Loader2,
  Lock,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CommunitySpecialRole, resolveCommunitySpecialRole } from '../../services/discussionService';
import {
  deleteGalleryCreation,
  getCachedLikedCreationIds,
  getGalleryLikerId,
  publishGalleryCreation,
  saveCachedLikedCreationIds,
  subscribeToGalleryCreations,
  syncLikedStateFromFirestore,
  toggleGalleryCreationLike,
  validateGalleryImageFile,
} from '../../services/galleryService';
import { GalleryCreation } from '../../types';

const INITIAL_LIMIT = 40;
const LOAD_STEP = 24;

function formatCreationDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface GalleryTabProps {
  onCountChange?: (count: number) => void;
}

const GalleryCardImage: React.FC<{ item: GalleryCreation }> = ({ item }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 via-[#151621] to-zinc-950 text-zinc-500 p-4 text-center">
        <ImageIcon className="w-8 h-8 text-zinc-600" />
        <span className="text-xs font-medium text-zinc-400 line-clamp-1">
          {item.title || `Création de ${item.authorName}`}
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

export const GalleryTab: React.FC<GalleryTabProps> = ({ onCountChange }) => {
  const { currentUser, readerProfile, users, adminAuth, openAuthModal, openProfileModal } = useData();

  const [creations, setCreations] = useState<GalleryCreation[]>([]);
  const [limitCount, setLimitCount] = useState(INITIAL_LIMIT);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const likerId = useMemo(
    () => getGalleryLikerId(currentUser?.uid ?? null),
    [currentUser?.uid]
  );

  const [likedIds, setLikedIds] = useState<Set<string>>(() => getCachedLikedCreationIds());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Upload Modal state (authenticated users only)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [titleInput, setTitleInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox viewer state
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

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

  const getCreationSpecialRole = (item: GalleryCreation): CommunitySpecialRole => {
    if (item.authorRole === 'w.s.k' || item.authorRole === 'admin') {
      return item.authorRole;
    }
    const matchedAuthor = users?.find((u) => u.id === item.authorId);
    if (matchedAuthor) {
      return resolveCommunitySpecialRole({
        email: matchedAuthor.email,
        userRole: matchedAuthor.role,
      });
    }
    if (currentUser && item.authorId === currentUser.uid && currentUserSpecialRole) {
      return currentUserSpecialRole;
    }
    return item.authorIsAdmin ? 'admin' : null;
  };

  useEffect(() => {
    setSyncError(null);
    const unsubscribe = subscribeToGalleryCreations(
      limitCount,
      (incoming) => {
        setCreations(incoming);
        setIsLoading(false);
        setSyncError(null);
        onCountChange?.(incoming.length);
      },
      (errMsg) => {
        setIsLoading(false);
        setSyncError(errMsg);
      }
    );
    return () => unsubscribe();
  }, [limitCount, onCountChange]);

  // Sync Firestore liked status for the active user/guest
  useEffect(() => {
    if (creations.length === 0) return;
    let active = true;
    const ids = creations.map((c) => c.id);
    syncLikedStateFromFirestore(ids, likerId).then((remoteLiked) => {
      if (!active) return;
      setLikedIds((prev) => {
        const merged = new Set<string>(prev);
        for (const id of ids) {
          if (remoteLiked.has(id)) {
            merged.add(id);
          }
        }
        saveCachedLikedCreationIds(merged);
        return merged;
      });
    });
    return () => {
      active = false;
    };
  }, [creations, likerId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % creations.length
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + creations.length) % creations.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeLightboxIndex, creations.length]);

  const handleOpenUploadModal = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleSelectImage = (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      validateGalleryImageFile(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image invalide.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetUploadModal = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setTitleInput('');
    setUploadError(null);
    setUploadProgressText('');
    setIsUploadOpen(false);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!selectedFile) {
      setUploadError('Veuillez sélectionner une image à publier.');
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
      resetUploadModal();
    } else {
      setUploadError(res.error || 'Publication impossible.');
    }
  };

  const handleToggleLike = async (creation: GalleryCreation) => {
    if (pendingLikes.has(creation.id)) return;
    setActionError(null);

    const currentlyLiked = likedIds.has(creation.id);
    const optimisticLiked = !currentlyLiked;
    const optimisticDelta = optimisticLiked ? 1 : -1;

    setPendingLikes((prev) => new Set(prev).add(creation.id));
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (optimisticLiked) next.add(creation.id);
      else next.delete(creation.id);
      saveCachedLikedCreationIds(next);
      return next;
    });
    setCreations((prev) =>
      prev.map((item) =>
        item.id === creation.id
          ? { ...item, likesCount: Math.max(0, item.likesCount + optimisticDelta) }
          : item
      )
    );

    const res = await toggleGalleryCreationLike({
      creationId: creation.id,
      likerId,
      currentlyLiked,
    });

    setPendingLikes((prev) => {
      const next = new Set(prev);
      next.delete(creation.id);
      return next;
    });

    if (!res.success) {
      // Revert optimistic state on error
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.add(creation.id);
        else next.delete(creation.id);
        saveCachedLikedCreationIds(next);
        return next;
      });
      setCreations((prev) =>
        prev.map((item) =>
          item.id === creation.id
            ? { ...item, likesCount: creation.likesCount }
            : item
        )
      );
      if (res.error) setActionError(res.error);
    }
  };

  const handleDelete = async (creation: GalleryCreation) => {
    setDeletingId(creation.id);
    setActionError(null);
    const res = await deleteGalleryCreation(creation);
    if (!res.success && res.error) {
      setActionError(res.error);
    } else if (
      activeLightboxIndex !== null &&
      creations[activeLightboxIndex]?.id === creation.id
    ) {
      setActiveLightboxIndex(null);
    }
    setDeletingId(null);
  };

  const activeLightboxCreation =
    activeLightboxIndex !== null ? creations[activeLightboxIndex] ?? null : null;

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col bg-[#0b0c12]">
      {/* Scrollable Gallery Canvas */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 pb-[88px] md:pb-8">
        {/* Gallery Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-zinc-800/80">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight font-almodobar">
              Galerie réservée à vos créations
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-body">
              Partagez uniquement vos illustrations, fan-arts et planches (images uniquement). Tout le monde peut liker vos œuvres ; un compte est requis pour publier.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => openProfileModal('gallery')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ImageIcon className="w-4 h-4 text-[#ff8679] shrink-0" />
                  <span>Ma galerie</span>
                </button>
                <button
                  id="gallery-add-image-btn"
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-sm shadow-md glow-ozi transition-all cursor-pointer whitespace-nowrap shrink-0 font-almodobar"
                >
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>Ajouter une image</span>
                </button>
              </>
            ) : (
              <button
                id="gallery-login-to-post-btn"
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/90 text-zinc-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-[#ff8679] shrink-0" />
                <span>Se connecter pour publier une image</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync / Action Errors */}
        {(syncError || actionError) && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 mb-5">
            <span>{syncError || actionError}</span>
            {syncError && (
              <button
                type="button"
                onClick={() => setLimitCount((c) => c)}
                className="underline font-bold text-white cursor-pointer shrink-0"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden bg-[#111218] border border-zinc-800/80 animate-pulse"
              >
                <div className="aspect-[4/3] bg-zinc-800/70" />
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-zinc-800 rounded" />
                      <div className="h-2.5 w-16 bg-zinc-800/70 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-12 bg-zinc-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : creations.length === 0 ? (
          <div className="min-h-[340px] flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-800 bg-[#111218]/60">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff8679] mb-4">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white font-almodobar">
              Aucune création pour le moment
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md font-body">
              Cet espace est réservé aux créations visuelles de la communauté. Connectez-vous pour exposer la première image !
            </p>
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-sm shadow-md glow-ozi cursor-pointer font-almodobar"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{currentUser ? 'Publier ma création' : 'Me connecter et publier'}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {creations.map((item, idx) => {
                const isLiked = likedIds.has(item.id);
                const isOwnCreation = Boolean(currentUser && item.authorId === currentUser.uid);
                const creationSpecialRole = getCreationSpecialRole(item);
                const isSpecialAuthor = Boolean(creationSpecialRole);
                const canDelete = Boolean(adminAuth.isAuthenticated || isOwnCreation);

                return (
                  <article
                    key={item.id}
                    className={`group rounded-2xl overflow-hidden bg-[#111218] border transition-colors flex flex-col ${
                      isSpecialAuthor
                        ? 'border-yellow-400/40 hover:border-yellow-400/70'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Artwork Image Surface */}
                    <button
                      type="button"
                      onClick={() => setActiveLightboxIndex(idx)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8679]"
                      aria-label={
                        item.title
                          ? `Agrandir ${item.title} par ${item.authorName}`
                          : `Agrandir la création de ${item.authorName}`
                      }
                    >
                      <GalleryCardImage item={item} />
                    </button>

                    {/* Clean Unboxed Artwork Footer */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${
                            isSpecialAuthor
                              ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2px] ring-2 ring-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                              : 'bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5'
                          }`}
                        >
                          {item.authorPhotoURL ? (
                            <img
                              src={item.authorPhotoURL}
                              alt={item.authorName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-full bg-zinc-900"
                            />
                          ) : (
                            <div
                              className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black ${
                                isSpecialAuthor ? 'text-yellow-300' : 'text-[#ff8679]'
                              }`}
                            >
                              {item.authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-bold truncate ${
                              isSpecialAuthor ? 'text-yellow-300' : 'text-white'
                            }`}
                          >
                            {item.title || item.authorName}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate font-body">
                            {creationSpecialRole ? (
                              <>
                                <span className="text-yellow-400 font-bold">
                                  {creationSpecialRole === 'w.s.k' ? 'w.s.k' : 'Admin'}
                                </span>
                                {item.title ? ` · ${item.authorName}` : ''}
                              </>
                            ) : item.title ? (
                              item.authorName
                            ) : (
                              'Créateur'
                            )}
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span className="tabular-nums font-mono text-[10px] text-zinc-500">
                              {formatCreationDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(item)}
                          disabled={pendingLikes.has(item.id)}
                          aria-pressed={isLiked}
                          aria-label={`Aimer cette création (${item.likesCount})`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                            isLiked
                              ? 'bg-[#ff8679]/15 text-[#ff8679] border border-[#ff8679]/30'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform ${
                              isLiked ? 'fill-[#ff8679] text-[#ff8679] scale-110' : ''
                            }`}
                          />
                          <span className="tabular-nums font-mono">{item.likesCount}</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                            title="Supprimer cette création"
                            aria-label="Supprimer cette création"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {creations.length >= limitCount && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => setLimitCount((prev) => prev + LOAD_STEP)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Charger plus de créations
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image-Only Upload Modal (Logged-in Accounts Only) */}
      {isUploadOpen && currentUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPublishing) resetUploadModal();
          }}
        >
          <form
            onSubmit={handlePublish}
            className="w-full max-w-lg rounded-2xl bg-[#111218] border border-zinc-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
              <div>
                <h3 className="text-base font-black text-white font-almodobar">
                  Publier dans #galerie
                </h3>
                <p className="text-xs text-zinc-400 font-body">
                  Galerie réservée pour vos créations · Images uniquement
                </p>
              </div>
              <button
                type="button"
                disabled={isPublishing}
                onClick={resetUploadModal}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Dropzone / Image Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleSelectImage(e.target.files?.[0])}
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
                  handleSelectImage(e.dataTransfer.files?.[0]);
                }}
                onClick={() => !isPublishing && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                  isDragging
                    ? 'border-[#ff8679] bg-[#ff8679]/10'
                    : previewUrl
                    ? 'border-zinc-700 bg-zinc-950'
                    : 'border-zinc-700 hover:border-[#ff8679]/70 bg-[#1a1b24]'
                }`}
              >
                {previewUrl ? (
                  <div className="relative aspect-[16/10] w-full flex items-center justify-center bg-zinc-950">
                    <img
                      src={previewUrl}
                      alt="Aperçu de votre création"
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/75 text-white text-xs font-bold border border-white/10">
                      Changer d’image
                    </span>
                  </div>
                ) : (
                  <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff8679] mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      Cliquez ou glissez une image ici
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      JPG, PNG, WEBP ou GIF · 15 Mo maximum
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Title */}
              <div>
                <label
                  htmlFor="gallery-title-input"
                  className="block text-xs font-bold text-zinc-300 mb-1.5"
                >
                  Titre de l’œuvre (optionnel)
                </label>
                <input
                  id="gallery-title-input"
                  type="text"
                  maxLength={80}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  disabled={isPublishing}
                  placeholder="Ex : Croquis personnage, Illustration chapitre 4..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1b24] border border-zinc-800 focus:border-[#ff8679] text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
                  {uploadError}
                </div>
              )}

              {isPublishing && uploadProgressText && (
                <div className="flex items-center gap-2 text-xs text-[#ff8679] font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{uploadProgressText}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPublishing}
                onClick={resetUploadModal}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                id="gallery-submit-btn"
                type="submit"
                disabled={isPublishing || !selectedFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-sm shadow-md glow-ozi disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-almodobar"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publication...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" />
                    <span>Publier l’image</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fullscreen Lightbox Viewer */}
      {activeLightboxCreation && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLightboxIndex(null);
          }}
        >
          {/* Lightbox Top Bar */}
          {(() => {
            const lightboxSpecialRole = getCreationSpecialRole(activeLightboxCreation);
            const isLightboxSpecial = Boolean(lightboxSpecialRole);
            return (
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/70">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-full overflow-hidden shrink-0 ${
                  isLightboxSpecial
                    ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2px] ring-2 ring-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                    : 'bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5'
                }`}
              >
                {activeLightboxCreation.authorPhotoURL ? (
                  <img
                    src={activeLightboxCreation.authorPhotoURL}
                    alt={activeLightboxCreation.authorName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full bg-zinc-900"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black ${
                      isLightboxSpecial ? 'text-yellow-300' : 'text-[#ff8679]'
                    }`}
                  >
                    {activeLightboxCreation.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-sm font-bold truncate ${
                    isLightboxSpecial ? 'text-yellow-300' : 'text-white'
                  }`}
                >
                  {activeLightboxCreation.title || activeLightboxCreation.authorName}
                </div>
                <div className="text-xs text-zinc-400 truncate font-body">
                  {lightboxSpecialRole && (
                    <>
                      <span className="text-yellow-400 font-bold">
                        {lightboxSpecialRole === 'w.s.k' ? 'w.s.k' : 'Admin'}
                      </span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                    </>
                  )}
                  Par {activeLightboxCreation.authorName}
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span className="tabular-nums font-mono text-[11px]">
                    {formatCreationDate(activeLightboxCreation.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleLike(activeLightboxCreation)}
                disabled={pendingLikes.has(activeLightboxCreation.id)}
                aria-pressed={likedIds.has(activeLightboxCreation.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  likedIds.has(activeLightboxCreation.id)
                    ? 'bg-[#ff8679]/20 text-[#ff8679] border border-[#ff8679]/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    likedIds.has(activeLightboxCreation.id)
                      ? 'fill-[#ff8679] text-[#ff8679]'
                      : ''
                  }`}
                />
                <span className="tabular-nums font-mono">
                  {activeLightboxCreation.likesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLightboxIndex(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white cursor-pointer"
                aria-label="Fermer l’aperçu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
            );
          })()}

          {/* Lightbox Image Stage */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8">
            {creations.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveLightboxIndex((prev) =>
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
              src={activeLightboxCreation.imageUrl}
              alt={
                activeLightboxCreation.title ||
                `Création de ${activeLightboxCreation.authorName}`
              }
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />

            {creations.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveLightboxIndex((prev) =>
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
