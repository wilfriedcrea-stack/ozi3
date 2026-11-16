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
  getSubscriptionStats,
  activateArtbookPurchase,
  hasArtbookAccess,
  getUserArtbookPurchases,
  getAllArtbookPurchases,
  activateCoinPackPurchase,
  getAllCoinTransactions
} from '../services/subscriptionService';

export const paystackRouter = Router();

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
      packName,
      coinsAmount,
      email, 
      amount, 
      currency, 
      callbackUrl 
    } = req.body;

    const paymentType = rawPaymentType || (artbookId ? 'artbook_purchase' : (packId ? 'coin_pack' : 'work_pass'));
    const targetId = rawTargetId || workId || artbookId || packId;

    if (!uid || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant lecteur (uid) et identifiant cible (workId / artbookId / packId) obligatoires.',
      });
    }

    const cleanEmail = (email || '').trim() || `${uid.slice(0, 10)}@reader.ozibd.net`;
    const numericAmount = Number(amount) || (paymentType === 'work_pass' ? 2000 : 3500);
    const validCurrency = (currency || 'XOF').toUpperCase();

    // 1. Call Paystack API
    const initResult = await initializePaystackTransaction({
      email: cleanEmail,
      amount: numericAmount,
      currency: validCurrency,
      uid,
      paymentType,
      targetId,
      workId,
      workTitle,
      artbookId,
      artbookTitle,
      artistName,
      packId,
      coinsAmount: Number(coinsAmount) || 0,
      callbackUrl,
    });

    if (!initResult.success || !initResult.reference) {
      return res.status(400).json(initResult);
    }

    // 2. Stage pending subscription if work_pass
    if (paymentType === 'work_pass') {
      await createPendingSubscription({
        uid,
        workId: targetId,
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
 * Secure Paystack Webhook endpoint
 * Validates x-paystack-signature using HMAC SHA512, parses event, and activates purchase
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
      const paymentType = metadata.paymentType || (metadata.artbookId ? 'artbook_purchase' : (metadata.packId ? 'coin_pack' : 'work_pass'));
      const reference = data?.reference;
      const rawAmount = data?.amount || 200000;
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
          console.log(`[paystackRouter] 🎨 Webhook activated Artbook "${artbookId}" for user "${uid}"`);
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
          console.log(`[paystackRouter] 🪙 Webhook credited coins pack "${packId}" for user "${uid}"`);
        }
      } else {
        // Default: work_pass (Pass 30 jours)
        const workId = metadata.workId || metadata.targetId;
        if (uid && workId) {
          const activeSub = await activateSubscription({
            paystackReference: reference || `ref_${Date.now()}`,
            uid,
            workId,
            amount,
            currency,
            customerEmail,
            workTitle: metadata.workTitle || metadata.title,
          });
          console.log(`[paystackRouter] ✅ Webhook activated Subscription for "${uid}" on work "${workId}". Expires: ${activeSub.expirationDate}`);
        }
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
 * Verifies a transaction reference after client redirect and activates purchase
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

    const uid = verifyResult.uid || queryUid;
    const paymentType = verifyResult.paymentType || queryType || (reference.includes('art') ? 'artbook_purchase' : (reference.includes('coin') ? 'coin_pack' : 'work_pass'));
    const targetId = verifyResult.targetId || queryTarget || verifyResult.workId || verifyResult.artbookId || verifyResult.packId;

    if (verifyResult.success && uid && targetId) {
      if (paymentType === 'artbook_purchase') {
        const purchase = await activateArtbookPurchase({
          paystackReference: reference,
          uid,
          artbookId: targetId,
          artbookTitle: verifyResult.artbookTitle,
          artistName: verifyResult.artistName,
          amount: verifyResult.amount || 3500,
          currency: verifyResult.currency || 'XOF',
          customerEmail: verifyResult.customerEmail || '',
        });
        return res.status(200).json({
          success: true,
          verified: true,
          paymentType: 'artbook_purchase',
          purchase,
          message: 'Artbook débloqué avec succès ! Téléchargement et galerie HD disponibles.'
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
          message: 'Pack de Coins crédité avec succès !'
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
 * GET /api/artbooks/check-access & /api/paystack/artbooks/check-access
 * Authoritative Server Check: hasArtbookAccess(uid, artbookId)
 */
paystackRouter.get(['/artbooks/check-access', '/check-access'], async (req: Request, res: Response) => {
  try {
    const uid = (req.query.uid as string) || (req.headers['x-reader-uid'] as string);
    const artbookId = req.query.artbookId as string;

    if (!uid || !artbookId) {
      return res.status(400).json({
        hasAccess: false,
        message: 'Paramètres uid et artbookId requis.'
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
 * Returns all paid artbooks for a reader
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

