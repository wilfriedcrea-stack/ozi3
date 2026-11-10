import { Router, Request, Response } from 'express';
import { 
  initializePaystackTransaction, 
  verifyPaystackSignature,
  verifyPaystackTransaction
} from '../services/paystackServerService';
import { 
  createPendingSubscription, 
  activateSubscription, 
  hasValidAccess, 
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionStats
} from '../services/subscriptionService';

export const paystackRouter = Router();

/**
 * POST /api/paystack/initialize
 * Initiates a 30-day Premium Subscription payment via Paystack for a specific work
 */
paystackRouter.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { uid, workId, workTitle, email, amount, currency, callbackUrl } = req.body;

    if (!uid || !workId) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant lecteur (uid) et identifiant d’œuvre (workId) obligatoires.',
      });
    }

    const cleanEmail = (email || '').trim() || `${uid.slice(0, 10)}@reader.ozibd.net`;
    const numericAmount = Number(amount) || 2000; // Default 2 000 FCFA
    const validCurrency = (currency || 'XOF').toUpperCase();

    // 1. Call Paystack API
    const initResult = await initializePaystackTransaction({
      email: cleanEmail,
      amount: numericAmount,
      currency: validCurrency,
      uid,
      workId,
      workTitle,
      callbackUrl,
    });

    if (!initResult.success || !initResult.reference) {
      return res.status(400).json(initResult);
    }

    // 2. Stage pending subscription in storage
    await createPendingSubscription({
      uid,
      workId,
      workTitle,
      amount: numericAmount,
      currency: validCurrency,
      paystackReference: initResult.reference,
      customerEmail: cleanEmail,
    });

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
 * Secure Paystack Webhook endpoint
 * Validates x-paystack-signature using HMAC SHA512, parses event, and activates 30-day access
 */
paystackRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    
    // Pristine raw body buffer from express.json verify hook
    const rawBody = (req as any).rawBody || (Buffer.isBuffer(req.body) 
      ? req.body 
      : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {}))));

    // 1. Signature Verification
    const isValid = verifyPaystackSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[paystackRouter] ⚠️ Invalid Paystack Webhook signature received!');
      return res.status(401).json({ status: 'error', message: 'Signature Paystack invalide' });
    }

    // 2. Parse event payload
    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      eventPayload = req.body;
    }

    const eventName = eventPayload?.event;
    console.log(`[paystackRouter] 🔔 Paystack Webhook received event: "${eventName}"`);

    // 3. Process charge.success
    if (eventName === 'charge.success') {
      const data = eventPayload.data;
      const metadata = data?.metadata || {};

      const uid = metadata.uid;
      const workId = metadata.workId;
      const reference = data?.reference;
      const rawAmount = data?.amount || 200000;
      const amount = Math.round(rawAmount / 100);
      const currency = data?.currency || 'XOF';
      const customerEmail = data?.customer?.email || metadata.email || '';
      const workTitle = metadata.workTitle || '';

      if (uid && workId) {
        // Authoritative server-side activation: startDate = SERVER_NOW, expirationDate = SERVER_NOW + 30 days
        const activeSub = await activateSubscription({
          paystackReference: reference || `ref_${Date.now()}`,
          uid,
          workId,
          amount,
          currency,
          customerEmail,
          workTitle,
        });

        console.log(`[paystackRouter] ✅ Subscription activated for user "${uid}" on work "${workId}". Expires: ${activeSub.expirationDate}`);
      } else {
        console.warn('[paystackRouter] Warning: charge.success missing uid or workId metadata:', metadata);
      }
    }

    // Always acknowledge 200 OK to Paystack
    return res.status(200).json({ status: 'success' });
  } catch (err: any) {
    console.error('[paystackRouter] Webhook handling error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * GET /api/paystack/verify/:reference
 * Verifies a transaction reference after client redirect and activates subscription
 */
paystackRouter.get('/verify/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const queryUid = (req.query.uid as string) || (req.headers['x-reader-uid'] as string);
    const queryWorkId = req.query.workId as string;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Référence Paystack requise.' });
    }

    const verifyResult = await verifyPaystackTransaction(reference);

    const uid = verifyResult.uid || queryUid;
    const workId = verifyResult.workId || queryWorkId;

    if (verifyResult.success && uid && workId) {
      const activeSub = await activateSubscription({
        paystackReference: reference,
        uid,
        workId,
        amount: verifyResult.amount || 2000,
        currency: verifyResult.currency || 'XOF',
        customerEmail: verifyResult.customerEmail || '',
        workTitle: verifyResult.workTitle || '',
      });

      return res.status(200).json({
        success: true,
        verified: true,
        subscription: activeSub,
        message: 'Abonnement 30 jours confirmé et actif !',
      });
    }

    return res.status(200).json({
      success: verifyResult.success,
      verified: verifyResult.status === 'success',
      status: verifyResult.status,
      message: verifyResult.success ? 'Paiement vérifié avec succès' : 'Paiement non finalisé ou en attente',
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /verify/:reference:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/premium/check-access
 * Authoritative Server Check: hasValidAccess(uid, workId)
 */
paystackRouter.get('/check-access', async (req: Request, res: Response) => {
  try {
    const uid = (req.query.uid as string) || (req.headers['x-reader-uid'] as string);
    const workId = req.query.workId as string;

    if (!uid || !workId) {
      return res.status(400).json({
        hasAccess: false,
        reason: 'invalid_params',
        message: 'Paramètres uid et workId requis.',
        serverTime: new Date().toISOString()
      });
    }

    const result = await hasValidAccess(uid, workId);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[paystackRouter] Error in /check-access:', err);
    return res.status(500).json({
      hasAccess: false,
      reason: 'server_error',
      serverTime: new Date().toISOString()
    });
  }
});

/**
 * GET /api/premium/user-subscriptions/:uid
 * Returns all active & past subscriptions for a reader
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
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /user-subscriptions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/paystack/simulate-success
 * Development sandbox helper to simulate a successful 30-day subscription activation
 */
paystackRouter.post('/simulate-success', async (req: Request, res: Response) => {
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
      workTitle: workTitle || 'Œuvre OZI'
    });

    return res.status(200).json({
      success: true,
      subscription: sub,
      message: 'Abonnement 30 jours activé en simulation !'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/paystack/admin/subscriptions
 * Back-Office Admin: returns all subscription records across the platform
 */
paystackRouter.get('/admin/subscriptions', async (_req: Request, res: Response) => {
  try {
    const subscriptions = await getAllSubscriptions();
    return res.status(200).json({
      success: true,
      subscriptions,
      count: subscriptions.length,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /admin/subscriptions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/paystack/admin/stats
 * Back-Office Admin: returns aggregated financial stats (revenue, active/expired, by work, by month)
 */
paystackRouter.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getSubscriptionStats();
    return res.status(200).json({
      success: true,
      stats,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[paystackRouter] Error in /admin/stats:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

