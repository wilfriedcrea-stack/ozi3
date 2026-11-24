import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PaystackInitResponse } from '../../src/types';
import { DATA_DIR, ensureDataDir, safeResolveInDataDir } from '../routes/studioDataRoutes';

const PAYSTACK_API_BASE = 'https://api.paystack.co';
const PAYSTACK_CONFIG_FILE = path.join(DATA_DIR, 'paystack-config.json');

export interface PaystackInitializeOptions {
  email: string;
  amount: number; // e.g. 2000 (FCFA)
  currency?: string; // e.g. 'XOF'
  uid: string;
  paymentType?: 'work_pass' | 'artbook_purchase' | 'coin_pack';
  targetId?: string; // workId, artbookId, or packId
  title?: string;
  workId?: string;
  workTitle?: string;
  artbookId?: string;
  artbookTitle?: string;
  artistName?: string;
  packId?: string;
  coinsAmount?: number;
  customerName?: string;
  callbackUrl?: string;
  originUrl?: string;
}

export interface PaystackConfigSummary {
  configured: boolean;
  mode: 'live' | 'test' | 'unconfigured';
  hasSecretKey: boolean;
  secretKeyMasked: string;
  publicKey: string;
  source: 'admin' | 'env' | 'none';
  webhookUrlSuggested: string;
  updatedAt: string | null;
}

interface StoredPaystackConfig {
  secretKey?: string;
  publicKey?: string;
  updatedAt?: string;
}

function isPlaceholderKey(val: string): boolean {
  const lower = val.toLowerCase();
  return !val || lower.includes('placeholder') || lower.includes('xxx') || lower === 'sk_test_ozibd_dev_secret';
}

function isValidSecretKeyFormat(val: string): boolean {
  return /^sk_(live|test)_[A-Za-z0-9_-]{8,}$/.test(val) && !isPlaceholderKey(val);
}

function isValidPublicKeyFormat(val: string): boolean {
  return /^pk_(live|test)_[A-Za-z0-9_-]{8,}$/.test(val) && !isPlaceholderKey(val);
}

function readStoredPaystackConfig(): StoredPaystackConfig {
  try {
    const file = safeResolveInDataDir(PAYSTACK_CONFIG_FILE);
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        return parsed as StoredPaystackConfig;
      }
    }
  } catch (err) {
    console.warn('[PaystackServerService] Failed reading paystack-config.json:', err);
  }
  return {};
}

function resolvePaystackCredentials(): {
  secretKey: string;
  publicKey: string;
  source: 'admin' | 'env' | 'none';
  updatedAt: string | null;
} {
  const stored = readStoredPaystackConfig();
  const storedSecret = typeof stored.secretKey === 'string' ? stored.secretKey.trim() : '';
  const storedPublic = typeof stored.publicKey === 'string' ? stored.publicKey.trim() : '';
  const envSecret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  const envPublic = (process.env.PAYSTACK_PUBLIC_KEY || '').trim();

  if (storedSecret && !isPlaceholderKey(storedSecret)) {
    return {
      secretKey: storedSecret,
      publicKey: storedPublic || (!isPlaceholderKey(envPublic) ? envPublic : ''),
      source: 'admin',
      updatedAt: stored.updatedAt || null,
    };
  }

  if (envSecret && !isPlaceholderKey(envSecret)) {
    return {
      secretKey: envSecret,
      publicKey: storedPublic || (!isPlaceholderKey(envPublic) ? envPublic : ''),
      source: 'env',
      updatedAt: stored.updatedAt || null,
    };
  }

  return {
    secretKey: '',
    publicKey: storedPublic || (!isPlaceholderKey(envPublic) ? envPublic : ''),
    source: 'none',
    updatedAt: stored.updatedAt || null,
  };
}

function maskSecretKey(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 12) return `${secret.slice(0, 7)}••••`;
  return `${secret.slice(0, 8)}••••••••${secret.slice(-4)}`;
}

export function getPaystackConfigSummary(baseUrl?: string): PaystackConfigSummary {
  const { secretKey, publicKey, source, updatedAt } = resolvePaystackCredentials();
  const hasSecret = Boolean(secretKey && isValidSecretKeyFormat(secretKey));
  let mode: 'live' | 'test' | 'unconfigured' = 'unconfigured';
  if (hasSecret) {
    mode = secretKey.startsWith('sk_live_') ? 'live' : 'test';
  }
  const cleanBase = (baseUrl || process.env.APP_URL || 'https://ozibd.net').replace(/\/+$/, '');
  return {
    configured: hasSecret,
    mode,
    hasSecretKey: hasSecret,
    secretKeyMasked: hasSecret ? maskSecretKey(secretKey) : '',
    publicKey,
    source,
    webhookUrlSuggested: `${cleanBase}/api/paystack/webhook`,
    updatedAt,
  };
}

export function savePaystackConfig(input: {
  secretKey?: string;
  publicKey?: string;
  clearSecret?: boolean;
}): { success: boolean; error?: string; summary?: PaystackConfigSummary } {
  const current = readStoredPaystackConfig();
  const next: StoredPaystackConfig = { ...current };

  if (input.clearSecret) {
    delete next.secretKey;
  } else if (typeof input.secretKey === 'string') {
    const trimmedSecret = input.secretKey.trim();
    if (trimmedSecret !== '') {
      if (!isValidSecretKeyFormat(trimmedSecret)) {
        return {
          success: false,
          error: 'Clé secrète Paystack invalide. Elle doit commencer par "sk_live_" ou "sk_test_".',
        };
      }
      next.secretKey = trimmedSecret;
    }
  }

  if (typeof input.publicKey === 'string') {
    const trimmedPublic = input.publicKey.trim();
    if (trimmedPublic === '') {
      delete next.publicKey;
    } else {
      if (!isValidPublicKeyFormat(trimmedPublic)) {
        return {
          success: false,
          error: 'Clé publique Paystack invalide. Elle doit commencer par "pk_live_" ou "pk_test_".',
        };
      }
      next.publicKey = trimmedPublic;
    }
  }

  next.updatedAt = new Date().toISOString();

  ensureDataDir();
  const targetFile = safeResolveInDataDir(PAYSTACK_CONFIG_FILE);
  const tempFile = safeResolveInDataDir(path.join(DATA_DIR, `paystack-config.${Date.now()}.tmp.json`));
  fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tempFile, targetFile);
  try {
    fs.chmodSync(targetFile, 0o600);
  } catch {}

  return {
    success: true,
    summary: getPaystackConfigSummary(),
  };
}

/**
 * Initializes a transaction with Paystack API for any paid item (Pass 30j, Artbooks, Coins).
 * Fails closed when Paystack secret key is missing so unpaid orders cannot be bypassed.
 */
export async function initializePaystackTransaction(
  options: PaystackInitializeOptions
): Promise<PaystackInitResponse> {
  const { secretKey } = resolvePaystackCredentials();
  const currency = (options.currency || 'XOF').toUpperCase();
  const amountInSubunits = Math.round(options.amount * 100);

  const paymentType = options.paymentType || (options.artbookId ? 'artbook_purchase' : (options.packId ? 'coin_pack' : 'work_pass'));
  const targetId = options.targetId || options.workId || options.artbookId || options.packId || 'item';
  const title = options.title || options.workTitle || options.artbookTitle || 'Produit OZI';

  const prefix = paymentType === 'artbook_purchase' ? 'art' : (paymentType === 'coin_pack' ? 'coin' : 'sub');
  const reference = `ozi_${prefix}_${targetId.slice(0, 18)}_${options.uid.slice(0, 8)}_${Date.now()}`;

  if (!secretKey || !isValidSecretKeyFormat(secretKey)) {
    return {
      success: false,
      message: 'Le paiement Paystack n\'est pas encore activé. L\'administrateur doit renseigner sa clé secrète Paystack dans le tableau de bord.',
    };
  }

  const baseAppUrl = (options.originUrl || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

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
        callback_url: options.callbackUrl || `${baseAppUrl}/#/paystack/callback?ref=${encodeURIComponent(reference)}&type=${encodeURIComponent(paymentType)}&target=${encodeURIComponent(targetId)}`,
        metadata: {
          uid: options.uid,
          paymentType,
          targetId,
          title,
          expectedAmount: Math.round(options.amount),
          workId: options.workId || (paymentType === 'work_pass' ? targetId : ''),
          workTitle: options.workTitle || (paymentType === 'work_pass' ? title : ''),
          artbookId: options.artbookId || (paymentType === 'artbook_purchase' ? targetId : ''),
          artbookTitle: options.artbookTitle || (paymentType === 'artbook_purchase' ? title : ''),
          artistName: options.artistName || '',
          packId: options.packId || (paymentType === 'coin_pack' ? targetId : ''),
          coinsAmount: options.coinsAmount || 0,
          email: options.email,
          customerName: options.customerName || '',
          custom_fields: [
            {
              display_name: 'Type de Paiement',
              variable_name: 'paymentType',
              value: paymentType,
            },
            {
              display_name: 'Identifiant Lecteur',
              variable_name: 'uid',
              value: options.uid,
            },
            {
              display_name: 'Article OZI',
              variable_name: 'targetId',
              value: targetId,
            },
          ],
        },
      }),
    });

    const data = await response.json() as any;

    if (response.ok && data.status && data.data?.authorization_url) {
      return {
        success: true,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference || reference,
        message: 'Paiement Paystack initialisé avec succès',
      };
    }

    console.warn('[PaystackServerService] Paystack API error response:', data);
    return {
      success: false,
      message: data.message || 'Erreur lors de l\'initialisation Paystack.',
    };
  } catch (err: any) {
    console.error('[PaystackServerService] Network error connecting to Paystack:', err);
    return {
      success: false,
      message: err.message || 'Impossible de joindre la passerelle Paystack.',
    };
  }
}

/**
 * Validates the x-paystack-signature header using HMAC SHA512
 */
export function verifyPaystackSignature(
  rawBody: Buffer | string,
  signatureHeader?: string | string[]
): boolean {
  const { secretKey } = resolvePaystackCredentials();
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  if (!secretKey || !isValidSecretKeyFormat(secretKey) || !signature) {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    if (computedHmac.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(computedHmac, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch (err) {
    console.error('[PaystackServerService] Error computing HMAC signature:', err);
    return false;
  }
}

/**
 * Verifies a transaction reference directly against Paystack API.
 * Never returns simulated success when unconfigured.
 */
export async function verifyPaystackTransaction(reference: string): Promise<{
  success: boolean;
  status: string;
  amount?: number;
  expectedAmount?: number;
  currency?: string;
  uid?: string;
  paymentType?: 'work_pass' | 'artbook_purchase' | 'coin_pack';
  targetId?: string;
  workId?: string;
  workTitle?: string;
  artbookId?: string;
  artbookTitle?: string;
  artistName?: string;
  packId?: string;
  coinsAmount?: number;
  customerEmail?: string;
  customerName?: string;
  raw?: any;
}> {
  const { secretKey } = resolvePaystackCredentials();

  if (!secretKey || !isValidSecretKeyFormat(secretKey)) {
    return {
      success: false,
      status: 'unconfigured',
    };
  }

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
      const paymentType = metadata.paymentType || (metadata.artbookId ? 'artbook_purchase' : (metadata.packId ? 'coin_pack' : 'work_pass'));
      const targetId = metadata.targetId || metadata.workId || metadata.artbookId || metadata.packId || '';
      const paidAmount = Math.round((d.amount || 0) / 100);
      const expectedAmount = typeof metadata.expectedAmount === 'number' ? metadata.expectedAmount : undefined;

      const amountValid = expectedAmount === undefined || paidAmount >= expectedAmount;

      return {
        success: d.status === 'success' && amountValid,
        status: d.status,
        amount: paidAmount,
        expectedAmount,
        currency: d.currency || 'XOF',
        uid: metadata.uid || '',
        paymentType,
        targetId,
        workId: metadata.workId || (paymentType === 'work_pass' ? targetId : ''),
        workTitle: metadata.workTitle || metadata.title || '',
        artbookId: metadata.artbookId || (paymentType === 'artbook_purchase' ? targetId : ''),
        artbookTitle: metadata.artbookTitle || metadata.title || '',
        artistName: metadata.artistName || '',
        packId: metadata.packId || (paymentType === 'coin_pack' ? targetId : ''),
        coinsAmount: metadata.coinsAmount || 0,
        customerEmail: (d.customer && d.customer.email) || metadata.email || '',
        customerName: metadata.customerName || '',
        raw: d,
      };
    }

    return {
      success: false,
      status: data?.data?.status || 'failed',
    };
  } catch (err) {
    console.error('[verifyPaystackTransaction] Network error:', err);
    return {
      success: false,
      status: 'error',
    };
  }
}
