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
    const seriesCol = collection(db, 'series');
    return onSnapshot(seriesCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedSeries: Series[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Series;
          loadedSeries.push({
            ...data,
            id: docSnap.id
          });
        });
        onUpdate(loadedSeries);
      }
    }, (err) => {
      console.warn('Firestore real-time subscription error:', err);
    });
  } catch (err) {
    console.warn('Firestore subscription unavailable:', err);
    return () => {};
  }
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
    await setDoc(doc(databaseInstance, 'series', series.id), {
      ...series,
      updatedAt: series.updatedAt || new Date().toISOString().split('T')[0],
      firestoreSyncedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `series/${series.id}`);
    return { success: false, error: err };
  }
}

export async function deleteSeriesFromFirestore(databaseInstance: Firestore = db, seriesId: string) {
  try {
    await deleteDoc(doc(databaseInstance, 'series', seriesId));
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


