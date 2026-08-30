export type SeriesGenre = 
  | 'Afro-Fantasy'
  | 'Sci-Fi & Cyberpunk'
  | 'Action & Shonen'
  | 'Romance & Drame'
  | 'Mythologie & Histoire'
  | 'Thriller & Mystère'
  | 'Arts Martiaux'
  | 'Jeunesse & Aventure'
  | 'Horreur'
  | 'Comédie'
  | 'Seinen'
  | 'Tranche de vie';

export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus' | 'coming_soon';

export type SeriesBadge = 'exclusivite' | 'coup_de_coeur' | 'tendance' | 'nouveau' | 'original_ozi';

export type AmbientAudioPreset = 'epic_action' | 'romance_soft' | 'mystery_suspense' | 'cyberpunk_urban' | 'traditional_fantasy' | 'none';

export interface AmbientAudioConfig {
  enabled: boolean;
  preset: AmbientAudioPreset;
  customAudioUrl?: string;
  audioFileName?: string;
  volume: number; // 0.0 to 1.0
  loop: boolean;
  autoPlayOnScroll: boolean;
}

export type ChapterPricingType = 'free' | 'coins' | 'ad_reward';

export interface Chapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  releaseDate: string;
  isFree: boolean;
  published?: boolean;
  publishedAt?: string | null;
  pricingType?: ChapterPricingType;
  coinsRequired: number;
  pages: string[];
  likesCount: number;
  readTimeMinutes: number;
  summary?: string;
  audioConfig?: AmbientAudioConfig;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  author: string;
  artist: string;
  studio?: string;
  country: string;
  synopsis: string;
  genre: SeriesGenre;
  format?: 'série' | 'film' | 'manga' | 'webtoon' | 'one-shot';
  mediaType?: string;
  secondaryGenres?: SeriesGenre[];
  tags: string[];
  coverUrl: string;
  coverStoragePath?: string;
  bannerUrl: string;
  bannerStoragePath?: string;
  status: SeriesStatus;
  published?: boolean;
  publishedAt?: string | null;
  badges?: SeriesBadge[];
  rating: number;
  reviewsCount: number;
  totalReads: number;
  totalLikes: number;
  chaptersCount: number;
  isFeatured: boolean;
  isExclusive: boolean;
  isTrending: boolean;
  releaseYear: number;
  language: string;
  ageRating: 'Tous publics' | '12+' | '16+' | '18+';
  teaserVideoUrl?: string;
  updatedAt: string;
  chapters?: Chapter[];
}

export interface Teaser {
  id: string;
  title: string;
  seriesId?: string;
  seriesTitle?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  viewsCount: number;
  description: string;
  type: 'trailer' | 'motion_comic' | 'interview' | 'teaser';
  releaseDate: string;
  featured?: boolean;
}

export type VideoTeaser = Teaser;

export interface Article {
  id: string;
  title: string;
  slug: string;
  image: string;
  publishedAt: string;
  category?: string;
  excerpt?: string;
  featured?: boolean;
  published?: boolean;
  layoutSize?: 'hero' | 'grid' | 'asymmetric-large' | 'asymmetric-small';
  alt?: string;
  author?: string;
  readTime?: string;
  content?: string;
}

export interface PressRelease {
  id: string;
  title: string;
  slug: string;
  date: string;
  category: 'Lancement' | 'Partenariat' | 'Événement' | 'Récompense' | 'Mise à jour' | string;
  summary: string;
  content: string;
  author: string;
  pdfDownloadUrl?: string;
  imageUrl?: string;
  readTime?: string;
}

export interface MediaKitAsset {
  id: string;
  name: string;
  category: 'Logos Officiels' | 'Bannières Presse' | 'Affiches Séries HD' | 'Captures Écran App' | 'Charte Graphique' | string;
  format: 'SVG' | 'PNG HD' | 'PDF' | 'ZIP' | string;
  resolution: string;
  fileSize: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  apkDownloadUrl: string;
  downloadUrl?: string;
  apkSizeMb: number;
  minAndroidVersion: string;
  checksumSha256: string;
  isForceUpdateRequired?: boolean;
  pwaUrl: string;
  webAppUrl?: string;
  changelog: string[];
  downloadsCount: number;
}

export interface CreatorSubmission {
  id: string;
  creatorName: string;
  email: string;
  phone?: string;
  country: string;
  seriesTitle: string;
  genre: SeriesGenre;
  pitch: string;
  portfolioUrl?: string;
  samplePagesUrl?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'contacted';
  submittedAt: string;
  notes?: string;
  editorialNotes?: string;
}

export interface AnalyticsOverview {
  totalReads: number;
  totalUsers: number;
  apkDownloads: number;
  creatorEarningsCfa: number;
  seriesCount: number;
  chaptersPublished: number;
  activeReadersToday: number;
  averageRating: number;
  dailyViewsHistory?: { date: string; views: number; reads: number }[];
  userGrowthHistory?: { date: string; newUsers: number; apkDownloads: number }[];
  revenueHistory?: { date: string; revenueXof: number; coinsBought: number }[];
}

export interface FirebaseSyncConfig {
  projectId: string;
  databaseId?: string;
  authDomain?: string;
  storageBucket?: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  autoSyncEnabled: boolean;
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

export type UserRole = 'reader' | 'creator' | 'moderator' | 'super_admin';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  coinsBalance: number;
  isVip: boolean;
  vipExpiresAt?: string;
  isBanned: boolean;
  country: string;
  joinedAt: string;
  lastActiveAt: string;
  readChaptersCount: number;
  unlockedSeriesCount: number;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'Super Admin' | 'Admin Éditorial' | 'Modérateur' | 'Gestionnaire Financier';
  permissions: string[];
  lastLogin: string;
  is2FAEnabled: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  provider: 'Wave' | 'MTN Mobile Money' | 'Orange Money' | 'Moov Money' | 'Carte Bancaire / Stripe' | 'Paystack';
  countries: string[];
  isActive: boolean;
  feePercent: number;
}

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceXof: number;
  priceEur: number;
  isPopular?: boolean;
  badge?: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'pack_purchase' | 'chapter_unlock' | 'ad_reward' | 'creator_payout' | 'admin_credit' | 'admin_debit';
  coins: number;
  amountXof?: number;
  seriesTitle?: string;
  chapterNumber?: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface CreatorPayout {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  seriesTitle: string;
  period: string;
  totalReads: number;
  coinsEarned: number;
  amountXof: number;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  paymentMethod: string;
  paymentAccount: string;
  requestedAt: string;
  processedAt?: string;
}

export interface MonetizationSettings {
  currency: 'XOF' | 'EUR' | 'USD';
  coinRateXof: number; // e.g. 5 FCFA = 1 Coin
  creatorRevenueSharePercent: number; // e.g. 70%
  vipMonthlyPriceXof: number; // e.g. 2900 FCFA
  freeChaptersThreshold: number; // e.g. 3 premiers chapitres gratuits
  defaultPaidChapterCoins: number; // e.g. 15 Coins
  supportedPaymentGateways: PaymentGateway[];
  coinPacks: CoinPack[];
  totalPlatformRevenueXof: number;
  totalPaidToCreatorsXof: number;
}

export interface ReportedComment {
  id: string;
  seriesId: string;
  seriesTitle: string;
  chapterNumber?: number;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  commentText: string;
  reportedReason: 'spam' | 'inappropriate' | 'spoiler' | 'hate_speech' | 'copyright' | 'harassment';
  reportCount: number;
  status: 'pending' | 'approved' | 'hidden' | 'deleted';
  createdAt: string;
  moderatorNotes?: string;
}

export interface ModerationLog {
  id: string;
  moderatorEmail: string;
  action: string;
  targetType: 'series' | 'chapter' | 'submission' | 'comment' | 'payout' | 'monetization' | 'user' | 'ad';
  targetId: string;
  details: string;
  timestamp: string;
}

export type AdPlacement = 'hero_home' | 'interstitial_chapter' | 'footer_banner';

export interface AdBanner {
  id: string;
  title: string;
  advertiserName: string;
  placement: AdPlacement;
  imageUrl: string;
  redirectUrl: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  priority: number;
}

export interface LwsStorageFile {
  name: string;
  path: string;
  directory: 'covers' | 'banners' | 'chapters' | 'audio';
  size: number;
  sizeFormatted: string;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

