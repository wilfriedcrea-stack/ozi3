import { SubscriptionRecord, PremiumAccessCheckResult, PaystackInitResponse } from '../types';
import { buildStudioAuthHeaders } from './studioSyncService';

export interface InitiateSubscriptionParams {
  uid: string;
  workId: string;
  workTitle?: string;
  email?: string;
  amount?: number; // 2 000 FCFA
  currency?: string; // 'XOF'
  callbackUrl?: string;
}

export interface PaystackAdminConfig {
  configured: boolean;
  mode: 'live' | 'test' | 'unconfigured';
  hasSecretKey: boolean;
  secretKeyMasked: string;
  publicKey: string;
  source: 'admin' | 'env' | 'none';
  webhookUrlSuggested: string;
  updatedAt: string | null;
}

export interface AdminStatsData {
  totalRevenueXof: number;
  workPassRevenueXof?: number;
  artbooksRevenueXof?: number;
  coinsRevenueXof?: number;
  activeCount: number;
  expiredCount: number;
  pendingCount: number;
  artbooksSalesCount?: number;
  coinsSalesCount?: number;
  totalTransactionsCount: number;
  byWork: Array<{ workId: string; workTitle: string; count: number; revenueXof: number }>;
  byMonth: Array<{ month: string; count: number; revenueXof: number }>;
  byType?: Array<{ type: string; label: string; count: number; revenueXof: number }>;
}

let detectedPaystackMode: 'node' | 'php' | null = null;

function isLikelyPhpHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase().includes('ozibd.net');
}

function getPreferredPaystackMode(): 'node' | 'php' {
  if (detectedPaystackMode) return detectedPaystackMode;
  return isLikelyPhpHost() ? 'php' : 'node';
}

async function fetchPaystackWithFallback(
  urls: { node: string; php: string },
  init: RequestInit = {},
  includeAdminAuth: boolean = false
): Promise<{ ok: boolean; status: number; json: any; unreachable: boolean }> {
  const firstMode = getPreferredPaystackMode();
  const secondMode: 'node' | 'php' = firstMode === 'node' ? 'php' : 'node';

  const attempt = async (mode: 'node' | 'php') => {
    const url = urls[mode];
    const baseHeaders: Record<string, string> = includeAdminAuth
      ? buildStudioAuthHeaders()
      : { 'Content-Type': 'application/json' };

    const resp = await fetch(url, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        ...baseHeaders,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');
    if (resp.status === 404 || (!isJson && resp.status !== 401)) {
      return { tryOther: true, ok: false, status: resp.status, json: null };
    }

    const json = await resp.json().catch(() => null);
    detectedPaystackMode = mode;
    return { tryOther: false, ok: resp.ok, status: resp.status, json };
  };

  try {
    const first = await attempt(firstMode);
    if (!first.tryOther) {
      return { ok: first.ok, status: first.status, json: first.json, unreachable: false };
    }
    const second = await attempt(secondMode);
    if (!second.tryOther) {
      return { ok: second.ok, status: second.status, json: second.json, unreachable: false };
    }
    return { ok: false, status: second.status, json: null, unreachable: true };
  } catch {
    return { ok: false, status: 0, json: null, unreachable: true };
  }
}

/**
 * Admin-only: fetches masked Paystack configuration status & public key
 */
export async function fetchAdminPaystackConfig(): Promise<{
  success: boolean;
  unauthorized?: boolean;
  config?: PaystackAdminConfig;
  error?: string;
}> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/admin/config',
      php: '/api/paystack.php?action=admin-config',
    },
    { method: 'GET' },
    true
  );

  if (res.status === 401) {
    return {
      success: false,
      unauthorized: true,
      error: res.json?.error || 'Session administrateur expirée. Veuillez vous reconnecter.',
    };
  }

  if (res.ok && res.json?.success && res.json?.config) {
    return { success: true, config: res.json.config as PaystackAdminConfig };
  }

  return {
    success: false,
    error: res.json?.error || 'Impossible de charger la configuration Paystack.',
  };
}

/**
 * Admin-only: saves Paystack secret/public keys securely on Node or LWS PHP
 */
export async function saveAdminPaystackConfig(payload: {
  secretKey?: string;
  publicKey?: string;
  clearSecret?: boolean;
}): Promise<{
  success: boolean;
  unauthorized?: boolean;
  config?: PaystackAdminConfig;
  error?: string;
}> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/admin/config',
      php: '/api/paystack.php?action=admin-config',
    },
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );

  if (res.status === 401) {
    return {
      success: false,
      unauthorized: true,
      error: res.json?.error || 'Session administrateur expirée. Veuillez vous reconnecter pour enregistrer vos clés.',
    };
  }

  if (res.ok && res.json?.success && res.json?.config) {
    return { success: true, config: res.json.config as PaystackAdminConfig };
  }

  return {
    success: false,
    error: res.json?.error || 'Erreur lors de l\'enregistrement des clés Paystack.',
  };
}

/**
 * Initiates a 30-day Premium Subscription for a work via backend Paystack route
 */
export async function initiateWorkSubscription(
  params: InitiateSubscriptionParams
): Promise<PaystackInitResponse> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/initialize',
      php: '/api/paystack.php?action=initialize',
    },
    {
      method: 'POST',
      body: JSON.stringify({
        uid: params.uid,
        paymentType: 'work_pass',
        targetId: params.workId,
        workId: params.workId,
        workTitle: params.workTitle,
        email: params.email,
        amount: params.amount || 2000,
        currency: params.currency || 'XOF',
        callbackUrl: params.callbackUrl,
      }),
    }
  );

  if (res.json) {
    return res.json as PaystackInitResponse;
  }

  return {
    success: false,
    message: 'Impossible de contacter le serveur de paiement Paystack.',
  };
}

/**
 * Server-authoritative check: verifies if a reader has active 30-day Premium access to a work
 */
export async function checkWorkPremiumAccess(
  uid: string,
  workId: string
): Promise<PremiumAccessCheckResult> {
  const q = `uid=${encodeURIComponent(uid)}&workId=${encodeURIComponent(workId)}`;
  const res = await fetchPaystackWithFallback(
    {
      node: `/api/premium/check-access?${q}`,
      php: `/api/paystack.php?action=check-access&${q}`,
    },
    {
      method: 'GET',
      headers: { 'x-reader-uid': uid },
    }
  );

  if (res.ok && res.json) {
    return res.json as PremiumAccessCheckResult;
  }

  return {
    hasAccess: false,
    reason: 'no_subscription',
    serverTime: new Date().toISOString(),
  };
}

/**
 * Fetches all subscriptions (active & expired) for a reader from the server
 */
export async function fetchUserSubscriptions(uid: string): Promise<SubscriptionRecord[]> {
  const res = await fetchPaystackWithFallback(
    {
      node: `/api/premium/user-subscriptions/${encodeURIComponent(uid)}`,
      php: `/api/paystack.php?action=user-subscriptions&uid=${encodeURIComponent(uid)}`,
    },
    { method: 'GET' }
  );

  if (res.ok && res.json?.subscriptions) {
    return res.json.subscriptions;
  }
  return [];
}

/**
 * Admin-only sandbox helper: activates 30-day access test entry in dashboard
 */
export async function simulateWorkSubscription(
  uid: string,
  workId: string,
  workTitle?: string
): Promise<{ success: boolean; subscription?: SubscriptionRecord; message?: string; error?: string }> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/simulate-success',
      php: '/api/paystack.php?action=simulate-success',
    },
    {
      method: 'POST',
      body: JSON.stringify({ uid, workId, workTitle }),
    },
    true
  );

  if (res.json) {
    return res.json;
  }
  return { success: false, message: 'Action impossible pour le moment.' };
}

/**
 * Verifies Paystack transaction by reference (supports work_pass, artbook_purchase, coin_pack)
 */
export async function verifyPaystackPayment(
  reference: string,
  uid?: string,
  targetId?: string,
  paymentType?: 'work_pass' | 'artbook_purchase' | 'coin_pack'
): Promise<{
  success: boolean;
  verified: boolean;
  status?: string;
  paymentType?: string;
  subscription?: SubscriptionRecord;
  purchase?: any;
  message?: string;
}> {
  const params = new URLSearchParams();
  if (uid) params.append('uid', uid);
  if (targetId) {
    if (paymentType === 'artbook_purchase') {
      params.append('target', targetId);
    } else {
      params.append('workId', targetId);
      params.append('target', targetId);
    }
  }
  if (paymentType) params.append('type', paymentType);
  const qs = params.toString();

  const res = await fetchPaystackWithFallback(
    {
      node: `/api/paystack/verify/${encodeURIComponent(reference)}${qs ? `?${qs}` : ''}`,
      php: `/api/paystack.php?action=verify&reference=${encodeURIComponent(reference)}${qs ? `&${qs}` : ''}`,
    },
    { method: 'GET' }
  );

  if (res.json) {
    return res.json;
  }

  return {
    success: false,
    verified: false,
    message: 'Échec de vérification du paiement.',
  };
}

/**
 * Initiates an Artbook purchase via backend Paystack
 */
export async function initiateArtbookPurchase(params: {
  uid: string;
  artbookId: string;
  artbookTitle: string;
  artistName?: string;
  email: string;
  name?: string;
  phone?: string;
  amount: number;
  callbackUrl?: string;
}): Promise<PaystackInitResponse> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/initialize',
      php: '/api/paystack.php?action=initialize',
    },
    {
      method: 'POST',
      body: JSON.stringify({
        uid: params.uid,
        paymentType: 'artbook_purchase',
        targetId: params.artbookId,
        artbookId: params.artbookId,
        artbookTitle: params.artbookTitle,
        artistName: params.artistName,
        email: params.email,
        customerName: params.name,
        amount: params.amount,
        currency: 'XOF',
        callbackUrl: params.callbackUrl,
      }),
    }
  );

  if (res.json) {
    return res.json as PaystackInitResponse;
  }

  return {
    success: false,
    message: 'Impossible de contacter le serveur de paiement.',
  };
}

/**
 * Checks if reader has paid for and unlocked access to a specific artbook
 */
export async function checkArtbookAccess(uid: string, artbookId: string): Promise<{
  hasAccess: boolean;
  purchase?: any;
}> {
  const q = `uid=${encodeURIComponent(uid)}&artbookId=${encodeURIComponent(artbookId)}`;
  const res = await fetchPaystackWithFallback(
    {
      node: `/api/artbooks/check-access?${q}`,
      php: `/api/paystack.php?action=check-access&${q}`,
    },
    {
      method: 'GET',
      headers: { 'x-reader-uid': uid },
    }
  );

  if (res.ok && res.json) {
    return res.json;
  }
  return { hasAccess: false };
}

/**
 * Fetches all artbook purchases made by a reader
 */
export async function fetchUserArtbookPurchases(uid: string): Promise<any[]> {
  const res = await fetchPaystackWithFallback(
    {
      node: `/api/artbooks/user-purchases/${encodeURIComponent(uid)}`,
      php: `/api/paystack.php?action=user-purchases&uid=${encodeURIComponent(uid)}`,
    },
    { method: 'GET' }
  );

  if (res.ok && res.json?.purchases) {
    return res.json.purchases;
  }
  return [];
}

/**
 * Recovers all confirmed artbook purchases made with a given email address (any device)
 */
export async function fetchArtbookPurchasesByEmail(email: string): Promise<{
  success: boolean;
  purchases: any[];
  message?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetchPaystackWithFallback(
    {
      node: `/api/artbooks/purchases-by-email?email=${encodeURIComponent(cleanEmail)}`,
      php: `/api/paystack.php?action=purchases-by-email&email=${encodeURIComponent(cleanEmail)}`,
    },
    { method: 'GET' }
  );

  if (res.ok && res.json?.success) {
    return {
      success: true,
      purchases: Array.isArray(res.json.purchases) ? res.json.purchases : [],
    };
  }

  return {
    success: false,
    purchases: [],
    message: res.json?.message || res.json?.error || 'Impossible de rechercher vos achats pour le moment.',
  };
}

/**
 * Initiates Coin Pack purchase via backend Paystack
 */
export async function initiateCoinPackPurchase(params: {
  uid: string;
  packId: string;
  packName: string;
  coinsAmount: number;
  amount: number;
  email: string;
}): Promise<PaystackInitResponse> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/initialize',
      php: '/api/paystack.php?action=initialize',
    },
    {
      method: 'POST',
      body: JSON.stringify({
        uid: params.uid,
        paymentType: 'coin_pack',
        targetId: params.packId,
        packId: params.packId,
        packName: params.packName,
        coinsAmount: params.coinsAmount,
        amount: params.amount,
        email: params.email,
        currency: 'XOF',
      }),
    }
  );

  if (res.json) {
    return res.json as PaystackInitResponse;
  }

  return {
    success: false,
    message: 'Impossible de joindre la passerelle Paystack.',
  };
}

/**
 * Back-Office: Fetches all platform subscriptions for the Admin
 */
export async function fetchAdminSubscriptions(): Promise<SubscriptionRecord[]> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/admin/subscriptions',
      php: '/api/paystack.php?action=admin-subscriptions',
    },
    { method: 'GET' },
    true
  );

  if (res.ok && res.json?.subscriptions) {
    return res.json.subscriptions;
  }
  return [];
}

/**
 * Back-Office: Fetches aggregated Paystack financial metrics
 */
export async function fetchAdminSubscriptionStats(): Promise<AdminStatsData | null> {
  const res = await fetchPaystackWithFallback(
    {
      node: '/api/paystack/admin/stats',
      php: '/api/paystack.php?action=admin-stats',
    },
    { method: 'GET' },
    true
  );

  if (res.ok && res.json?.stats) {
    return res.json.stats;
  }
  return null;
}
