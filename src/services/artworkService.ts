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
import { syncSeriesToFirestore, deleteSeriesFromFirestore, subscribeToFirestoreSeries, fetchFirestoreSeriesNow } from './firebaseService';

export const artworkService = {
  subscribePublishedSeries(callback: (seriesList: Series[]) => void) {
    return subscribeToFirestoreSeries(callback);
  },

  async getAllSeriesAdmin(): Promise<Series[]> {
    return await fetchFirestoreSeriesNow(db);
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

