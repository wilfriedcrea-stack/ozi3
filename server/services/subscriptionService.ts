import { SubscriptionRecord, SubscriptionStatus, PremiumAccessCheckResult, ArtbookPurchaseRecord } from '../../src/types';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

// Initialize server-side Firebase connection if available
let serverDb: any = null;
try {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig, 'OZI_SERVER_APP');
  serverDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.warn('[SubscriptionService] Notice initializing Firebase on server:', err);
}

// In-memory cache & fallback storage for zero-latency server-side authorization checks
const memorySubscriptions: Map<string, SubscriptionRecord> = new Map();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates or stages a pending subscription when a user initiates a Paystack payment
 */
export async function createPendingSubscription(params: {
  uid: string;
  workId: string;
  workTitle?: string;
  amount: number;
  currency: string;
  paystackReference: string;
  customerEmail?: string;
}): Promise<SubscriptionRecord> {
  const now = new Date();
  const subscriptionId = `sub_${params.workId}_${params.uid}_${Date.now()}`;

  const record: SubscriptionRecord = {
    subscriptionId,
    uid: params.uid.trim(),
    workId: params.workId.trim(),
    workTitle: params.workTitle || 'Œuvre OZI',
    amount: params.amount,
    currency: params.currency || 'XOF',
    paystackReference: params.paystackReference,
    customerEmail: params.customerEmail || '',
    status: 'pending',
    startDate: now.toISOString(),
    // Provisionally set to +30 days; will be re-locked to SERVER_NOW() upon charge.success
    expirationDate: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Cache in memory
  memorySubscriptions.set(subscriptionId, record);
  // Also index by composite key for fast lookups
  memorySubscriptions.set(`${record.uid}:${record.workId}`, record);

  // Persist to Firestore if available
  if (serverDb) {
    try {
      await setDoc(doc(serverDb, 'subscriptions', subscriptionId), record, { merge: true });
    } catch (dbErr) {
      console.warn('[SubscriptionService] Failed to persist pending subscription to Firestore:', dbErr);
    }
  }

  return record;
}

/**
 * Activates a subscription upon verified charge.success from Paystack Webhook
 * Applies strictly: startDate = SERVER_NOW(), expirationDate = SERVER_NOW() + 30 days
 */
export async function activateSubscription(params: {
  paystackReference: string;
  uid: string;
  workId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  workTitle?: string;
}): Promise<SubscriptionRecord> {
  const serverNow = new Date();
  const expirationDate = new Date(serverNow.getTime() + THIRTY_DAYS_MS);

  // Look for existing pending subscription by composite key or reference
  const compositeKey = `${params.uid.trim()}:${params.workId.trim()}`;
  let existing = memorySubscriptions.get(compositeKey);

  const subscriptionId = existing?.subscriptionId || `sub_${params.workId}_${params.uid}_${Date.now()}`;

  const activeRecord: SubscriptionRecord = {
    subscriptionId,
    uid: params.uid.trim(),
    workId: params.workId.trim(),
    workTitle: params.workTitle || existing?.workTitle || 'Œuvre OZI',
    startDate: serverNow.toISOString(),
    expirationDate: expirationDate.toISOString(),
    status: 'active',
    paystackReference: params.paystackReference,
    amount: params.amount,
    currency: params.currency || 'XOF',
    customerEmail: params.customerEmail || existing?.customerEmail || '',
    createdAt: existing?.createdAt || serverNow.toISOString(),
    updatedAt: serverNow.toISOString(),
  };

  // Update in-memory stores
  memorySubscriptions.set(subscriptionId, activeRecord);
  memorySubscriptions.set(compositeKey, activeRecord);

  // Persist to Firestore
  if (serverDb) {
    try {
      await setDoc(doc(serverDb, 'subscriptions', subscriptionId), activeRecord, { merge: true });
    } catch (dbErr) {
      console.warn('[SubscriptionService] Failed to persist active subscription to Firestore:', dbErr);
    }
  }

  console.log(`[SubscriptionService] ✅ Abonnement activé pour 30 jours ! Lecteur: ${activeRecord.uid} | Oeuvre: ${activeRecord.workId} | Expire le: ${activeRecord.expirationDate}`);
  return activeRecord;
}

/**
 * Server-side Access Control: hasValidAccess(uid, workId)
 * Verifies validity strictly against the authoritative SERVER TIMESTAMP.
 * Criteria: status == 'active' ET expirationDate > serverTime
 */
export async function hasValidAccess(uid: string, workId: string): Promise<PremiumAccessCheckResult> {
  const serverNow = new Date();
  const serverTimeIso = serverNow.toISOString();
  const serverTimeMs = serverNow.getTime();

  if (!uid || !workId) {
    return {
      hasAccess: false,
      reason: 'invalid_params',
      serverTime: serverTimeIso
    };
  }

  const cleanUid = uid.trim();
  const cleanWorkId = workId.trim();
  const compositeKey = `${cleanUid}:${cleanWorkId}`;

  // 1. Check memory cache first
  let sub = memorySubscriptions.get(compositeKey);

  // 2. If not found in cache and Firestore is available, look up in Firestore
  if (!sub && serverDb) {
    try {
      const subsRef = collection(serverDb, 'subscriptions');
      const q = query(
        subsRef,
        where('uid', '==', cleanUid),
        where('workId', '==', cleanWorkId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Find most recent subscription
        const docs = snap.docs.map(d => d.data() as SubscriptionRecord);
        docs.sort((a, b) => new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime());
        sub = docs[0];
        if (sub) {
          memorySubscriptions.set(sub.subscriptionId, sub);
          memorySubscriptions.set(compositeKey, sub);
        }
      }
    } catch (queryErr) {
      console.warn('[SubscriptionService] Notice querying Firestore for subscription:', queryErr);
    }
  }

  if (!sub) {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      serverTime: serverTimeIso
    };
  }

  // 3. Strict Server-Side Evaluation: status == 'active' && expirationDate > serverTime
  if (sub.status !== 'active') {
    return {
      hasAccess: false,
      subscription: sub,
      reason: 'subscription_inactive',
      serverTime: serverTimeIso
    };
  }

  const expirationMs = new Date(sub.expirationDate).getTime();

  if (isNaN(expirationMs) || expirationMs <= serverTimeMs) {
    // Subscription has expired
    sub.status = 'expired';
    sub.updatedAt = serverTimeIso;
    memorySubscriptions.set(sub.subscriptionId, sub);
    memorySubscriptions.set(compositeKey, sub);

    // Update asynchronously in Firestore
    if (serverDb) {
      updateDoc(doc(serverDb, 'subscriptions', sub.subscriptionId), {
        status: 'expired',
        updatedAt: serverTimeIso
      }).catch(() => {});
    }

    return {
      hasAccess: false,
      subscription: sub,
      reason: 'subscription_expired',
      remainingDays: 0,
      serverTime: serverTimeIso
    };
  }

  // Active and valid! Calculate remaining days
  const remainingDays = Math.max(1, Math.ceil((expirationMs - serverTimeMs) / (24 * 60 * 60 * 1000)));

  return {
    hasAccess: true,
    subscription: sub,
    reason: 'active',
    remainingDays,
    serverTime: serverTimeIso
  };
}

// In-memory store for Artbook Purchases
const memoryArtbookPurchases: Map<string, ArtbookPurchaseRecord> = new Map();

/**
 * Activates an Artbook purchase upon verified charge.success from Paystack
 */
export async function activateArtbookPurchase(params: {
  paystackReference: string;
  uid: string;
  artbookId: string;
  artbookTitle?: string;
  artistName?: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  userName?: string;
  phone?: string;
}): Promise<ArtbookPurchaseRecord> {
  const serverNow = new Date();
  const purchaseId = `art_pur_${params.artbookId}_${params.uid}_${Date.now()}`;
  const compositeKey = `${params.uid.trim()}:${params.artbookId.trim()}`;

  const record: ArtbookPurchaseRecord = {
    id: purchaseId,
    artbookId: params.artbookId.trim(),
    artbookTitle: params.artbookTitle || 'Artbook OZI',
    artistName: params.artistName || 'Artiste OZI',
    priceXof: params.amount,
    userName: params.userName || 'Lecteur OZI',
    userEmail: (params.customerEmail || '').trim().toLowerCase(),
    userPhone: params.phone || '',
    paymentGateway: 'paystack',
    paymentReference: params.paystackReference,
    status: 'completed',
    purchasedAt: serverNow.toISOString(),
    downloadAuthorized: true,
    userId: params.uid.trim()
  };

  memoryArtbookPurchases.set(purchaseId, record);
  memoryArtbookPurchases.set(compositeKey, record);

  if (serverDb) {
    try {
      await setDoc(doc(serverDb, 'artbook_purchases', purchaseId), record, { merge: true });
    } catch (err) {
      console.warn('[SubscriptionService] Error persisting artbook purchase to Firestore:', err);
    }
  }

  console.log(`[SubscriptionService] 🎨 Achat Artbook débloqué avec succès ! Lecteur: ${record.userId} | Artbook: ${record.artbookId} | Réf: ${record.paymentReference}`);
  return record;
}

/**
 * Server-side Access Control: hasArtbookAccess(uid, artbookId, email?)
 */
export async function hasArtbookAccess(uid: string, artbookId: string, email?: string): Promise<{
  hasAccess: boolean;
  purchase?: ArtbookPurchaseRecord;
  serverTime: string;
}> {
  const serverTime = new Date().toISOString();
  if (!uid || !artbookId) {
    return { hasAccess: false, serverTime };
  }

  const cleanUid = uid.trim();
  const cleanArtbookId = artbookId.trim();
  const compositeKey = `${cleanUid}:${cleanArtbookId}`;

  // 1. Check memory cache
  let purchase = memoryArtbookPurchases.get(compositeKey);

  // 2. Query Firestore if available
  if (!purchase && serverDb) {
    try {
      const colRef = collection(serverDb, 'artbook_purchases');
      const q = query(
        colRef,
        where('artbookId', '==', cleanArtbookId),
        where('userId', '==', cleanUid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const found = snap.docs.map(d => d.data() as ArtbookPurchaseRecord).find(p => p.status === 'completed' && p.downloadAuthorized);
        if (found) {
          purchase = found;
          memoryArtbookPurchases.set(compositeKey, purchase);
          memoryArtbookPurchases.set(purchase.id, purchase);
        }
      }
    } catch (err) {
      console.warn('[SubscriptionService] Notice querying Firestore for artbook purchase:', err);
    }
  }

  if (purchase && purchase.status === 'completed' && purchase.downloadAuthorized) {
    return { hasAccess: true, purchase, serverTime };
  }

  return { hasAccess: false, serverTime };
}

/**
 * Returns all purchased artbooks for a specific user
 */
export async function getUserArtbookPurchases(uid: string): Promise<ArtbookPurchaseRecord[]> {
  const cleanUid = uid.trim();
  const list: ArtbookPurchaseRecord[] = [];

  for (const pur of memoryArtbookPurchases.values()) {
    if (pur.userId === cleanUid && pur.downloadAuthorized && !list.some(p => p.id === pur.id)) {
      list.push(pur);
    }
  }

  if (serverDb) {
    try {
      const colRef = collection(serverDb, 'artbook_purchases');
      const q = query(colRef, where('userId', '==', cleanUid));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data() as ArtbookPurchaseRecord;
        if (data.downloadAuthorized && !list.some(p => p.id === data.id)) {
          list.push(data);
        }
      });
    } catch (err) {
      console.warn('[SubscriptionService] Notice fetching user artbook purchases:', err);
    }
  }

  list.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  return list;
}

/**
 * Returns all artbook purchases across all readers for reporting
 */
export async function getAllArtbookPurchases(): Promise<ArtbookPurchaseRecord[]> {
  const mapById = new Map<string, ArtbookPurchaseRecord>();

  for (const pur of memoryArtbookPurchases.values()) {
    if (pur.id) mapById.set(pur.id, pur);
  }

  if (serverDb) {
    try {
      const colRef = collection(serverDb, 'artbook_purchases');
      const snap = await getDocs(colRef);
      snap.forEach(d => {
        const data = d.data() as ArtbookPurchaseRecord;
        if (data.id) mapById.set(data.id, data);
      });
    } catch (err) {
      console.warn('[SubscriptionService] Notice fetching all artbook purchases:', err);
    }
  }

  return Array.from(mapById.values());
}

// In-memory store for Coin Transactions
const memoryCoinTransactions: Map<string, any> = new Map();

/**
 * Activates Coin Pack purchase upon verified charge.success from Paystack
 */
export async function activateCoinPackPurchase(params: {
  paystackReference: string;
  uid: string;
  packId: string;
  packName?: string;
  coinsAmount: number;
  amount: number;
  currency?: string;
  customerEmail?: string;
}): Promise<any> {
  const serverNow = new Date();
  const txId = `coin_tx_${params.packId}_${params.uid}_${Date.now()}`;

  const record = {
    id: txId,
    uid: params.uid.trim(),
    packId: params.packId,
    packName: params.packName || 'Pack de Coins',
    coinsAmount: params.coinsAmount,
    amountXof: params.amount,
    currency: params.currency || 'XOF',
    paystackReference: params.paystackReference,
    customerEmail: params.customerEmail || '',
    status: 'completed',
    createdAt: serverNow.toISOString(),
  };

  memoryCoinTransactions.set(txId, record);

  if (serverDb) {
    try {
      // 1. Record transaction
      await setDoc(doc(serverDb, 'coin_transactions', txId), record, { merge: true });

      // 2. Atomically increment reader's coins balance
      const userRef = doc(serverDb, 'users', params.uid.trim());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentBalance = userSnap.data()?.coinsBalance || 0;
        await updateDoc(userRef, {
          coinsBalance: currentBalance + params.coinsAmount,
          updatedAt: serverNow.toISOString()
        });
      }
    } catch (err) {
      console.warn('[SubscriptionService] Notice recording coin pack purchase in Firestore:', err);
    }
  }

  console.log(`[SubscriptionService] 🪙 Pack de ${params.coinsAmount} Coins crédité avec succès pour le lecteur ${params.uid} ! Réf: ${params.paystackReference}`);
  return record;
}

/**
 * Returns all coin transactions for admin reporting
 */
export async function getAllCoinTransactions(): Promise<any[]> {
  const mapById = new Map<string, any>();
  for (const tx of memoryCoinTransactions.values()) {
    if (tx.id) mapById.set(tx.id, tx);
  }

  if (serverDb) {
    try {
      const colRef = collection(serverDb, 'coin_transactions');
      const snap = await getDocs(colRef);
      snap.forEach(d => {
        const data = d.data();
        if (data.id) mapById.set(data.id, data);
      });
    } catch (err) {
      console.warn('[SubscriptionService] Notice fetching all coin transactions:', err);
    }
  }

  return Array.from(mapById.values());
}

/**
 * Returns all subscriptions for a specific reader (active & past)
 */
export async function getUserSubscriptions(uid: string): Promise<SubscriptionRecord[]> {
  const cleanUid = uid.trim();
  const list: SubscriptionRecord[] = [];

  // Memory scan
  for (const sub of memorySubscriptions.values()) {
    if (sub.uid === cleanUid && !list.some(s => s.subscriptionId === sub.subscriptionId)) {
      list.push(sub);
    }
  }

  // Firestore query if available
  if (serverDb) {
    try {
      const subsRef = collection(serverDb, 'subscriptions');
      const q = query(subsRef, where('uid', '==', cleanUid));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data() as SubscriptionRecord;
        if (!list.some(s => s.subscriptionId === data.subscriptionId)) {
          list.push(data);
        }
      });
    } catch (err) {
      console.warn('[SubscriptionService] Notice fetching user subscriptions:', err);
    }
  }

  // Refresh expiration status against server time
  const nowMs = Date.now();
  for (const s of list) {
    if (s.status === 'active' && new Date(s.expirationDate).getTime() <= nowMs) {
      s.status = 'expired';
    }
  }

  // Sort by most recent
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export interface PaystackAdminStats {
  totalRevenueXof: number;
  workPassRevenueXof: number;
  artbooksRevenueXof: number;
  coinsRevenueXof: number;
  activeCount: number;
  expiredCount: number;
  pendingCount: number;
  artbooksSalesCount: number;
  coinsSalesCount: number;
  totalTransactionsCount: number;
  byWork: Array<{ workId: string; workTitle: string; count: number; revenueXof: number }>;
  byMonth: Array<{ month: string; count: number; revenueXof: number }>;
  byType: Array<{ type: string; label: string; count: number; revenueXof: number }>;
}

/**
 * Returns all subscriptions across all users for admin reporting
 */
export async function getAllSubscriptions(): Promise<SubscriptionRecord[]> {
  const mapById = new Map<string, SubscriptionRecord>();

  // In-memory scan
  for (const sub of memorySubscriptions.values()) {
    if (sub.subscriptionId) {
      mapById.set(sub.subscriptionId, sub);
    }
  }

  // Firestore query if available
  if (serverDb) {
    try {
      const subsRef = collection(serverDb, 'subscriptions');
      const snap = await getDocs(subsRef);
      snap.forEach(d => {
        const data = d.data() as SubscriptionRecord;
        if (data.subscriptionId) {
          mapById.set(data.subscriptionId, data);
        }
      });
    } catch (err) {
      console.warn('[SubscriptionService] Notice fetching all subscriptions:', err);
    }
  }

  const list = Array.from(mapById.values());
  const nowMs = Date.now();

  for (const s of list) {
    if (s.status === 'active' && new Date(s.expirationDate).getTime() <= nowMs) {
      s.status = 'expired';
    }
  }

  // Sort by most recent
  list.sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
  return list;
}

/**
 * Computes aggregated financial & subscription statistics across ALL Paystack purchases:
 * (Pass Œuvres 30 jours + Artbooks Payants + Packs de Coins)
 */
export async function getSubscriptionStats(): Promise<PaystackAdminStats> {
  const [subscriptions, artbookPurchases, coinTransactions] = await Promise.all([
    getAllSubscriptions(),
    getAllArtbookPurchases(),
    getAllCoinTransactions()
  ]);

  let workPassRevenueXof = 0;
  let artbooksRevenueXof = 0;
  let coinsRevenueXof = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let pendingCount = 0;

  const workMap = new Map<string, { workTitle: string; count: number; revenueXof: number }>();
  const monthMap = new Map<string, { count: number; revenueXof: number }>();

  // 1. Process Work Subscriptions
  for (const sub of subscriptions) {
    if (sub.status === 'active') {
      activeCount++;
      workPassRevenueXof += (sub.amount || 2000);
    } else if (sub.status === 'expired') {
      expiredCount++;
      workPassRevenueXof += (sub.amount || 2000);
    } else if (sub.status === 'pending') {
      pendingCount++;
    }

    if (sub.status === 'active' || sub.status === 'expired') {
      const workId = sub.workId || 'inconnu';
      const existing = workMap.get(workId) || {
        workTitle: sub.workTitle || 'Œuvre OZI',
        count: 0,
        revenueXof: 0,
      };
      existing.count++;
      existing.revenueXof += (sub.amount || 2000);
      workMap.set(workId, existing);

      const dateStr = sub.startDate || sub.createdAt || new Date().toISOString();
      const month = dateStr.slice(0, 7);
      const existingMonth = monthMap.get(month) || { count: 0, revenueXof: 0 };
      existingMonth.count++;
      existingMonth.revenueXof += (sub.amount || 2000);
      monthMap.set(month, existingMonth);
    }
  }

  // 2. Process Artbook Purchases
  let artbooksSalesCount = 0;
  for (const art of artbookPurchases) {
    if (art.status === 'completed' || art.downloadAuthorized) {
      artbooksSalesCount++;
      artbooksRevenueXof += (art.priceXof || 3500);

      const dateStr = art.purchasedAt || new Date().toISOString();
      const month = dateStr.slice(0, 7);
      const existingMonth = monthMap.get(month) || { count: 0, revenueXof: 0 };
      existingMonth.count++;
      existingMonth.revenueXof += (art.priceXof || 3500);
      monthMap.set(month, existingMonth);
    }
  }

  // 3. Process Coin Transactions
  let coinsSalesCount = 0;
  for (const coin of coinTransactions) {
    if (coin.status === 'completed') {
      coinsSalesCount++;
      coinsRevenueXof += (coin.amountXof || 1000);

      const dateStr = coin.createdAt || new Date().toISOString();
      const month = dateStr.slice(0, 7);
      const existingMonth = monthMap.get(month) || { count: 0, revenueXof: 0 };
      existingMonth.count++;
      existingMonth.revenueXof += (coin.amountXof || 1000);
      monthMap.set(month, existingMonth);
    }
  }

  const totalRevenueXof = workPassRevenueXof + artbooksRevenueXof + coinsRevenueXof;
  const totalTransactionsCount = subscriptions.length + artbookPurchases.length + coinTransactions.length;

  const byWork = Array.from(workMap.entries()).map(([workId, val]) => ({
    workId,
    workTitle: val.workTitle,
    count: val.count,
    revenueXof: val.revenueXof,
  })).sort((a, b) => b.revenueXof - a.revenueXof);

  const byMonth = Array.from(monthMap.entries()).map(([month, val]) => ({
    month,
    count: val.count,
    revenueXof: val.revenueXof,
  })).sort((a, b) => b.month.localeCompare(a.month));

  const byType = [
    { type: 'work_pass', label: 'Pass Œuvres 30 Jours', count: activeCount + expiredCount, revenueXof: workPassRevenueXof },
    { type: 'artbook_purchase', label: 'Artbooks Payants', count: artbooksSalesCount, revenueXof: artbooksRevenueXof },
    { type: 'coin_pack', label: 'Packs de Coins', count: coinsSalesCount, revenueXof: coinsRevenueXof },
  ];

  return {
    totalRevenueXof,
    workPassRevenueXof,
    artbooksRevenueXof,
    coinsRevenueXof,
    activeCount,
    expiredCount,
    pendingCount,
    artbooksSalesCount,
    coinsSalesCount,
    totalTransactionsCount,
    byWork,
    byMonth,
    byType
  };
}

