import { db } from '../lib/firebase';
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { Series } from '../types';

export const artworkService = {
  subscribePublishedSeries(callback: (seriesList: Series[]) => void) {
    try {
      const q = query(
        collection(db, 'artworks'),
        where('published', '==', true),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as unknown as Series[];
        callback(list);
      }, (error) => {
        console.warn('Firestore subscription fallback:', error);
      });
    } catch (e) {
      console.warn('Firestore offline / local fallback:', e);
      return () => {};
    }
  },

  async getAllSeriesAdmin(): Promise<Series[]> {
    try {
      const q = query(collection(db, 'artworks'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as unknown as Series[];
    } catch (e) {
      console.warn('Firestore get admin series fallback:', e);
      return [];
    }
  },

  async saveSeries(data: Partial<Series>, id?: string): Promise<string> {
    const docId = id || doc(collection(db, 'artworks')).id;
    const docRef = doc(db, 'artworks', docId);
    const now = serverTimestamp();

    if (id) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: now,
        publishedAt: data.published ? (data.publishedAt || now) : null
      });
    } else {
      await setDoc(docRef, {
        ...data,
        id: docId,
        totalReads: 0,
        totalLikes: 0,
        rating: 5.0,
        currency: 'XOF',
        createdAt: now,
        updatedAt: now,
        publishedAt: data.published ? now : null
      });
    }
    return docId;
  },

  async deleteSeries(seriesId: string): Promise<void> {
    const seriesRef = doc(db, 'artworks', seriesId);
    const batch = writeBatch(db);
    batch.delete(seriesRef);
    await batch.commit();
  }
};
