import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'studio-data.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'studio-auth.json');
const SECRET_FILE = path.resolve(DATA_DIR, 'studio-secret.key');

// Default salted SHA-256 hash matching src/data/initialData.ts DEFAULT_ADMIN_CREDENTIALS
const DEFAULT_PASSWORD_HASH = 'b7a12a3eff6c697a84d40b3eaded800533543e621c32cbc2f3dc65c7da11c1f7';
const DEFAULT_ALLOWED_USERNAMES = ['admin', 'wilfriedcrea@gmail.com', 'wilfried', 'ozi', 'ozibd'];

function resolveSigningSecret(): string {
  const fromEnv = (process.env.STUDIO_SESSION_SECRET || '').trim();
  if (fromEnv.length >= 32) return fromEnv;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const resolvedSecret = path.resolve(SECRET_FILE);
    if (!resolvedSecret.startsWith(DATA_DIR + path.sep)) {
      throw new Error('Invalid secret path');
    }
    if (fs.existsSync(resolvedSecret)) {
      const existing = fs.readFileSync(resolvedSecret, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(resolvedSecret, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SESSION_SECRET = resolveSigningSecret();

const ALLOWED_KEYS = [
  'artists',
  'deletedArtistIds',
  'artbooks',
  'deletedArtbookIds',
  'series',
  'deletedSeriesIds',
  'heroSlides',
  'articles',
  'teasers',
  'pressReleases',
  'siteBannerUrl',
  'appVersion',
] as const;

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function safeResolveInDataDir(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid storage path boundary');
  }
  return resolved;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function constantTimeEqualHex(a: string, b: string): boolean {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA.length !== cleanB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleanA, 'utf8'), Buffer.from(cleanB, 'utf8'));
}

function readAuthConfig(): { passwordHash: string; allowedUsernames: string[] } {
  try {
    const file = safeResolveInDataDir(AUTH_FILE);
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed && typeof parsed.passwordHash === 'string' && parsed.passwordHash.length > 0) {
        return {
          passwordHash: parsed.passwordHash.toLowerCase(),
          allowedUsernames: Array.isArray(parsed.allowedUsernames) ? parsed.allowedUsernames : DEFAULT_ALLOWED_USERNAMES,
        };
      }
    }
  } catch (err) {
    console.warn('[StudioData] Unable to read auth config:', err);
  }
  return {
    passwordHash: DEFAULT_PASSWORD_HASH,
    allowedUsernames: DEFAULT_ALLOWED_USERNAMES,
  };
}

function verifyAdminPassword(password: string, storedHash: string): boolean {
  const cleanPass = password.trim();
  if (!cleanPass) return false;

  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPasscode) {
    return constantTimeEqualHex(sha256Hex(cleanPass), sha256Hex(envPasscode));
  }

  const saltedHash = sha256Hex(`OZI_SALT_PW_${cleanPass}_SECURE_2026`);
  if (constantTimeEqualHex(saltedHash, storedHash)) return true;

  const legacyHash = sha256Hex(cleanPass);
  if (constantTimeEqualHex(legacyHash, storedHash)) return true;

  return false;
}

function issueSignedSessionToken(username: string, ttlMs = 24 * 60 * 60 * 1000): string {
  const now = Date.now();
  const payload = {
    u: username.trim().toLowerCase(),
    i: now,
    e: now + ttlMs,
    n: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  return `ozi_srv_v1.${payloadB64}.${sig}`;
}

function verifySignedSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string' || !token.startsWith('ozi_srv_v1.')) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [, payloadB64, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  if (!constantTimeEqualHex(providedSig, expectedSig)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.e !== 'number') return false;
    return Date.now() <= decoded.e;
  } catch {
    return false;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) cookies[k] = decodeURIComponent(v);
  }
  return cookies;
}

function isRequestHttps(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return req.secure || proto === 'https';
}

function isSameOriginValid(req: Request): boolean {
  const xrw = String(req.headers['x-requested-with'] || '');
  if (xrw.toLowerCase() !== 'ozistudio') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const expectedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
    if (!expectedHost) return true;
    return originHost === expectedHost;
  } catch {
    return false;
  }
}

export function isAdminAuthorized(req: Request): boolean {
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (verifySignedSessionToken(bearerToken)) {
      return true;
    }
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['ozi_studio_session'];
  if (cookieToken && verifySignedSessionToken(cookieToken) && isSameOriginValid(req)) {
    return true;
  }
  return false;
}

export function readStudioDataFile(): Record<string, unknown> {
  try {
    const file = safeResolveInDataDir(DATA_FILE);
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    }
  } catch (err) {
    console.warn('[StudioData] Failed reading studio-data.json:', err);
  }
  return {};
}

function writeStudioDataFile(data: Record<string, unknown>): void {
  ensureDataDir();
  const file = safeResolveInDataDir(DATA_FILE);
  const tempFile = safeResolveInDataDir(path.join(DATA_DIR, `studio-data.${Date.now()}.tmp.json`));
  fs.writeFileSync(tempFile, JSON.stringify(data), 'utf8');
  fs.renameSync(tempFile, file);
}

function readFirebaseWebApiKey(): string | null {
  try {
    const cfgPath = path.resolve(__dirname, '..', '..', 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (parsed && typeof parsed.apiKey === 'string' && parsed.apiKey.trim()) {
        return parsed.apiKey.trim();
      }
    }
  } catch {}
  return null;
}

const ALLOWED_UPLOAD_CATEGORIES = new Set(['covers', 'banners', 'chapters', 'audio', 'articles', 'authors', 'shop']);
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

export const studioDataRouter = Router();

studioDataRouter.post('/admin/login', (req: Request, res: Response) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const cleanPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const authCfg = readAuthConfig();

  const usernameAllowed =
    authCfg.allowedUsernames.some(u => u.toLowerCase() === username) ||
    username.includes('wilfried') ||
    ['admin', 'ozi', 'ozibd'].includes(username);

  if (!usernameAllowed || !verifyAdminPassword(cleanPassword, authCfg.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Identifiants Studio invalides.' });
  }

  const token = issueSignedSessionToken(username);
  const https = isRequestHttps(req);
  const cookieParts = [
    `ozi_studio_session=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${24 * 60 * 60}`,
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (https) {
    cookieParts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '));

  return res.status(200).json({ success: true, token });
});

studioDataRouter.post('/admin/google-login', async (req: Request, res: Response) => {
  const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Jeton Google manquant.' });
  }
  const apiKey = readFirebaseWebApiKey();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Configuration Firebase introuvable.' });
  }

  try {
    const verifyResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const verifyJson = (await verifyResp.json().catch(() => null)) as any;
    const userRecord = Array.isArray(verifyJson?.users) ? verifyJson.users[0] : null;
    const verifiedEmail = typeof userRecord?.email === 'string' ? userRecord.email.trim().toLowerCase() : '';
    const emailVerified = Boolean(userRecord?.emailVerified);

    const authCfg = readAuthConfig();
    const isAuthorizedEmail =
      emailVerified &&
      Boolean(verifiedEmail) &&
      (verifiedEmail === 'wilfriedcrea@gmail.com' ||
        authCfg.allowedUsernames.some(u => u.toLowerCase() === verifiedEmail) ||
        verifiedEmail.endsWith('@ozibd.net'));

    if (!verifyResp.ok || !isAuthorizedEmail) {
      return res.status(401).json({ success: false, error: 'Compte Google non autorisé.' });
    }

    const token = issueSignedSessionToken(verifiedEmail);
    const https = isRequestHttps(req);
    const cookieParts = [
      `ozi_studio_session=${encodeURIComponent(token)}`,
      'Path=/',
      `Max-Age=${24 * 60 * 60}`,
      'HttpOnly',
      https ? 'SameSite=None' : 'SameSite=Lax',
    ];
    if (https) {
      cookieParts.push('Secure', 'Partitioned');
    }
    res.setHeader('Set-Cookie', cookieParts.join('; '));

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.warn('[StudioData] Google login verification error:', err);
    return res.status(500).json({ success: false, error: 'Erreur de vérification Google.' });
  }
});

studioDataRouter.post('/studio-upload', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise pour téléverser un fichier.' });
  }

  const rawCategory = typeof req.body?.category === 'string' ? req.body.category.trim().toLowerCase() : 'authors';
  const category = ALLOWED_UPLOAD_CATEGORIES.has(rawCategory) ? rawCategory : 'authors';
  const rawName = typeof req.body?.fileName === 'string' ? req.body.fileName.trim() : `upload_${Date.now()}.webp`;
  const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : '';

  const match = dataUrl.match(/^data:image\/(webp|png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    return res.status(400).json({ success: false, error: 'Format image invalide.' });
  }

  const extFromMime = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Image vide ou supérieure à 10 Mo.' });
  }

  try {
    const baseName = path.basename(rawName, path.extname(rawName)).replace(/[^a-zA-Z0-9_-]/g, '_') || 'media';
    const finalFileName = `${baseName}_${Date.now()}.${extFromMime}`;
    const targetDir = safeResolveInDataDir(path.join(UPLOADS_DIR, category));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = safeResolveInDataDir(path.join(targetDir, finalFileName));
    fs.writeFileSync(targetFile, buffer);

    const publicUrl = `/uploads/${category}/${finalFileName}`;
    return res.status(200).json({
      success: true,
      url: publicUrl,
      path: `server/data/uploads/${category}/${finalFileName}`,
      size: buffer.length,
    });
  } catch (err) {
    console.error('[StudioUpload] Save failed:', err);
    return res.status(500).json({ success: false, error: 'Échec de sauvegarde du média sur le serveur.' });
  }
});

studioDataRouter.get('/admin/session', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ success: true, authenticated: isAdminAuthorized(req) });
});

studioDataRouter.post('/admin/logout', (req: Request, res: Response) => {
  const https = isRequestHttps(req);
  const cookieParts = [
    'ozi_studio_session=',
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (https) {
    cookieParts.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.status(200).json({ success: true });
});

studioDataRouter.post('/admin/change-password', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur requise.' });
  }
  const newHash = typeof req.body?.passwordHash === 'string' ? req.body.passwordHash.trim().toLowerCase() : '';
  if (!/^[a-f0-9]{64}$/.test(newHash)) {
    return res.status(400).json({ success: false, error: 'Empreinte invalide.' });
  }
  ensureDataDir();
  const cfg = readAuthConfig();
  const nextCfg = {
    ...cfg,
    passwordHash: newHash,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(safeResolveInDataDir(AUTH_FILE), JSON.stringify(nextCfg, null, 2), 'utf8');
  return res.status(200).json({ success: true });
});

studioDataRouter.get('/studio-data', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const data = readStudioDataFile();
  return res.status(200).json({ success: true, data });
});

studioDataRouter.post('/studio-data', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Session administrateur expirée ou non valide.' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: 'Payload JSON invalide.' });
  }

  const current = readStudioDataFile();
  for (const key of ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      current[key] = req.body[key];
    }
  }
  const updatedAt = new Date().toISOString();
  current.updatedAt = updatedAt;

  writeStudioDataFile(current);
  return res.status(200).json({ success: true, updatedAt });
});
