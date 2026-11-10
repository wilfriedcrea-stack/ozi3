import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ChapterReview, ReportedComment } from '../types';

const INITIAL_DEMO_REVIEWS: ChapterReview[] = [
  {
    id: 'rev_demo_1',
    seriesId: 'series-1787959963374',
    seriesTitle: "L'Ombre du Masque",
    chapterNumber: 1,
    uid: 'user_demo_fan1',
    userName: 'Koffi MangaFan',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=koffi',
    rating: 5,
    commentText: "Une masterclass ! L'ambiance afro-futuriste et les détails des planches sont à couper le souffle. Hâte de lire la suite !",
    likesCount: 14,
    likedBy: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved'
  },
  {
    id: 'rev_demo_2',
    seriesId: 'series-1787959963374',
    seriesTitle: "L'Ombre du Masque",
    chapterNumber: 1,
    uid: 'user_demo_fan2',
    userName: 'Amina BD',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=amina',
    rating: 5,
    commentText: "Félicitations aux créateurs, la bande-son d'ambiance avec la lecture des planches est incroyable.",
    likesCount: 9,
    likedBy: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved'
  },
  {
    id: 'rev_demo_3',
    seriesId: 'series-1787959963374',
    seriesTitle: "L'Ombre du Masque",
    chapterNumber: 2,
    uid: 'user_demo_fan3',
    userName: 'Ibrahim Comics',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ibrahim',
    rating: 4,
    commentText: "Le plot twist à la fin du chapitre 2 est dingue !! J'ai pris le pass 30 jours direct.",
    likesCount: 7,
    likedBy: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'approved'
  }
];

// In-memory fallback
let localReviews: ChapterReview[] = [...INITIAL_DEMO_REVIEWS];

/**
 * Subscribes in real-time to reviews for a series or specific chapter
 */
export function subscribeToReviews(
  seriesId: string,
  chapterId: string | undefined,
  callback: (reviews: ChapterReview[]) => void
): () => void {
  try {
    const reviewsRef = collection(db, 'reviews');
    let q = query(
      reviewsRef,
      where('seriesId', '==', seriesId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ChapterReview[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ChapterReview;
            if (data.status !== 'hidden') {
              if (!chapterId || data.chapterId === chapterId || !data.chapterId) {
                list.push({ ...data, id: docSnap.id });
              }
            }
          });

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(list.length > 0 ? list : getFallbackReviews(seriesId, chapterId));
        } else {
          callback(getFallbackReviews(seriesId, chapterId));
        }
      },
      (error) => {
        console.warn('[ReviewService] Snapshot error, using fallback:', error);
        callback(getFallbackReviews(seriesId, chapterId));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[ReviewService] Could not establish Firestore listener:', err);
    callback(getFallbackReviews(seriesId, chapterId));
    return () => {};
  }
}

function getFallbackReviews(seriesId: string, chapterId?: string): ChapterReview[] {
  return localReviews
    .filter((r) => r.seriesId === seriesId && r.status !== 'hidden')
    .filter((r) => !chapterId || r.chapterId === chapterId || !r.chapterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Posts a new review / rating for a series or chapter
 */
export async function submitReaderReview(params: {
  seriesId: string;
  seriesTitle?: string;
  chapterId?: string;
  chapterNumber?: number;
  uid: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  rating: number; // 1 to 5
  commentText: string;
}): Promise<{ success: boolean; review?: ChapterReview; error?: string }> {
  try {
    const cleanComment = params.commentText.trim();
    if (!cleanComment) {
      return { success: false, error: 'Le commentaire ne peut pas être vide.' };
    }

    const reviewId = `rev_${params.seriesId}_${params.uid}_${Date.now()}`;
    const newReview: ChapterReview = {
      id: reviewId,
      seriesId: params.seriesId,
      seriesTitle: params.seriesTitle || 'Œuvre OZI',
      chapterId: params.chapterId || undefined,
      chapterNumber: params.chapterNumber || undefined,
      uid: params.uid,
      userName: params.userName || 'Lecteur OZI',
      userAvatar: params.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${params.uid}`,
      userEmail: params.userEmail || '',
      rating: Math.max(1, Math.min(5, Math.round(params.rating))),
      commentText: cleanComment,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      status: 'approved'
    };

    // Store in local array
    localReviews.unshift(newReview);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'reviews', reviewId), newReview);
    } catch (firestoreErr: any) {
      console.warn('[ReviewService] Firestore write warning (persisted in local state):', firestoreErr);
    }

    return { success: true, review: newReview };
  } catch (err: any) {
    console.error('[ReviewService] Submit review error:', err);
    return { success: false, error: err.message || 'Impossible de publier votre avis.' };
  }
}

/**
 * Toggles a like on a review
 */
export async function toggleReviewLike(
  reviewId: string, 
  uid: string
): Promise<{ likesCount: number; isLiked: boolean }> {
  const existing = localReviews.find((r) => r.id === reviewId);
  const likedBy = existing?.likedBy || [];
  const isCurrentlyLiked = likedBy.includes(uid);

  let newLikedBy: string[];
  let newLikesCount: number;

  if (isCurrentlyLiked) {
    newLikedBy = likedBy.filter((id) => id !== uid);
    newLikesCount = Math.max(0, (existing?.likesCount || 1) - 1);
  } else {
    newLikedBy = [...likedBy, uid];
    newLikesCount = (existing?.likesCount || 0) + 1;
  }

  if (existing) {
    existing.likedBy = newLikedBy;
    existing.likesCount = newLikesCount;
  }

  // Update in Firestore
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      likesCount: newLikesCount,
      likedBy: newLikedBy
    });
  } catch (err) {
    console.warn('[ReviewService] Could not sync like to Firestore:', err);
  }

  return { likesCount: newLikesCount, isLiked: !isCurrentlyLiked };
}

/**
 * Reports a review to the moderation system
 */
export async function reportReviewToAdmin(params: {
  review: ChapterReview;
  reason: 'spam' | 'inappropriate' | 'spoiler' | 'hate_speech' | 'copyright' | 'harassment';
  reporterEmail?: string;
}): Promise<boolean> {
  try {
    const reportId = `rep_${Date.now()}`;
    const reportRecord: ReportedComment = {
      id: reportId,
      seriesId: params.review.seriesId,
      seriesTitle: params.review.seriesTitle || 'Œuvre OZI',
      chapterNumber: params.review.chapterNumber,
      userEmail: params.review.userEmail || `${params.review.uid}@reader.ozibd.net`,
      userName: params.review.userName,
      userAvatar: params.review.userAvatar,
      commentText: params.review.commentText,
      reportedReason: params.reason,
      reportCount: 1,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'reported_comments', reportId), reportRecord);
    } catch (err) {
      console.warn('[ReviewService] Could not persist report to Firestore:', err);
    }

    return true;
  } catch {
    return false;
  }
}
