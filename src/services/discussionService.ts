import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminAccountRecord, DiscussionMessage, DiscussionReplyRef } from '../types';

const COLLECTION_NAME = 'discussion_messages';
const GUEST_ID_STORAGE_KEY = 'ozi_discussion_guest_id';
const GUEST_NAME_STORAGE_KEY = 'ozi_discussion_guest_name';

export type CommunitySpecialRole = 'w.s.k' | 'admin' | null;

export function isWilfriedEmail(email?: string | null): boolean {
  const clean = (email || '').trim().toLowerCase();
  return clean === 'wilfriedcrea@gmail.com' || clean === 'wilfriedcrea@gmail';
}

export function isAdminOrWilfriedEmail(email?: string | null): boolean {
  return isWilfriedEmail(email);
}

export function resolveCommunitySpecialRole(params: {
  email?: string | null;
  userRole?: string | null;
  isStudioAdminAuthenticated?: boolean;
  adminAccounts?: AdminAccountRecord[];
}): CommunitySpecialRole {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  if (isWilfriedEmail(cleanEmail) || params.userRole === 'w.s.k') {
    return 'w.s.k';
  }
  if (cleanEmail && Array.isArray(params.adminAccounts)) {
    const matchedAdmin = params.adminAccounts.find(
      (a) => a.email.trim().toLowerCase() === cleanEmail && a.status === 'active'
    );
    if (matchedAdmin) {
      return matchedAdmin.role === 'w.s.k' ? 'w.s.k' : 'admin';
    }
  }
  if (
    params.userRole === 'super_admin' ||
    params.userRole === 'admin' ||
    params.userRole === 'moderator' ||
    params.isStudioAdminAuthenticated
  ) {
    return 'admin';
  }
  return null;
}

export enum DiscussionOperationType {
  CREATE = 'create',
  DELETE = 'delete',
  LIST = 'list',
}

export interface DiscussionFirestoreErrorInfo {
  error: string;
  operationType: DiscussionOperationType;
  path: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function logDiscussionFirestoreError(
  error: unknown,
  operationType: DiscussionOperationType,
  path: string
): DiscussionFirestoreErrorInfo {
  const errInfo: DiscussionFirestoreErrorInfo = {
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

export function getOrCreateGuestSessionId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{6,48}$/.test(existing)) {
      return existing;
    }
    const created = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(GUEST_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return `guest_${Date.now().toString(36)}`;
  }
}

export function getSavedGuestName(): string {
  try {
    const saved = localStorage.getItem(GUEST_NAME_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim().slice(0, 30) : 'Visiteur';
  } catch {
    return 'Visiteur';
  }
}

export function saveGuestName(name: string): void {
  try {
    const clean = name.trim().slice(0, 30);
    if (clean) {
      localStorage.setItem(GUEST_NAME_STORAGE_KEY, clean);
    }
  } catch {
    // ignore storage quota failures
  }
}

/**
 * Subscribes in real-time to the public Chatango-style discussion room.
 * Queries newest `limitCount` messages descending, then orders chronologically ascending for display.
 */
export function subscribeToDiscussionMessages(
  limitCount: number,
  onMessages: (messages: DiscussionMessage[]) => void,
  onError?: (friendlyError: string) => void
): () => void {
  const ref = collection(db, COLLECTION_NAME);
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DiscussionMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          text: String(data.text || ''),
          authorName: String(data.authorName || 'Visiteur'),
          authorPhotoURL: typeof data.authorPhotoURL === 'string' ? data.authorPhotoURL : '',
          userId: typeof data.userId === 'string' && data.userId ? data.userId : null,
          guestSessionId: typeof data.guestSessionId === 'string' ? data.guestSessionId : undefined,
          isGuest: Boolean(data.isGuest),
          authorIsAdmin: Boolean(data.authorIsAdmin),
          authorRole: typeof data.authorRole === 'string' && data.authorRole ? data.authorRole : undefined,
          replyTo: data.replyTo && typeof data.replyTo === 'object' ? (data.replyTo as DiscussionReplyRef) : null,
          createdAt: String(data.createdAt || new Date().toISOString()),
        });
      });

      items.reverse();
      onMessages(items);
    },
    (error) => {
      const info = logDiscussionFirestoreError(error, DiscussionOperationType.LIST, COLLECTION_NAME);
      if (onError) {
        if (info.error.toLowerCase().includes('permission')) {
          onError('Accès temporairement indisponible pour lire la discussion.');
        } else {
          onError('Impossible de synchroniser les messages en direct. Vérifiez votre connexion.');
        }
      }
    }
  );
}

/**
 * Posts a new message to the discussion collection.
 * Supports both authenticated members (with profile photo) and guests (default icon).
 */
export async function sendDiscussionMessage(params: {
  text: string;
  authorName: string;
  authorPhotoURL: string;
  userId: string | null;
  guestSessionId?: string;
  isGuest: boolean;
  authorIsAdmin?: boolean;
  authorRole?: string;
  replyTo?: DiscussionReplyRef | null;
}): Promise<{ success: boolean; message?: DiscussionMessage; error?: string }> {
  const cleanText = params.text.trim();
  if (!cleanText) {
    return { success: false, error: 'Le message ne peut pas être vide.' };
  }
  if (cleanText.length > 1000) {
    return { success: false, error: 'Le message est limité à 1 000 caractères.' };
  }

  const cleanAuthor = (params.authorName || 'Visiteur').trim().slice(0, 40) || 'Visiteur';
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();

  const isGuest = params.isGuest || !params.userId;
  const cleanRole = !isGuest && (params.authorRole === 'w.s.k' || params.authorRole === 'admin')
    ? params.authorRole
    : undefined;
  const authorIsAdmin = !isGuest && (Boolean(params.authorIsAdmin) || Boolean(cleanRole));
  const payload: DiscussionMessage = {
    id,
    text: cleanText,
    authorName: cleanAuthor,
    authorPhotoURL: isGuest ? '' : (params.authorPhotoURL || '').slice(0, 120000),
    userId: isGuest ? null : params.userId,
    guestSessionId: isGuest ? (params.guestSessionId || getOrCreateGuestSessionId()).slice(0, 64) : '',
    isGuest,
    ...(authorIsAdmin ? { authorIsAdmin: true } : {}),
    ...(cleanRole ? { authorRole: cleanRole } : {}),
    replyTo: params.replyTo
      ? {
          id: String(params.replyTo.id).slice(0, 128),
          authorName: String(params.replyTo.authorName).slice(0, 40),
          excerpt: String(params.replyTo.excerpt).slice(0, 160),
        }
      : null,
    createdAt,
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), payload);
    return { success: true, message: payload };
  } catch (error) {
    if (authorIsAdmin || cleanRole) {
      // Retry without privileged flags if current auth token does not carry server claim
      try {
        const fallbackPayload: DiscussionMessage = { ...payload };
        delete fallbackPayload.authorIsAdmin;
        delete fallbackPayload.authorRole;
        await setDoc(doc(db, COLLECTION_NAME, id), fallbackPayload);
        return { success: true, message: fallbackPayload };
      } catch (retryErr) {
        logDiscussionFirestoreError(retryErr, DiscussionOperationType.CREATE, `${COLLECTION_NAME}/${id}`);
      }
    } else {
      logDiscussionFirestoreError(error, DiscussionOperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    }
    return {
      success: false,
      error: 'Envoi impossible pour le moment. Réessayez dans un instant.',
    };
  }
}

export async function deleteDiscussionMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, messageId));
    return { success: true };
  } catch (error) {
    const info = logDiscussionFirestoreError(
      error,
      DiscussionOperationType.DELETE,
      `${COLLECTION_NAME}/${messageId}`
    );
    const isPermissionError = info.error.toLowerCase().includes('permission');
    return {
      success: false,
      error: isPermissionError
        ? 'Autorisation requise : connectez-vous à votre compte lecteur w.s.k ou admin pour supprimer les messages des autres membres.'
        : 'Impossible de supprimer ce message.',
    };
  }
}
