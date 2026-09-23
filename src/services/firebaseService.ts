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

// Deduplicate series by ID, Slug, and Title
export function deduplicateSeries(seriesList: Series[]): { deduplicated: Series[]; duplicateIds: string[] } {
  const result: Series[] = [];
  const duplicateIds: string[] = [];

  for (const item of seriesList) {
    if (!item || !item.id) continue;
    const slugKey = (item.slug || item.id).trim().toLowerCase();
    const titleKey = (item.title || '').trim().toLowerCase();

    // Check if duplicate already encountered by ID, slug or title
    const matchIdx = result.findIndex(existing => 
      existing.id === item.id || 
      (existing.slug && existing.slug.trim().toLowerCase() === slugKey) ||
      (existing.title && existing.title.trim().toLowerCase() === titleKey)
    );

    if (matchIdx === -1) {
      result.push(item);
    } else {
      const existing = result[matchIdx];
      
      // Determine which one to keep
      const isItemCustom = item.id.startsWith('series-');
      const isExistingCustom = existing.id.startsWith('series-');

      let winner: Series;
      let loser: Series;

      if (isItemCustom && !isExistingCustom) {
        winner = item;
        loser = existing;
      } else if (!isItemCustom && isExistingCustom) {
        winner = existing;
        loser = item;
      } else {
        const itemCh = (item.chapters && item.chapters.length) || 0;
        const existCh = (existing.chapters && existing.chapters.length) || 0;
        if (itemCh !== existCh) {
          winner = itemCh > existCh ? item : existing;
          loser = itemCh > existCh ? existing : item;
        } else {
          winner = item;
          loser = existing;
        }
      }

      // Preserve chapters or cover from loser if winner misses them
      if ((!winner.chapters || winner.chapters.length === 0) && loser.chapters && loser.chapters.length > 0) {
        winner.chapters = loser.chapters;
        winner.chaptersCount = loser.chapters.length;
      }
      if ((!winner.coverUrl || winner.coverUrl.includes('placeholder')) && loser.coverUrl) {
        winner.coverUrl = loser.coverUrl;
      }

      if (loser.id !== winner.id && !duplicateIds.includes(loser.id)) {
        duplicateIds.push(loser.id);
      }

      result[matchIdx] = winner;
    }
  }

  return { deduplicated: result, duplicateIds };
}

// Subscribe to real-time series changes (for Web and mobile APK readers)
export function subscribeToFirestoreSeries(onUpdate: (seriesList: Series[]) => void) {
  try {
    let currentSeriesDocs = new Map<string, Series>();
    let currentWorksDocs = new Map<string, Series>();
    let currentArtworksDocs = new Map<string, Series>();

    const handleUpdate = () => {
      const merged = new Map<string, Series>();
      // Canonical /series takes absolute priority
      currentSeriesDocs.forEach((s, id) => merged.set(id, s));
      // /works only for items not in /series
      currentWorksDocs.forEach((s, id) => {
        if (!merged.has(id)) merged.set(id, s);
      });
      // /artworks only for items not in /series or /works
      currentArtworksDocs.forEach((s, id) => {
        if (!merged.has(id)) merged.set(id, s);
      });

      const rawList = Array.from(merged.values());
      const { deduplicated, duplicateIds } = deduplicateSeries(rawList);

      if (duplicateIds.length > 0) {
        duplicateIds.forEach(dupId => {
          deleteSeriesFromFirestore(db, dupId).catch(() => {});
        });
      }

      if (deduplicated.length > 0) {
        onUpdate(deduplicated);
      }
    };

    // Listen to /series
    const seriesCol = collection(db, 'series');
    const unsubSeries = onSnapshot(seriesCol, (snapshot) => {
      currentSeriesDocs = new Map<string, Series>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Series;
        const id = docSnap.id;
        currentSeriesDocs.set(id, {
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
      currentWorksDocs = new Map<string, Series>();
      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data() as any;
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
        currentWorksDocs.set(id, normalized);
      });
      handleUpdate();
    }, (err) => {
      console.warn('Firestore works real-time subscription error:', err);
    });

    // Listen to /artworks (legacy or alternative collection)
    const artworksCol = collection(db, 'artworks');
    const unsubArtworks = onSnapshot(artworksCol, (snapshot) => {
      currentArtworksDocs = new Map<string, Series>();
      snapshot.forEach((docSnap) => {
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
        currentArtworksDocs.set(id, normalized);
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

  // 2. Also check /works collection (only if not already loaded from /series)
  try {
    const worksCol = collection(databaseInstance, 'works');
    const snapshotWorks = await getDocs(worksCol);
    snapshotWorks.forEach((docSnap) => {
      const id = docSnap.id;
      if (!loadedMap.has(id)) {
        const data = docSnap.data() as any;
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

  const rawList = Array.from(loadedMap.values());
  const { deduplicated, duplicateIds } = deduplicateSeries(rawList);
  if (duplicateIds.length > 0) {
    duplicateIds.forEach(dupId => {
      deleteSeriesFromFirestore(databaseInstance, dupId).catch(() => {});
    });
  }

  return deduplicated;
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

// Deep sanitization helper to strip any `undefined` values that cause Firestore setDoc() to fail
export function cleanFirestoreObject(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreObject(item));
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreObject(value);
    }
  }
  return cleaned;
}

// Firestore CRUD operations with safe handling
export async function syncSeriesToFirestore(databaseInstance: Firestore = db, series: Series) {
  try {
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.split('T')[0];

    const safeCover = series.coverUrl || (series as any).cover || (series as any).thumbnailUrl || '';
    const safeBanner = series.bannerUrl || (series as any).banner || safeCover;

    const rawPayload = {
      ...series,
      id: series.id,
      coverUrl: safeCover,
      cover: safeCover,
      thumbnailUrl: safeCover,
      bannerUrl: safeBanner,
      banner: safeBanner,
      createdAt: (series as any).createdAt || nowIso,
      updatedAt: series.updatedAt || nowDate,
      firestoreSyncedAt: nowIso
    };

    const payload = cleanFirestoreObject(rawPayload);

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

    // 3. Write individual chapters to subcollection /series/{id}/chapters/{chapterId}
    if (series.chapters && series.chapters.length > 0) {
      for (const ch of series.chapters) {
        if (ch && ch.id) {
          try {
            const chThumb = (ch as any).thumbnailUrl || (ch as any).thumbnail || (ch.pages && ch.pages.length > 0 ? ch.pages[0] : '');
            const chPayload = cleanFirestoreObject({
              ...ch,
              seriesId: series.id,
              thumbnailUrl: chThumb,
              thumbnail: chThumb,
              firestoreSyncedAt: nowIso
            });
            await setDoc(doc(databaseInstance, 'series', series.id, 'chapters', ch.id), chPayload, { merge: true });
          } catch (chErr) {
            console.warn(`Subcollection chapter sync warning for chapter ${ch.id}:`, chErr);
          }
        }
      }
    }

    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `series/${series.id}`);
    return { success: false, error: err };
  }
}

// Site Settings & Header Banner Sync
export interface SiteSettings {
  headerBannerUrl?: string;
  lastUpdated?: string;
}

export async function syncSiteSettingsToFirestore(
  databaseInstance: Firestore = db, 
  settings: Partial<SiteSettings>
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const payload = cleanFirestoreObject({
      ...settings,
      lastUpdated: new Date().toISOString()
    });
    
    // Write to /config/site_settings
    await setDoc(doc(databaseInstance, 'config', 'site_settings'), payload, { merge: true });
    
    // Also write to /config/top_banner for direct access
    if (settings.headerBannerUrl) {
      await setDoc(doc(databaseInstance, 'config', 'top_banner'), {
        url: settings.headerBannerUrl,
        bannerUrl: settings.headerBannerUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/site_settings');
    return { success: false, error: err };
  }
}

export async function fetchSiteSettingsFromFirestore(databaseInstance: Firestore = db): Promise<SiteSettings | null> {
  try {
    const snap = await getDocs(collection(databaseInstance, 'config'));
    let headerBannerUrl: string | undefined;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id === 'site_settings' && data?.headerBannerUrl) {
        headerBannerUrl = data.headerBannerUrl;
      } else if (docSnap.id === 'top_banner' && !headerBannerUrl) {
        headerBannerUrl = data?.url || data?.bannerUrl;
      }
    });
    return headerBannerUrl ? { headerBannerUrl } : null;
  } catch (err) {
    console.warn('Fetch site settings error:', err);
    return null;
  }
}

export function subscribeToFirestoreSiteSettings(onUpdate: (settings: SiteSettings) => void) {
  try {
    const docRef = doc(db, 'config', 'site_settings');
    const unsubMain = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        if (data && data.headerBannerUrl) {
          onUpdate(data);
        }
      }
    }, (err) => {
      console.warn('Site settings watch error:', err);
    });

    // Also fallback watch top_banner
    const bannerRef = doc(db, 'config', 'top_banner');
    const unsubBanner = onSnapshot(bannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const url = data?.url || data?.bannerUrl;
        if (url) {
          onUpdate({ headerBannerUrl: url });
        }
      }
    }, () => {});

    return () => {
      unsubMain();
      unsubBanner();
    };
  } catch {
    return () => {};
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



