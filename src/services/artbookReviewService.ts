import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ArtbookReview } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleArtbookReviewFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error (artbook_reviews): ', JSON.stringify(errInfo));
  return errInfo;
}

const STORAGE_PREFIX = 'ozi_artbook_reviews_v1_';

function readCachedReviews(artbookId: string): ArtbookReview[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${artbookId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedReviews(artbookId: string, reviews: ArtbookReview[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${artbookId}`, JSON.stringify(reviews));
  } catch {
    // Ignore storage quota errors
  }
}

export function subscribeToArtbookReviews(
  artbookId: string,
  callback: (reviews: ArtbookReview[]) => void
): () => void {
  const cached = readCachedReviews(artbookId);
  if (cached.length > 0) {
    callback(cached);
  }

  try {
    const reviewsRef = collection(db, 'artbook_reviews');
    const q = query(reviewsRef, where('artbookId', '==', artbookId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ArtbookReview[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ArtbookReview;
          if (data.status !== 'hidden') {
            list.push({ ...data, id: docSnap.id });
          }
        });
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        writeCachedReviews(artbookId, list);
        callback(list);
      },
      (error) => {
        handleArtbookReviewFirestoreError(
          error,
          OperationType.LIST,
          `artbook_reviews?artbookId=${artbookId}`
        );
        callback(readCachedReviews(artbookId));
      }
    );

    return unsubscribe;
  } catch (err) {
    handleArtbookReviewFirestoreError(
      err,
      OperationType.LIST,
      `artbook_reviews?artbookId=${artbookId}`
    );
    callback(readCachedReviews(artbookId));
    return () => {};
  }
}

export async function submitArtbookReview(params: {
  artbookId: string;
  artbookTitle?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 0 (aucune étoile) ou 1..5
  commentText: string;
}): Promise<{ success: boolean; review?: ArtbookReview; error?: string }> {
  const cleanComment = params.commentText.trim();
  if (!cleanComment) {
    return { success: false, error: 'Veuillez écrire un commentaire avant de publier.' };
  }
  if (cleanComment.length > 2000) {
    return { success: false, error: 'Le commentaire ne peut pas dépasser 2000 caractères.' };
  }

  const safeRating = Number.isFinite(params.rating)
    ? Math.max(0, Math.min(5, Math.round(params.rating)))
    : 0;

  const reviewId = `abrev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newReview: ArtbookReview = {
    id: reviewId,
    artbookId: params.artbookId,
    artbookTitle: (params.artbookTitle || 'Artbook OZI').slice(0, 200),
    userId: params.userId,
    userName: (params.userName || 'Lecteur OZI').slice(0, 100),
    ...(params.userAvatar ? { userAvatar: params.userAvatar.slice(0, 1000) } : {}),
    rating: safeRating,
    commentText: cleanComment,
    likesCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
    status: 'approved',
  };

  try {
    await setDoc(doc(db, 'artbook_reviews', reviewId), newReview);
    const updatedCache = [
      newReview,
      ...readCachedReviews(params.artbookId).filter((r) => r.id !== reviewId),
    ];
    writeCachedReviews(params.artbookId, updatedCache);
    return { success: true, review: newReview };
  } catch (err: any) {
    handleArtbookReviewFirestoreError(
      err,
      OperationType.CREATE,
      `artbook_reviews/${reviewId}`
    );
    return {
      success: false,
      error:
        err?.code === 'permission-denied'
          ? 'Veuillez vous reconnecter pour publier votre avis.'
          : err?.message || 'Impossible de publier votre commentaire.',
    };
  }
}

export async function toggleArtbookReviewLike(
  review: ArtbookReview,
  userId: string
): Promise<{ likesCount: number; isLiked: boolean }> {
  const likedBy = Array.isArray(review.likedBy) ? review.likedBy : [];
  const isCurrentlyLiked = likedBy.includes(userId);
  const newLikedBy = isCurrentlyLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId].slice(0, 500);
  const newLikesCount = isCurrentlyLiked
    ? Math.max(0, (review.likesCount || 1) - 1)
    : (review.likesCount || 0) + 1;

  try {
    await updateDoc(doc(db, 'artbook_reviews', review.id), {
      likesCount: newLikesCount,
      likedBy: newLikedBy,
    });
  } catch (err) {
    handleArtbookReviewFirestoreError(
      err,
      OperationType.UPDATE,
      `artbook_reviews/${review.id}`
    );
  }

  return { likesCount: newLikesCount, isLiked: !isCurrentlyLiked };
}

export async function deleteArtbookReview(
  review: ArtbookReview
): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'artbook_reviews', review.id));
    const remaining = readCachedReviews(review.artbookId).filter(
      (r) => r.id !== review.id
    );
    writeCachedReviews(review.artbookId, remaining);
    return true;
  } catch (err) {
    handleArtbookReviewFirestoreError(
      err,
      OperationType.DELETE,
      `artbook_reviews/${review.id}`
    );
    return false;
  }
}
