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
import { syncSeriesToFirestore, deleteSeriesFromFirestore } from './firebaseService';

export const artworkService = {
  subscribePublishedSeries(callback: (seriesList: Series[]) => void) {
    try {
      const colRef = collection(db, 'series');
      return onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as unknown as Series[];
        list.sort((a, b) => {
          const timeB = new Date(b.updatedAt || (b as any).createdAt || 0).getTime() || (b.id?.startsWith('series-') ? Number(b.id.replace('series-', '')) : 0);
          const timeA = new Date(a.updatedAt || (a as any).createdAt || 0).getTime() || (a.id?.startsWith('series-') ? Number(a.id.replace('series-', '')) : 0);
          return timeB - timeA;
        });
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
      const q = query(collection(db, 'series'), orderBy('updatedAt', 'desc'));
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
    const docId = id || doc(collection(db, 'series')).id;
    const now = new Date().toISOString().split('T')[0];

    const fullSeries: Series = {
      id: docId,
      title: data.title || 'Nouvelle Œuvre',
      slug: data.slug || docId,
      author: data.author || 'Auteur OZI',
      artist: data.artist || 'Artiste OZI',
      country: data.country || 'Côte d\'Ivoire',
      synopsis: data.synopsis || '',
      genre: data.genre || 'Action & Shonen',
      secondaryGenres: data.secondaryGenres || [],
      tags: data.tags || [],
      coverUrl: data.coverUrl || '',
      bannerUrl: data.bannerUrl || data.coverUrl || '',
      status: data.status || 'ongoing',
      rating: data.rating || 5.0,
      reviewsCount: data.reviewsCount || 10,
      totalReads: data.totalReads || 100,
      totalLikes: data.totalLikes || 50,
      chaptersCount: data.chaptersCount || 1,
      isFeatured: !!data.isFeatured,
      isExclusive: !!data.isExclusive,
      isTrending: !!data.isTrending,
      releaseYear: data.releaseYear || new Date().getFullYear(),
      language: data.language || 'Français',
      ageRating: data.ageRating || 'Tous publics',
      updatedAt: now,
      chapters: data.chapters || []
    };

    // Save across all collections so mobile and web never miss it
    await syncSeriesToFirestore(db, fullSeries);
    return docId;
  },

  async deleteSeries(seriesId: string): Promise<void> {
    await deleteSeriesFromFirestore(db, seriesId);
  }
};

