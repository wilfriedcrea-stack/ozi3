import { Router, Request, Response } from 'express';
import {
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
  getPaystackConfigSummary,
  savePaystackConfig,
} from '../services/paystackServerService';
import {
  createPendingSubscription,
  activateSubscription,
  hasValidAccess,
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionStats,
  activateArtbookPurchase,
  hasArtbookAccess,
  getUserArtbookPurchases,
  activateCoinPackPurchase,
} from '../services/subscriptionService';
import { isAdminAuthorized, readStudioDataFile } from './studioDataRoutes';

export const paystackRouter = Router();

function getRequestOrigin(req: Request): string {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000').split(',')[0].trim();
  return `${proto}://${host}`;
}

function resolveAuthoritativePrice(paymentType: string, targetId: string, fallbackAmount: number): number {
  if (paymentType === 'artbook_purchase') {
    const studioData = readStudioDataFile();
    const artbooks = Array.isArray(studioData.artbooks) ? (studioData.artbooks as any[]) : [];
    const found = artbooks.find(a => a && (a.id === targetId || a.slug === targetId));
    if (found && typeof found.price === 'number' && found.price > 0) {
      return Math.round(found.price);
    }
  }
  return Math.max(100, Math.round(fallbackAmount));
}

/**
 * GET /api/paystack/admin/config
 * Admin-only: returns masked Paystack status & public key (never raw secret key)
 */
paystackRouter.get('/admin/config', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise.' });
  }
  return res.status(200).json({
    success: true,
    config: getPaystackConfigSummary(getRequestOrigin(req)),
  });
});

/**
 * POST /api/paystack/admin/config
 * Admin-only: saves Paystack secret/public keys securely on server
 */
paystackRouter.post('/admin/config', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise.' });
  }

  const secretKey = typeof req.body?.secretKey === 'string' ? req.body.secretKey : undefined;
  const publicKey = typeof req.body?.publicKey === 'string' ? req.body.publicKey : undefined;
  const clearSecret = Boolean(req.body?.clearSecret);

  const result = savePaystackConfig({ secretKey, publicKey, clearSecret });
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  return res.status(200).json({
    success: true,
    config: getPaystackConfigSummary(getRequestOrigin(req)),
  });
});

/**
 * POST /api/paystack/initialize
 * Initiates a Paystack transaction for:
 * 1. Work Pass 30 days ('work_pass')
 * 2. Artbook Purchase ('artbook_purchase')
 * 3. Coin Pack ('coin_pack')
 */
paystackRouter.post('/initialize', async (req: Request, res: Response) => {
  try {
    const {
      uid,
      paymentType: rawPaymentType,
      targetId: rawTargetId,
      workId,
      workTitle,
      artbookId,
      artbookTitle,
      artistName,
      packId,
      coinsAmount,
      email,
      amount,
      currency,
      callbackUrl,
    } = req.body;

    const paymentType = rawPaymentType || (artbookId ? 'artbook_purchase' : (packId ? 'coin_pack' : 'work_pass'));
    const targetId = rawTargetId || workId || artbookId || packId;

    if (!uid || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant lecteur (uid) et identifiant cible (workId / artbookId / packId) obligatoires.',
      });
    }

    const cleanEmail = (email || '').trim() || `${String(uid).slice(0, 10)}@reader.ozibd.net`;
    const fallbackAmount = Number(amount) || (paymentType === 'work_pass' ? 2000 : 3500);
    const numericAmount = resolveAuthoritativePrice(paymentType, String(targetId), fallbackAmount);
    const validCurrency = (currency || 'XOF').toUpperCase();

    const initResult = await initializePaystackTransaction({
      email: cleanEmail,
      amount: numericAmount,
      currency: validCurrency,
      uid: String(uid),
      paymentType,
      targetId: String(targetId),
      workId,
      workTitle,
      artbookId,
      artbookTitle,
      artistName,
      packId,
      coinsAmount: Number(coinsAmount) || 0,
      callbackUrl,
      originUrl: getRequestOrigin(req),
    });

    if (!initResult.success || !initResult.reference) {
      return res.status(400).json(initResult);
    }

    if (paymentType === 'work_pass') {
      await createPendingSubscription({
        uid: String(uid),
        workId: String(targetId),
        workTitle,
        amount: numericAmount,
        currency: validCurrency,
        paystackReference: initResult.reference,
        customerEmail: cleanEmail,
      });
    }

    return res.status(200).json(initResult);
  } catch (err: any) {
    console.error('[paystackRouter] Error in /initialize:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Erreur lors de l\'initialisation du paiement Paystack.',
    });
  }
});

/**
 * POST /api/paystack/webhook
 * Validates x-paystack-signature using HMAC SHA512, parses event, and activates purchase
 */
paystackRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    const rawBody = (req as any).rawBody || (Buffer.isBuffer(req.body)
      ? req.body
      : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {}))));

    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[paystackRouter] Invalid Paystack Webhook signature received');
      return res.status(401).json({ status: 'error', message: 'Signature Paystack invalide' });
    }

    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      eventPayload = req.body;
    }

    const eventName = eventPayload?.event;

    if (eventName === 'charge.success') {
      const data = eventPayload.data;
      const metadata = data?.metadata || {};

      const uid = metadata.uid;
      const paymentType = metadata.paymentType || (metadata.artbookId ? 'artbook_purchase' : (metadata.packId ? 'coin_pack' : 'work_pass'));
      const reference = data?.reference;
      const rawAmount = data?.amount || 0;
      const amount = Math.round(rawAmount / 100);
      const currency = data?.currency || 'XOF';
      const customerEmail = data?.customer?.email || metadata.email || '';

      if (paymentType === 'artbook_purchase') {
        const artbookId = metadata.artbookId || metadata.targetId;
        if (uid && artbookId) {
          await activateArtbookPurchase({
            paystackReference: reference || `art_ref_${Date.now()}`,
            uid,
            artbookId,
            artbookTitle: metadata.artbookTitle || metadata.title,
            artistName: metadata.artistName,
            amount,
            currency,
            customerEmail,
          });
        }
      } else if (paymentType === 'coin_pack') {
        const packId = metadata.packId || metadata.targetId;
        if (uid && packId) {
          await activateCoinPackPurchase({
            paystackReference: reference || `coin_ref_${Date.now()}`,
            uid,
            packId,
            packName: metadata.packName || metadata.title,
            coinsAmount: Number(metadata.coinsAmount) || 50,
            amount,
            currency,
            customerEmail,
          });
        }
      } else {
        const workId = metadata.workId || metadata.targetId;
        if (uid && workId) {
          await activateSubscription({
            paystackReference: reference || `ref_${Date.now()}`,
            uid,
            workId,
            amount,
            currency,
            customerEmail,
            workTitle: metadata.workTitle || metadata.title,
          });
        }
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error('[paystackRouter] Webhook handling error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * GET /api/paystack/verify/:reference
 * Verifies a transaction reference strictly against Paystack API and activates purchase
 */
paystackRouter.get('/verify/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const queryUid = (req.query.uid as string) || (req.headers['x-reader-uid'] as string);
    const queryType = req.query.type as string;
    const queryTarget = req.query.target as string;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Référence Paystack requise.' });
    }

    const verifyResult = await verifyPaystackTransaction(reference);

    if (!verifyResult.success) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: verifyResult.status,
        message: verifyResult.status === 'unconfigured'
          ? 'Passerelle Paystack non configurée.'
          : 'Paiement non encore validé ou en attente.',
      });
    }

    const uid = verifyResult.uid || queryUid;
    const paymentType = verifyResult.paymentType || queryType;
    const targetId = verifyResult.targetId || queryTarget || verifyResult.workId || verifyResult.artbookId || verifyResult.packId;

    if (!uid || !targetId || !paymentType) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Métadonnées de transaction incomplètes.',
      });
    }

    const expectedPrice = resolveAuthoritativePrice(paymentType, targetId, verifyResult.amount || 0);
    if ((verifyResult.amount || 0) < expectedPrice) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Montant réglé insuffisant pour cet article.',
      });
    }

    if (paymentType === 'artbook_purchase') {
      const purchase = await activateArtbookPurchase({
        paystackReference: reference,
        uid,
        artbookId: targetId,
        artbookTitle: verifyResult.artbookTitle,
        artistName: verifyResult.artistName,
        amount: verifyResult.amount || expectedPrice,
        currency: verifyResult.currency || 'XOF',
        customerEmail: verifyResult.customerEmail || '',
      });
      return res.status(200).json({
        success: true,
        verified: true,
        paymentType: 'artbook_purchase',
        purchase,
        message: 'Artbook débloqué avec succès !',
      });
    } else if (paymentType === 'coin_pack') {
      const coinTx = await activateCoinPackPurchase({
        paystackReference: reference,
        uid,
        packId: targetId,
        packName: verifyResult.workTitle,
        coinsAmount: verifyResult.coinsAmount || 50,
        amount: verifyResult.amount || 1000,
        currency: verifyResult.currency || 'XOF',
        customerEmail: verifyResult.customerEmail || '',
      });
      return res.status(200).json({
        success: true,
        verified: true,
        paymentType: 'coin_pack',
        coinTx,
        message: 'Pack de Coins crédité avec succès !',
      });
    } else {
      const activeSub = await activateSubscription({
        paystackReference: reference,
        uid,
        workId: targetId,
        amount: verifyResult.amount || 2000,
        currency: verifyResult.currency || 'XOF',
        customerEmail: verifyResult.customerEmail || '',
        workTitle: verifyResult.workTitle || '',
      });

      return res.status(200).json({
        success: true,
        verified: true,
        paymentType: 'work_pass',
        subscription: activeSub,
        message: 'Abonnement 30 jours confirmé et actif !',
      });
    }
  } catch (err: any) {
    console.error('[paystackRouter] Error in /verify/:reference:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/artbooks/check-access & /api/paystack/artbooks/check-access
 */
paystackRouter.get(['/artbooks/check-access', '/check-access'], async (req: Request, res: Response) => {
  try {
    const uid = (req.query.uid as string) || (req.headers['x-reader-uid'] as string);
    const artbookId = req.query.artbookId as string;
    const workId = req.query.workId as string;

    if (workId && uid) {
      const workRes = await hasValidAccess(uid, workId);
      return res.status(200).json(workRes);
    }

    if (!uid || !artbookId) {
      return res.status(400).json({
        hasAccess: false,
        message: 'Paramètres uid et artbookId requis.',
      });
    }

    const result = await hasArtbookAccess(uid, artbookId);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[paystackRouter] Error in /artbooks/check-access:', err);
    return res.status(500).json({ hasAccess: false, error: err.message });
  }
});

/**
 * GET /api/artbooks/user-purchases/:uid & /api/paystack/artbooks/user-purchases/:uid
 */
paystackRouter.get(['/artbooks/user-purchases/:uid', '/user-purchases/:uid'], async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'UID manquant' });

    const purchases = await getUserArtbookPurchases(uid);
    return res.status(200).json({ success: true, purchases });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/premium/user-subscriptions/:uid
 */
paystackRouter.get('/user-subscriptions/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ error: 'UID manquant' });
    }

    const subscriptions = await getUserSubscriptions(uid);
    return res.status(200).json({
      success: true,
      subscriptions,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /user-subscriptions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/paystack/simulate-success
 * Admin-only sandbox helper to test a 30-day subscription entry in dashboard
 */
paystackRouter.post('/simulate-success', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Action réservée à l\'administrateur connecté.' });
  }

  try {
    const { uid, workId, workTitle, amount } = req.body;
    if (!uid || !workId) {
      return res.status(400).json({ error: 'uid and workId are required' });
    }

    const reference = `sim_${Date.now()}`;
    const sub = await activateSubscription({
      paystackReference: reference,
      uid,
      workId,
      amount: Number(amount) || 2000,
      currency: 'XOF',
      workTitle: workTitle || 'Œuvre OZI',
    });

    return res.status(200).json({
      success: true,
      subscription: sub,
      message: 'Abonnement test activé côté admin.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/paystack/admin/subscriptions
 * Admin-only: returns all subscription records across the platform
 */
paystackRouter.get('/admin/subscriptions', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise.' });
  }
  try {
    const subscriptions = await getAllSubscriptions();
    return res.status(200).json({
      success: true,
      subscriptions,
      count: subscriptions.length,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /admin/subscriptions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/paystack/admin/stats
 * Admin-only: returns aggregated financial stats
 */
paystackRouter.get('/admin/stats', async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise.' });
  }
  try {
    const stats = await getSubscriptionStats();
    return res.status(200).json({
      success: true,
      stats,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /admin/stats:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
