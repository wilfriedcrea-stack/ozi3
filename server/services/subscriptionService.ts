import { SubscriptionRecord, SubscriptionStatus, PremiumAccessCheckResult } from '../../src/types';
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
  activeCount: number;
  expiredCount: number;
  pendingCount: number;
  totalTransactionsCount: number;
  byWork: Array<{ workId: string; workTitle: string; count: number; revenueXof: number }>;
  byMonth: Array<{ month: string; count: number; revenueXof: number }>;
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
 * Computes aggregated financial & subscription statistics for the Admin Dashboard
 */
export async function getSubscriptionStats(): Promise<PaystackAdminStats> {
  const subscriptions = await getAllSubscriptions();

  let totalRevenueXof = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let pendingCount = 0;

  const workMap = new Map<string, { workTitle: string; count: number; revenueXof: number }>();
  const monthMap = new Map<string, { count: number; revenueXof: number }>();

  for (const sub of subscriptions) {
    if (sub.status === 'active') {
      activeCount++;
      totalRevenueXof += (sub.amount || 2000);
    } else if (sub.status === 'expired') {
      expiredCount++;
      totalRevenueXof += (sub.amount || 2000);
    } else if (sub.status === 'pending') {
      pendingCount++;
    }

    // Work breakdown (for paid transactions)
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

      // Month breakdown
      const dateStr = sub.startDate || sub.createdAt || new Date().toISOString();
      const month = dateStr.slice(0, 7); // 'YYYY-MM'
      const existingMonth = monthMap.get(month) || { count: 0, revenueXof: 0 };
      existingMonth.count++;
      existingMonth.revenueXof += (sub.amount || 2000);
      monthMap.set(month, existingMonth);
    }
  }

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

  return {
    totalRevenueXof,
    activeCount,
    expiredCount,
    pendingCount,
    totalTransactionsCount: subscriptions.length,
    byWork,
    byMonth,
  };
}

