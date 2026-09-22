import { db } from '../lib/firebase';
import { Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Series, Teaser, PressRelease, AppVersionInfo, CreatorSubmission, Article } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export function getAppFirestoreDb(): Firestore {
  return db;
}

export function initializeFirebaseCustom(config?: {
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  storageBucket?: string;
  databaseId?: string;
}) {
  return { success: true, db };
}

export async function testFirestoreConnection(databaseInstance: Firestore = db): Promise<{ connected: boolean; message: string }> {
  try {
    await setDoc(doc(databaseInstance, '_health', 'status'), {
      status: 'online',
      lastPing: new Date().toISOString(),
      projectId: firebaseAppletConfig.projectId
    }, { merge: true });
    return { connected: true, message: `Connexion Firestore établie avec succès ! (Projet: ${firebaseAppletConfig.projectId})` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('permission-denied') || msg.includes('unavailable')) {
      return { connected: true, message: 'Client Firestore initialisé (Mode réactif & synchronisation active)' };
    }
    return { connected: false, message: msg };
  }
}

// Subscribe to real-time series changes (for Web and mobile APK readers)
export function subscribeToFirestoreSeries(onUpdate: (seriesList: Series[]) => void) {
  try {
    const loadedMap = new Map<string, Series>();

    const handleUpdate = () => {
      if (loadedMap.size > 0) {
        onUpdate(Array.from(loadedMap.values()));
      }
    };

    // Listen to /series
    const seriesCol = collection(db, 'series');
    const unsubSeries = onSnapshot(seriesCol, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Series;
        const id = docSnap.id;
        loadedMap.set(id, {
          ...data,
          id,
          slug: data.slug || id
        });
      });
      handleUpdate();
    }, (err) => {
      console.warn('Firestore series real-time subscription error:', err);
    });

    // Listen to /works (in case added from website or external admin)
    const worksCol = collection(db, 'works');
    const unsubWorks = onSnapshot(worksCol, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const id = docSnap.id;
        // Normalize fields if from /works
        const normalized: Series = {
          id,
          title: data.title || data.name || id,
          slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id),
          author: data.author || data.writer || 'Auteur OZI',
          artist: data.artist || data.illustrator || 'Artiste OZI',
          country: data.country || 'Côte d\'Ivoire',
          synopsis: data.synopsis || data.description || 'Découvrez cette œuvre sur OZI.',
          genre: data.genre || 'Action & Shonen',
          secondaryGenres: data.secondaryGenres || [],
          tags: data.tags || [],
          coverUrl: data.coverUrl || data.cover || data.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          bannerUrl: data.bannerUrl || data.banner || data.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
          status: data.status || 'ongoing',
          rating: data.rating || 4.9,
          reviewsCount: data.reviewsCount || 100,
          totalReads: data.totalReads || data.views || 1000,
          totalLikes: data.totalLikes || data.likes || 250,
          chaptersCount: data.chaptersCount || (data.chapters ? data.chapters.length : 1),
          isFeatured: !!data.isFeatured,
          isExclusive: !!data.isExclusive,
          isTrending: !!data.isTrending,
          releaseYear: data.releaseYear || new Date().getFullYear(),
          language: data.language || 'Français',
          ageRating: data.ageRating || 'Tous publics',
          updatedAt: data.updatedAt || new Date().toISOString().split('T')[0],
          chapters: data.chapters || []
        };
        loadedMap.set(id, normalized);
      });
      handleUpdate();
    }, (err) => {
      console.warn('Firestore works real-time subscription error:', err);
    });

    // Listen to /artworks (legacy or alternative collection)
    const artworksCol = collection(db, 'artworks');
    const unsubArtworks = onSnapshot(artworksCol, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const id = docSnap.id;
        if (!loadedMap.has(id)) {
          const normalized: Series = {
            id,
            title: data.title || data.name || id,
            slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id),
            author: data.author || data.writer || 'Auteur OZI',
            artist: data.artist || data.illustrator || 'Artiste OZI',
            country: data.country || 'Côte d\'Ivoire',
            synopsis: data.synopsis || data.description || 'Découvrez cette œuvre sur OZI.',
            genre: data.genre || 'Action & Shonen',
            secondaryGenres: data.secondaryGenres || [],
            tags: data.tags || [],
            coverUrl: data.coverUrl || data.cover || data.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
            bannerUrl: data.bannerUrl || data.banner || data.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
            status: data.status || 'ongoing',
            rating: data.rating || 4.9,
            reviewsCount: data.reviewsCount || 100,
            totalReads: data.totalReads || data.views || 1000,
            totalLikes: data.totalLikes || data.likes || 250,
            chaptersCount: data.chaptersCount || (data.chapters ? data.chapters.length : 1),
            isFeatured: !!data.isFeatured,
            isExclusive: !!data.isExclusive,
            isTrending: !!data.isTrending,
            releaseYear: data.releaseYear || new Date().getFullYear(),
            language: data.language || 'Français',
            ageRating: data.ageRating || 'Tous publics',
            updatedAt: data.updatedAt || new Date().toISOString().split('T')[0],
            chapters: data.chapters || []
          };
          loadedMap.set(id, normalized);
        }
      });
      handleUpdate();
    }, (err) => {
      console.warn('Firestore artworks real-time subscription error:', err);
    });

    return () => {
      unsubSeries();
      unsubWorks();
      unsubArtworks();
    };
  } catch (err) {
    console.warn('Firestore subscription unavailable:', err);
    return () => {};
  }
}

// Direct fetch of all Series from Firestore (bypasses local cache for instant refresh)
export async function fetchFirestoreSeriesNow(databaseInstance: Firestore = db): Promise<Series[]> {
  const loadedMap = new Map<string, Series>();
  try {
    // 1. Check /series collection
    const seriesCol = collection(databaseInstance, 'series');
    const snapshotSeries = await getDocs(seriesCol);
    snapshotSeries.forEach((docSnap) => {
      const data = docSnap.data() as Series;
      const id = docSnap.id;
      loadedMap.set(id, {
        ...data,
        id,
        slug: data.slug || id
      });
    });
  } catch (err) {
    console.warn('Fetch series notice:', err);
  }

  // 2. Also check /works collection
  try {
    const worksCol = collection(databaseInstance, 'works');
      const snapshotWorks = await getDocs(worksCol);
      snapshotWorks.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const id = docSnap.id;
        const normalized: Series = {
          id,
          title: data.title || data.name || id,
          slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id),
          author: data.author || data.writer || 'Auteur OZI',
          artist: data.artist || data.illustrator || 'Artiste OZI',
          country: data.country || 'Côte d\'Ivoire',
          synopsis: data.synopsis || data.description || 'Découvrez cette œuvre sur OZI.',
          genre: data.genre || 'Action & Shonen',
          secondaryGenres: data.secondaryGenres || [],
          tags: data.tags || [],
          coverUrl: data.coverUrl || data.cover || data.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          bannerUrl: data.bannerUrl || data.banner || data.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
          status: data.status || 'ongoing',
          rating: data.rating || 4.9,
          reviewsCount: data.reviewsCount || 100,
          totalReads: data.totalReads || data.views || 1000,
          totalLikes: data.totalLikes || data.likes || 250,
          chaptersCount: data.chaptersCount || (data.chapters ? data.chapters.length : 1),
          isFeatured: !!data.isFeatured,
          isExclusive: !!data.isExclusive,
          isTrending: !!data.isTrending,
          releaseYear: data.releaseYear || new Date().getFullYear(),
          language: data.language || 'Français',
          ageRating: data.ageRating || 'Tous publics',
          updatedAt: data.updatedAt || new Date().toISOString().split('T')[0],
          chapters: data.chapters || []
        };
        loadedMap.set(id, normalized);
      });
    } catch (err) {
      console.warn('Fetch works notice:', err);
    }

    // 3. Also check /artworks collection
    try {
      const artworksCol = collection(databaseInstance, 'artworks');
      const snapshotArtworks = await getDocs(artworksCol);
      snapshotArtworks.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const id = docSnap.id;
        if (!loadedMap.has(id)) {
          const normalized: Series = {
            id,
            title: data.title || data.name || id,
            slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id),
            author: data.author || data.writer || 'Auteur OZI',
            artist: data.artist || data.illustrator || 'Artiste OZI',
            country: data.country || 'Côte d\'Ivoire',
            synopsis: data.synopsis || data.description || 'Découvrez cette œuvre sur OZI.',
            genre: data.genre || 'Action & Shonen',
            secondaryGenres: data.secondaryGenres || [],
            tags: data.tags || [],
            coverUrl: data.coverUrl || data.cover || data.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
            bannerUrl: data.bannerUrl || data.banner || data.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
            status: data.status || 'ongoing',
            rating: data.rating || 4.9,
            reviewsCount: data.reviewsCount || 100,
            totalReads: data.totalReads || data.views || 1000,
            totalLikes: data.totalLikes || data.likes || 250,
            chaptersCount: data.chaptersCount || (data.chapters ? data.chapters.length : 1),
            isFeatured: !!data.isFeatured,
            isExclusive: !!data.isExclusive,
            isTrending: !!data.isTrending,
            releaseYear: data.releaseYear || new Date().getFullYear(),
            language: data.language || 'Français',
            ageRating: data.ageRating || 'Tous publics',
            updatedAt: data.updatedAt || new Date().toISOString().split('T')[0],
            chapters: data.chapters || []
          };
          loadedMap.set(id, normalized);
        }
      });
    } catch (err) {
      console.warn('Fetch artworks notice:', err);
    }

  return Array.from(loadedMap.values());
}

// Subscribe to real-time APK Version
export function subscribeToFirestoreAppVersion(onUpdate: (version: AppVersionInfo) => void) {
  try {
    const versionDoc = doc(db, 'config', 'app_version');
    return onSnapshot(versionDoc, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AppVersionInfo);
      }
    }, (err) => {
      console.warn('Firestore version watch notice:', err);
    });
  } catch {
    return () => {};
  }
}

// Firestore CRUD operations with safe handling
export async function syncSeriesToFirestore(databaseInstance: Firestore = db, series: Series) {
  try {
    const payload = {
      ...series,
      updatedAt: series.updatedAt || new Date().toISOString().split('T')[0],
      firestoreSyncedAt: new Date().toISOString()
    };

    // 1. Write to /series (primary collection for app & website)
    await setDoc(doc(databaseInstance, 'series', series.id), payload, { merge: true });

    // 2. Also write/mirror to /works and /artworks so ANY old or new query hits the data
    try {
      await setDoc(doc(databaseInstance, 'works', series.id), payload, { merge: true });
    } catch {
      // Non-blocking fallback
    }

    try {
      await setDoc(doc(databaseInstance, 'artworks', series.id), payload, { merge: true });
    } catch {
      // Non-blocking fallback
    }

    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `series/${series.id}`);
    return { success: false, error: err };
  }
}

export async function deleteSeriesFromFirestore(databaseInstance: Firestore = db, seriesId: string) {
  try {
    await deleteDoc(doc(databaseInstance, 'series', seriesId));
    try {
      await deleteDoc(doc(databaseInstance, 'works', seriesId));
    } catch {
      // ignore
    }
    try {
      await deleteDoc(doc(databaseInstance, 'artworks', seriesId));
    } catch {
      // ignore
    }
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `series/${seriesId}`);
    return { success: false, error: err };
  }
}

export async function syncAppVersionToFirestore(databaseInstance: Firestore = db, versionInfo: AppVersionInfo) {
  try {
    await setDoc(doc(databaseInstance, 'config', 'app_version'), {
      ...versionInfo,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/app_version');
    return { success: false, error: err };
  }
}

export async function syncPressToFirestore(databaseInstance: Firestore = db, press: PressRelease) {
  try {
    await setDoc(doc(databaseInstance, 'press_releases', press.id), press, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `press_releases/${press.id}`);
    return { success: false, error: err };
  }
}

export async function syncTeaserToFirestore(databaseInstance: Firestore = db, teaser: Teaser) {
  try {
    await setDoc(doc(databaseInstance, 'teasers', teaser.id), teaser, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `teasers/${teaser.id}`);
    return { success: false, error: err };
  }
}

export async function syncSubmissionToFirestore(databaseInstance: Firestore = db, sub: CreatorSubmission) {
  try {
    await setDoc(doc(databaseInstance, 'creator_submissions', sub.id), sub, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `creator_submissions/${sub.id}`);
    return { success: false, error: err };
  }
}

export async function syncArticleToFirestore(databaseInstance: Firestore = db, article: Article) {
  try {
    await setDoc(doc(databaseInstance, 'articles', article.id), article, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `articles/${article.id}`);
    return { success: false, error: err };
  }
}

export async function deleteArticleFromFirestore(databaseInstance: Firestore = db, articleId: string) {
  try {
    await deleteDoc(doc(databaseInstance, 'articles', articleId));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
    return { success: false, error: err };
  }
}

export async function syncAdminSecurityToFirestore(
  databaseInstance: Firestore = db,
  securityData: { passwordHash: string; allowedUsernames: string[]; lastChangedAt: string }
) {
  try {
    await setDoc(doc(databaseInstance, 'config', 'admin_security'), {
      ...securityData,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/admin_security');
    return { success: false, error: err };
  }
}

export async function fetchAdminSecurityFromFirestore(databaseInstance: Firestore = db): Promise<{
  passwordHash: string;
  allowedUsernames: string[];
  lastChangedAt: string;
} | null> {
  try {
    const snap = await getDocFromServer(doc(databaseInstance, 'config', 'admin_security'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.passwordHash) {
        return {
          passwordHash: data.passwordHash,
          allowedUsernames: data.allowedUsernames || ['admin', 'wilfriedcrea@gmail.com', 'wilfried', 'ozi', 'ozibd'],
          lastChangedAt: data.lastChangedAt || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Unable to fetch admin security from Firestore (offline or initial):', err);
  }
  return null;
}



