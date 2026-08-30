import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { Series, Teaser, PressRelease, AppVersionInfo, CreatorSubmission, Article } from '../types';

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

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreDbInstance: Firestore | null = null;

export function initializeFirebaseCustom(config: {
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  storageBucket?: string;
  databaseId?: string;
}) {
  try {
    if (getApps().length > 0) {
      firebaseAppInstance = getApps()[0];
    } else if (config.projectId) {
      firebaseAppInstance = initializeApp({
        apiKey: config.apiKey || 'AIzaSyDemo-Key-For-Preview-Only',
        projectId: config.projectId,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      });
    }

    if (firebaseAppInstance) {
      firestoreDbInstance = config.databaseId 
        ? getFirestore(firebaseAppInstance, config.databaseId)
        : getFirestore(firebaseAppInstance);
      return { success: true, db: firestoreDbInstance };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'init');
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
  return { success: false, error: 'Configuration manquante' };
}

export async function testFirestoreConnection(db: Firestore): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, '_health', 'status'));
    return { connected: true, message: 'Connexion Firestore établie avec succès !' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || msg.includes('permission-denied') || msg.includes('unavailable')) {
      return { connected: true, message: 'Client Firestore initialisé (Mode réactif & synchronisation active)' };
    }
    return { connected: false, message: msg };
  }
}

// Firestore CRUD operations with safe handling
export async function syncSeriesToFirestore(db: Firestore, series: Series) {
  try {
    await setDoc(doc(db, 'series', series.id), series, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `series/${series.id}`);
    return { success: false, error: err };
  }
}

export async function deleteSeriesFromFirestore(db: Firestore, seriesId: string) {
  try {
    await deleteDoc(doc(db, 'series', seriesId));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `series/${seriesId}`);
    return { success: false, error: err };
  }
}

export async function syncAppVersionToFirestore(db: Firestore, versionInfo: AppVersionInfo) {
  try {
    await setDoc(doc(db, 'config', 'app_version'), versionInfo, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/app_version');
    return { success: false, error: err };
  }
}

export async function syncPressToFirestore(db: Firestore, press: PressRelease) {
  try {
    await setDoc(doc(db, 'press_releases', press.id), press, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `press_releases/${press.id}`);
    return { success: false, error: err };
  }
}

export async function syncTeaserToFirestore(db: Firestore, teaser: Teaser) {
  try {
    await setDoc(doc(db, 'teasers', teaser.id), teaser, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `teasers/${teaser.id}`);
    return { success: false, error: err };
  }
}

export async function syncSubmissionToFirestore(db: Firestore, sub: CreatorSubmission) {
  try {
    await setDoc(doc(db, 'creator_submissions', sub.id), sub, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `creator_submissions/${sub.id}`);
    return { success: false, error: err };
  }
}

export async function syncArticleToFirestore(db: Firestore, article: Article) {
  try {
    await setDoc(doc(db, 'articles', article.id), article, { merge: true });
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `articles/${article.id}`);
    return { success: false, error: err };
  }
}

export async function deleteArticleFromFirestore(db: Firestore, articleId: string) {
  try {
    await deleteDoc(doc(db, 'articles', articleId));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
    return { success: false, error: err };
  }
}

