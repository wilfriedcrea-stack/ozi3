import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  AdminCredentials
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
  INITIAL_LWS_FILES
} from '../data/initialData';
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
import { 
  initializeFirebaseCustom, 
  testFirestoreConnection, 
  syncSeriesToFirestore, 
  deleteSeriesFromFirestore, 
  syncAppVersionToFirestore, 
  syncPressToFirestore, 
  syncTeaserToFirestore, 
  syncSubmissionToFirestore,
  syncArticleToFirestore,
  deleteArticleFromFirestore,
  subscribeToFirestoreSeries,
  fetchFirestoreSeriesNow,
  subscribeToFirestoreAppVersion,
  getAppFirestoreDb,
  syncAdminSecurityToFirestore,
  fetchAdminSecurityFromFirestore,
  syncSiteSettingsToFirestore,
  fetchSiteSettingsFromFirestore,
  subscribeToFirestoreSiteSettings,
  deduplicateSeries
} from '../services/firebaseService';
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

  // Auth actions
  loginWithCredentials: (usernameInput: string, passwordInput: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; isLocked?: boolean; remainingSeconds?: number }>;
  loginWithGoogle: () => Promise<boolean>;
  logoutAdmin: () => void;
  setAdminUser: (user: AdminUser) => void;
  changeAdminPassword: (currentPass: string, newPass: string, isSuperAdminDirect?: boolean) => Promise<{ success: boolean; message?: string }>;
  isPasswordModalOpen: boolean;
  setIsPasswordModalOpen: (open: boolean) => void;
  openPasswordModal: () => void;

  // View state & standalone pages
  viewMode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail';
  setViewMode: (mode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail') => void;
  selectedArticleId: string | null;
  selectedOeuvreId: string | null;
  openArticlePage: (articleIdOrSlug: string) => void;
  openOeuvrePage: (seriesIdOrSlug: string) => void;

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
  updateSeries: (id: string, updates: Partial<Series>) => void;
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

  // Interactions
  likeSeries: (seriesId: string) => void;
  likeChapter: (seriesId: string, chapterId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEYS = {
  SERIES: 'ozi_series_data_v1',
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
  DELETED_SERIES: 'ozi_deleted_series_ids_v1'
};

type ViewModeType = 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin' | 'article-detail' | 'oeuvre-detail';

interface ParsedRoute {
  mode: ViewModeType;
  id: string | null;
}

const parseCurrentRoute = (): ParsedRoute => {
  if (typeof window === 'undefined') return { mode: 'accueil', id: null };
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Article standalone page check (#/article/slug or /article/slug or ?article=slug)
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

  // 2. Oeuvre / Series standalone page check (#/oeuvre/slug or #/series/slug or /oeuvre/slug or ?oeuvre=slug)
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

  // 3. Search page check (#/recherche or #/search or /recherche or /search or ?search= or ?q=)
  if (path === '/recherche' || path.startsWith('/recherche/') || path === '/search' || path.startsWith('/search/') || hash.includes('recherche') || hash.includes('search') || searchParams.has('search') || searchParams.has('q')) {
    return { mode: 'recherche', id: null };
  }

  // 4. Admin view check
  if (path === '/admin' || path.startsWith('/admin/') || path.includes('/admin') || hash.includes('admin') || searchParams.has('admin')) {
    return { mode: 'admin', id: null };
  }

  // 5. Oeuvres list catalog check
  if (path === '/oeuvres' || path.startsWith('/oeuvres/') || hash === '#oeuvres' || hash === '#/oeuvres' || searchParams.has('oeuvres')) {
    return { mode: 'oeuvres', id: null };
  }

  // 6. Articles list check
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

  const [activeReaderSeries, setActiveReaderSeries] = useState<Series | null>(null);
  const [activeReaderChapter, setActiveReaderChapter] = useState<Chapter | null>(null);
  const [activeVideoTeaser, setActiveVideoTeaser] = useState<Teaser | null>(null);

  const setViewMode = useCallback((mode: ViewModeType) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      let targetHash = '';
      if (mode === 'admin') targetHash = '#admin';
      else if (mode === 'oeuvres') targetHash = '#oeuvres';
      else if (mode === 'articles') targetHash = '#articles';
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

  // Listen to browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setViewModeState(route.mode);
      if (route.mode === 'article-detail' && route.id) {
        setSelectedArticleId(route.id);
      } else if (route.mode === 'oeuvre-detail' && route.id) {
        setSelectedOeuvreId(route.id);
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
      country: String(s?.country || fallback?.country || 'Côte d\'Ivoire'),
      synopsis: String(s?.synopsis || s?.description || fallback?.synopsis || 'Découvrez cette œuvre sur OZI.'),
      genre: (s?.genre || fallback?.genre || 'Action & Shonen') as SeriesGenre,
      secondaryGenres: Array.isArray(s?.secondaryGenres) ? s.secondaryGenres : (fallback?.secondaryGenres || []),
      tags: Array.isArray(s?.tags) ? s.tags : (fallback?.tags || []),
      coverUrl: String(s?.coverUrl || s?.cover || s?.thumbnailUrl || fallback?.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'),
      bannerUrl: String(s?.bannerUrl || s?.banner || s?.coverUrl || fallback?.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80'),
      status: s?.status || fallback?.status || 'ongoing',
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
      const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_SERIES);
      const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

      const saved = localStorage.getItem(STORAGE_KEYS.SERIES);
      if (saved) {
        const parsed: Series[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanedSaved = parsed
            .filter((s) => s && s.id && !deletedSet.has(s.id))
            .map((s) => cleanSeries(s));
          const { deduplicated } = deduplicateSeries(cleanedSaved);
          return deduplicated;
        }
      }
      const initial = INITIAL_SERIES
        .filter((s) => !deletedSet.has(s.id))
        .map((s) => cleanSeries(s));
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

  const [analytics, setAnalytics] = useState<AnalyticsOverview>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return saved ? JSON.parse(saved) : INITIAL_ANALYTICS;
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

  const [monetization, setMonetization] = useState<MonetizationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MONETIZATION);
      return saved ? JSON.parse(saved) : INITIAL_MONETIZATION;
    } catch {
      return INITIAL_MONETIZATION;
    }
  });

  const [creatorPayouts, setCreatorPayouts] = useState<CreatorPayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      return saved ? JSON.parse(saved) : INITIAL_CREATOR_PAYOUTS;
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
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_COIN_TRANSACTIONS;
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

  // Real-time Firestore sync listener (keeps Web and APK synchronized immediately)
  useEffect(() => {
    // 1. Fetch immediately on launch to ensure latest catalog is active
    const fetchInitial = async () => {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          // Cloud sync admin credentials from Firestore
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
          } catch (secErr) {
            console.warn('Initial admin security fetch note:', secErr);
          }

          // Cloud sync Site Header Banner from Firestore
          try {
            const remoteSettings = await fetchSiteSettingsFromFirestore(fb.db);
            if (remoteSettings && remoteSettings.headerBannerUrl) {
              setSiteBannerUrl(remoteSettings.headerBannerUrl);
              try {
                localStorage.setItem(STORAGE_KEYS.SITE_BANNER, remoteSettings.headerBannerUrl);
              } catch {}
            }
          } catch (bannerErr) {
            console.warn('Initial site settings banner fetch note:', bannerErr);
          }

          const initialData = await fetchFirestoreSeriesNow(fb.db);
          if (initialData && initialData.length > 0) {
            setSeries((prevLocal) => {
              const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_SERIES);
              const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
              const filteredPrev = prevLocal.filter(s => !deletedSet.has(s.id));
              const combined = [...initialData, ...filteredPrev];
              const { deduplicated, duplicateIds } = deduplicateSeries(combined);
              if (duplicateIds.length > 0 && fb.db) {
                duplicateIds.forEach(id => deleteSeriesFromFirestore(fb.db!, id).catch(() => {}));
              }
              try {
                localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
              } catch {}
              return deduplicated;
            });
          }
        }
      } catch (err) {
        console.warn('Initial Firestore fetch note:', err);
      }
    };
    fetchInitial();

    // 2. Real-time persistent onSnapshot listener
    const unsubscribeSeries = subscribeToFirestoreSeries((firestoreSeries) => {
      if (firestoreSeries && firestoreSeries.length > 0) {
        setSeries((prevLocal) => {
          const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_SERIES);
          const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
          const filteredPrev = prevLocal.filter(s => !deletedSet.has(s.id));
          const combined = [...firestoreSeries, ...filteredPrev];
          const { deduplicated, duplicateIds } = deduplicateSeries(combined);
          if (duplicateIds.length > 0) {
            try {
              const fb = initializeFirebaseCustom();
              if (fb.db) {
                duplicateIds.forEach(id => deleteSeriesFromFirestore(fb.db!, id).catch(() => {}));
              }
            } catch {}
          }
          try {
            localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
          } catch {}
          return deduplicated;
        });
      }
    });

    const unsubscribeVersion = subscribeToFirestoreAppVersion((remoteVersion) => {
      if (remoteVersion && remoteVersion.version) {
        setAppVersion((prev) => ({ ...prev, ...remoteVersion }));
      }
    });

    const unsubscribeBanner = subscribeToFirestoreSiteSettings((settings) => {
      if (settings && settings.headerBannerUrl) {
        setSiteBannerUrl(settings.headerBannerUrl);
        try {
          localStorage.setItem(STORAGE_KEYS.SITE_BANNER, settings.headerBannerUrl);
        } catch {}
      }
    });

    return () => {
      unsubscribeSeries();
      unsubscribeVersion();
      unsubscribeBanner();
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
    // 1. Anti-Brute-Force & Rate Limiting Check
    const rateCheck = checkLoginRateLimit();
    if (rateCheck.isLocked) {
      return { 
        success: false, 
        isLocked: true, 
        remainingSeconds: rateCheck.remainingLockoutSeconds,
        message: `Console administrative temporairement verrouillée par mesure de sécurité suite à plusieurs tentatives infructueuses. Veuillez patienter ${rateCheck.remainingLockoutSeconds}s.` 
      };
    }

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Veuillez renseigner votre identifiant et votre mot de passe." };
    }

    // 2. Validate authorized administrator alias
    const isUsernameValid = adminCredentials.allowedUsernames.some(u => u.toLowerCase() === cleanUser) ||
      cleanUser === adminUser.email.toLowerCase();

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

    // 3. Strict Cryptographic Salted SHA-256 Verification with Constant-Time Jitter
    // NO backdoor strings and NO unhashed bypasses!
    const isPassValid = await verifyPassword(cleanPass, adminCredentials.passwordHash);

    if (!isPassValid) {
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
        details: `Session sécurisée active (Jeton cryptographique v3 pour ${cleanUser})`
      },
      ...prev
    ]);

    return { success: true };
  }, [adminCredentials, adminUser]);

  const loginWithGoogle = useCallback(async () => {
    // Deprecated for security: Google popup alone cannot bypass the administrator password
    console.warn('Google bypass is disabled for admin access. Administrator password is required.');
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
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

    const isDirectAllowed = Boolean(isSuperAdminDirect && (isAuthenticated || adminUser.role === 'Super Admin'));

    if (!isDirectAllowed) {
      if (!currentPass) {
        return { success: false, message: "Veuillez renseigner votre mot de passe actuel." };
      }
      // Constant-time check of current password
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

    // Cloud sync to Firestore config/admin_security
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

    // Automatically re-sign current active session with the new hash so the admin stays connected,
    // while all other sessions on other devices/tabs become immediately invalid!
    const updatedSession = await generateAdminSessionToken(adminUser.email, newHash);
    if (localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, updatedSession.token);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, updatedSession.token);
    }

    return { success: true, message: "Mot de passe administrateur renouvelé avec succès ! Synchronisé avec le Cloud Firestore." };
  }, [adminCredentials, adminUser.email, isAuthenticated, adminUser.role]);

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
    const nowDate = nowIso.split('T')[0];
    const newSeries: Series = {
      ...newSeriesData,
      id,
      slug,
      totalReads: 0,
      totalLikes: 0,
      rating: 5.0,
      reviewsCount: 1,
      createdAt: nowIso,
      updatedAt: nowDate,
      chapters: newSeriesData.chapters || []
    } as any;

    setSeries(prev => {
      // Remove any existing series with identical slug or title so mock duplicates are superseded
      const filtered = prev.filter(s => {
        const sameSlug = (s.slug || '').trim().toLowerCase() === slug;
        const sameTitle = (s.title || '').trim().toLowerCase() === newSeriesData.title.trim().toLowerCase();
        if (sameSlug || sameTitle) {
          if (s.id !== id) {
            try {
              const fb = initializeFirebaseCustom();
              if (fb.db) deleteSeriesFromFirestore(fb.db, s.id);
            } catch {}
          }
          return false;
        }
        return s.id !== id;
      });
      return [newSeries, ...filtered];
    });
    setAnalytics(prev => ({ ...prev, seriesCount: prev.seriesCount + 1 }));

    // Firebase background sync with robust fallback
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncSeriesToFirestore(fb.db, newSeries);
      }
    } catch (syncErr) {
      console.warn('Sync new series to Firestore warning:', syncErr);
    }
  }, []);

  const updateSeries = useCallback(async (id: string, updates: Partial<Series>) => {
    let targetUpdated: Series | null = null;
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.split('T')[0];

    setSeries(prev => prev.map(s => {
      if (s.id === id) {
        targetUpdated = { ...s, ...updates, updatedAt: nowDate };
        return targetUpdated;
      }
      return s;
    }));

    if (targetUpdated) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, targetUpdated);
        }
      } catch (syncErr) {
        console.warn('Sync updated series to Firestore warning:', syncErr);
      }
    }
  }, []);

  const deleteSeries = useCallback(async (id: string) => {
    // Record in deleted set to permanently prevent rebirth from INITIAL_SERIES
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_SERIES);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_SERIES, JSON.stringify(Array.from(set)));
    } catch {}

    setSeries(prev => prev.filter(s => s.id !== id));
    setAnalytics(prev => ({ ...prev, seriesCount: Math.max(0, prev.seriesCount - 1) }));

    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await deleteSeriesFromFirestore(fb.db, id);
      }
    } catch (delErr) {
      console.warn('Delete series from Firestore warning:', delErr);
    }
  }, []);

  // Chapters CRUD
  const addChapter = useCallback(async (seriesId: string, chapterData: Omit<Chapter, 'id' | 'seriesId' | 'releaseDate' | 'likesCount'>) => {
    const chapterId = `ch-${Date.now()}`;
    const newChapter: Chapter = {
      ...chapterData,
      id: chapterId,
      seriesId,
      releaseDate: new Date().toISOString().split('T')[0],
      likesCount: 0
    };

    let updatedSeries: Series | null = null;
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId) {
        const updatedChapters = [...(s.chapters || []), newChapter];
        updatedSeries = {
          ...s,
          chapters: updatedChapters,
          chaptersCount: updatedChapters.length,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return updatedSeries;
      }
      return s;
    }));

    if (updatedSeries) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries);
        }
      } catch (err) {
        console.warn('Sync new chapter to Firestore warning:', err);
      }
    }

    setAnalytics(prev => ({ ...prev, chaptersPublished: prev.chaptersPublished + 1 }));
  }, []);

  const updateChapter = useCallback(async (seriesId: string, chapterId: string, updates: Partial<Chapter>) => {
    let updatedSeries: Series | null = null;
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId && s.chapters) {
        const updatedChapters = s.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c);
        updatedSeries = { ...s, chapters: updatedChapters, updatedAt: new Date().toISOString().split('T')[0] };
        return updatedSeries;
      }
      return s;
    }));

    if (updatedSeries) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries);
        }
      } catch (err) {
        console.warn('Sync updated chapter to Firestore warning:', err);
      }
    }
  }, []);

  const deleteChapter = useCallback(async (seriesId: string, chapterId: string) => {
    let updatedSeries: Series | null = null;
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId && s.chapters) {
        const updatedChapters = s.chapters.filter(c => c.id !== chapterId);
        updatedSeries = { ...s, chapters: updatedChapters, chaptersCount: updatedChapters.length };
        return updatedSeries;
      }
      return s;
    }));

    if (updatedSeries) {
      try {
        const fb = initializeFirebaseCustom();
        if (fb.db) {
          await syncSeriesToFirestore(fb.db, updatedSeries);
        }
      } catch (err) {
        console.warn('Sync delete chapter to Firestore warning:', err);
      }
    }
  }, []);

  // Teasers CRUD
  const addTeaser = useCallback((teaserData: Omit<Teaser, 'id' | 'viewsCount' | 'releaseDate'>) => {
    const newTeaser: Teaser = {
      ...teaserData,
      id: `teaser-${Date.now()}`,
      viewsCount: 0,
      releaseDate: new Date().toISOString().split('T')[0]
    };
    setTeasers(prev => [newTeaser, ...prev]);

    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        syncTeaserToFirestore(fb.db, newTeaser);
      }
    }
  }, [firebaseConfig]);

  const updateTeaser = useCallback((id: string, updates: Partial<Teaser>) => {
    setTeasers(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncTeaserToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return t;
    }));
  }, [firebaseConfig]);

  const deleteTeaser = useCallback((id: string) => {
    setTeasers(prev => prev.filter(t => t.id !== id));
  }, []);

  // Press CRUD
  const addPressRelease = useCallback((pressData: Omit<PressRelease, 'id' | 'slug' | 'date'>) => {
    const slug = pressData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newPress: PressRelease = {
      ...pressData,
      id: `press-${Date.now()}`,
      slug,
      date: new Date().toISOString().split('T')[0]
    };
    setPressReleases(prev => [newPress, ...prev]);

    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        syncPressToFirestore(fb.db, newPress);
      }
    }
  }, [firebaseConfig]);

  const updatePressRelease = useCallback((id: string, updates: Partial<PressRelease>) => {
    setPressReleases(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncPressToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return p;
    }));
  }, [firebaseConfig]);

  const deletePressRelease = useCallback((id: string) => {
    setPressReleases(prev => prev.filter(p => p.id !== id));
  }, []);

  // Articles CRUD
  const addArticle = useCallback((articleData: Omit<Article, 'id' | 'slug'>) => {
    const id = `art-${Date.now()}`;
    const slug = articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newArticle: Article = {
      ...articleData,
      id,
      slug,
      published: articleData.published !== undefined ? articleData.published : true,
      publishedAt: articleData.publishedAt || new Date().toISOString().split('T')[0]
    };
    setArticles(prev => [newArticle, ...prev]);

    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        syncArticleToFirestore(fb.db, newArticle);
      }
    }
  }, [firebaseConfig]);

  const updateArticle = useCallback((id: string, updates: Partial<Article>) => {
    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncArticleToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return a;
    }));
  }, [firebaseConfig]);

  const deleteArticle = useCallback((id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        deleteArticleFromFirestore(fb.db, id);
      }
    }
  }, [firebaseConfig]);

  // Version Info
  const updateAppVersion = useCallback((updates: Partial<AppVersionInfo>) => {
    setAppVersion(prev => {
      const updated = { ...prev, ...updates };
      if (firebaseConfig.isConnected) {
        const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
        if (fb.success && fb.db) {
          syncAppVersionToFirestore(fb.db, updated);
        }
      }
      return updated;
    });
  }, [firebaseConfig]);

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

    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        syncSubmissionToFirestore(fb.db, newSub);
      }
    }
    return true;
  }, [firebaseConfig]);

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
  const updateMonetizationSettings = useCallback((updates: Partial<MonetizationSettings>) => {
    setMonetization(prev => ({ ...prev, ...updates }));
    addModerationLog(
      'Mise à jour Paramètres Monétisation',
      'monetization',
      'settings',
      `Modification des taux et paramètres de monétisation par ${adminUser.email}`
    );
  }, [addModerationLog, adminUser.email]);

  const updateCoinPack = useCallback((packId: string, updates: Partial<CoinPack>) => {
    setMonetization(prev => ({
      ...prev,
      coinPacks: prev.coinPacks.map(p => p.id === packId ? { ...p, ...updates } : p)
    }));
    addModerationLog(
      'Mise à jour Pack de Coins',
      'monetization',
      packId,
      `Ajustement du pack de coins ${packId}`
    );
  }, [addModerationLog]);

  const addCoinPack = useCallback((pack: Omit<CoinPack, 'id'>) => {
    const newPack: CoinPack = {
      ...pack,
      id: `pack-${Date.now()}`
    };
    setMonetization(prev => ({
      ...prev,
      coinPacks: [...prev.coinPacks, newPack]
    }));
    addModerationLog(
      'Ajout Pack de Coins',
      'monetization',
      newPack.id,
      `Création du pack ${newPack.name} (${newPack.coins} Coins à ${newPack.priceXof} FCFA)`
    );
  }, [addModerationLog]);

  const deleteCoinPack = useCallback((packId: string) => {
    setMonetization(prev => ({
      ...prev,
      coinPacks: prev.coinPacks.filter(p => p.id !== packId)
    }));
    addModerationLog('Suppression Pack de Coins', 'monetization', packId, `Suppression du pack ${packId}`);
  }, [addModerationLog]);

  const togglePaymentGateway = useCallback((gatewayId: string) => {
    setMonetization(prev => ({
      ...prev,
      supportedPaymentGateways: prev.supportedPaymentGateways.map(g => 
        g.id === gatewayId ? { ...g, isActive: !g.isActive } : g
      )
    }));
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
    const trimmed = newUrl.trim();
    if (!trimmed) return false;
    setSiteBannerUrl(trimmed);
    try {
      localStorage.setItem(STORAGE_KEYS.SITE_BANNER, trimmed);
    } catch {}

    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        await syncSiteSettingsToFirestore(fb.db, { headerBannerUrl: trimmed });
      }
      return true;
    } catch (err) {
      console.warn('Error syncing site banner to Firestore:', err);
      return false;
    }
  }, []);

  const triggerManualSync = useCallback(async () => {
    setFirebaseConfig(prev => ({ ...prev, syncState: 'syncing' }));
    try {
      const fb = initializeFirebaseCustom({
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.databaseId
      });
      if (fb.success && fb.db) {
        // Deduplicate series first so no ghost/mock copies are pushed
        const { deduplicated: cleanSeriesList, duplicateIds } = deduplicateSeries(series);
        if (duplicateIds.length > 0) {
          for (const dId of duplicateIds) {
            try {
              await deleteSeriesFromFirestore(fb.db, dId);
            } catch {}
          }
          setSeries(cleanSeriesList);
        }

        // Sync all deduplicated series securely with individual error trapping
        const seriesResults = await Promise.allSettled(cleanSeriesList.map(s => syncSeriesToFirestore(fb.db!, s)));
        seriesResults.forEach((res, idx) => {
          if (res.status === 'rejected') {
            console.warn(`Sync failed for series ${cleanSeriesList[idx]?.id}:`, res.reason);
          }
        });

        // Sync header banner & site settings
        await syncSiteSettingsToFirestore(fb.db, { headerBannerUrl: siteBannerUrl });

        await Promise.allSettled(articles.map(a => syncArticleToFirestore(fb.db!, a)));
        await syncAppVersionToFirestore(fb.db, appVersion);
        await Promise.allSettled(pressReleases.map(p => syncPressToFirestore(fb.db!, p)));
        await Promise.allSettled(teasers.map(t => syncTeaserToFirestore(fb.db!, t)));
        
        setFirebaseConfig(prev => ({
          ...prev,
          syncState: 'synced',
          isConnected: true,
          lastSyncedAt: new Date().toISOString()
        }));
      }
    } catch {
      setFirebaseConfig(prev => ({ ...prev, syncState: 'error', errorMessage: 'Échec de synchronisation globale' }));
    }
  }, [firebaseConfig, series, articles, appVersion, pressReleases, teasers, siteBannerUrl]);

  const cleanupDuplicates = useCallback(async (): Promise<{ cleaned: number; message: string }> => {
    let cleanedCount = 0;
    try {
      const fb = initializeFirebaseCustom();
      // 1. Deduplicate local series
      const { deduplicated: cleanLocal, duplicateIds: localDupIds } = deduplicateSeries(series);
      setSeries(cleanLocal);
      try {
        localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(cleanLocal));
      } catch {}

      // 2. Scan and purge duplicates from Firestore
      if (fb.db) {
        for (const dId of localDupIds) {
          try {
            await deleteSeriesFromFirestore(fb.db, dId);
            cleanedCount++;
          } catch {}
        }

        const remoteSeries = await fetchFirestoreSeriesNow(fb.db);
        const { deduplicated: cleanRemote, duplicateIds: remoteDupIds } = deduplicateSeries(remoteSeries);
        for (const rId of remoteDupIds) {
          try {
            await deleteSeriesFromFirestore(fb.db, rId);
            cleanedCount++;
          } catch {}
        }
        setSeries(cleanRemote);
        try {
          localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(cleanRemote));
        } catch {}
      } else {
        cleanedCount = localDupIds.length;
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
  }, [series]);

  const refreshCatalogueFromFirestore = useCallback(async () => {
    setIsRefreshingCatalogue(true);
    try {
      const fb = initializeFirebaseCustom();
      if (fb.db) {
        const latestSeries = await fetchFirestoreSeriesNow(fb.db);
        if (latestSeries && latestSeries.length > 0) {
          setSeries((prevLocal) => {
            const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_SERIES);
            const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
            const filteredPrev = prevLocal.filter(s => !deletedSet.has(s.id));
            const combined = [...latestSeries, ...filteredPrev];
            const { deduplicated } = deduplicateSeries(combined);
            try {
              localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(deduplicated));
            } catch {}
            return deduplicated;
          });
        }
      }
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => setIsRefreshingCatalogue(false), 500);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      series,
      teasers,
      pressReleases,
      articles,
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
      viewMode,
      setViewMode,
      selectedArticleId,
      selectedOeuvreId,
      openArticlePage,
      openOeuvrePage,
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
      likeChapter
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

