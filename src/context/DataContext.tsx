import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Series, 
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
  Article
} from '../types';
import { 
  INITIAL_SERIES, 
  INITIAL_TEASERS, 
  INITIAL_PRESS_RELEASES, 
  INITIAL_MEDIA_KIT, 
  INITIAL_APP_VERSION, 
  INITIAL_ANALYTICS,
  DEFAULT_ADMIN_USER,
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
  subscribeToFirestoreAppVersion,
  getAppFirestoreDb
} from '../services/firebaseService';
import firebaseAppletConfig from '../../firebase-applet-config.json';

interface AdminAuthState {
  isAuthenticated: boolean;
  user: AdminUser;
  isSuperAdmin: boolean;
  isBypassActive: boolean;
}

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
  loginWithGoogle: () => Promise<boolean>;
  logoutAdmin: () => void;
  setAdminUser: (user: AdminUser) => void;

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
  USERS: 'ozi_users_data_v1',
  TRANSACTIONS: 'ozi_transactions_v1',
  ADS: 'ozi_ads_banners_v1',
  LWS_FILES: 'ozi_lws_files_v1',
  ARTICLES: 'ozi_articles_data_v1'
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

  // Core Data
  const [series, setSeries] = useState<Series[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERIES);
      return saved ? JSON.parse(saved) : INITIAL_SERIES;
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
          parsed.downloadUrl = 'http://ozibd.net/ozi-reader.apk';
          parsed.apkDownloadUrl = 'http://ozibd.net/ozi-reader.apk';
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

  // Admin Auth State (Auto-bypass active for wilfriedcrea@gmail.com)
  const adminAuth: AdminAuthState = {
    isAuthenticated: true,
    user: adminUser,
    isSuperAdmin: adminUser.email.toLowerCase() === 'wilfriedcrea@gmail.com' || adminUser.role === 'Super Admin',
    isBypassActive: adminUser.email.toLowerCase() === 'wilfriedcrea@gmail.com'
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

  // Real-time Firestore sync listener (keeps Web and APK synchronized immediately)
  useEffect(() => {
    const unsubscribeSeries = subscribeToFirestoreSeries((firestoreSeries) => {
      if (firestoreSeries && firestoreSeries.length > 0) {
        setSeries((prevLocal) => {
          // Merge remote firestore items with local items
          const map = new Map<string, Series>();
          // Put initial/local first
          prevLocal.forEach((s) => map.set(s.id, s));
          // Overwrite/Add remote items from Firestore
          firestoreSeries.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
          return Array.from(map.values());
        });
      }
    });

    const unsubscribeVersion = subscribeToFirestoreAppVersion((remoteVersion) => {
      if (remoteVersion && remoteVersion.version) {
        setAppVersion((prev) => ({ ...prev, ...remoteVersion }));
      }
    });

    return () => {
      unsubscribeSeries();
      unsubscribeVersion();
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
  const loginWithGoogle = useCallback(async () => {
    setAdminUserState(DEFAULT_ADMIN_USER);
    return true;
  }, []);

  const logoutAdmin = useCallback(() => {
    setViewMode('accueil');
  }, []);

  const setAdminUser = useCallback((user: AdminUser) => {
    setAdminUserState(user);
  }, []);

  // Webtoon Reader Controls
  const openReader = useCallback((seriesId: string, chapterId?: string) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries) return;

    let targetChapter: Chapter | undefined;
    if (chapterId && targetSeries.chapters) {
      targetChapter = targetSeries.chapters.find(c => c.id === chapterId);
    }
    if (!targetChapter && targetSeries.chapters && targetSeries.chapters.length > 0) {
      targetChapter = targetSeries.chapters[0];
    }

    setActiveReaderSeries(targetSeries);
    setActiveReaderChapter(targetChapter || null);

    // Increment read stats
    setSeries(prev => prev.map(s => s.id === seriesId ? { ...s, totalReads: s.totalReads + 1 } : s));
    setAnalytics(prev => ({ ...prev, totalReads: prev.totalReads + 1, activeReadersToday: prev.activeReadersToday + 1 }));
  }, [series]);

  const closeReader = useCallback(() => {
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
  const addSeries = useCallback((newSeriesData: Omit<Series, 'id' | 'slug' | 'totalReads' | 'totalLikes' | 'rating' | 'reviewsCount' | 'updatedAt'>) => {
    const id = `series-${Date.now()}`;
    const slug = newSeriesData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSeries: Series = {
      ...newSeriesData,
      id,
      slug,
      totalReads: 0,
      totalLikes: 0,
      rating: 5.0,
      reviewsCount: 1,
      updatedAt: new Date().toISOString().split('T')[0],
      chapters: newSeriesData.chapters || []
    };

    setSeries(prev => [newSeries, ...prev]);
    setAnalytics(prev => ({ ...prev, seriesCount: prev.seriesCount + 1 }));

    // Firebase background sync
    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        syncSeriesToFirestore(fb.db, newSeries);
      }
    }
  }, [firebaseConfig]);

  const updateSeries = useCallback((id: string, updates: Partial<Series>) => {
    setSeries(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncSeriesToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return s;
    }));
  }, [firebaseConfig]);

  const deleteSeries = useCallback((id: string) => {
    setSeries(prev => prev.filter(s => s.id !== id));
    setAnalytics(prev => ({ ...prev, seriesCount: Math.max(0, prev.seriesCount - 1) }));

    if (firebaseConfig.isConnected) {
      const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
      if (fb.success && fb.db) {
        deleteSeriesFromFirestore(fb.db, id);
      }
    }
  }, [firebaseConfig]);

  // Chapters CRUD
  const addChapter = useCallback((seriesId: string, chapterData: Omit<Chapter, 'id' | 'seriesId' | 'releaseDate' | 'likesCount'>) => {
    const chapterId = `ch-${Date.now()}`;
    const newChapter: Chapter = {
      ...chapterData,
      id: chapterId,
      seriesId,
      releaseDate: new Date().toISOString().split('T')[0],
      likesCount: 0
    };

    setSeries(prev => prev.map(s => {
      if (s.id === seriesId) {
        const updatedChapters = [...(s.chapters || []), newChapter];
        const updated = {
          ...s,
          chapters: updatedChapters,
          chaptersCount: updatedChapters.length,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncSeriesToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return s;
    }));

    setAnalytics(prev => ({ ...prev, chaptersPublished: prev.chaptersPublished + 1 }));
  }, [firebaseConfig]);

  const updateChapter = useCallback((seriesId: string, chapterId: string, updates: Partial<Chapter>) => {
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId && s.chapters) {
        const updatedChapters = s.chapters.map(c => c.id === chapterId ? { ...c, ...updates } : c);
        const updated = { ...s, chapters: updatedChapters, updatedAt: new Date().toISOString().split('T')[0] };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncSeriesToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return s;
    }));
  }, [firebaseConfig]);

  const deleteChapter = useCallback((seriesId: string, chapterId: string) => {
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId && s.chapters) {
        const updatedChapters = s.chapters.filter(c => c.id !== chapterId);
        const updated = { ...s, chapters: updatedChapters, chaptersCount: updatedChapters.length };
        if (firebaseConfig.isConnected) {
          const fb = initializeFirebaseCustom({ projectId: firebaseConfig.projectId, databaseId: firebaseConfig.databaseId });
          if (fb.success && fb.db) {
            syncSeriesToFirestore(fb.db, updated);
          }
        }
        return updated;
      }
      return s;
    }));
  }, [firebaseConfig]);

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

  const triggerManualSync = useCallback(async () => {
    setFirebaseConfig(prev => ({ ...prev, syncState: 'syncing' }));
    try {
      const fb = initializeFirebaseCustom({
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.databaseId
      });
      if (fb.success && fb.db) {
        // Sync all series in parallel
        await Promise.all(series.map(s => syncSeriesToFirestore(fb.db!, s)));
        await Promise.all(articles.map(a => syncArticleToFirestore(fb.db!, a)));
        await syncAppVersionToFirestore(fb.db, appVersion);
        await Promise.all(pressReleases.map(p => syncPressToFirestore(fb.db!, p)));
        await Promise.all(teasers.map(t => syncTeaserToFirestore(fb.db!, t)));
        
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
  }, [firebaseConfig, series, articles, appVersion, pressReleases, teasers]);

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
      monetization,
      creatorPayouts,
      reportedComments,
      moderationLogs,
      users,
      coinTransactions,
      ads,
      lwsFiles,
      loginWithGoogle,
      logoutAdmin,
      setAdminUser,
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

