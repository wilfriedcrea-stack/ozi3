import { SubscriptionRecord, PremiumAccessCheckResult, PaystackInitResponse } from '../types';

export interface InitiateSubscriptionParams {
  uid: string;
  workId: string;
  workTitle?: string;
  email?: string;
  amount?: number; // 2 000 FCFA
  currency?: string; // 'XOF'
}

/**
 * Initiates a 30-day Premium Subscription for a work via backend Paystack route
 */
export async function initiateWorkSubscription(
  params: InitiateSubscriptionParams
): Promise<PaystackInitResponse> {
  try {
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: params.uid,
        workId: params.workId,
        workTitle: params.workTitle,
        email: params.email,
        amount: params.amount || 2000,
        currency: params.currency || 'XOF',
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('[paystackClientService] Error initializing subscription:', err);
    return {
      success: false,
      message: err.message || 'Impossible de contacter le serveur de paiement.',
    };
  }
}

/**
 * Server-authoritative check: verifies if a reader has active 30-day Premium access to a work
 */
export async function checkWorkPremiumAccess(
  uid: string,
  workId: string
): Promise<PremiumAccessCheckResult> {
  try {
    const url = `/api/premium/check-access?uid=${encodeURIComponent(uid)}&workId=${encodeURIComponent(workId)}`;
    const response = await fetch(url, {
      headers: {
        'x-reader-uid': uid,
      },
    });

    if (!response.ok) {
      return {
        hasAccess: false,
        reason: 'no_subscription',
        serverTime: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return data as PremiumAccessCheckResult;
  } catch (err) {
    console.warn('[paystackClientService] Access check warning:', err);
    return {
      hasAccess: false,
      reason: 'no_subscription',
      serverTime: new Date().toISOString(),
    };
  }
}

/**
 * Fetches all subscriptions (active & expired) for a reader from the server
 */
export async function fetchUserSubscriptions(uid: string): Promise<SubscriptionRecord[]> {
  try {
    const response = await fetch(`/api/premium/user-subscriptions/${encodeURIComponent(uid)}`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (err) {
    console.warn('[paystackClientService] Fetch user subscriptions warning:', err);
    return [];
  }
}

/**
 * Sandbox / Test helper: activates 30-day access in development mode
 */
export async function simulateWorkSubscription(
  uid: string,
  workId: string,
  workTitle?: string
): Promise<{ success: boolean; subscription?: SubscriptionRecord; message?: string }> {
  try {
    const response = await fetch('/api/paystack/simulate-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, workId, workTitle }),
    });

    return await response.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Verifies Paystack transaction by reference upon redirect back to site
 */
export async function verifyPaystackPayment(
  reference: string,
  uid?: string,
  workId?: string
): Promise<{ success: boolean; verified: boolean; subscription?: SubscriptionRecord; message?: string }> {
  try {
    let url = `/api/paystack/verify/${encodeURIComponent(reference)}`;
    const params = new URLSearchParams();
    if (uid) params.append('uid', uid);
    if (workId) params.append('workId', workId);
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, verified: false, message: 'Échec de vérification du paiement.' };
    }

    return await response.json();
  } catch (err: any) {
    console.error('[paystackClientService] Verification error:', err);
    return { success: false, verified: false, message: err.message };
  }
}

export interface AdminStatsData {
  totalRevenueXof: number;
  activeCount: number;
  expiredCount: number;
  pendingCount: number;
  totalTransactionsCount: number;
  byWork: Array<{ workId: string; workTitle: string; count: number; revenueXof: number }>;
  byMonth: Array<{ month: string; count: number; revenueXof: number }>;
}

/**
 * Back-Office: Fetches all platform subscriptions for the Admin
 */
export async function fetchAdminSubscriptions(): Promise<SubscriptionRecord[]> {
  try {
    const res = await fetch('/api/paystack/admin/subscriptions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.subscriptions || [];
  } catch (err) {
    console.error('[paystackClientService] Error fetching admin subscriptions:', err);
    return [];
  }
}

/**
 * Back-Office: Fetches aggregated Paystack financial metrics
 */
export async function fetchAdminSubscriptionStats(): Promise<AdminStatsData | null> {
  try {
    const res = await fetch('/api/paystack/admin/stats');
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats || null;
  } catch (err) {
    console.error('[paystackClientService] Error fetching admin stats:', err);
    return null;
  }
}


