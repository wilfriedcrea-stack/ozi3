import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { GalleryCreation } from '../types';
import { getOrCreateGuestSessionId } from './discussionService';
import { deleteStorageAsset, uploadArtworkAsset } from './storageService';

const GALLERY_COLLECTION = 'gallery_creations';
const LIKED_STORAGE_KEY = 'ozi_gallery_liked_creations_v1';
const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 680_000;

export enum GalleryOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  GET = 'get',
  LIST = 'list',
}

interface GalleryFirestoreErrorInfo {
  error: string;
  operationType: GalleryOperationType;
  path: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function logGalleryFirestoreError(
  error: unknown,
  operationType: GalleryOperationType,
  path: string
): GalleryFirestoreErrorInfo {
  const errInfo: GalleryFirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function getGalleryLikerId(uid?: string | null): string {
  if (uid) {
    return `u_${uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)}`;
  }
  return `g_${getOrCreateGuestSessionId().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)}`;
}

export function getCachedLikedCreationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

export function saveCachedLikedCreationIds(ids: Set<string>): void {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch {
    // ignore storage quota errors
  }
}

export function subscribeToGalleryCreations(
  limitCount: number,
  onCreations: (creations: GalleryCreation[]) => void,
  onError?: (friendlyError: string) => void
): () => void {
  const ref = collection(db, GALLERY_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GalleryCreation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';
        if (!imageUrl) return;
        items.push({
          id: docSnap.id,
          title: typeof data.title === 'string' ? data.title : '',
          imageUrl,
          storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          authorId: String(data.authorId || ''),
          authorName: String(data.authorName || 'Créateur OZI'),
          authorPhotoURL: typeof data.authorPhotoURL === 'string' ? data.authorPhotoURL : '',
          authorIsAdmin: Boolean(data.authorIsAdmin),
          authorRole: typeof data.authorRole === 'string' && data.authorRole ? data.authorRole : undefined,
          likesCount: Math.max(0, Number(data.likesCount || 0)),
          createdAt: String(data.createdAt || new Date().toISOString()),
        });
      });
      onCreations(items);
    },
    (error) => {
      const info = logGalleryFirestoreError(error, GalleryOperationType.LIST, GALLERY_COLLECTION);
      if (onError) {
        if (info.error.toLowerCase().includes('permission')) {
          onError('Accès temporairement indisponible pour lire la galerie.');
        } else {
          onError('Impossible de charger la galerie en direct. Vérifiez votre connexion.');
        }
      }
    }
  );
}

/**
 * Subscribes in real-time to all creations published by a specific user in #galerie.
 * Sorts client-side descending by createdAt to avoid requiring a composite index.
 */
export function subscribeToUserGalleryCreations(
  authorId: string,
  onCreations: (creations: GalleryCreation[]) => void,
  onError?: (friendlyError: string) => void
): () => void {
  if (!authorId) {
    onCreations([]);
    return () => {};
  }

  const ref = collection(db, GALLERY_COLLECTION);
  const q = query(ref, where('authorId', '==', authorId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GalleryCreation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';
        if (!imageUrl) return;
        items.push({
          id: docSnap.id,
          title: typeof data.title === 'string' ? data.title : '',
          imageUrl,
          storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
          authorId: String(data.authorId || ''),
          authorName: String(data.authorName || 'Créateur OZI'),
          authorPhotoURL: typeof data.authorPhotoURL === 'string' ? data.authorPhotoURL : '',
          authorIsAdmin: Boolean(data.authorIsAdmin),
          authorRole: typeof data.authorRole === 'string' && data.authorRole ? data.authorRole : undefined,
          likesCount: Math.max(0, Number(data.likesCount || 0)),
          createdAt: String(data.createdAt || new Date().toISOString()),
        });
      });

      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onCreations(items);
    },
    (error) => {
      const info = logGalleryFirestoreError(
        error,
        GalleryOperationType.LIST,
        `${GALLERY_COLLECTION}?authorId=${authorId}`
      );
      if (onError) {
        if (info.error.toLowerCase().includes('permission')) {
          onError('Accès temporairement indisponible pour lire votre galerie.');
        } else {
          onError('Impossible de charger votre galerie personnelle pour le moment.');
        }
      }
    }
  );
}

export async function syncLikedStateFromFirestore(
  creationIds: string[],
  likerId: string
): Promise<Set<string>> {
  const liked = new Set<string>();
  const checks = creationIds.slice(0, 60).map(async (creationId) => {
    try {
      const likeSnap = await getDoc(doc(db, GALLERY_COLLECTION, creationId, 'likes', likerId));
      if (likeSnap.exists()) {
        liked.add(creationId);
      }
    } catch {
      // ignore individual read failures
    }
  });
  await Promise.allSettled(checks);
  return liked;
}

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateGalleryImageFile(file: File): void {
  const hasImageMime = file.type ? ALLOWED_IMAGE_MIMES.includes(file.type.toLowerCase()) : false;
  const hasImageExt = /\.(jpe?g|png|webp|gif)$/i.test(file.name);

  if (!hasImageMime && !hasImageExt) {
    throw new Error('Seules les images (JPG, PNG, WEBP, GIF) sont autorisées dans #galerie.');
  }
  if (file.size > MAX_RAW_IMAGE_BYTES) {
    throw new Error('Image trop lourde (maximum 15 Mo).');
  }
}

function renderCompressedImage(
  img: HTMLImageElement,
  maxSide: number,
  mime: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error("Impossible de traiter l'image sur cet appareil."));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Échec de l'optimisation de l'image."));
          return;
        }
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve({ blob, dataUrl });
      },
      mime,
      quality
    );
  });
}

async function prepareGalleryImage(
  file: File
): Promise<{ blob: Blob; compactDataUrl: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    const objectUrl = URL.createObjectURL(file);
    el.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(el);
    };
    el.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire le fichier image sélectionné.'));
    };
    el.src = objectUrl;
  });

  const primary = await renderCompressedImage(img, 1400, 'image/webp', 0.86);
  if (primary.dataUrl.length <= MAX_DATA_URL_LENGTH) {
    return { blob: primary.blob, compactDataUrl: primary.dataUrl };
  }

  // Try progressively smaller fallback dimensions so Firestore inline fallback always succeeds cleanly
  const attempts: Array<{ side: number; mime: 'image/webp' | 'image/jpeg'; quality: number }> = [
    { side: 1080, mime: 'image/webp', quality: 0.78 },
    { side: 900, mime: 'image/webp', quality: 0.72 },
    { side: 760, mime: 'image/jpeg', quality: 0.72 },
  ];

  for (const step of attempts) {
    const attempt = await renderCompressedImage(img, step.side, step.mime, step.quality);
    if (attempt.dataUrl.length <= MAX_DATA_URL_LENGTH) {
      return { blob: primary.blob, compactDataUrl: attempt.dataUrl };
    }
  }

  return { blob: primary.blob, compactDataUrl: primary.dataUrl };
}

export async function publishGalleryCreation(params: {
  file: File;
  title: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  authorIsAdmin?: boolean;
  authorRole?: string;
  onProgress?: (percent: number, statusText: string) => void;
}): Promise<{ success: boolean; creation?: GalleryCreation; error?: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== params.authorId) {
    return {
      success: false,
      error: 'Seuls les membres connectés peuvent ajouter une image dans la galerie.',
    };
  }

  try {
    validateGalleryImageFile(params.file);
    params.onProgress?.(15, 'Préparation de votre création...');

    const creationId = `gal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const { blob, compactDataUrl } = await prepareGalleryImage(params.file);

    let imageUrl = '';
    let storagePath = '';

    try {
      params.onProgress?.(40, 'Envoi de l’image...');
      const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
      const targetPath = `gallery/${params.authorId}/${creationId}.${ext}`;
      const uploaded = await uploadArtworkAsset(blob, targetPath, (pct, txt) => {
        params.onProgress?.(Math.max(40, Math.min(90, pct)), txt);
      });
      if (uploaded?.downloadUrl) {
        imageUrl = uploaded.downloadUrl;
        storagePath = uploaded.storagePath;
      }
    } catch {
      // Fall back to compact WebP data URL if Storage upload is blocked/unavailable
    }

    if (!imageUrl) {
      if (compactDataUrl.length > 880_000) {
        return {
          success: false,
          error: "L'image reste trop lourde après compression. Essayez une image plus légère.",
        };
      }
      imageUrl = compactDataUrl;
      storagePath = '';
    }

    params.onProgress?.(95, 'Publication dans #galerie...');

    const cleanTitle = params.title.trim().slice(0, 80);
    const cleanAuthor = (params.authorName || 'Créateur OZI').trim().slice(0, 40) || 'Créateur OZI';
    const cleanRole =
      params.authorRole === 'w.s.k' || params.authorRole === 'admin'
        ? params.authorRole
        : undefined;
    const isAdminFlag = Boolean(params.authorIsAdmin) || Boolean(cleanRole);
    const creation: GalleryCreation = {
      id: creationId,
      title: cleanTitle,
      imageUrl,
      ...(storagePath ? { storagePath } : {}),
      authorId: params.authorId,
      authorName: cleanAuthor,
      authorPhotoURL: (params.authorPhotoURL || '').slice(0, 120_000),
      ...(isAdminFlag ? { authorIsAdmin: true } : {}),
      ...(cleanRole ? { authorRole: cleanRole } : {}),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, GALLERY_COLLECTION, creationId), creation);
    } catch (writeErr) {
      if (isAdminFlag || cleanRole) {
        const fallbackCreation: GalleryCreation = { ...creation };
        delete fallbackCreation.authorIsAdmin;
        delete fallbackCreation.authorRole;
        await setDoc(doc(db, GALLERY_COLLECTION, creationId), fallbackCreation);
        params.onProgress?.(100, 'Publié !');
        return { success: true, creation: fallbackCreation };
      }
      throw writeErr;
    }

    params.onProgress?.(100, 'Publié !');
    return { success: true, creation };
  } catch (error) {
    logGalleryFirestoreError(error, GalleryOperationType.CREATE, GALLERY_COLLECTION);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de publier l'image pour le moment.",
    };
  }
}

export async function toggleGalleryCreationLike(params: {
  creationId: string;
  likerId: string;
  currentlyLiked: boolean;
}): Promise<{ success: boolean; liked: boolean; likesCount?: number; error?: string }> {
  const creationRef = doc(db, GALLERY_COLLECTION, params.creationId);
  const likeRef = doc(db, GALLERY_COLLECTION, params.creationId, 'likes', params.likerId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const creationSnap = await transaction.get(creationRef);
      if (!creationSnap.exists()) {
        throw new Error("Cette création n'existe plus.");
      }

      const likeSnap = await transaction.get(likeRef);
      const currentCount = Math.max(0, Number(creationSnap.data().likesCount || 0));

      if (likeSnap.exists()) {
        const nextCount = Math.max(0, currentCount - 1);
        transaction.delete(likeRef);
        if (nextCount !== currentCount) {
          transaction.update(creationRef, { likesCount: nextCount });
        }
        return { liked: false, likesCount: nextCount };
      }

      const nextCount = currentCount + 1;
      transaction.set(likeRef, {
        id: params.likerId,
        creationId: params.creationId,
        userId: auth.currentUser?.uid ?? null,
        createdAt: new Date().toISOString(),
      });
      transaction.update(creationRef, { likesCount: nextCount });
      return { liked: true, likesCount: nextCount };
    });

    return { success: true, liked: result.liked, likesCount: result.likesCount };
  } catch (error) {
    logGalleryFirestoreError(
      error,
      GalleryOperationType.UPDATE,
      `${GALLERY_COLLECTION}/${params.creationId}/likes/${params.likerId}`
    );
    return {
      success: false,
      liked: params.currentlyLiked,
      error: 'Impossible de mettre à jour le like pour le moment.',
    };
  }
}

export async function updateGalleryCreationTitle(
  creationId: string,
  newTitle: string
): Promise<{ success: boolean; error?: string }> {
  if (!auth.currentUser) {
    return {
      success: false,
      error: 'Vous devez être connecté pour modifier cette création.',
    };
  }
  const cleanTitle = newTitle.trim().slice(0, 80);
  try {
    await updateDoc(doc(db, GALLERY_COLLECTION, creationId), {
      title: cleanTitle,
    });
    return { success: true };
  } catch (error) {
    logGalleryFirestoreError(
      error,
      GalleryOperationType.UPDATE,
      `${GALLERY_COLLECTION}/${creationId}`
    );
    return {
      success: false,
      error: 'Impossible de modifier le titre pour le moment.',
    };
  }
}

export async function deleteGalleryCreation(
  creation: GalleryCreation
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, GALLERY_COLLECTION, creation.id));
    if (creation.storagePath) {
      await deleteStorageAsset(creation.storagePath);
    }
    return { success: true };
  } catch (error) {
    const info = logGalleryFirestoreError(
      error,
      GalleryOperationType.DELETE,
      `${GALLERY_COLLECTION}/${creation.id}`
    );
    const isPermissionError = info.error.toLowerCase().includes('permission');
    return {
      success: false,
      error: isPermissionError
        ? 'Autorisation requise : connectez-vous à votre compte w.s.k ou admin pour supprimer cette création.'
        : 'Impossible de supprimer cette création.',
    };
  }
}
