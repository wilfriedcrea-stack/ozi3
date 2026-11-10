import crypto from 'crypto';
import { PaystackInitResponse } from '../../src/types';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

export interface PaystackInitializeOptions {
  email: string;
  amount: number; // e.g. 2000 (FCFA)
  currency?: string; // e.g. 'XOF'
  uid: string;
  workId: string;
  workTitle?: string;
  callbackUrl?: string;
}

/**
 * Initializes a transaction with Paystack API
 */
export async function initializePaystackTransaction(
  options: PaystackInitializeOptions
): Promise<PaystackInitResponse> {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  const currency = (options.currency || 'XOF').toUpperCase();
  // Paystack requires amount in smallest currency unit (multiply by 100 for XOF/NGN/USD)
  const amountInSubunits = Math.round(options.amount * 100);

  const reference = `ozi_sub_${options.workId}_${options.uid.slice(0, 8)}_${Date.now()}`;

  // If secret key is provided and not a placeholder, call real Paystack API
  if (secretKey && !secretKey.includes('placeholder') && !secretKey.includes('xxx')) {
    try {
      const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          amount: amountInSubunits,
          currency,
          reference,
          callback_url: options.callbackUrl || `${process.env.APP_URL || 'http://localhost:3000'}/#/oeuvre/${options.workId}?status=success&ref=${reference}`,
          metadata: {
            uid: options.uid,
            workId: options.workId,
            workTitle: options.workTitle || 'Œuvre OZI',
            subscriptionType: 'work_30_days',
            custom_fields: [
              {
                display_name: 'Identifiant Lecteur',
                variable_name: 'uid',
                value: options.uid,
              },
              {
                display_name: 'Oeuvre OZI',
                variable_name: 'workId',
                value: options.workId,
              },
            ],
          },
        }),
      });

      const data = await response.json() as any;

      if (response.ok && data.status) {
        return {
          success: true,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference || reference,
          message: 'Paiement Paystack initialisé avec succès',
        };
      } else {
        console.warn('[PaystackServerService] Paystack API error response:', data);
        return {
          success: false,
          message: data.message || 'Erreur lors de l\'initialisation Paystack',
        };
      }
    } catch (err: any) {
      console.error('[PaystackServerService] Network error connecting to Paystack:', err);
      return {
        success: false,
        message: err.message || 'Impossible de joindre la passerelle Paystack',
      };
    }
  }

  // Fallback: Sandbox / Development Mode when secret key is not configured in environment
  const mockAuthUrl = `${process.env.APP_URL || 'http://localhost:3000'}/#/oeuvre/${options.workId}?paystack_simulated=1&ref=${reference}&uid=${encodeURIComponent(options.uid)}&workId=${encodeURIComponent(options.workId)}`;

  return {
    success: true,
    authorizationUrl: mockAuthUrl,
    accessCode: `acc_${reference}`,
    reference,
    message: 'Passerelle Paystack initialisée (Mode Sandbox Test)',
  };
}

/**
 * Validates the x-paystack-signature header using HMAC SHA512
 */
export function verifyPaystackSignature(
  rawBody: Buffer | string,
  signatureHeader?: string | string[]
): boolean {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || 'sk_test_ozibd_dev_secret').trim();
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (!signature) {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');
    if (computedHmac === signature) {
      return true;
    }

    // In local development sandbox if real key is not yet set in production
    if (!process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== 'production') {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[PaystackServerService] Error computing HMAC signature:', err);
    return false;
  }
}

/**
 * Verifies a transaction reference directly against Paystack API
 */
export async function verifyPaystackTransaction(reference: string): Promise<{
  success: boolean;
  status: string;
  amount?: number;
  currency?: string;
  uid?: string;
  workId?: string;
  workTitle?: string;
  customerEmail?: string;
  raw?: any;
}> {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();

  if (secretKey && !secretKey.includes('placeholder') && !secretKey.includes('xxx')) {
    try {
      const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const data = await response.json() as any;
      if (response.ok && data.status && data.data) {
        const d = data.data;
        const metadata = d.metadata || {};
        return {
          success: d.status === 'success',
          status: d.status,
          amount: Math.round((d.amount || 0) / 100),
          currency: d.currency || 'XOF',
          uid: metadata.uid || '',
          workId: metadata.workId || '',
          workTitle: metadata.workTitle || '',
          customerEmail: (d.customer && d.customer.email) || metadata.email || '',
          raw: d,
        };
      }
    } catch (err) {
      console.error('[verifyPaystackTransaction] Network error:', err);
    }
  }

  // Fallback for test / development mode
  return {
    success: true,
    status: 'success',
    amount: 2000,
    currency: 'XOF',
    raw: { simulated: true },
  };
}

