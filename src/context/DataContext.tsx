import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Series, 
  SeriesGenre,
  Teaser, 
  PressRelease, 
  MediaKitAsset, 
  AppVersionInfo, 
  CreatorSubmission, 
  AnalyticsOverview, 
  FirebaseSyncConfig, 
  Chapter,
  AdminUser,
  MonetizationSettings,
  CreatorPayout,
  ReportedComment,
  ModerationLog,
  CoinPack,
  PaymentGateway,
  UserAccount,
  CoinTransaction,
  AdBanner,
  LwsStorageFile,
  Article,
  AdminAuthState,
  AdminCredentials,
  HomeHeroSlide,
  ReaderProfile,
  Artist,
  Artbook,
  ArtbookDownloadRecord,
  ArtbookPurchaseRecord,
  SubscriptionRecord
} from '../types';
import { 
  INITIAL_SERIES, 
  INITIAL_TEASERS, 
  INITIAL_PRESS_RELEASES, 
  INITIAL_MEDIA_KIT, 
  INITIAL_APP_VERSION, 
  INITIAL_ANALYTICS,
  DEFAULT_ADMIN_USER,
  DEFAULT_ADMIN_CREDENTIALS,
  INITIAL_MONETIZATION,
  INITIAL_CREATOR_PAYOUTS,
  INITIAL_REPORTED_COMMENTS,
  INITIAL_MODERATION_LOGS,
  INITIAL_USERS,
  INITIAL_COIN_TRANSACTIONS,
  INITIAL_ADS,
  INITIAL_LWS_FILES,
  INITIAL_HERO_SLIDES
} from '../data/initialData';
import { INITIAL_ARTISTS, INITIAL_ARTBOOKS } from '../data/initialArtists';
import { initialArticles } from '../data/initialArticles';
import { ambientAudio } from '../lib/ambientAudioEngine';
import { 
  hashPassword, 
  verifyPassword, 
  generateAdminSessionToken, 
  verifyAdminSessionToken, 
  checkLoginRateLimit, 
  recordFailedLoginAttempt, 
  resetFailedLoginAttempts 
} from '../utils/securityUtils';
import { normalizeImageUrl } from '../utils/imageUtils';
import { 
  initializeFirebaseCustom, 
  testFirestoreConnection, 
  syncSeriesToFirestore, 
  deleteSeriesFromFirestore, 
  syncAppVersionToFirestore, 
  syncPressToFirestore, 
  deletePressFromFirestore,
  fetchPressFromFirestore,
  subscribeToFirestorePress,
  syncTeaserToFirestore, 
  deleteTeaserFromFirestore,
  fetchTeasersFromFirestore,
  subscribeToFirestoreTeasers,
  syncMonetizationToFirestore,
  fetchMonetizationFromFirestore,
  subscribeToFirestoreMonetization,
  syncSubmissionToFirestore,
  syncArticleToFirestore,
  deleteArticleFromFirestore,
  fetchArticlesFromFirestore,
  subscribeToFirestoreArticles,
  syncAllArticlesToFirestore,
  subscribeToFirestoreSeries,
  fetchFirestoreSeriesNow,
  subscribeToFirestoreAppVersion,
  getAppFirestoreDb,
  syncAdminSecurityToFirestore,
  fetchAdminSecurityFromFirestore,
  syncSiteSettingsToFirestore,
  fetchSiteSettingsFromFirestore,
  subscribeToFirestoreSiteSettings,
  recordDeletedSeriesToFirestore,
  deduplicateSeries,
  syncHeroSlidesToFirestore,
  fetchHeroSlidesFromFirestore,
  subscribeToFirestoreHeroSlides,
  syncArtistToFirestore,
  syncArtistToFirestoreDetailed,
  fetchArtistsFromFirestore,
  deleteArtistFromFirestore,
  deleteArtistFromFirestoreDetailed,
  syncArtbookToFirestore,
  syncArtbookToFirestoreDetailed,
  fetchArtbooksFromFirestore,
  deleteArtbookFromFirestore,
  deleteArtbookFromFirestoreDetailed,
  subscribeToFirestoreArtists,
  subscribeToFirestoreArtbooks,
  syncAllArtistsToFirestore,
  syncAllArtbooksToFirestore,
  recordArtbookDownloadInFirestore,
  recordArtbookPurchaseInFirestore,
  verifyArtbookPurchaseInFirestore,
  fetchUsersFromFirestore
} from '../services/firebaseService';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  loginStudioServer,
  loginStudioServerWithGoogleIdToken,
  logoutStudioServer,
  checkStudioServerSession,
  changeStudioServerPassword,
  fetchStudioDataFromServer,
  pushStudioDataPatch,
  mergeEntitiesByRecency,
  mergeIdSets,
  clearInMemoryServerToken
} from '../services/studioSyncService';
import { 
  signInReaderWithGoogle, 
  signInReaderWithEmail, 
  signUpReaderWithEmail, 
  sendReaderPasswordReset, 
  signOutReader, 
  updateReaderProfileInDb, 
  fetchOrCreateReaderProfile 
} from '../services/authService';
import { fetchUserSubscriptions, verifyPaystackPayment } from '../services/paystackClientService';
import firebaseAppletConfig from '../../firebase-applet-config.json';

interface DataContextType {
  // Data
  series: Series[];
  teasers: Teaser[];
  pressReleases: PressRelease[];
  mediaKit: MediaKitAsset[];
  appVersion: AppVersionInfo;
  analytics: AnalyticsOverview;
  submissions: CreatorSubmission[];
  firebaseConfig: FirebaseSyncConfig;
  adminUser: AdminUser;
  adminAuth: AdminAuthState;
  adminCredentials: AdminCredentials;
  monetization: MonetizationSettings;
  creatorPayouts: CreatorPayout[];
  reportedComments: ReportedComment[];
  moderationLogs: ModerationLog[];
  users: UserAccount[];
  coinTransactions: CoinTransaction[];
  ads: AdBanner[];
  lwsFiles: LwsStorageFile[];
  articles: Article[];
  artists: Artist[];
  artbooks: Artbook[];
  artbookDownloads: ArtbookDownloadRecord[];
  artbookPurchases: ArtbookPurchaseRecord[];

  // Auth actions (Admin)
  loginWithCredentials: (usernameInput: string, passwordInput: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; isLocked?: boolean; remainingSeconds?: number }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;
  setAdminUser: (user: AdminUser) => void;
  changeAdminPassword: (currentPass: string, newPass: string, isSuperAdminDirect?: boolean) => Promise<{ success: boolean; message?: string }>;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: (open: boolean) => void;
  openPasswordModal: () => void;
  isFirebaseAdminConnected: boolean;
  firebaseAuthEmail: string | null;
  lastCloudError: { message: string; needsGoogleAuth: boolean; code?: string } | null;
  clearLastCloudError: () => void;

  // Reader Firebase Authentication & Profile
  currentUser: User | null;
  readerProfile: ReaderProfile | null;
  isReaderAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  signInReaderWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInReaderWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpReaderWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  sendReaderPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  logoutReader: () => Promise<void>;
  updateReaderProfileData: (updates: { displayName?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;

  // View state & standalone pages
  viewMode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail' | 'artistes' | 'artiste-detail' | 'artbook-detail';
  setViewMode: (mode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail' | 'artistes' | 'artiste-detail' | 'artbook-detail') => void;
  selectedArticleId: string | null;
  selectedOeuvreId: string | null;
  selectedArtistId: string | null;
  selectedArtbookId: string | null;
  openArticlePage: (articleIdOrSlug: string) => void;
  openOeuvrePage: (seriesIdOrSlug: string) => void;
  openArtistPage: (artistIdOrSlug: string) => void;
  openArtbookPage: (artbookIdOrSlug: string) => void;
  recordArtbookDownload: (record: ArtbookDownloadRecord) => Promise<boolean>;
  recordArtbookPurchase: (record: ArtbookPurchaseRecord) => Promise<boolean>;
  verifyArtbookPurchase: (purchaseId: string, reference: string) => Promise<{ verified: boolean; downloadAuthorized: boolean }>;

  // Artist & Artbook admin management
  addArtist: (artist: Omit<Artist, 'id' | 'slug' | 'createdAt'>) => Promise<boolean>;
  updateArtist: (id: string, updates: Partial<Artist>) => Promise<boolean>;
  deleteArtist: (id: string) => Promise<boolean>;
  addArtbook: (artbook: Omit<Artbook, 'id' | 'slug' | 'downloadsCount' | 'createdAt'>) => Promise<boolean>;
  updateArtbook: (id: string, updates: Partial<Artbook>) => Promise<boolean>;
  deleteArtbook: (id: string) => Promise<boolean>;

  // Webtoon Reader State
  activeReaderSeries: Series | null;
  activeReaderChapter: Chapter | null;
  openReader: (seriesId: string, chapterId?: string) => void;
  closeReader: () => void;

  // Video Teaser State
  activeVideoTeaser: Teaser | null;
  openTeaserModal: (teaser: Teaser) => void;
  closeTeaserModal: () => void;

  // Series actions
  addSeries: (series: Omit<Series, 'id' | 'slug' | 'totalReads' | 'totalLikes' | 'rating' | 'reviewsCount' | 'updatedAt'>) => void;
  updateSeries: (id: string, updates: Partial<Series>) => Promise<boolean>;
  deleteSeries: (id: string) => void;
  cleanupDuplicates: () => Promise<{ cleaned: number; message: string }>;
  addChapter: (seriesId: string, chapter: Omit<Chapter, 'id' | 'seriesId' | 'releaseDate' | 'likesCount'>) => void;
  updateChapter: (seriesId: string, chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (seriesId: string, chapterId: string) => void;

  // Teasers actions
  addTeaser: (teaser: Omit<Teaser, 'id' | 'viewsCount' | 'releaseDate'>) => void;
  updateTeaser: (id: string, updates: Partial<Teaser>) => void;
  deleteTeaser: (id: string) => void;

  // Articles actions
  addArticle: (article: Omit<Article, 'id' | 'slug'>) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  // Press actions
  addPressRelease: (press: Omit<PressRelease, 'id' | 'slug' | 'date'>) => void;
  updatePressRelease: (id: string, updates: Partial<PressRelease>) => void;
  deletePressRelease: (id: string) => void;

  // Version actions
  updateAppVersion: (updates: Partial<AppVersionInfo>) => void;
  recordApkDownload: () => void;

  // Creator submissions
  submitCreatorProject: (submission: Omit<CreatorSubmission, 'id' | 'status' | 'submittedAt'>) => Promise<boolean>;
  updateSubmissionStatus: (id: string, status: CreatorSubmission['status'], notes?: string) => void;

  // Moderation Actions
  moderateComment: (commentId: string, action: 'approved' | 'hidden' | 'deleted', notes?: string) => void;
  deleteReportedComment: (commentId: string) => void;
  addModerationLog: (action: string, targetType: ModerationLog['targetType'], targetId: string, details: string) => void;

  // Monetization Actions
  updateMonetizationSettings: (updates: Partial<MonetizationSettings>) => void;
  updateCoinPack: (packId: string, updates: Partial<CoinPack>) => void;
  addCoinPack: (pack: Omit<CoinPack, 'id'>) => void;
  deleteCoinPack: (packId: string) => void;
  togglePaymentGateway: (gatewayId: string) => void;
  approvePayout: (payoutId: string) => void;
  rejectPayout: (payoutId: string, reason?: string) => void;
  createPayoutRequest: (payout: Omit<CreatorPayout, 'id' | 'status' | 'requestedAt'>) => void;

  // Users management
  updateUserRole: (userId: string, newRole: UserAccount['role']) => void;
  adjustUserCoins: (userId: string, amount: number, reason: string) => void;
  toggleUserBan: (userId: string) => void;
  toggleUserVip: (userId: string) => void;

  // Ads & Banners
  addAdBanner: (ad: Omit<AdBanner, 'id' | 'impressions' | 'clicks'>) => void;
  updateAdBanner: (id: string, updates: Partial<AdBanner>) => void;
  deleteAdBanner: (id: string) => void;
  toggleAdStatus: (id: string) => void;
  recordAdClick: (id: string) => void;

  // LWS Media Storage
  addLwsFile: (file: LwsStorageFile) => void;
  deleteLwsFile: (path: string) => void;

  // Firebase Firestore actions
  updateFirebaseConfig: (updates: Partial<FirebaseSyncConfig>) => void;
  testFirebaseConnection: () => Promise<{ success: boolean; message: string }>;
  triggerManualSync: () => Promise<void>;
  refreshCatalogueFromFirestore: () => Promise<boolean>;
  isRefreshingCatalogue: boolean;

  // Site Header Banner
  siteBannerUrl: string;
  updateSiteBannerUrl: (url: string) => Promise<boolean>;

  // Home Hero Slides Showcase
  heroSlides: HomeHeroSlide[];
  addHeroSlide: (slide: Omit<HomeHeroSlide, 'id' | 'createdAt'>) => void;
  updateHeroSlide: (id: string, updates: Partial<HomeHeroSlide>) => void;
  deleteHeroSlide: (id: string) => void;
  reorderHeroSlides: (slides: HomeHeroSlide[]) => void;
  syncHeroSlidesToFirestoreNow: () => Promise<{ success: boolean; message: string }>;
  isSyncingHeroSlides: boolean;

  // Artists & Artbooks Cloud Synchronization
  syncAllArtistsToFirestoreNow: () => Promise<{ success: boolean; message: string }>;
  syncAllArtbooksToFirestoreNow: () => Promise<{ success: boolean; message: string }>;
  isSyncingArtists: boolean;
  isSyncingArtbooks: boolean;

  // Articles Cloud Synchronization (Multi-devices)
  syncAllArticlesToFirestoreNow: () => Promise<{ success: boolean; message: string; count?: number }>;
  isSyncingArticlesCloud: boolean;

  // Interactions
  likeSeries: (seriesId: string) => void;
  likeChapter: (seriesId: string, chapterId: string) => void;

  // Premium Subscriptions & Paystack Access
  userSubscriptions: SubscriptionRecord[];
  hasWorkAccess: (workId: string) => boolean;
  refreshUserSubscriptions: () => Promise<void>;
  paystackToast: { visible: boolean; message: string; type: 'success' | 'error' | 'info'; workTitle?: string } | null;
  setPaystackToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' | 'info'; workTitle?: string } | null) => void;
}


const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEYS = {
  SERIES: 'ozi_series_data_v3',
  TEASERS: 'ozi_teasers_data_v1',
  PRESS: 'ozi_press_data_v1',
  VERSION: 'ozi_app_version_v1',
  SUBMISSIONS: 'ozi_submissions_v1',
  ANALYTICS: 'ozi_analytics_v1',
  FIREBASE: 'ozi_firebase_config_v1',
  MONETIZATION: 'ozi_monetization_v1',
  PAYOUTS: 'ozi_payouts_v1',
  COMMENTS: 'ozi_reported_comments_v1',
  MOD_LOGS: 'ozi_mod_logs_v1',
  ADMIN_USER: 'ozi_admin_user_v1',
  ADMIN_SESSION: 'ozi_admin_session_v2',
  ADMIN_CREDENTIALS: 'ozi_admin_credentials_v2',
  USERS: 'ozi_users_data_v1',
  TRANSACTIONS: 'ozi_transactions_v1',
  ADS: 'ozi_ads_banners_v1',
  LWS_FILES: 'ozi_lws_files_v1',
  ARTICLES: 'ozi_articles_data_v1',
  SITE_BANNER: 'ozi_site_banner_url_v1',
  DELETED_SERIES: 'ozi_deleted_series_ids_v1',
  HERO_SLIDES: 'ozi_hero_slides_v1',
  ARTISTS: 'ozi_artists_data_v1',
  DELETED_ARTISTS: 'ozi_deleted_artists_ids_v1',
  ARTBOOKS: 'ozi_artbooks_data_v1',
  DELETED_ARTBOOKS: 'ozi_deleted_artbooks_ids_v1',
  ARTBOOK_DOWNLOADS: 'ozi_artbook_downloads_v1',
  ARTBOOK_PURCHASES: 'ozi_artbook_purchases_v1'
};

export const KNOWN_DELETED_SERIES_IDS: string[] = [];

export const isSeriesPermanentlyDeleted = (s: Series, deletedSet: Set<string>): boolean => {
  if (!s || !s.id) return true;
  const idLower = (s.id || '').trim().toLowerCase();
  const slugLower = (s.slug || '').trim().toLowerCase();
  if (deletedSet.has(s.id) || deletedSet.has(idLower)) return true;
  if (s.slug && (deletedSet.has(s.slug) || deletedSet.has(slugLower))) return true;
  return false;
};

type ViewModeType = 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail' | 'artistes' | 'artiste-detail' | 'artbook-detail';

interface ParsedRoute {
  mode: ViewModeType;
  id: string | null;
}

const parseCurrentRoute = (): ParsedRoute => {
  if (typeof window === 'undefined') return { mode: 'accueil', id: null };
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Artbook standalone page check (#/artbook/slug or /artbook/slug or ?artbook=slug)
  const artbookHashMatch = window.location.hash.match(/#\/?artbook\/([a-zA-Z0-9_-]+)/i);
  const artbookPathMatch = window.location.pathname.match(/\/artbook\/([a-zA-Z0-9_-]+)/i);
  const artbookParam = searchParams.get('artbook');

  if (artbookHashMatch && artbookHashMatch[1]) {
    return { mode: 'artbook-detail', id: artbookHashMatch[1] };
  }
  if (artbookPathMatch && artbookPathMatch[1]) {
    return { mode: 'artbook-detail', id: artbookPathMatch[1] };
  }
  if (artbookParam) {
    return { mode: 'artbook-detail', id: artbookParam };
  }

  // 2. Artist standalone page check (#/artiste/slug or #/artist/slug or /artiste/slug or ?artiste=slug)
  const artistHashMatch = window.location.hash.match(/#\/?(artiste|artist)\/([a-zA-Z0-9_-]+)/i);
  const artistPathMatch = window.location.pathname.match(/\/(artiste|artist)\/([a-zA-Z0-9_-]+)/i);
  const artistParam = searchParams.get('artiste') || searchParams.get('artist');

  if (artistHashMatch && artistHashMatch[2]) {
    return { mode: 'artiste-detail', id: artistHashMatch[2] };
  }
  if (artistPathMatch && artistPathMatch[2]) {
    return { mode: 'artiste-detail', id: artistPathMatch[2] };
  }
  if (artistParam) {
    return { mode: 'artiste-detail', id: artistParam };
  }

  // 3. Article standalone page check (#/article/slug or /article/slug or ?article=slug)
  const articleHashMatch = window.location.hash.match(/#\/?article\/([a-zA-Z0-9_-]+)/i);
  const articlePathMatch = window.location.pathname.match(/\/article\/([a-zA-Z0-9_-]+)/i);
  const articleParam = searchParams.get('article');

  if (articleHashMatch && articleHashMatch[1]) {
    return { mode: 'article-detail', id: articleHashMatch[1] };
  }
  if (articlePathMatch && articlePathMatch[1]) {
    return { mode: 'article-detail', id: articlePathMatch[1] };
  }
  if (articleParam) {
    return { mode: 'article-detail', id: articleParam };
  }

  // 4. Oeuvre / Series standalone page check (#/oeuvre/slug or #/series/slug or /oeuvre/slug or ?oeuvre=slug)
  const oeuvreHashMatch = window.location.hash.match(/#\/?(oeuvre|series)\/([a-zA-Z0-9_-]+)/i);
  const oeuvrePathMatch = window.location.pathname.match(/\/(oeuvre|series)\/([a-zA-Z0-9_-]+)/i);
  const oeuvreParam = searchParams.get('oeuvre') || searchParams.get('series');

  if (oeuvreHashMatch && oeuvreHashMatch[2]) {
    return { mode: 'oeuvre-detail', id: oeuvreHashMatch[2] };
  }
  if (oeuvrePathMatch && oeuvrePathMatch[2]) {
    return { mode: 'oeuvre-detail', id: oeuvrePathMatch[2] };
  }
  if (oeuvreParam) {
    return { mode: 'oeuvre-detail', id: oeuvreParam };
  }

  // 5. Search page check (#/recherche or #/search or /recherche or /search or ?search= or ?q=)
  if (path === '/recherche' || path.startsWith('/recherche/') || path === '/search' || path.startsWith('/search/') || hash.includes('recherche') || hash.includes('search') || searchParams.has('search') || searchParams.has('q')) {
    return { mode: 'recherche', id: null };
  }

  // 6. Admin view check
  if (path === '/admin' || path.startsWith('/admin/') || path.includes('/admin') || hash.includes('admin') || searchParams.has('admin')) {
    return { mode: 'admin', id: null };
  }

  // 7. Artistes catalog check
  if (path === '/artistes' || path.startsWith('/artistes/') || path === '/artists' || path.startsWith('/artists/') || hash === '#artistes' || hash === '#/artistes' || hash === '#artists' || hash === '#/artists' || searchParams.has('artistes') || searchParams.has('artists')) {
    return { mode: 'artistes', id: null };
  }

  // 8. Oeuvres list catalog check
  if (path === '/oeuvres' || path.startsWith('/oeuvres/') || hash === '#oeuvres' || hash === '#/oeuvres' || searchParams.has('oeuvres')) {
    return { mode: 'oeuvres', id: null };
  }

  // 9. Articles list check
  if (path === '/articles' || path.startsWith('/articles/') || hash === '#articles' || hash === '#/articles' || searchParams.has('articles')) {
    return { mode: 'articles', id: null };
  }

  return { mode: 'accueil', id: null };
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Page routing state
  const initialRoute = parseCurrentRoute();
  const [viewMode, setViewModeState] = useState<ViewModeType>(initialRoute.mode);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialRoute.mode === 'article-detail' ? initialRoute.id : null);
  const [selectedOeuvreId, setSelectedOeuvreId] = useState<string | null>(initialRoute.mode === 'oeuvre-detail' ? initialRoute.id : null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(initialRoute.mode === 'artiste-detail' ? initialRoute.id : null);
  const [selectedArtbookId, setSelectedArtbookId] = useState<string | null>(initialRoute.mode === 'artbook-detail' ? initialRoute.id : null);

  const [artists, setArtists] = useState<Artist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTISTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const DEMO_IDS = new Set([
            'artist-kofi-mensah',
            'artist-tidiane-traore',
            'artist-nathalie-kouame',
            'artist-cherif-keita',
            'artist-fatou-sow',
            'artist-emeka-okafor',
            'artist-aissata-diallo',
            'artist-malick-sidibe-jr',
            'artist-zainab-al-mansoor',
            'artist-baba-kante'
          ]);
          return parsed.filter((a: any) => a && a.id && !DEMO_IDS.has(a.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [artbooks, setArtbooks] = useState<Artbook[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTBOOKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const DEMO_AB_IDS = new Set([
            'artbook-kemet-celeste',
            'artbook-gardiens-nil',
            'artbook-neo-abidjan-bible',
            'artbook-abidjan-neon-sketches',
            'artbook-reine-ebene-royaume',
            'artbook-soundiata-chroniques',
            'artbook-dakar-rouge-artbook',
            'artbook-lagos-mecha-design',
            'artbook-mami-wata-art',
            'artbook-sahel-souvenirs',
            'artbook-dakar-racers-garage'
          ]);
          return parsed.filter((ab: any) => ab && ab.id && !DEMO_AB_IDS.has(ab.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [artbookDownloads, setArtbookDownloads] = useState<ArtbookDownloadRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTBOOK_DOWNLOADS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [artbookPurchases, setArtbookPurchases] = useState<ArtbookPurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTBOOK_PURCHASES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeReaderSeries, setActiveReaderSeries] = useState<Series | null>(null);
  const [activeReaderChapter, setActiveReaderChapter] = useState<Chapter | null>(null);
  const [activeVideoTeaser, setActiveVideoTeaser] = useState<Teaser | null>(null);

  // Reader Firebase Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile | null>(null);
  const [isReaderAuthLoading, setIsReaderAuthLoading] = useState<boolean>(true);
  const [lastCloudError, setLastCloudError] = useState<{ message: string; needsGoogleAuth: boolean; code?: string } | null>(null);
  const clearLastCloudError = useCallback(() => setLastCloudError(null), []);
  const firebaseAuthEmail = currentUser?.email || null;
  const isFirebaseAdminConnected = Boolean(firebaseAuthEmail && firebaseAuthEmail.toLowerCase() === 'wilfriedcrea@gmail.com');
  const isFirebaseAdminConnectedRef = useRef<boolean>(isFirebaseAdminConnected);
  useEffect(() => { isFirebaseAdminConnectedRef.current = isFirebaseAdminConnected; }, [isFirebaseAdminConnected]);

  const loadStoredIdSet = (key: string): Set<string> => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const set = new Set<string>();
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (id && typeof id === 'string') {
            const trimmed = id.trim();
            if (trimmed) {
              set.add(trimmed);
              set.add(trimmed.toLowerCase());
            }
          }
        });
      }
      return set;
    } catch {
      return new Set<string>();
    }
  };

  const deletedArtistIdsRef = useRef<Set<string>>(loadStoredIdSet(STORAGE_KEYS.DELETED_ARTISTS));
  const deletedArtbookIdsRef = useRef<Set<string>>(loadStoredIdSet(STORAGE_KEYS.DELETED_ARTBOOKS));
  const deletedSeriesIdsRef = useRef<Set<string>>(loadStoredIdSet(STORAGE_KEYS.DELETED_SERIES));

  const artistsRef = useRef<Artist[]>(artists);
  const artbooksRef = useRef<Artbook[]>(artbooks);
  useEffect(() => { artistsRef.current = artists; }, [artists]);
  useEffect(() => { artbooksRef.current = artbooks; }, [artbooks]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  // Listen to Firebase Auth state for Readers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await fetchOrCreateReaderProfile(firebaseUser);
          setReaderProfile(profile);
          if (profile) {
            setUsers((prev) => {
              const alreadyExists = prev.some(u => u.id === profile.uid || (u.email && u.email.toLowerCase() === profile.email.toLowerCase()));
              if (alreadyExists) {
                return prev.map(u => (u.id === profile.uid || (u.email && u.email.toLowerCase() === profile.email.toLowerCase())) ? {
                  ...u,
                  id: profile.uid,
                  name: profile.displayName || u.name,
                  email: profile.email || u.email,
                  avatarUrl: profile.photoURL || u.avatarUrl
                } : u);
              }
              const newUser: UserAccount = {
                id: profile.uid,
                email: profile.email,
                name: profile.displayName || 'Lecteur Ozi',
                avatarUrl: profile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.uid}`,
                role: 'reader',
                coinsBalance: 0,
                isVip: false,
                isBanned: false,
                country: 'Côte d\'Ivoire',
                joinedAt: profile.createdAt || new Date().toISOString(),
                lastActiveAt: profile.updatedAt || new Date().toISOString(),
                readChaptersCount: 0,
                unlockedSeriesCount: 0
              };
              return [...prev, newUser];
            });
          }
        } catch (err) {
          console.warn('Reader profile load note:', err);
        }
      } else {
        setReaderProfile(null);
      }
      setIsReaderAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInReaderWithGoogleAction = useCallback(async () => {
    const res = await signInReaderWithGoogle();
    if (res.success && res.profile) {
      setReaderProfile(res.profile);
      setIsAuthModalOpen(false);
    }
    return res;
  }, []);

  const signInReaderWithEmailAction = useCallback(async (email: string, pass: string) => {
    const res = await signInReaderWithEmail(email, pass);
    if (res.success && res.profile) {
      setReaderProfile(res.profile);
      setIsAuthModalOpen(false);
    }
    return res;
  }, []);

  const signUpReaderWithEmailAction = useCallback(async (name: string, email: string, pass: string) => {
    const res = await signUpReaderWithEmail(name, email, pass);
    if (res.success && res.profile) {
      setReaderProfile(res.profile);
      setIsAuthModalOpen(false);
    }
    return res;
  }, []);

  const sendReaderPasswordResetAction = useCallback(async (email: string) => {
    return await sendReaderPasswordReset(email);
  }, []);

  const logoutReaderAction = useCallback(async () => {
    await signOutReader();
    setCurrentUser(null);
    setReaderProfile(null);
    setIsProfileModalOpen(false);
  }, []);

  const updateReaderProfileDataAction = useCallback(async (updates: { displayName?: string; bio?: string }) => {
    if (!currentUser) return { success: false, error: 'Non authentifié' };
    const res = await updateReaderProfileInDb(currentUser.uid, updates);
    if (res.success) {
      setReaderProfile(prev => prev ? ({ ...prev, ...updates, updatedAt: new Date().toISOString() }) : null);
    }
    return res;
  }, [currentUser]);

  // Premium Subscriptions State
  const [userSubscriptions, setUserSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [paystackToast, setPaystackToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    workTitle?: string;
  } | null>(null);

  const refreshUserSubscriptions = useCallback(async () => {
    if (currentUser?.uid) {
      const subs = await fetchUserSubscriptions(currentUser.uid);
      setUserSubscriptions(subs);
    }
  }, [currentUser]);

  // Load subscriptions on user change
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserSubscriptions(currentUser.uid).then(setUserSubscriptions);
    } else {
      setUserSubscriptions([]);
    }
  }, [currentUser]);

  // Automatic detection of Paystack redirect callback parameters (?reference=... or ?trxref=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    let reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('ref');

    if (!reference && hash.includes('ref=')) {
      const match = hash.match(/ref=([a-zA-Z0-9_-]+)/);
      if (match) reference = match[1];
    }

    if (reference) {
      (async () => {
        try {
          const res = await verifyPaystackPayment(
            reference!,
            currentUser?.uid,
            selectedOeuvreId || undefined
          );

          if (res.success && res.verified) {
            setPaystackToast({
              visible: true,
              type: 'success',
              message: '🎉 Félicitations ! Votre Pass 30 Jours a été activé avec succès.',
              workTitle: res.subscription?.workTitle,
            });
            if (currentUser?.uid) {
              const updated = await fetchUserSubscriptions(currentUser.uid);
              setUserSubscriptions(updated);
            }
          }

          // Clean URL params cleanly without reloading
          const cleanPath = window.location.pathname + (hash ? hash.split('?')[0] : '');
          window.history.replaceState({}, document.title, cleanPath);
        } catch (err) {
          console.error('[DataContext] Error processing Paystack callback:', err);
        }
      })();
    }
  }, [currentUser, selectedOeuvreId]);

  const setViewMode = useCallback((mode: ViewModeType) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      let targetHash = '';
      if (mode === 'admin') targetHash = '#admin';
      else if (mode === 'oeuvres') targetHash = '#oeuvres';
      else if (mode === 'articles') targetHash = '#articles';
      else if (mode === 'artistes') targetHash = '#artistes';
      else if (mode === 'recherche') targetHash = '#recherche';
      else if (mode === 'accueil') targetHash = '';

      if (targetHash) {
        window.location.hash = targetHash;
      } else if (mode === 'accueil' && window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openArticlePage = useCallback((articleIdOrSlug: string) => {
    setSelectedArticleId(articleIdOrSlug);
    setViewModeState('article-detail');
    if (typeof window !== 'undefined') {
      window.location.hash = `#/article/${articleIdOrSlug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openOeuvrePage = useCallback((seriesIdOrSlug: string) => {
    setSelectedOeuvreId(seriesIdOrSlug);
    setViewModeState('oeuvre-detail');
    if (typeof window !== 'undefined') {
      window.location.hash = `#/oeuvre/${seriesIdOrSlug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openArtistPage = useCallback((artistIdOrSlug: string) => {
    setSelectedArtistId(artistIdOrSlug);
    setViewModeState('artiste-detail');
    if (typeof window !== 'undefined') {
      window.location.hash = `#/artiste/${artistIdOrSlug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openArtbookPage = useCallback((artbookIdOrSlug: string) => {
    setSelectedArtbookId(artbookIdOrSlug);
    setViewModeState('artbook-detail');
    if (typeof window !== 'undefined') {
      window.location.hash = `#/artbook/${artbookIdOrSlug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Record free artbook download
  const recordArtbookDownload = useCallback(async (record: ArtbookDownloadRecord) => {
    setArtbookDownloads(prev => [record, ...prev]);
    setArtbooks(prev => prev.map(a => a.id === record.artbookId ? { ...a, downloadsCount: (a.downloadsCount || 0) + 1 } : a));
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await recordArtbookDownloadInFirestore(fb.db, record);
      }
    } catch (err) {
      console.warn('Sync download to Firestore notice:', err);
    }
    return true;
  }, []);

  // Record paid artbook purchase
  const recordArtbookPurchase = useCallback(async (record: ArtbookPurchaseRecord) => {
    setArtbookPurchases(prev => [record, ...prev]);
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await recordArtbookPurchaseInFirestore(fb.db, record);
      }
    } catch (err) {
      console.warn('Sync purchase to Firestore notice:', err);
    }
    return true;
  }, []);

  // Verify paid artbook purchase
  const verifyArtbookPurchaseAction = useCallback(async (purchaseId: string, reference: string) => {
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        const res = await verifyArtbookPurchaseInFirestore(fb.db, purchaseId, reference);
        if (res.verified) {
          setArtbookPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'completed', downloadAuthorized: true } : p));
          setArtbooks(prev => prev.map(a => {
            const matchPurchase = artbookPurchases.find(p => p.id === purchaseId);
            if (matchPurchase && a.id === matchPurchase.artbookId) {
              return { ...a, downloadsCount: (a.downloadsCount || 0) + 1 };
            }
            return a;
          }));
        }
        return res;
      }
    } catch (err) {
      console.warn('Verify purchase in Firestore error:', err);
    }
    setArtbookPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'completed', downloadAuthorized: true } : p));
    return { verified: true, downloadAuthorized: true };
  }, [artbookPurchases]);

  const persistArtistsLocally = useCallback((nextArtists: Artist[]) => {
    artistsRef.current = nextArtists;
    setArtists(nextArtists);
    try {
      localStorage.setItem(STORAGE_KEYS.ARTISTS, JSON.stringify(nextArtists));
    } catch (storageErr) {
      console.warn('Unable to persist artists to localStorage:', storageErr);
    }
  }, []);

  const persistArtbooksLocally = useCallback((nextArtbooks: Artbook[]) => {
    artbooksRef.current = nextArtbooks;
    setArtbooks(nextArtbooks);
    try {
      localStorage.setItem(STORAGE_KEYS.ARTBOOKS, JSON.stringify(nextArtbooks));
    } catch (storageErr) {
      console.warn('Unable to persist artbooks to localStorage:', storageErr);
    }
  }, []);

  const addArtist = useCallback(async (artistData: Omit<Artist, 'id' | 'slug' | 'createdAt'>): Promise<boolean> => {
    const nowIso = new Date().toISOString();
    const slug = artistData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newArtist: Artist = {
      ...artistData,
      photoUrl: normalizeImageUrl(artistData.photoUrl),
      bannerAvatarUrl: artistData.bannerAvatarUrl ? normalizeImageUrl(artistData.bannerAvatarUrl) : '',
      bannerUrl: artistData.bannerUrl ? normalizeImageUrl(artistData.bannerUrl) : '',
      id: `artist-${slug}-${Date.now().toString(36)}`,
      slug: slug || `artist-${Date.now().toString(36)}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const previousArtists = artistsRef.current;
    const nextArtists = [newArtist, ...previousArtists];
    persistArtistsLocally(nextArtists);

    const srvRes = await pushStudioDataPatch({
      artists: nextArtists,
      deletedArtistIds: Array.from(deletedArtistIdsRef.current)
    });

    if (srvRes.unauthorized) {
      persistArtistsLocally(previousArtists);
      clearInMemoryServerToken();
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    let firestoreSaved = false;
    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          const fbRes = await syncArtistToFirestoreDetailed(fb.db, newArtist);
          firestoreSaved = fbRes.success;
        }
      } catch {}
    }

    if (!srvRes.success && !firestoreSaved) {
      persistArtistsLocally(previousArtists);
      setLastCloudError({
        message: srvRes.error || 'Impossible d\'enregistrer sur le serveur. Veuillez réessayer.',
        needsGoogleAuth: false
      });
      return false;
    }

    setLastCloudError(null);
    return true;
  }, [persistArtistsLocally]);

  const updateArtist = useCallback(async (id: string, updates: Partial<Artist>): Promise<boolean> => {
    const previousArtists = artistsRef.current;
    const existing = previousArtists.find(a => a.id === id);
    if (!existing) {
      setLastCloudError({
        message: 'Artiste introuvable dans la session actuelle.',
        needsGoogleAuth: false
      });
      return false;
    }
    const nextBannerAvatarRaw = updates.bannerAvatarUrl !== undefined ? updates.bannerAvatarUrl : existing.bannerAvatarUrl;
    const nextBannerRaw = updates.bannerUrl !== undefined ? updates.bannerUrl : existing.bannerUrl;
    const updatedArtist: Artist = {
      ...existing,
      ...updates,
      photoUrl: normalizeImageUrl(updates.photoUrl !== undefined ? updates.photoUrl : existing.photoUrl),
      bannerAvatarUrl: nextBannerAvatarRaw ? normalizeImageUrl(nextBannerAvatarRaw) : '',
      bannerUrl: nextBannerRaw ? normalizeImageUrl(nextBannerRaw) : '',
      updatedAt: new Date().toISOString()
    };
    const nextArtists = previousArtists.map(a => (a.id === id ? updatedArtist : a));
    persistArtistsLocally(nextArtists);

    const srvRes = await pushStudioDataPatch({
      artists: nextArtists,
      deletedArtistIds: Array.from(deletedArtistIdsRef.current)
    });

    if (srvRes.unauthorized) {
      persistArtistsLocally(previousArtists);
      clearInMemoryServerToken();
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    let firestoreSaved = false;
    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          const fbRes = await syncArtistToFirestoreDetailed(fb.db, updatedArtist);
          firestoreSaved = fbRes.success;
        }
      } catch {}
    }

    if (!srvRes.success && !firestoreSaved) {
      persistArtistsLocally(previousArtists);
      setLastCloudError({
        message: srvRes.error || 'Impossible d\'enregistrer les modifications sur le serveur.',
        needsGoogleAuth: false
      });
      return false;
    }

    setLastCloudError(null);
    return true;
  }, [persistArtistsLocally]);

  const deleteArtist = useCallback(async (id: string): Promise<boolean> => {
    const target = artistsRef.current.find(a => a.id === id);
    deletedArtistIdsRef.current.add(id);
    deletedArtistIdsRef.current.add(id.toLowerCase());
    if (target?.slug) {
      deletedArtistIdsRef.current.add(target.slug);
      deletedArtistIdsRef.current.add(target.slug.toLowerCase());
    }
    const deletedArr = Array.from(deletedArtistIdsRef.current);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_ARTISTS, JSON.stringify(deletedArr));
    } catch {}

    const nextArtists = artistsRef.current.filter(a => a.id !== id);
    persistArtistsLocally(nextArtists);

    const srvRes = await pushStudioDataPatch({
      artists: nextArtists,
      deletedArtistIds: deletedArr
    });
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await deleteArtistFromFirestoreDetailed(fb.db, id).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, [persistArtistsLocally]);

  const addArtbook = useCallback(async (artbookData: Omit<Artbook, 'id' | 'slug' | 'downloadsCount' | 'createdAt'>): Promise<boolean> => {
    const nowIso = new Date().toISOString();
    const slug = artbookData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newArtbook: Artbook = {
      ...artbookData,
      coverUrl: normalizeImageUrl(artbookData.coverUrl),
      alternateCoverUrl: artbookData.alternateCoverUrl ? normalizeImageUrl(artbookData.alternateCoverUrl) : '',
      id: `artbook-${slug}-${Date.now().toString(36)}`,
      slug: slug || `artbook-${Date.now().toString(36)}`,
      downloadsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const nextArtbooks = [newArtbook, ...artbooksRef.current];
    persistArtbooksLocally(nextArtbooks);

    let updatedLinkedArtist: Artist | null = null;
    let nextArtists = artistsRef.current;
    if (newArtbook.artistId) {
      nextArtists = artistsRef.current.map(a => {
        if (a.id === newArtbook.artistId && !(a.artbookIds || []).includes(newArtbook.id)) {
          updatedLinkedArtist = {
            ...a,
            artbookIds: [...(a.artbookIds || []), newArtbook.id],
            updatedAt: nowIso
          };
          return updatedLinkedArtist;
        }
        return a;
      });
      if (updatedLinkedArtist) {
        persistArtistsLocally(nextArtists);
      }
    }

    const patch: Record<string, unknown> = {
      artbooks: nextArtbooks,
      deletedArtbookIds: Array.from(deletedArtbookIdsRef.current)
    };
    if (updatedLinkedArtist) {
      patch.artists = nextArtists;
    }

    const srvRes = await pushStudioDataPatch(patch);
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          if (updatedLinkedArtist) {
            await syncArtistToFirestoreDetailed(fb.db, updatedLinkedArtist).catch(() => {});
          }
          await syncArtbookToFirestoreDetailed(fb.db, newArtbook).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, [persistArtbooksLocally, persistArtistsLocally]);

  const updateArtbook = useCallback(async (id: string, updates: Partial<Artbook>): Promise<boolean> => {
    const existing = artbooksRef.current.find(a => a.id === id);
    if (!existing) {
      setLastCloudError({
        message: 'Artbook introuvable dans la session actuelle.',
        needsGoogleAuth: false
      });
      return false;
    }
    const updatedArtbook: Artbook = {
      ...existing,
      ...updates,
      coverUrl: normalizeImageUrl(updates.coverUrl !== undefined ? updates.coverUrl : existing.coverUrl),
      alternateCoverUrl: (updates.alternateCoverUrl !== undefined ? updates.alternateCoverUrl : existing.alternateCoverUrl)
        ? normalizeImageUrl(updates.alternateCoverUrl !== undefined ? updates.alternateCoverUrl : existing.alternateCoverUrl)
        : '',
      updatedAt: new Date().toISOString()
    };
    const nextArtbooks = artbooksRef.current.map(a => (a.id === id ? updatedArtbook : a));
    persistArtbooksLocally(nextArtbooks);

    const srvRes = await pushStudioDataPatch({
      artbooks: nextArtbooks,
      deletedArtbookIds: Array.from(deletedArtbookIdsRef.current)
    });
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncArtbookToFirestoreDetailed(fb.db, updatedArtbook).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, [persistArtbooksLocally]);

  const deleteArtbook = useCallback(async (id: string): Promise<boolean> => {
    const target = artbooksRef.current.find(a => a.id === id);
    deletedArtbookIdsRef.current.add(id);
    deletedArtbookIdsRef.current.add(id.toLowerCase());
    if (target?.slug) {
      deletedArtbookIdsRef.current.add(target.slug);
      deletedArtbookIdsRef.current.add(target.slug.toLowerCase());
    }
    const deletedAbArr = Array.from(deletedArtbookIdsRef.current);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_ARTBOOKS, JSON.stringify(deletedAbArr));
    } catch {}

    const nextArtbooks = artbooksRef.current.filter(a => a.id !== id);
    persistArtbooksLocally(nextArtbooks);

    let updatedArtist: Artist | null = null;
    const nowIso = new Date().toISOString();
    const nextArtists = artistsRef.current.map(a => {
      if (a.artbookIds?.includes(id)) {
        updatedArtist = { ...a, artbookIds: a.artbookIds.filter(abId => abId !== id), updatedAt: nowIso };
        return updatedArtist;
      }
      return a;
    });
    if (updatedArtist) {
      persistArtistsLocally(nextArtists);
    }

    const patch: Record<string, unknown> = {
      artbooks: nextArtbooks,
      deletedArtbookIds: deletedAbArr
    };
    if (updatedArtist) {
      patch.artists = nextArtists;
    }

    const srvRes = await pushStudioDataPatch(patch);
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          if (updatedArtist) {
            await syncArtistToFirestoreDetailed(fb.db, updatedArtist).catch(() => {});
          }
          await deleteArtbookFromFirestoreDetailed(fb.db, id).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, [persistArtbooksLocally, persistArtistsLocally]);

  // Sync artists & artbooks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTISTS, JSON.stringify(artists));
    } catch {}
  }, [artists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTBOOKS, JSON.stringify(artbooks));
    } catch {}
  }, [artbooks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTBOOK_DOWNLOADS, JSON.stringify(artbookDownloads));
    } catch {}
  }, [artbookDownloads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTBOOK_PURCHASES, JSON.stringify(artbookPurchases));
    } catch {}
  }, [artbookPurchases]);

  // Cross-device synchronization for Artists & Artbooks (Server/LWS primary + timestamp-merged Firestore)
  useEffect(() => {
    const DEMO_ARTIST_IDS = new Set([
      'artist-kofi-mensah',
      'artist-tidiane-traore',
      'artist-nathalie-kouame',
      'artist-cherif-keita',
      'artist-fatou-sow',
      'artist-emeka-okafor',
      'artist-aissata-diallo',
      'artist-malick-sidibe-jr',
      'artist-zainab-al-mansoor',
      'artist-baba-kante'
    ]);
    const DEMO_AB_IDS = new Set([
      'artbook-kemet-celeste',
      'artbook-gardiens-nil',
      'artbook-neo-abidjan-bible',
      'artbook-abidjan-neon-sketches',
      'artbook-reine-ebene-royaume',
      'artbook-soundiata-chroniques',
      'artbook-dakar-rouge-artbook',
      'artbook-lagos-mecha-design',
      'artbook-mami-wata-art',
      'artbook-sahel-souvenirs',
      'artbook-dakar-racers-garage'
    ]);

    const filterUserArtists = (list: Artist[]) =>
      list.filter(a => a && a.id && !DEMO_ARTIST_IDS.has(a.id));

    const filterUserArtbooks = (list: Artbook[]) =>
      list.filter(ab => ab && ab.id && !DEMO_AB_IDS.has(ab.id));

    // 1. Initial baseline fetch from Server/LWS and Firestore merged strictly by recency
    const initRemoteArtistsAndArtbooks = async () => {
      try {
        const [serverData, remoteArtists, remoteArtbooks] = await Promise.all([
          fetchStudioDataFromServer(),
          fetchArtistsFromFirestore(),
          fetchArtbooksFromFirestore()
        ]);

        if (serverData) {
          if (Array.isArray(serverData.deletedArtistIds)) {
            deletedArtistIdsRef.current = mergeIdSets(deletedArtistIdsRef.current, serverData.deletedArtistIds);
            try {
              localStorage.setItem(STORAGE_KEYS.DELETED_ARTISTS, JSON.stringify(Array.from(deletedArtistIdsRef.current)));
            } catch {}
          }
          if (Array.isArray(serverData.deletedArtbookIds)) {
            deletedArtbookIdsRef.current = mergeIdSets(deletedArtbookIdsRef.current, serverData.deletedArtbookIds);
            try {
              localStorage.setItem(STORAGE_KEYS.DELETED_ARTBOOKS, JSON.stringify(Array.from(deletedArtbookIdsRef.current)));
            } catch {}
          }

          if (Array.isArray(serverData.artists)) {
            const mergedSrvArtists = mergeEntitiesByRecency(
              filterUserArtists(artistsRef.current),
              filterUserArtists(serverData.artists),
              deletedArtistIdsRef.current
            );
            persistArtistsLocally(mergedSrvArtists);
          }

          if (Array.isArray(serverData.artbooks)) {
            const mergedSrvArtbooks = mergeEntitiesByRecency(
              filterUserArtbooks(artbooksRef.current),
              filterUserArtbooks(serverData.artbooks),
              deletedArtbookIdsRef.current
            );
            persistArtbooksLocally(mergedSrvArtbooks);
          }
        }

        if (remoteArtists && remoteArtists.length > 0) {
          const mergedFbArtists = mergeEntitiesByRecency(
            filterUserArtists(artistsRef.current),
            filterUserArtists(remoteArtists),
            deletedArtistIdsRef.current
          );
          persistArtistsLocally(mergedFbArtists);
        }

        if (remoteArtbooks && remoteArtbooks.length > 0) {
          const mergedFbArtbooks = mergeEntitiesByRecency(
            filterUserArtbooks(artbooksRef.current),
            filterUserArtbooks(remoteArtbooks),
            deletedArtbookIdsRef.current
          );
          persistArtbooksLocally(mergedFbArtbooks);
        }
      } catch (err) {
        console.warn('Initial artists/artbooks sync notice:', err);
      }
    };
    initRemoteArtistsAndArtbooks();

    // 2. Persistent real-time onSnapshot listener: merges by recency so stale Firestore never wipes local/LWS edits
    const unsubscribeArtists = subscribeToFirestoreArtists((liveArtists) => {
      if (!liveArtists || liveArtists.length === 0) return;
      const merged = mergeEntitiesByRecency(
        filterUserArtists(artistsRef.current),
        filterUserArtists(liveArtists),
        deletedArtistIdsRef.current
      );
      persistArtistsLocally(merged);
    });

    const unsubscribeArtbooks = subscribeToFirestoreArtbooks((liveArtbooks) => {
      if (!liveArtbooks || liveArtbooks.length === 0) return;
      const merged = mergeEntitiesByRecency(
        filterUserArtbooks(artbooksRef.current),
        filterUserArtbooks(liveArtbooks),
        deletedArtbookIdsRef.current
      );
      persistArtbooksLocally(merged);
    });

    return () => {
      unsubscribeArtists();
      unsubscribeArtbooks();
    };
  }, [persistArtistsLocally, persistArtbooksLocally]);

  // Listen to browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setViewModeState(route.mode);
      if (route.mode === 'article-detail' && route.id) {
        setSelectedArticleId(route.id);
      } else if (route.mode === 'oeuvre-detail' && route.id) {
        setSelectedOeuvreId(route.id);
      } else if (route.mode === 'artiste-detail' && route.id) {
        setSelectedArtistId(route.id);
      } else if (route.mode === 'artbook-detail' && route.id) {
        setSelectedArtbookId(route.id);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sanitization utilities to guarantee zero rendering crashes on bad/incomplete data
  const cleanSeries = (s: any, fallback?: Series): Series => {
    const base = fallback || INITIAL_SERIES[0];
    const chapters = (Array.isArray(s?.chapters) && s.chapters.length > 0)
      ? s.chapters
      : (fallback?.chapters && fallback.chapters.length > 0 ? fallback.chapters : []);

    return {
      id: String(s?.id || fallback?.id || 'series-default'),
      title: String(s?.title || s?.name || fallback?.title || 'Série OZI'),
      slug: String(s?.slug || (s?.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : fallback?.slug || 'serie')),
      author: String(s?.author || s?.writer || fallback?.author || 'Auteur OZI'),
      artist: String(s?.artist || s?.illustrator || fallback?.artist || 'Artiste OZI'),
      authorPhotoUrl: s?.authorPhotoUrl || fallback?.authorPhotoUrl || '',
      authorBio: s?.authorBio || fallback?.authorBio || '',
      authorQuote: (s?.authorQuote && typeof s.authorQuote === 'string' && s.authorQuote.trim() !== '')
        ? s.authorQuote.trim()
        : ((fallback?.authorQuote && typeof fallback.authorQuote === 'string' && fallback.authorQuote.trim() !== '')
            ? fallback.authorQuote.trim()
            : 'Chaque chapitre est minutieusement composé avec passion et sens du détail. Merci pour votre lecture !'),
      shopArticles: Array.isArray(s?.shopArticles) ? s.shopArticles : (fallback?.shopArticles || []),
      country: String(s?.country || fallback?.country || 'Côte d\'Ivoire'),
      synopsis: String(s?.synopsis || s?.description || fallback?.synopsis || 'Découvrez cette œuvre sur OZI.'),
      genre: (s?.genre || fallback?.genre || 'Action & Shonen') as SeriesGenre,
      secondaryGenres: Array.isArray(s?.secondaryGenres) ? s.secondaryGenres : (fallback?.secondaryGenres || []),
      tags: Array.isArray(s?.tags) ? s.tags : (fallback?.tags || []),
      coverUrl: String(s?.coverUrl || s?.cover || s?.thumbnailUrl || fallback?.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'),
      bannerUrl: String(s?.bannerUrl || s?.banner || s?.coverUrl || fallback?.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80'),
      status: s?.status || fallback?.status || 'ongoing',
      format: (s?.format || fallback?.format || (chapters.length > 1 ? 'série' : 'film')) as any,
      published: s?.published !== undefined ? !!s.published : (fallback?.published !== undefined ? !!fallback.published : true),
      publishedAt: s?.publishedAt || fallback?.publishedAt || null,
      badges: Array.isArray(s?.badges) ? s.badges : (fallback?.badges || []),
      teaserVideoUrl: s?.teaserVideoUrl || fallback?.teaserVideoUrl,
      rating: typeof s?.rating === 'number' && !isNaN(s.rating) ? s.rating : (fallback?.rating ?? 4.9),
      reviewsCount: typeof s?.reviewsCount === 'number' && !isNaN(s.reviewsCount) ? s.reviewsCount : (fallback?.reviewsCount ?? 120),
      totalReads: typeof s?.totalReads === 'number' && !isNaN(s.totalReads) ? s.totalReads : (fallback?.totalReads ?? 1000),
      totalLikes: typeof s?.totalLikes === 'number' && !isNaN(s.totalLikes) ? s.totalLikes : (fallback?.totalLikes ?? 250),
      chaptersCount: typeof s?.chaptersCount === 'number' && !isNaN(s.chaptersCount) ? s.chaptersCount : (chapters.length || 1),
      isFeatured: !!(s?.isFeatured ?? fallback?.isFeatured),
      isExclusive: !!(s?.isExclusive ?? fallback?.isExclusive),
      isTrending: !!(s?.isTrending ?? fallback?.isTrending),
      releaseYear: typeof s?.releaseYear === 'number' ? s.releaseYear : (fallback?.releaseYear ?? 2026),
      language: String(s?.language || fallback?.language || 'Français'),
      ageRating: (s?.ageRating || fallback?.ageRating || 'Tous publics') as '18+' | 'Tous publics' | '16+' | '12+',
      updatedAt: String(s?.updatedAt || fallback?.updatedAt || new Date().toISOString().split('T')[0]),
      chapters
    };
  };

  // Helper to deduplicate series list by ID, slug and normalized title
  const deduplicateSeriesList = useCallback((seriesList: Series[]): { list: Series[]; discardedIds: string[] } => {
    const { deduplicated, duplicateIds } = deduplicateSeries(seriesList);
    return { list: deduplicated, discardedIds: duplicateIds };
  }, []);

  // Core Data
  const [series, setSeries] = useState<Series[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('ozi_series_data_v1');
        window.localStorage.removeItem('ozi_series_data');
        window.localStorage.removeItem('ozi_series_data_v2');
      }

      const saved = localStorage.getItem(STORAGE_KEYS.SERIES);
      if (saved) {
        const parsed: Series[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanedSaved = parsed.map((s) => cleanSeries(s));
          const { deduplicated } = deduplicateSeries(cleanedSaved);
          return deduplicated;
        }
      }
      const initial = INITIAL_SERIES.map((s) => cleanSeries(s));
      const { deduplicated } = deduplicateSeries(initial);
      return deduplicated;
    } catch {
      return INITIAL_SERIES;
    }
  });

  const [teasers, setTeasers] = useState<Teaser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEASERS);
      return saved ? JSON.parse(saved) : INITIAL_TEASERS;
    } catch {
      return INITIAL_TEASERS;
    }
  });

  const [pressReleases, setPressReleases] = useState<PressRelease[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESS);
      return saved ? JSON.parse(saved) : INITIAL_PRESS_RELEASES;
    } catch {
      return INITIAL_PRESS_RELEASES;
    }
  });

  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialArticles;
    } catch {
      return initialArticles;
    }
  });

  const [heroSlides, setHeroSlides] = useState<HomeHeroSlide[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HERO_SLIDES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: HomeHeroSlide, idx: number) => ({
            ...s,
            imageUrl: normalizeImageUrl(s.imageUrl),
            logoUrl: s.logoUrl ? normalizeImageUrl(s.logoUrl) : (s.id === 'slide-arcane' ? '/images/arcane-logo.svg' : (s.id === 'slide-dakar' ? '/images/dakar-logo.svg' : '')),
            buttonText: (s.buttonText && s.buttonText !== 'Lire le premier chapitre') ? s.buttonText : 'Voir le manhwa',
            formatStatus: s.formatStatus || 'WEBTOON • EN COURS',
            order: s.order ?? (idx + 1)
          }));
        }
      }
      return INITIAL_HERO_SLIDES.map(s => ({
        ...s,
        imageUrl: normalizeImageUrl(s.imageUrl),
        logoUrl: s.logoUrl ? normalizeImageUrl(s.logoUrl) : ''
      }));
    } catch {
      return INITIAL_HERO_SLIDES;
    }
  });

  const [mediaKit] = useState<MediaKitAsset[]>(INITIAL_MEDIA_KIT);

  const [appVersion, setAppVersion] = useState<AppVersionInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure valid official APK download URL
        if (!parsed.downloadUrl || parsed.downloadUrl.includes('ozi-app.lws.fr') || parsed.downloadUrl === './ozi-reader.apk') {
          parsed.downloadUrl = 'https://ozibd.net/ozi-reader.apk';
          parsed.apkDownloadUrl = 'https://ozibd.net/ozi-reader.apk';
        }
        // Always make sure apkDownloadUrl is synced with downloadUrl
        if (parsed.downloadUrl) {
          parsed.apkDownloadUrl = parsed.downloadUrl;
        }
        return parsed;
      }
      return INITIAL_APP_VERSION;
    } catch {
      return INITIAL_APP_VERSION;
    }
  });
  const seriesRef = useRef<Series[]>(series);
  const teasersRef = useRef<Teaser[]>(teasers);
  const pressReleasesRef = useRef<PressRelease[]>(pressReleases);
  const articlesRef = useRef<Article[]>(articles);
  const heroSlidesRef = useRef<HomeHeroSlide[]>(heroSlides);
  const appVersionRef = useRef<AppVersionInfo>(appVersion);
  useEffect(() => { seriesRef.current = series; }, [series]);
  useEffect(() => { teasersRef.current = teasers; }, [teasers]);
  useEffect(() => { pressReleasesRef.current = pressReleases; }, [pressReleases]);
  useEffect(() => { articlesRef.current = articles; }, [articles]);
  useEffect(() => { heroSlidesRef.current = heroSlides; }, [heroSlides]);
  useEffect(() => { appVersionRef.current = appVersion; }, [appVersion]);

  const [analytics, setAnalytics] = useState<AnalyticsOverview>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (saved) {
        const parsed: AnalyticsOverview = JSON.parse(saved);
        if (parsed.creatorEarningsCfa === 38450000) {
          return { ...parsed, creatorEarningsCfa: 0, revenueHistory: [] };
        }
        return parsed;
      }
      return INITIAL_ANALYTICS;
    } catch {
      return INITIAL_ANALYTICS;
    }
  });

  const [submissions, setSubmissions] = useState<CreatorSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'sub-1',
          creatorName: 'Amadou Konaté',
          email: 'amadou.k@artstudio.ci',
          phone: '+225 07 48 12 34 56',
          country: 'Côte d\'Ivoire',
          seriesTitle: 'Chroniques du Golfe Noir',
          genre: 'Sci-Fi & Cyberpunk',
          pitch: 'Une saga d\'espionnage maritime dans les plateformes pétrolières autonomes de 2070.',
          portfolioUrl: 'https://artstation.com/amadou-art',
          status: 'pending',
          submittedAt: '2026-08-24T14:30:00Z',
          notes: 'Portfolio très prometteur, style graphique dynamique'
        },
        {
          id: 'sub-2',
          creatorName: 'Grace Okafor',
          email: 'grace.okafor@creators.ng',
          country: 'Nigéria',
          seriesTitle: 'Orisha Rising',
          genre: 'Afro-Fantasy',
          pitch: 'L\'initiation des 12 gardiennes des autels sacrés de Lagos et Ibadan.',
          status: 'reviewed',
          submittedAt: '2026-08-20T09:15:00Z',
          notes: 'Épisode pilote reçu. En attente de contrat éditorial.'
        }
      ];
    } catch {
      return [];
    }
  });

  const [adminUser, setAdminUserState] = useState<AdminUser>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_USER;
    } catch {
      return DEFAULT_ADMIN_USER;
    }
  });

  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      allowedUsernames: DEFAULT_ADMIN_CREDENTIALS.allowedUsernames,
      passwordHash: DEFAULT_ADMIN_CREDENTIALS.defaultPasswordHash,
      lastChangedAt: '2026-09-01T00:00:00Z'
    };
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const openPasswordModal = useCallback(() => setIsPasswordModalOpen(true), []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) || localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!raw || !raw.startsWith('ozi_sec_v3.')) {
        return false;
      }
      // Tentative check of expiration timestamp
      const parts = raw.split('.');
      if (parts.length === 3) {
        const json = typeof atob === 'function' ? atob(parts[1]) : Buffer.from(parts[1], 'base64').toString('utf8');
        const parsed = JSON.parse(json);
        if (parsed?.e && Date.now() < parsed.e) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  // Continuous Cryptographic Session Audit
  useEffect(() => {
    let isMounted = true;
    async function auditSession() {
      if (typeof window === 'undefined') return;
      const rawToken = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) || localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!rawToken) {
        if (isMounted && isAuthenticated) {
          setIsAuthenticated(false);
        }
        return;
      }

      const res = await verifyAdminSessionToken(rawToken, adminCredentials.passwordHash, adminCredentials.allowedUsernames);
      if (!res.valid) {
        console.warn('OZI Security Guard - Session signature rejected:', res.reason);
        if (isMounted) {
          setIsAuthenticated(false);
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
        }
        return;
      }

      if (isAuthenticated) {
        const srvSession = await checkStudioServerSession();
        if (srvSession.reachable && !srvSession.authenticated && isMounted) {
          clearInMemoryServerToken();
          setIsAuthenticated(false);
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
        }
      }
    }

    auditSession();
    return () => { isMounted = false; };
  }, [adminCredentials.passwordHash, adminCredentials.allowedUsernames, isAuthenticated]);

  // Admin Inactivity Auto-Lockout (30 minutes of no user interaction)
  useEffect(() => {
    if (!isAuthenticated || viewMode !== 'admin') return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 30 * 60 * 1000;

    const resetInactivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAuthenticated(false);
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      }, INACTIVITY_LIMIT);
    };

    resetInactivity();
    const userEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    userEvents.forEach(evt => window.addEventListener(evt, resetInactivity, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      userEvents.forEach(evt => window.removeEventListener(evt, resetInactivity));
    };
  }, [isAuthenticated, viewMode]);

  // Admin Auth State - strictly guarded by authentication
  const adminAuth: AdminAuthState = {
    isAuthenticated,
    user: isAuthenticated ? adminUser : null,
    isSuperAdmin: isAuthenticated && (adminUser.email.toLowerCase() === 'wilfriedcrea@gmail.com' || adminUser.role === 'Super Admin'),
    isBypassActive: false,
    lastLoginAt: adminUser.lastLogin
  };

  // Check if current user has active 30-day Pass for this work
  const hasWorkAccess = useCallback((workId: string): boolean => {
    if (!workId) return false;
    // Admins always have full access
    if (adminAuth.isAuthenticated) return true;

    const now = Date.now();
    return userSubscriptions.some(
      sub => sub.workId === workId && sub.status === 'active' && new Date(sub.expirationDate).getTime() > now
    );
  }, [adminAuth.isAuthenticated, userSubscriptions]);

  const [monetization, setMonetization] = useState<MonetizationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MONETIZATION);
      if (saved) {
        const parsed: MonetizationSettings = JSON.parse(saved);
        return {
          ...parsed,
          totalPlatformRevenueXof: parsed.totalPlatformRevenueXof === 54900000 ? 0 : (parsed.totalPlatformRevenueXof || 0),
          totalPaidToCreatorsXof: parsed.totalPaidToCreatorsXof === 38450000 ? 0 : (parsed.totalPaidToCreatorsXof || 0),
        };
      }
      return INITIAL_MONETIZATION;
    } catch {
      return INITIAL_MONETIZATION;
    }
  });
  const monetizationRef = useRef<MonetizationSettings>(monetization);
  useEffect(() => { monetizationRef.current = monetization; }, [monetization]);

  const [creatorPayouts, setCreatorPayouts] = useState<CreatorPayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      if (saved) {
        const parsed: CreatorPayout[] = JSON.parse(saved);
        const mockIds = new Set(['payout-101', 'payout-102', 'payout-103', 'payout-104']);
        return parsed.filter(p => !mockIds.has(p.id));
      }
      return INITIAL_CREATOR_PAYOUTS;
    } catch {
      return INITIAL_CREATOR_PAYOUTS;
    }
  });

  const [reportedComments, setReportedComments] = useState<ReportedComment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      return saved ? JSON.parse(saved) : INITIAL_REPORTED_COMMENTS;
    } catch {
      return INITIAL_REPORTED_COMMENTS;
    }
  });

  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOD_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_MODERATION_LOGS;
    } catch {
      return INITIAL_MODERATION_LOGS;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        const mockIds = new Set(['usr-002', 'usr-003', 'usr-004', 'usr-005', 'usr-006']);
        const cleaned = parsed.filter(u => !mockIds.has(u.id));
        const hasAdmin = cleaned.some(u => u.role === 'super_admin' || u.email.toLowerCase() === 'wilfriedcrea@gmail.com');
        return hasAdmin ? cleaned : [INITIAL_USERS[0], ...cleaned];
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed: CoinTransaction[] = JSON.parse(saved);
        const mockTxIds = new Set(['tx-001', 'tx-002', 'tx-003', 'tx-004']);
        return parsed.filter(t => !mockTxIds.has(t.id));
      }
      return INITIAL_COIN_TRANSACTIONS;
    } catch {
      return INITIAL_COIN_TRANSACTIONS;
    }
  });

  const [ads, setAds] = useState<AdBanner[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADS);
      return saved ? JSON.parse(saved) : INITIAL_ADS;
    } catch {
      return INITIAL_ADS;
    }
  });

  const [lwsFiles, setLwsFiles] = useState<LwsStorageFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LWS_FILES);
      return saved ? JSON.parse(saved) : INITIAL_LWS_FILES;
    } catch {
      return INITIAL_LWS_FILES;
    }
  });

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseSyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FIREBASE);
      return saved ? JSON.parse(saved) : {
        projectId: firebaseAppletConfig.projectId,
        databaseId: firebaseAppletConfig.firestoreDatabaseId,
        authDomain: firebaseAppletConfig.authDomain,
        storageBucket: firebaseAppletConfig.storageBucket,
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
        autoSyncEnabled: true,
        syncState: 'synced'
      };
    } catch {
      return {
        projectId: firebaseAppletConfig.projectId,
        databaseId: firebaseAppletConfig.firestoreDatabaseId,
        authDomain: firebaseAppletConfig.authDomain,
        storageBucket: firebaseAppletConfig.storageBucket,
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
        autoSyncEnabled: true,
        syncState: 'synced'
      };
    }
  });

  const [isRefreshingCatalogue, setIsRefreshingCatalogue] = useState(false);

  // Site Header Banner State (synchronized across devices via Firestore config/site_settings)
  const [siteBannerUrl, setSiteBannerUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SITE_BANNER);
      return saved && saved.trim() ? saved : 'https://ozibd.net/REF.png';
    } catch {
      return 'https://ozibd.net/REF.png';
    }
  });

  // Real-time Server/LWS + Firestore sync listener (keeps Web and APK synchronized without overwriting newer edits)
  useEffect(() => {
    let hasServerBanner = false;

    const fetchInitial = async () => {
      try {
        const serverData = await fetchStudioDataFromServer();
        if (serverData) {
          if (Array.isArray(serverData.deletedSeriesIds)) {
            deletedSeriesIdsRef.current = mergeIdSets(deletedSeriesIdsRef.current, serverData.deletedSeriesIds);
            try {
              localStorage.setItem(STORAGE_KEYS.DELETED_SERIES, JSON.stringify(Array.from(deletedSeriesIdsRef.current)));
            } catch {}
          }
          if (typeof serverData.siteBannerUrl === 'string' && serverData.siteBannerUrl.trim()) {
            hasServerBanner = true;
            const normBanner = normalizeImageUrl(serverData.siteBannerUrl);
            setSiteBannerUrl(normBanner);
            try {
              localStorage.setItem(STORAGE_KEYS.SITE_BANNER, normBanner);
            } catch {}
          }
          if (Array.isArray(serverData.heroSlides) && serverData.heroSlides.length > 0) {
            const normSlides = serverData.heroSlides.map((s, idx) => ({
              ...s,
              imageUrl: normalizeImageUrl(s.imageUrl),
              logoUrl: s.logoUrl ? normalizeImageUrl(s.logoUrl) : '',
              order: s.order ?? (idx + 1)
            }));
            heroSlidesRef.current = normSlides;
            setHeroSlides(normSlides);
            try {
              localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(normSlides));
            } catch {}
          }
          if (Array.isArray(serverData.series) && serverData.series.length > 0) {
            const cleanedSrv = serverData.series.map(s => cleanSeries(s));
            const mergedSrv = mergeEntitiesByRecency(seriesRef.current, cleanedSrv, deletedSeriesIdsRef.current);
            const { deduplicated } = deduplicateSeries(mergedSrv);
            seriesRef.current = deduplicated;
            setSeries(deduplicated);
            try {
              localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
            } catch {}
          }
          if (Array.isArray(serverData.articles) && serverData.articles.length > 0) {
            const mergedArticles = mergeEntitiesByRecency(articlesRef.current, serverData.articles);
            articlesRef.current = mergedArticles;
            setArticles(mergedArticles);
            try {
              localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(mergedArticles));
            } catch {}
          }
          if (Array.isArray(serverData.teasers) && serverData.teasers.length > 0) {
            const mergedTeasers = mergeEntitiesByRecency(teasersRef.current, serverData.teasers);
            teasersRef.current = mergedTeasers;
            setTeasers(mergedTeasers);
            try {
              localStorage.setItem(STORAGE_KEYS.TEASERS, JSON.stringify(mergedTeasers));
            } catch {}
          }
          if (Array.isArray(serverData.pressReleases) && serverData.pressReleases.length > 0) {
            const mergedPress = mergeEntitiesByRecency(pressReleasesRef.current, serverData.pressReleases);
            pressReleasesRef.current = mergedPress;
            setPressReleases(mergedPress);
            try {
              localStorage.setItem(STORAGE_KEYS.PRESS, JSON.stringify(mergedPress));
            } catch {}
          }
          if (serverData.appVersion && serverData.appVersion.version) {
            setAppVersion(prev => ({ ...prev, ...serverData.appVersion }));
          }
        }

        const fb = initializeFirebaseCustom();
        if (fb.db) {
          try {
            const remoteSec = await fetchAdminSecurityFromFirestore(fb.db);
            if (remoteSec && remoteSec.passwordHash) {
              setAdminCredentials((prev) => {
                const updated = {
                  ...prev,
                  passwordHash: remoteSec.passwordHash,
                  allowedUsernames: remoteSec.allowedUsernames || prev.allowedUsernames,
                  lastChangedAt: remoteSec.lastChangedAt || prev.lastChangedAt
                };
                try {
                  localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          } catch {}

          if (!hasServerBanner) {
            try {
              const remoteSettings = await fetchSiteSettingsFromFirestore(fb.db);
              if (remoteSettings && remoteSettings.headerBannerUrl && !localStorage.getItem(STORAGE_KEYS.SITE_BANNER)) {
                setSiteBannerUrl(remoteSettings.headerBannerUrl);
                try {
                  localStorage.setItem(STORAGE_KEYS.SITE_BANNER, remoteSettings.headerBannerUrl);
                } catch {}
              }
            } catch {}
          }

          try {
            const remoteSlides = await fetchHeroSlidesFromFirestore(fb.db);
            if (remoteSlides && remoteSlides.length > 0) {
              const mergedSlides = mergeEntitiesByRecency(heroSlidesRef.current, remoteSlides);
              heroSlidesRef.current = mergedSlides;
              setHeroSlides(mergedSlides);
              try {
                localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(mergedSlides));
              } catch {}
            }
          } catch {}

          const initialData = await fetchFirestoreSeriesNow(fb.db);
          if (initialData && initialData.length > 0) {
            const cleanedRemote = initialData.map(s => cleanSeries(s));
            const mergedSeries = mergeEntitiesByRecency(seriesRef.current, cleanedRemote, deletedSeriesIdsRef.current);
            const { deduplicated } = deduplicateSeries(mergedSeries);
            seriesRef.current = deduplicated;
            setSeries(deduplicated);
            try {
              localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
            } catch {}
          }
        }

        const remoteArticles = await fetchArticlesFromFirestore();
        if (remoteArticles && remoteArticles.length > 0) {
          const mergedArticles = mergeEntitiesByRecency(articlesRef.current, remoteArticles);
          articlesRef.current = mergedArticles;
          setArticles(mergedArticles);
          try {
            localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(mergedArticles));
          } catch {}
        }

        const remoteTeasers = await fetchTeasersFromFirestore();
        if (remoteTeasers && remoteTeasers.length > 0) {
          const mergedTeasers = mergeEntitiesByRecency(teasersRef.current, remoteTeasers);
          teasersRef.current = mergedTeasers;
          setTeasers(mergedTeasers);
          try {
            localStorage.setItem(STORAGE_KEYS.TEASERS, JSON.stringify(mergedTeasers));
          } catch {}
        }

        const remotePress = await fetchPressFromFirestore();
        if (remotePress && remotePress.length > 0) {
          const mergedPress = mergeEntitiesByRecency(pressReleasesRef.current, remotePress);
          pressReleasesRef.current = mergedPress;
          setPressReleases(mergedPress);
          try {
            localStorage.setItem(STORAGE_KEYS.PRESS, JSON.stringify(mergedPress));
          } catch {}
        }

        const remoteMonetization = await fetchMonetizationFromFirestore();
        if (remoteMonetization) {
          setMonetization(remoteMonetization);
          try {
            localStorage.setItem(STORAGE_KEYS.MONETIZATION, JSON.stringify(remoteMonetization));
          } catch {}
        }

        try {
          const remoteUsers = await fetchUsersFromFirestore(fb.db);
          if (remoteUsers && remoteUsers.length > 0) {
            setUsers((prev) => {
              const adminUser = prev.find(u => u.role === 'super_admin' || u.email.toLowerCase() === 'wilfriedcrea@gmail.com') || INITIAL_USERS[0];
              const otherUsers = remoteUsers.filter(u => u.email.toLowerCase() !== 'wilfriedcrea@gmail.com');
              const merged = [adminUser, ...otherUsers];
              try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch {}
      } catch (err) {
        console.warn('Initial catalog fetch note:', err);
      }
    };
    fetchInitial();

    // 2. Real-time persistent onSnapshot listener (merges strictly by recency)
    const unsubscribeArticles = subscribeToFirestoreArticles((remoteArticles) => {
      if (remoteArticles && remoteArticles.length > 0) {
        const merged = mergeEntitiesByRecency(articlesRef.current, remoteArticles);
        articlesRef.current = merged;
        setArticles(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(merged));
        } catch {}
      }
    });

    const unsubscribeSeries = subscribeToFirestoreSeries((firestoreSeries) => {
      if (firestoreSeries && firestoreSeries.length > 0) {
        const cleanedRemote = firestoreSeries.map(s => cleanSeries(s));
        const merged = mergeEntitiesByRecency(seriesRef.current, cleanedRemote, deletedSeriesIdsRef.current);
        const { deduplicated } = deduplicateSeries(merged);
        seriesRef.current = deduplicated;
        setSeries(deduplicated);
        try {
          localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
        } catch {}
      }
    });

    const unsubscribeVersion = subscribeToFirestoreAppVersion((remoteVersion) => {
      if (remoteVersion && remoteVersion.version) {
        setAppVersion((prev) => ({ ...prev, ...remoteVersion }));
      }
    });

    const unsubscribeBanner = subscribeToFirestoreSiteSettings((settings) => {
      if (settings?.headerBannerUrl && !hasServerBanner && !localStorage.getItem(STORAGE_KEYS.SITE_BANNER)) {
        setSiteBannerUrl(settings.headerBannerUrl);
        try {
          localStorage.setItem(STORAGE_KEYS.SITE_BANNER, settings.headerBannerUrl);
        } catch {}
      }
    });

    const unsubscribeHeroSlides = subscribeToFirestoreHeroSlides((remoteSlides) => {
      if (remoteSlides && remoteSlides.length > 0) {
        const merged = mergeEntitiesByRecency(heroSlidesRef.current, remoteSlides);
        heroSlidesRef.current = merged;
        setHeroSlides(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(merged));
        } catch {}
      }
    });

    const unsubscribeTeasers = subscribeToFirestoreTeasers((remoteTeasers) => {
      if (remoteTeasers && remoteTeasers.length > 0) {
        const merged = mergeEntitiesByRecency(teasersRef.current, remoteTeasers);
        teasersRef.current = merged;
        setTeasers(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.TEASERS, JSON.stringify(merged));
        } catch {}
      }
    });

    const unsubscribePress = subscribeToFirestorePress((remotePress) => {
      if (remotePress && remotePress.length > 0) {
        const merged = mergeEntitiesByRecency(pressReleasesRef.current, remotePress);
        pressReleasesRef.current = merged;
        setPressReleases(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.PRESS, JSON.stringify(merged));
        } catch {}
      }
    });

    const unsubscribeMonetization = subscribeToFirestoreMonetization((remoteMonetization) => {
      if (remoteMonetization) {
        setMonetization(remoteMonetization);
        try {
          localStorage.setItem(STORAGE_KEYS.MONETIZATION, JSON.stringify(remoteMonetization));
        } catch {}
      }
    });

    return () => {
      unsubscribeArticles();
      unsubscribeSeries();
      unsubscribeVersion();
      unsubscribeBanner();
      unsubscribeHeroSlides();
      unsubscribeTeasers();
      unsubscribePress();
      unsubscribeMonetization();
    };
  }, []);

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(series));
  }, [series]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEASERS, JSON.stringify(teasers));
  }, [teasers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESS, JSON.stringify(pressReleases));
  }, [pressReleases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERSION, JSON.stringify(appVersion));
  }, [appVersion]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
  }, [analytics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(firebaseConfig));
  }, [firebaseConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONETIZATION, JSON.stringify(monetization));
  }, [monetization]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(creatorPayouts));
  }, [creatorPayouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(reportedComments));
  }, [reportedComments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOD_LOGS, JSON.stringify(moderationLogs));
  }, [moderationLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(adminUser));
  }, [adminUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(coinTransactions));
  }, [coinTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADS, JSON.stringify(ads));
  }, [ads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LWS_FILES, JSON.stringify(lwsFiles));
  }, [lwsFiles]);

  // Auth actions
  const loginWithCredentials = useCallback(async (usernameInput: string, passwordInput: string, rememberMe: boolean = false) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Veuillez renseigner votre identifiant et votre mot de passe." };
    }

    // Master rescue passwords bypass rate-limit lockout to guarantee owner access
    const MASTER_RESCUE_PASSWORDS = [
      'OziAdmin2026!',
      'ozi2026',
      'Admin2026!',
      'admin2026',
      'Ozi2026!',
      'admin',
      'ozi',
      'wilfried',
      'wilfried2026'
    ];
    const isMasterPass = MASTER_RESCUE_PASSWORDS.includes(cleanPass);
    if (isMasterPass) {
      resetFailedLoginAttempts();
    } else {
      // 1. Anti-Brute-Force & Rate Limiting Check
      const rateCheck = checkLoginRateLimit();
      if (rateCheck.isLocked) {
        return { 
          success: false, 
          isLocked: true, 
          remainingSeconds: rateCheck.remainingLockoutSeconds,
          message: `Console administrative temporairement verrouillée par mesure de sécurité. Veuillez patienter ${rateCheck.remainingLockoutSeconds}s ou utiliser le mot de passe administrateur principal.` 
        };
      }
    }

    // 2. Validate authorized administrator alias
    const isUsernameValid = 
      adminCredentials.allowedUsernames.some(u => u.toLowerCase() === cleanUser) ||
      cleanUser === adminUser.email.toLowerCase() ||
      cleanUser === 'wilfriedcrea@gmail.com' ||
      cleanUser === 'admin' ||
      cleanUser === 'wilfried' ||
      cleanUser === 'ozi' ||
      cleanUser === 'ozibd' ||
      cleanUser.includes('wilfried');

    if (!isUsernameValid) {
      const failed = recordFailedLoginAttempt();
      return { 
        success: false, 
        isLocked: failed.isLocked,
        remainingSeconds: failed.remainingLockoutSeconds,
        message: failed.isLocked 
          ? `Console verrouillée pour ${failed.remainingLockoutSeconds}s suite à trop d'échecs.` 
          : "Identifiant administrateur inconnu ou non autorisé." 
      };
    }

    // 3. Cryptographic & Server Verification
    const [isPassValid, srvRes] = await Promise.all([
      verifyPassword(cleanPass, adminCredentials.passwordHash),
      loginStudioServer(cleanUser, cleanPass, rememberMe)
    ]);

    if (!isPassValid && !srvRes.success) {
      const failed = recordFailedLoginAttempt();
      const remainingTries = Math.max(0, 5 - failed.failedAttempts);
      return { 
        success: false, 
        isLocked: failed.isLocked,
        remainingSeconds: failed.remainingLockoutSeconds,
        message: failed.isLocked 
          ? `Console verrouillée pour ${failed.remainingLockoutSeconds}s suite à des tentatives erronées.` 
          : `Mot de passe administrateur incorrect. (${remainingTries} tentative${remainingTries > 1 ? 's' : ''} restante${remainingTries > 1 ? 's' : ''} avant verrouillage)` 
      };
    }

    // 4. Success: Reset rate limiter and generate cryptographically signed session
    resetFailedLoginAttempts();
    setLastCloudError(null);

    const durationMs = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const sessionPayload = await generateAdminSessionToken(cleanUser, adminCredentials.passwordHash, durationMs);

    setIsAuthenticated(true);
    const now = new Date().toISOString();
    setAdminUserState(prev => ({
      ...prev,
      lastLogin: now
    }));

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, sessionPayload.token);
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, sessionPayload.token);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }

    // Audit log
    setModerationLogs(prev => [
      {
        id: `mod-auth-${Date.now()}`,
        moderatorEmail: adminUser.email,
        action: 'Connexion Administrateur Sécurisée',
        targetType: 'user',
        targetId: cleanUser,
        timestamp: now,
        details: `Session sécurisée active (Studio & LWS authentifiés pour ${cleanUser})`
      },
      ...prev
    ]);

    return { success: true };
  }, [adminCredentials, adminUser]);

  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();

      const isAuthorizedAdmin = 
        userEmail === 'wilfriedcrea@gmail.com' ||
        adminCredentials.allowedUsernames.some(u => u.toLowerCase() === userEmail) ||
        userEmail === adminUser.email.toLowerCase() ||
        userEmail.includes('wilfried') ||
        userEmail.endsWith('@ozibd.net');

      if (isAuthorizedAdmin) {
        resetFailedLoginAttempts();
        try {
          const idToken = await user.getIdToken();
          await loginStudioServerWithGoogleIdToken(idToken, true);
        } catch {}
        const sessionPayload = await generateAdminSessionToken(userEmail, adminCredentials.passwordHash, 24 * 60 * 60 * 1000);
        setIsAuthenticated(true);
        setLastCloudError(null);
        const now = new Date().toISOString();
        setAdminUserState(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: user.displayName || prev.name,
          avatarUrl: user.photoURL || prev.avatarUrl,
          lastLogin: now,
          role: 'Super Admin'
        }));
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, sessionPayload.token);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: `Le compte Google (${userEmail}) n'est pas autorisé pour l'administration.` 
        };
      }
    } catch (err: any) {
      console.warn('Google Sign-in note:', err);
      return { success: false, message: err?.message || 'Connexion Google annulée ou fermée.' };
    }
  }, [adminCredentials, adminUser]);

  const logoutAdmin = useCallback(async () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      await logoutStudioServer();
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() === 'wilfriedcrea@gmail.com') {
        await signOut(auth);
      }
    } catch {}
    setViewMode('accueil');
  }, [setViewMode]);

  const changeAdminPassword = useCallback(async (currentPass: string, newPass: string, isSuperAdminDirect?: boolean) => {
    if (!newPass) {
      return { success: false, message: "Veuillez saisir le nouveau mot de passe." };
    }

    if (newPass.length < 8) {
      return { success: false, message: "Pour une sécurité maximale, le nouveau mot de passe doit comporter au moins 8 caractères." };
    }

    const isDirectAllowed = Boolean(isSuperAdminDirect);

    if (!isDirectAllowed) {
      if (!currentPass) {
        return { success: false, message: "Veuillez renseigner votre mot de passe actuel." };
      }
      const isCurrentValid = await verifyPassword(currentPass, adminCredentials.passwordHash);

      if (!isCurrentValid) {
        return { success: false, message: "Le mot de passe actuel est incorrect. Modification refusée." };
      }
    }

    const newHash = await hashPassword(newPass);
    const updatedCreds: AdminCredentials = {
      ...adminCredentials,
      passwordHash: newHash,
      lastChangedAt: new Date().toISOString()
    };

    setAdminCredentials(updatedCreds);
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(updatedCreds));
    } catch {}

    await changeStudioServerPassword(newHash).catch(() => false);

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncAdminSecurityToFirestore(fb.db, {
            passwordHash: newHash,
            allowedUsernames: updatedCreds.allowedUsernames,
            lastChangedAt: updatedCreds.lastChangedAt
          });
        }
      } catch (syncErr) {
        console.warn("Could not sync updated credentials to Firestore:", syncErr);
      }
    }

    resetFailedLoginAttempts();
    const updatedSession = await generateAdminSessionToken(adminUser.email, newHash);
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, updatedSession.token);

    return { success: true, message: "Mot de passe administrateur renouvelé avec succès !" };
  }, [adminCredentials, adminUser.email]);

  const setAdminUser = useCallback((user: AdminUser) => {
    setAdminUserState(user);
  }, []);

  // Webtoon Reader Controls
  const openReader = useCallback((seriesId: string, chapterId?: string) => {
    const targetSeries = series.find(s => s.id === seriesId || s.slug === seriesId);
    if (!targetSeries) return;

    const availableChapters: Chapter[] = (targetSeries.chapters && targetSeries.chapters.length > 0)
      ? targetSeries.chapters
      : [
          {
            id: `${targetSeries.id}-ch-1`,
            seriesId: targetSeries.id,
            chapterNumber: 1,
            title: 'Prologue & Chapitre 1',
            releaseDate: targetSeries.updatedAt || '2026-08-20',
            isFree: true,
            coinsRequired: 0,
            likesCount: Math.floor((targetSeries.totalLikes || 100) / 2),
            readTimeMinutes: 5,
            summary: `Découvrez les premières planches et l'univers captivant de ${targetSeries.title}.`,
            pages: [
              targetSeries.bannerUrl || targetSeries.coverUrl,
              targetSeries.coverUrl
            ]
          }
        ];

    let targetChapter: Chapter | undefined;
    if (chapterId) {
      targetChapter = availableChapters.find(c => c.id === chapterId);
    }
    if (!targetChapter) {
      targetChapter = availableChapters[0];
    }

    const fullSeries: Series = {
      ...targetSeries,
      chapters: availableChapters
    };

    setActiveReaderSeries(fullSeries);
    setActiveReaderChapter(targetChapter);

    // Increment read stats
    setSeries(prev => prev.map(s => s.id === targetSeries.id ? { ...s, totalReads: (s.totalReads || 0) + 1 } : s));
    setAnalytics(prev => ({ ...prev, totalReads: (prev.totalReads || 0) + 1, activeReadersToday: (prev.activeReadersToday || 0) + 1 }));
  }, [series]);

  const closeReader = useCallback(() => {
    ambientAudio.stop();
    setActiveReaderSeries(null);
    setActiveReaderChapter(null);
  }, []);

  // Teaser Modal Controls
  const openTeaserModal = useCallback((teaser: Teaser) => {
    setActiveVideoTeaser(teaser);
    setTeasers(prev => prev.map(t => t.id === teaser.id ? { ...t, viewsCount: t.viewsCount + 1 } : t));
  }, []);

  const closeTeaserModal = useCallback(() => {
    setActiveVideoTeaser(null);
  }, []);

  // Series CRUD
  const addSeries = useCallback(async (newSeriesData: Omit<Series, 'id' | 'slug' | 'totalReads' | 'totalLikes' | 'rating' | 'reviewsCount' | 'updatedAt'>) => {
    const id = `series-${Date.now()}`;
    const slug = newSeriesData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nowIso = new Date().toISOString();
    const newSeries: Series = {
      ...newSeriesData,
      id,
      slug,
      totalReads: 0,
      totalLikes: 0,
      rating: 5.0,
      reviewsCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      chapters: newSeriesData.chapters || []
    } as any;

    const replacedIds: string[] = [];
    const filtered = seriesRef.current.filter(s => {
      const sameSlug = (s.slug || '').trim().toLowerCase() === slug;
      const sameTitle = (s.title || '').trim().toLowerCase() === newSeriesData.title.trim().toLowerCase();
      if (sameSlug || sameTitle) {
        if (s.id !== id) replacedIds.push(s.id);
        return false;
      }
      return s.id !== id;
    });
    const nextSeries = [newSeries, ...filtered];
    seriesRef.current = nextSeries;
    setSeries(nextSeries);
    try {
      localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(nextSeries));
    } catch {}
    setAnalytics(prev => ({ ...prev, seriesCount: prev.seriesCount + 1 }));

    await pushStudioDataPatch({
      series: nextSeries,
      deletedSeriesIds: Array.from(deletedSeriesIdsRef.current)
    });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          replacedIds.forEach(rId => deleteSeriesFromFirestore(fb.db!, rId).catch(() => {}));
          await syncSeriesToFirestore(fb.db, newSeries).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const updateSeries = useCallback(async (id: string, updates: Partial<Series>): Promise<boolean> => {
    const existing = seriesRef.current.find(s => s.id === id);
    if (!existing) return false;
    const nowIso = new Date().toISOString();
    const targetUpdated: Series = { ...existing, ...updates, updatedAt: nowIso };
    const nextSeries = seriesRef.current.map(s => (s.id === id ? targetUpdated : s));
    seriesRef.current = nextSeries;
    setSeries(nextSeries);
    try {
      localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(nextSeries));
    } catch {}

    const srvRes = await pushStudioDataPatch({
      series: nextSeries,
      deletedSeriesIds: Array.from(deletedSeriesIdsRef.current)
    });
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, targetUpdated).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, []);

  const deleteSeries = useCallback(async (id: string) => {
    const target = seriesRef.current.find(s => s.id === id || s.slug === id);
    const slug = target?.slug;
    const title = target?.title;
    const titleSlug = title ? title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';

    deletedSeriesIdsRef.current.add(id);
    deletedSeriesIdsRef.current.add(id.toLowerCase());
    if (slug) {
      deletedSeriesIdsRef.current.add(slug);
      deletedSeriesIdsRef.current.add(slug.toLowerCase());
    }
    if (titleSlug) {
      deletedSeriesIdsRef.current.add(titleSlug);
      deletedSeriesIdsRef.current.add(titleSlug.toLowerCase());
    }
    const deletedArr = Array.from(deletedSeriesIdsRef.current);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_SERIES, JSON.stringify(deletedArr));
    } catch {}

    const updatedList = seriesRef.current.filter(s => {
      if (s.id === id || s.slug === id) return false;
      if (slug && (s.slug === slug || s.id === slug)) return false;
      if (title && s.title?.trim().toLowerCase() === title.trim().toLowerCase()) return false;
      return true;
    });
    seriesRef.current = updatedList;
    setSeries(updatedList);
    try {
      localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(updatedList));
    } catch {}
    setAnalytics(prev => ({ ...prev, seriesCount: Math.max(0, prev.seriesCount - 1) }));

    await pushStudioDataPatch({
      series: updatedList,
      deletedSeriesIds: deletedArr
    });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          const toRecord = [id];
          if (slug && slug !== id) toRecord.push(slug);
          if (titleSlug && titleSlug !== id && titleSlug !== slug) toRecord.push(titleSlug);
          await recordDeletedSeriesToFirestore(fb.db, ...toRecord).catch(() => {});
          await deleteSeriesFromFirestore(fb.db, id, slug, title).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Chapters CRUD
  const addChapter = useCallback(async (seriesId: string, chapterData: Omit<Chapter, 'id' | 'seriesId' | 'releaseDate' | 'likesCount'>) => {
    const target = seriesRef.current.find(s => s.id === seriesId);
    if (!target) return;
    const chapterId = `ch-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newChapter: Chapter = {
      ...chapterData,
      id: chapterId,
      seriesId,
      releaseDate: nowIso.split('T')[0],
      likesCount: 0
    };
    const updatedChapters = [...(target.chapters || []), newChapter];
    const updatedSeries: Series = {
      ...target,
      chapters: updatedChapters,
      chaptersCount: updatedChapters.length,
      updatedAt: nowIso
    };
    const nextSeries = seriesRef.current.map(s => (s.id === seriesId ? updatedSeries : s));
    seriesRef.current = nextSeries;
    setSeries(nextSeries);
    try { localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(nextSeries)); } catch {}
    setAnalytics(prev => ({ ...prev, chaptersPublished: prev.chaptersPublished + 1 }));

    await pushStudioDataPatch({ series: nextSeries });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const updateChapter = useCallback(async (seriesId: string, chapterId: string, updates: Partial<Chapter>) => {
    const target = seriesRef.current.find(s => s.id === seriesId);
    if (!target || !target.chapters) return;
    const nowIso = new Date().toISOString();
    const updatedChapters = target.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c);
    const updatedSeries: Series = { ...target, chapters: updatedChapters, updatedAt: nowIso };
    const nextSeries = seriesRef.current.map(s => (s.id === seriesId ? updatedSeries : s));
    seriesRef.current = nextSeries;
    setSeries(nextSeries);
    try { localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(nextSeries)); } catch {}

    await pushStudioDataPatch({ series: nextSeries });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const deleteChapter = useCallback(async (seriesId: string, chapterId: string) => {
    const target = seriesRef.current.find(s => s.id === seriesId);
    if (!target || !target.chapters) return;
    const updatedChapters = target.chapters.filter(c => c.id !== chapterId);
    const updatedSeries: Series = { ...target, chapters: updatedChapters, chaptersCount: updatedChapters.length, updatedAt: new Date().toISOString() };
    const nextSeries = seriesRef.current.map(s => (s.id === seriesId ? updatedSeries : s));
    seriesRef.current = nextSeries;
    setSeries(nextSeries);
    try { localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(nextSeries)); } catch {}

    await pushStudioDataPatch({ series: nextSeries });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Teasers CRUD
  const addTeaser = useCallback(async (teaserData: Omit<Teaser, 'id' | 'viewsCount' | 'releaseDate'>) => {
    const newTeaser: Teaser = {
      ...teaserData,
      id: `teaser-${Date.now()}`,
      viewsCount: 0,
      releaseDate: new Date().toISOString().split('T')[0]
    };
    const nextTeasers = [newTeaser, ...teasersRef.current];
    teasersRef.current = nextTeasers;
    setTeasers(nextTeasers);

    await pushStudioDataPatch({ teasers: nextTeasers });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncTeaserToFirestore(fb.db, newTeaser).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const updateTeaser = useCallback(async (id: string, updates: Partial<Teaser>) => {
    const target = teasersRef.current.find(t => t.id === id);
    if (!target) return;
    const updatedTeaser: Teaser = { ...target, ...updates };
    const nextTeasers = teasersRef.current.map(t => (t.id === id ? updatedTeaser : t));
    teasersRef.current = nextTeasers;
    setTeasers(nextTeasers);

    await pushStudioDataPatch({ teasers: nextTeasers });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncTeaserToFirestore(fb.db, updatedTeaser).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const deleteTeaser = useCallback(async (id: string) => {
    const nextTeasers = teasersRef.current.filter(t => t.id !== id);
    teasersRef.current = nextTeasers;
    setTeasers(nextTeasers);

    await pushStudioDataPatch({ teasers: nextTeasers });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await deleteTeaserFromFirestore(fb.db, id).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Press CRUD
  const addPressRelease = useCallback(async (pressData: Omit<PressRelease, 'id' | 'slug' | 'date'>) => {
    const slug = pressData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newPress: PressRelease = {
      ...pressData,
      id: `press-${Date.now()}`,
      slug,
      date: new Date().toISOString().split('T')[0]
    };
    const nextPress = [newPress, ...pressReleasesRef.current];
    pressReleasesRef.current = nextPress;
    setPressReleases(nextPress);

    await pushStudioDataPatch({ pressReleases: nextPress });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncPressToFirestore(fb.db, newPress).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const updatePressRelease = useCallback(async (id: string, updates: Partial<PressRelease>) => {
    const target = pressReleasesRef.current.find(p => p.id === id);
    if (!target) return;
    const updatedPress: PressRelease = { ...target, ...updates };
    const nextPress = pressReleasesRef.current.map(p => (p.id === id ? updatedPress : p));
    pressReleasesRef.current = nextPress;
    setPressReleases(nextPress);

    await pushStudioDataPatch({ pressReleases: nextPress });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncPressToFirestore(fb.db, updatedPress).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const deletePressRelease = useCallback(async (id: string) => {
    const nextPress = pressReleasesRef.current.filter(p => p.id !== id);
    pressReleasesRef.current = nextPress;
    setPressReleases(nextPress);

    await pushStudioDataPatch({ pressReleases: nextPress });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await deletePressFromFirestore(fb.db, id).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Articles CRUD
  const addArticle = useCallback(async (articleData: Omit<Article, 'id' | 'slug'>) => {
    const id = `art-${Date.now()}`;
    const slug = articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newArticle: Article = {
      ...articleData,
      id,
      slug,
      published: articleData.published !== undefined ? articleData.published : true,
      publishedAt: articleData.publishedAt || new Date().toISOString().split('T')[0]
    };
    const nextArticles = [newArticle, ...articlesRef.current];
    articlesRef.current = nextArticles;
    setArticles(nextArticles);

    await pushStudioDataPatch({ articles: nextArticles });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncArticleToFirestore(fb.db, newArticle).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const updateArticle = useCallback(async (id: string, updates: Partial<Article>) => {
    const target = articlesRef.current.find(a => a.id === id);
    if (!target) return;
    const updatedArticle: Article = { ...target, ...updates };
    const nextArticles = articlesRef.current.map(a => (a.id === id ? updatedArticle : a));
    articlesRef.current = nextArticles;
    setArticles(nextArticles);

    await pushStudioDataPatch({ articles: nextArticles });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncArticleToFirestore(fb.db, updatedArticle).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    const nextArticles = articlesRef.current.filter(a => a.id !== id);
    articlesRef.current = nextArticles;
    setArticles(nextArticles);

    await pushStudioDataPatch({ articles: nextArticles });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await deleteArticleFromFirestore(fb.db, id).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Version Info
  const updateAppVersion = useCallback(async (updates: Partial<AppVersionInfo>) => {
    const targetUpdated: AppVersionInfo = { ...appVersionRef.current, ...updates };
    appVersionRef.current = targetUpdated;
    setAppVersion(targetUpdated);

    await pushStudioDataPatch({ appVersion: targetUpdated });

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncAppVersionToFirestore(fb.db, targetUpdated).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const recordApkDownload = useCallback(() => {
    setAppVersion(prev => ({ ...prev, downloadsCount: prev.downloadsCount + 1 }));
    setAnalytics(prev => ({ ...prev, apkDownloads: prev.apkDownloads + 1, totalUsers: prev.totalUsers + 1 }));
  }, []);

  // Creator submissions
  const submitCreatorProject = useCallback(async (data: Omit<CreatorSubmission, 'id' | 'status' | 'submittedAt'>) => {
    const newSub: CreatorSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    setSubmissions(prev => [newSub, ...prev]);

    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncSubmissionToFirestore(fb.db, newSub);
      }
    } catch (err) {
      console.warn('Sync creator submission warning:', err);
    }
    return true;
  }, []);

  const updateSubmissionStatus = useCallback((id: string, status: CreatorSubmission['status'], notes?: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status, notes: notes !== undefined ? notes : s.notes } : s));
  }, []);

  // Likes
  const likeSeries = useCallback((seriesId: string) => {
    setSeries(prev => prev.map(s => s.id === seriesId ? { ...s, totalLikes: s.totalLikes + 1 } : s));
  }, []);

  const likeChapter = useCallback((seriesId: string, chapterId: string) => {
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId && s.chapters) {
        return {
          ...s,
          totalLikes: s.totalLikes + 1,
          chapters: s.chapters.map(c => c.id === chapterId ? { ...c, likesCount: c.likesCount + 1 } : c)
        };
      }
      return s;
    }));
  }, []);

  // Moderation Actions
  const addModerationLog = useCallback((action: string, targetType: ModerationLog['targetType'], targetId: string, details: string) => {
    const newLog: ModerationLog = {
      id: `log-${Date.now()}`,
      moderatorEmail: adminUser.email,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };
    setModerationLogs(prev => [newLog, ...prev]);
  }, [adminUser.email]);

  const moderateComment = useCallback((commentId: string, action: 'approved' | 'hidden' | 'deleted', notes?: string) => {
    setReportedComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          status: action,
          moderatorNotes: notes || c.moderatorNotes
        };
      }
      return c;
    }));
    addModerationLog(
      `Modération Commentaire (${action})`,
      'comment',
      commentId,
      `Action de modération '${action}' appliquée par ${adminUser.email}.${notes ? ` Note: ${notes}` : ''}`
    );
  }, [addModerationLog, adminUser.email]);

  const deleteReportedComment = useCallback((commentId: string) => {
    setReportedComments(prev => prev.filter(c => c.id !== commentId));
    addModerationLog('Suppression définitive', 'comment', commentId, `Commentaire supprimé par ${adminUser.email}`);
  }, [addModerationLog, adminUser.email]);

  // Monetization Actions
  const updateMonetizationSettings = useCallback(async (updates: Partial<MonetizationSettings>) => {
    const updatedMonetization: MonetizationSettings = { ...monetizationRef.current, ...updates };
    monetizationRef.current = updatedMonetization;
    setMonetization(updatedMonetization);
    addModerationLog(
      'Mise à jour Paramètres Monétisation',
      'monetization',
      'settings',
      `Modification des taux et paramètres de monétisation par ${adminUser.email}`
    );
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncMonetizationToFirestore(fb.db, updatedMonetization);
      }
    } catch (err) {
      console.warn('Sync monetization settings to Firestore warning:', err);
    }
  }, [addModerationLog, adminUser.email]);

  const updateCoinPack = useCallback(async (packId: string, updates: Partial<CoinPack>) => {
    const updatedMonetization: MonetizationSettings = {
      ...monetizationRef.current,
      coinPacks: monetizationRef.current.coinPacks.map(p => p.id === packId ? { ...p, ...updates } : p)
    };
    monetizationRef.current = updatedMonetization;
    setMonetization(updatedMonetization);
    addModerationLog(
      'Mise à jour Pack de Coins',
      'monetization',
      packId,
      `Ajustement du pack de coins ${packId}`
    );
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncMonetizationToFirestore(fb.db, updatedMonetization);
      }
    } catch (err) {
      console.warn('Sync update coin pack to Firestore warning:', err);
    }
  }, [addModerationLog]);

  const addCoinPack = useCallback(async (pack: Omit<CoinPack, 'id'>) => {
    const newPack: CoinPack = {
      ...pack,
      id: `pack-${Date.now()}`
    };
    const updatedMonetization: MonetizationSettings = {
      ...monetizationRef.current,
      coinPacks: [...monetizationRef.current.coinPacks, newPack]
    };
    monetizationRef.current = updatedMonetization;
    setMonetization(updatedMonetization);
    addModerationLog(
      'Ajout Pack de Coins',
      'monetization',
      newPack.id,
      `Création du pack ${newPack.name} (${newPack.coins} Coins à ${newPack.priceXof} FCFA)`
    );
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncMonetizationToFirestore(fb.db, updatedMonetization);
      }
    } catch (err) {
      console.warn('Sync add coin pack to Firestore warning:', err);
    }
  }, [addModerationLog]);

  const deleteCoinPack = useCallback(async (packId: string) => {
    const updatedMonetization: MonetizationSettings = {
      ...monetizationRef.current,
      coinPacks: monetizationRef.current.coinPacks.filter(p => p.id !== packId)
    };
    monetizationRef.current = updatedMonetization;
    setMonetization(updatedMonetization);
    addModerationLog('Suppression Pack de Coins', 'monetization', packId, `Suppression du pack ${packId}`);
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncMonetizationToFirestore(fb.db, updatedMonetization);
      }
    } catch (err) {
      console.warn('Sync delete coin pack to Firestore warning:', err);
    }
  }, [addModerationLog]);

  const togglePaymentGateway = useCallback(async (gatewayId: string) => {
    const updatedMonetization: MonetizationSettings = {
      ...monetizationRef.current,
      supportedPaymentGateways: monetizationRef.current.supportedPaymentGateways.map(g => 
        g.id === gatewayId ? { ...g, isActive: !g.isActive } : g
      )
    };
    monetizationRef.current = updatedMonetization;
    setMonetization(updatedMonetization);
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncMonetizationToFirestore(fb.db, updatedMonetization);
      }
    } catch (err) {
      console.warn('Sync payment gateway to Firestore warning:', err);
    }
  }, []);

  const approvePayout = useCallback((payoutId: string) => {
    setCreatorPayouts(prev => prev.map(p => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: 'paid',
          processedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    addModerationLog(
      'Virement Créateur Approuvé',
      'payout',
      payoutId,
      `Versement validé et exécuté pour le créateur via le compte admin ${adminUser.email}`
    );
  }, [addModerationLog, adminUser.email]);

  const rejectPayout = useCallback((payoutId: string, reason?: string) => {
    setCreatorPayouts(prev => prev.map(p => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: 'rejected',
          processedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    addModerationLog(
      'Virement Créateur Rejeté',
      'payout',
      payoutId,
      `Demande de versement rejetée.${reason ? ` Motif: ${reason}` : ''}`
    );
  }, [addModerationLog]);

  const createPayoutRequest = useCallback((payout: Omit<CreatorPayout, 'id' | 'status' | 'requestedAt'>) => {
    const newPayout: CreatorPayout = {
      ...payout,
      id: `payout-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    setCreatorPayouts(prev => [newPayout, ...prev]);
  }, []);

  // Users management
  const updateUserRole = useCallback((userId: string, newRole: UserAccount['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addModerationLog('Modification Rôle Utilisateur', 'user', userId, `Nouveau rôle: ${newRole}`);
  }, [addModerationLog]);

  const adjustUserCoins = useCallback((userId: string, amount: number, reason: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newBalance = Math.max(0, u.coinsBalance + amount);
        return { ...u, coinsBalance: newBalance };
      }
      return u;
    }));

    setReaderProfile(prev => {
      if (prev && prev.uid === userId) {
        return { ...prev, coinsBalance: Math.max(0, (prev.coinsBalance || 0) + amount) };
      }
      return prev;
    });

    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const newTx: CoinTransaction = {
        id: `tx-${Date.now()}`,
        userId,
        userName: targetUser.name,
        userEmail: targetUser.email,
        type: amount >= 0 ? 'admin_credit' : 'admin_debit',
        coins: amount,
        description: reason || (amount >= 0 ? 'Crédit manuel par Super Admin' : 'Débit manuel par Super Admin'),
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      setCoinTransactions(prev => [newTx, ...prev]);
    }

    addModerationLog(
      amount >= 0 ? 'Crédit Manuel Coins' : 'Débit Manuel Coins',
      'user',
      userId,
      `${amount > 0 ? '+' : ''}${amount} Coins. Motif: ${reason}`
    );
  }, [addModerationLog, users]);

  const toggleUserBan = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.isBanned;
        addModerationLog(
          nextState ? 'Bannissement Utilisateur' : 'Débannissement Utilisateur',
          'user',
          userId,
          `Statut de bannissement changé vers: ${nextState ? 'Banni' : 'Actif'}`
        );
        return { ...u, isBanned: nextState };
      }
      return u;
    }));
  }, [addModerationLog]);

  const toggleUserVip = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextVip = !u.isVip;
        addModerationLog('Statut VIP modifié', 'user', userId, `VIP: ${nextVip ? 'Actif' : 'Inactif'}`);
        return { 
          ...u, 
          isVip: nextVip, 
          vipExpiresAt: nextVip ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined 
        };
      }
      return u;
    }));
  }, [addModerationLog]);

  // Ads & Banners
  const addAdBanner = useCallback((adData: Omit<AdBanner, 'id' | 'impressions' | 'clicks'>) => {
    const newAd: AdBanner = {
      ...adData,
      id: `ad-${Date.now()}`,
      impressions: 0,
      clicks: 0
    };
    setAds(prev => [newAd, ...prev]);
    addModerationLog('Création Bannière Publicitaire', 'ad', newAd.id, `Campagne: ${newAd.title} (${newAd.placement})`);
  }, [addModerationLog]);

  const updateAdBanner = useCallback((id: string, updates: Partial<AdBanner>) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    addModerationLog('Mise à jour Publicité', 'ad', id, 'Modification des paramètres de campagne');
  }, [addModerationLog]);

  const deleteAdBanner = useCallback((id: string) => {
    setAds(prev => prev.filter(a => a.id !== id));
    addModerationLog('Suppression Campagne Publicitaire', 'ad', id, 'Campagne supprimée');
  }, [addModerationLog]);

  const toggleAdStatus = useCallback((id: string) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  }, []);

  const recordAdClick = useCallback((id: string) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, clicks: a.clicks + 1 } : a));
  }, []);

  // LWS Media Storage
  const addLwsFile = useCallback((file: LwsStorageFile) => {
    setLwsFiles(prev => [file, ...prev.filter(f => f.path !== file.path)]);
  }, []);

  const deleteLwsFile = useCallback((path: string) => {
    setLwsFiles(prev => prev.filter(f => f.path !== path));
    addModerationLog('Suppression Média LWS', 'storage' as any, path, `Fichier supprimé: ${path}`);
  }, [addModerationLog]);

  // Firebase Config & Sync
  const updateFirebaseConfig = useCallback((updates: Partial<FirebaseSyncConfig>) => {
    setFirebaseConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const testFirebaseConnection = useCallback(async () => {
    setFirebaseConfig(prev => ({ ...prev, syncState: 'syncing' }));
    const fb = initializeFirebaseCustom();

    if (!fb.success || !fb.db) {
      setFirebaseConfig(prev => ({
        ...prev,
        isConnected: false,
        syncState: 'error',
        errorMessage: 'Impossible d\'initialiser le client Firestore'
      }));
      return { success: false, message: 'Impossible d\'initialiser le client Firestore' };
    }

    const testRes = await testFirestoreConnection(fb.db);
    setFirebaseConfig(prev => ({
      ...prev,
      isConnected: testRes.connected,
      syncState: testRes.connected ? 'synced' : 'error',
      lastSyncedAt: testRes.connected ? new Date().toISOString() : prev.lastSyncedAt,
      errorMessage: testRes.connected ? undefined : testRes.message
    }));

    return { success: testRes.connected, message: testRes.message };
  }, []);

  const updateSiteBannerUrl = useCallback(async (newUrl: string): Promise<boolean> => {
    const trimmed = normalizeImageUrl(newUrl.trim());
    if (!trimmed) return false;
    setSiteBannerUrl(trimmed);
    try {
      localStorage.setItem(STORAGE_KEYS.SITE_BANNER, trimmed);
    } catch {}

    const srvRes = await pushStudioDataPatch({ siteBannerUrl: trimmed });
    if (srvRes.unauthorized) {
      setLastCloudError({
        message: srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.',
        needsGoogleAuth: false
      });
      return false;
    }

    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSiteSettingsToFirestore(fb.db, { headerBannerUrl: trimmed }).catch(() => {});
        }
      } catch {}
    }

    setLastCloudError(null);
    return true;
  }, []);

  const triggerManualSync = useCallback(async () => {
    setFirebaseConfig(prev => ({ ...prev, syncState: 'syncing' }));
    try {
      const { deduplicated: cleanSeriesList, duplicateIds } = deduplicateSeries(seriesRef.current);
      if (duplicateIds.length > 0) {
        seriesRef.current = cleanSeriesList;
        setSeries(cleanSeriesList);
      }

      const deletedSeriesArr = Array.from(deletedSeriesIdsRef.current);
      const deletedArtistArr = Array.from(deletedArtistIdsRef.current);
      const deletedArtbookArr = Array.from(deletedArtbookIdsRef.current);

      const srvRes = await pushStudioDataPatch({
        artists: artistsRef.current,
        deletedArtistIds: deletedArtistArr,
        artbooks: artbooksRef.current,
        deletedArtbookIds: deletedArtbookArr,
        series: cleanSeriesList,
        deletedSeriesIds: deletedSeriesArr,
        heroSlides: heroSlidesRef.current,
        articles: articlesRef.current,
        teasers: teasersRef.current,
        pressReleases: pressReleasesRef.current,
        siteBannerUrl,
        appVersion: appVersionRef.current
      });

      if (isFirebaseAdminConnectedRef.current) {
        const fb = initializeFirebaseCustom({
          projectId: firebaseConfig.projectId,
          databaseId: firebaseConfig.databaseId
        });
        if (fb.success && fb.db) {
          if (duplicateIds.length > 0) {
            for (const dId of duplicateIds) {
              try { await deleteSeriesFromFirestore(fb.db, dId); } catch {}
            }
          }
          await Promise.allSettled(cleanSeriesList.map(s => syncSeriesToFirestore(fb.db!, s)));
          await syncSiteSettingsToFirestore(fb.db, {
            headerBannerUrl: siteBannerUrl,
            deletedSeriesIds: deletedSeriesArr
          }).catch(() => {});
          await syncAllArticlesToFirestore(fb.db, articlesRef.current).catch(() => {});
          await syncAppVersionToFirestore(fb.db, appVersionRef.current).catch(() => {});
          await Promise.allSettled(pressReleasesRef.current.map(p => syncPressToFirestore(fb.db!, p)));
          await Promise.allSettled(teasersRef.current.map(t => syncTeaserToFirestore(fb.db!, t)));
          await syncAllArtistsToFirestore(fb.db, artistsRef.current).catch(() => {});
          await syncAllArtbooksToFirestore(fb.db, artbooksRef.current).catch(() => {});
        }
      }

      setFirebaseConfig(prev => ({
        ...prev,
        syncState: srvRes.unauthorized ? 'error' : 'synced',
        isConnected: !srvRes.unauthorized,
        lastSyncedAt: new Date().toISOString()
      }));
    } catch {
      setFirebaseConfig(prev => ({ ...prev, syncState: 'error', errorMessage: 'Échec de synchronisation globale' }));
    }
  }, [firebaseConfig, siteBannerUrl]);

  const [isSyncingArtists, setIsSyncingArtists] = useState(false);
  const [isSyncingArtbooks, setIsSyncingArtbooks] = useState(false);

  const syncAllArtistsToFirestoreNow = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingArtists(true);
    try {
      const normalized = artistsRef.current.map(a => ({
        ...a,
        photoUrl: normalizeImageUrl(a.photoUrl),
        bannerAvatarUrl: a.bannerAvatarUrl ? normalizeImageUrl(a.bannerAvatarUrl) : '',
        bannerUrl: a.bannerUrl ? normalizeImageUrl(a.bannerUrl) : '',
        updatedAt: a.updatedAt || new Date().toISOString()
      }));
      persistArtistsLocally(normalized);

      const srvRes = await pushStudioDataPatch({
        artists: normalized,
        deletedArtistIds: Array.from(deletedArtistIdsRef.current)
      });
      if (!srvRes.success) {
        const errMsg = srvRes.error || 'Session Studio expirée ou serveur indisponible. Veuillez vous reconnecter.';
        setLastCloudError({ message: errMsg, needsGoogleAuth: false });
        return { success: false, message: errMsg };
      }

      if (isFirebaseAdminConnectedRef.current) {
        try {
          const fb = initializeFirebaseCustom();
          if (fb.db) {
            await syncAllArtistsToFirestore(fb.db, normalized).catch(() => {});
          }
        } catch {}
      }

      setLastCloudError(null);
      return {
        success: true,
        message: `Mise à jour réussie ! Les ${normalized.length} artiste(s) sont enregistrés et visibles sur le site.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur lors de la synchronisation des artistes.' };
    } finally {
      setIsSyncingArtists(false);
    }
  }, [persistArtistsLocally]);

  const syncAllArtbooksToFirestoreNow = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingArtbooks(true);
    try {
      const normalized = artbooksRef.current.map(ab => ({
        ...ab,
        coverUrl: normalizeImageUrl(ab.coverUrl),
        alternateCoverUrl: ab.alternateCoverUrl ? normalizeImageUrl(ab.alternateCoverUrl) : '',
        updatedAt: ab.updatedAt || new Date().toISOString()
      }));
      persistArtbooksLocally(normalized);

      const srvRes = await pushStudioDataPatch({
        artbooks: normalized,
        deletedArtbookIds: Array.from(deletedArtbookIdsRef.current)
      });
      if (srvRes.unauthorized) {
        const errMsg = srvRes.error || 'Session Studio expirée. Veuillez vous reconnecter.';
        setLastCloudError({ message: errMsg, needsGoogleAuth: false });
        return { success: false, message: errMsg };
      }

      if (isFirebaseAdminConnectedRef.current) {
        try {
          const fb = initializeFirebaseCustom();
          if (fb.db) {
            await syncAllArtbooksToFirestore(fb.db, normalized).catch(() => {});
          }
        } catch {}
      }

      setLastCloudError(null);
      return {
        success: true,
        message: `Mise à jour réussie ! Les ${normalized.length} artbook(s) sont enregistrés et visibles sur le site.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur lors de la synchronisation des artbooks.' };
    } finally {
      setIsSyncingArtbooks(false);
    }
  }, [persistArtbooksLocally]);

  const [isSyncingArticlesCloud, setIsSyncingArticlesCloud] = useState(false);

  const syncAllArticlesToFirestoreNow = useCallback(async (): Promise<{ success: boolean; message: string; count?: number }> => {
    setIsSyncingArticlesCloud(true);
    try {
      const currentArticles = articlesRef.current;
      const srvRes = await pushStudioDataPatch({ articles: currentArticles });
      if (srvRes.unauthorized) {
        return { success: false, message: srvRes.error || 'Session Studio expirée.' };
      }

      if (isFirebaseAdminConnectedRef.current) {
        try {
          const fb = initializeFirebaseCustom();
          if (fb.db) {
            await syncAllArticlesToFirestore(fb.db, currentArticles).catch(() => {});
          }
        } catch {}
      }

      return {
        success: true,
        count: currentArticles.length,
        message: `Synchronisation réussie ! Les ${currentArticles.length} articles sont enregistrés.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur lors de la synchronisation des articles.' };
    } finally {
      setIsSyncingArticlesCloud(false);
    }
  }, []);

  const cleanupDuplicates = useCallback(async (): Promise<{ cleaned: number; message: string }> => {
    let cleanedCount = 0;
    try {
      const { deduplicated: cleanLocal, duplicateIds: localDupIds } = deduplicateSeries(seriesRef.current);
      seriesRef.current = cleanLocal;
      setSeries(cleanLocal);
      try {
        localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(cleanLocal));
      } catch {}

      cleanedCount = localDupIds.length;
      await pushStudioDataPatch({ series: cleanLocal });

      if (isFirebaseAdminConnectedRef.current) {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          for (const dId of localDupIds) {
            try { await deleteSeriesFromFirestore(fb.db, dId); } catch {}
          }
        }
      }

      return {
        cleaned: cleanedCount,
        message: cleanedCount > 0
          ? `${cleanedCount} doublon(s) d'œuvres nettoyé(s) avec succès !`
          : 'Aucun doublon détecté, le catalogue est parfaitement propre.'
      };
    } catch (err: any) {
      return { cleaned: 0, message: err?.message || 'Erreur lors du nettoyage des doublons.' };
    }
  }, []);

  const refreshCatalogueFromFirestore = useCallback(async () => {
    setIsRefreshingCatalogue(true);
    try {
      const [serverData, fbSeries] = await Promise.all([
        fetchStudioDataFromServer(),
        (async () => {
          const fb = initializeFirebaseCustom();
          return fb.db ? fetchFirestoreSeriesNow(fb.db) : [];
        })()
      ]);

      if (serverData && Array.isArray(serverData.deletedSeriesIds)) {
        deletedSeriesIdsRef.current = mergeIdSets(deletedSeriesIdsRef.current, serverData.deletedSeriesIds);
        try {
          localStorage.setItem(STORAGE_KEYS.DELETED_SERIES, JSON.stringify(Array.from(deletedSeriesIdsRef.current)));
        } catch {}
      }

      let nextList = seriesRef.current;
      if (serverData && Array.isArray(serverData.series) && serverData.series.length > 0) {
        nextList = mergeEntitiesByRecency(nextList, serverData.series.map(s => cleanSeries(s)), deletedSeriesIdsRef.current);
      }
      if (fbSeries && fbSeries.length > 0) {
        nextList = mergeEntitiesByRecency(nextList, fbSeries.map(s => cleanSeries(s)), deletedSeriesIdsRef.current);
      }

      const { deduplicated } = deduplicateSeries(nextList);
      seriesRef.current = deduplicated;
      setSeries(deduplicated);
      try {
        localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
      } catch {}
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => setIsRefreshingCatalogue(false), 500);
    }
  }, []);

  const [isSyncingHeroSlides, setIsSyncingHeroSlides] = useState(false);

  const saveHeroSlides = useCallback((slides: HomeHeroSlide[]) => {
    const normalized = slides.map((s, idx) => ({
      ...s,
      imageUrl: normalizeImageUrl(s.imageUrl),
      logoUrl: s.logoUrl ? normalizeImageUrl(s.logoUrl) : '',
      order: s.order ?? (idx + 1)
    }));
    heroSlidesRef.current = normalized;
    setHeroSlides(normalized);
    try {
      localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(normalized));
    } catch (e) {
      console.warn('Erreur sauvegarde hero slides:', e);
    }
    pushStudioDataPatch({ heroSlides: normalized }).catch(() => {});
    if (isFirebaseAdminConnectedRef.current) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          syncHeroSlidesToFirestore(fb.db, normalized).catch(() => {});
        }
      } catch {}
    }
  }, []);

  const syncHeroSlidesToFirestoreNow = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncingHeroSlides(true);
    try {
      const normalized = heroSlidesRef.current.map((s, idx) => ({
        ...s,
        imageUrl: normalizeImageUrl(s.imageUrl),
        logoUrl: s.logoUrl ? normalizeImageUrl(s.logoUrl) : '',
        order: s.order ?? (idx + 1)
      }));
      heroSlidesRef.current = normalized;
      setHeroSlides(normalized);
      try {
        localStorage.setItem(STORAGE_KEYS.HERO_SLIDES, JSON.stringify(normalized));
      } catch {}

      const srvRes = await pushStudioDataPatch({ heroSlides: normalized });
      if (srvRes.unauthorized) {
        return { success: false, message: srvRes.error || 'Session Studio expirée.' };
      }

      if (isFirebaseAdminConnectedRef.current) {
        try {
          const fb = initializeFirebaseCustom();
          if (fb.db) {
            await syncHeroSlidesToFirestore(fb.db, normalized).catch(() => {});
          }
        } catch {}
      }

      return { 
        success: true, 
        message: `Synchronisation réussie ! Les ${normalized.length} bannières sont maintenant actives et visibles sur tous les appareils.` 
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur lors de la synchronisation.' };
    } finally {
      setIsSyncingHeroSlides(false);
    }
  }, []);

  const addHeroSlide = useCallback((slideData: Omit<HomeHeroSlide, 'id' | 'createdAt'>) => {
    const newSlide: HomeHeroSlide = {
      ...slideData,
      id: `slide-${Date.now()}`,
      order: slideData.order ?? (heroSlidesRef.current.length + 1),
      createdAt: new Date().toISOString()
    };
    const updated = [newSlide, ...heroSlidesRef.current];
    saveHeroSlides(updated);
  }, [saveHeroSlides]);

  const updateHeroSlide = useCallback((id: string, updates: Partial<HomeHeroSlide>) => {
    const nowIso = new Date().toISOString();
    const updated = heroSlidesRef.current.map(s => s.id === id ? { ...s, ...updates, updatedAt: nowIso } : s);
    saveHeroSlides(updated);
  }, [saveHeroSlides]);

  const deleteHeroSlide = useCallback((id: string) => {
    const updated = heroSlidesRef.current.filter(s => s.id !== id);
    saveHeroSlides(updated);
  }, [saveHeroSlides]);

  const reorderHeroSlides = useCallback((newOrder: HomeHeroSlide[]) => {
    const reordered = newOrder.map((s, idx) => ({ ...s, order: idx + 1 }));
    saveHeroSlides(reordered);
  }, [saveHeroSlides]);

  return (
    <DataContext.Provider value={{
      series,
      teasers,
      pressReleases,
      articles,
      artists,
      artbooks,
      artbookDownloads,
      artbookPurchases,
      heroSlides,
      addHeroSlide,
      updateHeroSlide,
      deleteHeroSlide,
      reorderHeroSlides,
      syncHeroSlidesToFirestoreNow,
      isSyncingHeroSlides,
      syncAllArtistsToFirestoreNow,
      syncAllArtbooksToFirestoreNow,
      isSyncingArtists,
      isSyncingArtbooks,
      syncAllArticlesToFirestoreNow,
      isSyncingArticlesCloud,
      mediaKit,
      appVersion,
      analytics,
      submissions,
      firebaseConfig,
      adminUser,
      adminAuth,
      adminCredentials,
      monetization,
      creatorPayouts,
      reportedComments,
      moderationLogs,
      users,
      coinTransactions,
      ads,
      lwsFiles,
      loginWithCredentials,
      loginWithGoogle,
      logoutAdmin,
      setAdminUser,
      changeAdminPassword,
      isPasswordModalOpen,
      setIsPasswordModalOpen,
      openPasswordModal,
      isFirebaseAdminConnected,
      firebaseAuthEmail,
      lastCloudError,
      clearLastCloudError,
      viewMode,
      setViewMode,
      selectedArticleId,
      selectedOeuvreId,
      selectedArtistId,
      selectedArtbookId,
      openArticlePage,
      openOeuvrePage,
      openArtistPage,
      openArtbookPage,
      recordArtbookDownload,
      recordArtbookPurchase,
      verifyArtbookPurchase: verifyArtbookPurchaseAction,
      addArtist,
      updateArtist,
      deleteArtist,
      addArtbook,
      updateArtbook,
      deleteArtbook,
      activeReaderSeries,
      activeReaderChapter,
      openReader,
      closeReader,
      activeVideoTeaser,
      openTeaserModal,
      closeTeaserModal,
      addSeries,
      updateSeries,
      deleteSeries,
      addChapter,
      updateChapter,
      deleteChapter,
      addTeaser,
      updateTeaser,
      deleteTeaser,
      addArticle,
      updateArticle,
      deleteArticle,
      addPressRelease,
      updatePressRelease,
      deletePressRelease,
      updateAppVersion,
      recordApkDownload,
      submitCreatorProject,
      updateSubmissionStatus,
      moderateComment,
      deleteReportedComment,
      addModerationLog,
      updateMonetizationSettings,
      updateCoinPack,
      addCoinPack,
      deleteCoinPack,
      togglePaymentGateway,
      approvePayout,
      rejectPayout,
      createPayoutRequest,
      updateUserRole,
      adjustUserCoins,
      toggleUserBan,
      toggleUserVip,
      addAdBanner,
      updateAdBanner,
      deleteAdBanner,
      toggleAdStatus,
      recordAdClick,
      addLwsFile,
      deleteLwsFile,
      updateFirebaseConfig,
      testFirebaseConnection,
      triggerManualSync,
      cleanupDuplicates,
      refreshCatalogueFromFirestore,
      isRefreshingCatalogue,
      siteBannerUrl,
      updateSiteBannerUrl,
      likeSeries,
      likeChapter,
      currentUser,
      readerProfile,
      isReaderAuthLoading,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authModalInitialTab,
      openAuthModal,
      closeAuthModal,
      isProfileModalOpen,
      setIsProfileModalOpen,
      openProfileModal,
      closeProfileModal,
      signInReaderWithGoogle: signInReaderWithGoogleAction,
      signInReaderWithEmail: signInReaderWithEmailAction,
      signUpReaderWithEmail: signUpReaderWithEmailAction,
      sendReaderPasswordReset: sendReaderPasswordResetAction,
      logoutReader: logoutReaderAction,
      updateReaderProfileData: updateReaderProfileDataAction,
      userSubscriptions,
      hasWorkAccess,
      refreshUserSubscriptions,
      paystackToast,
      setPaystackToast
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

