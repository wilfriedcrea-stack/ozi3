import {
  Artist,
  Artbook,
  Series,
  HomeHeroSlide,
  Article,
  Teaser,
  PressRelease,
  AppVersionInfo,
} from '../types';

export interface StudioDataSnapshot {
  artists?: Artist[];
  deletedArtistIds?: string[];
  artbooks?: Artbook[];
  deletedArtbookIds?: string[];
  series?: Series[];
  deletedSeriesIds?: string[];
  heroSlides?: HomeHeroSlide[];
  articles?: Article[];
  teasers?: Teaser[];
  pressReleases?: PressRelease[];
  siteBannerUrl?: string;
  appVersion?: AppVersionInfo;
  updatedAt?: string;
}

export interface StudioSyncWriteResult {
  success: boolean;
  unauthorized?: boolean;
  unreachable?: boolean;
  updatedAt?: string;
  error?: string;
}

export interface StudioSessionCheckResult {
  reachable: boolean;
  authenticated: boolean;
}

const SRV_TOKEN_STORAGE_KEY = 'ozi_studio_srv_token_v1';

function readPersistedServerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const t = sessionStorage.getItem(SRV_TOKEN_STORAGE_KEY) || localStorage.getItem(SRV_TOKEN_STORAGE_KEY);
    return t && t.startsWith('ozi_srv_v1.') ? t : null;
  } catch {
    return null;
  }
}

function writePersistedServerToken(token: string | null, rememberMe = false): void {
  serverSessionToken = token;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SRV_TOKEN_STORAGE_KEY);
    localStorage.removeItem(SRV_TOKEN_STORAGE_KEY);
    if (token) {
      if (rememberMe) {
        localStorage.setItem(SRV_TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.setItem(SRV_TOKEN_STORAGE_KEY, token);
      }
    }
  } catch {}
}

// Keep session token synced with storage + HttpOnly cookie from server/LWS
let serverSessionToken: string | null = readPersistedServerToken();
let detectedMode: 'node' | 'php' | null = null;

function isLikelyPhpHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host.includes('ozibd.net');
}

function getPreferredMode(): 'node' | 'php' {
  if (detectedMode) return detectedMode;
  return isLikelyPhpHost() ? 'php' : 'node';
}

function buildEndpoints(mode: 'node' | 'php') {
  if (mode === 'php') {
    return {
      login: '/api/studio-data.php?action=login',
      googleLogin: '/api/admin/google-login',
      logout: '/api/studio-data.php?action=logout',
      session: '/api/studio-data.php?action=session',
      changePassword: '/api/studio-data.php?action=change-password',
      data: '/api/studio-data.php',
    };
  }
  return {
    login: '/api/admin/login',
    googleLogin: '/api/admin/google-login',
    logout: '/api/admin/logout',
    session: '/api/admin/session',
    changePassword: '/api/admin/change-password',
    data: '/api/studio-data',
  };
}

export function buildStudioAuthHeaders(): Record<string, string> {
  if (!serverSessionToken) {
    serverSessionToken = readPersistedServerToken();
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'OziStudio',
  };
  if (serverSessionToken) {
    headers['Authorization'] = `Bearer ${serverSessionToken}`;
  }
  return headers;
}

async function fetchJsonWithFallback(
  endpointKey: keyof ReturnType<typeof buildEndpoints>,
  init: RequestInit
): Promise<{ ok: boolean; status: number; json: any; unreachable: boolean }> {
  const firstMode = getPreferredMode();
  const secondMode: 'node' | 'php' = firstMode === 'node' ? 'php' : 'node';

  const attempt = async (mode: 'node' | 'php') => {
    const url = buildEndpoints(mode)[endpointKey];
    const resp = await fetch(url, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        ...buildStudioAuthHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');
    if (resp.status === 404 || (!isJson && resp.status !== 401)) {
      return { tryOther: true, ok: false, status: resp.status, json: null };
    }
    const json = await resp.json().catch(() => null);
    detectedMode = mode;
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

export function hasInMemoryServerToken(): boolean {
  if (!serverSessionToken) {
    serverSessionToken = readPersistedServerToken();
  }
  return Boolean(serverSessionToken);
}

export function clearInMemoryServerToken(): void {
  writePersistedServerToken(null, false);
}

export async function loginStudioServer(
  username: string,
  password: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; unreachable?: boolean; error?: string }> {
  const res = await fetchJsonWithFallback('login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (res.ok && res.json?.success) {
    if (typeof res.json.token === 'string' && res.json.token.startsWith('ozi_srv_v1.')) {
      writePersistedServerToken(res.json.token, rememberMe);
    }
    return { success: true };
  }

  return {
    success: false,
    unreachable: res.unreachable,
    error: res.json?.error || (res.unreachable ? 'Serveur inaccessible.' : 'Identifiants Studio invalides.'),
  };
}

export async function loginStudioServerWithGoogleIdToken(
  idToken: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; unreachable?: boolean; error?: string }> {
  const res = await fetchJsonWithFallback('googleLogin', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  if (res.ok && res.json?.success) {
    if (typeof res.json.token === 'string' && res.json.token.startsWith('ozi_srv_v1.')) {
      writePersistedServerToken(res.json.token, rememberMe);
    }
    return { success: true };
  }

  return {
    success: false,
    unreachable: res.unreachable,
    error: res.json?.error || 'Impossible de valider la session Google sur le serveur.',
  };
}

export async function logoutStudioServer(): Promise<void> {
  clearInMemoryServerToken();
  try {
    await fetchJsonWithFallback('logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } catch {}
}

export async function checkStudioServerSession(): Promise<StudioSessionCheckResult> {
  const res = await fetchJsonWithFallback('session', { method: 'GET' });
  if (res.unreachable) {
    return { reachable: false, authenticated: false };
  }
  const isAuth = Boolean(res.ok && res.json?.authenticated);
  if (!isAuth) {
    clearInMemoryServerToken();
  }
  return {
    reachable: true,
    authenticated: isAuth,
  };
}

export async function changeStudioServerPassword(passwordHash: string): Promise<boolean> {
  const res = await fetchJsonWithFallback('changePassword', {
    method: 'POST',
    body: JSON.stringify({ passwordHash }),
  });
  return Boolean(res.ok && res.json?.success);
}

export async function fetchStudioDataFromServer(): Promise<StudioDataSnapshot | null> {
  const res = await fetchJsonWithFallback('data', { method: 'GET' });
  if (res.ok && res.json?.success && res.json?.data && typeof res.json.data === 'object') {
    return res.json.data as StudioDataSnapshot;
  }
  return null;
}

export async function pushStudioDataPatch(patch: Partial<StudioDataSnapshot>): Promise<StudioSyncWriteResult> {
  const res = await fetchJsonWithFallback('data', {
    method: 'POST',
    body: JSON.stringify(patch),
  });

  if (res.ok && res.json?.success) {
    return { success: true, updatedAt: res.json.updatedAt };
  }

  if (res.status === 401) {
    return {
      success: false,
      unauthorized: true,
      error: res.json?.error || 'Session administrateur expirée. Veuillez vous reconnecter.',
    };
  }

  return {
    success: false,
    unreachable: res.unreachable,
    error: res.json?.error || 'Erreur lors de la synchronisation serveur.',
  };
}

export function getEntityTimestamp(item: { updatedAt?: string; createdAt?: string } | null | undefined): number {
  if (!item) return 0;
  const candidate = item.updatedAt || item.createdAt;
  if (!candidate) return 0;
  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mergeIdSets(baseSet: Set<string>, incomingIds?: string[]): Set<string> {
  const merged = new Set<string>(baseSet);
  if (Array.isArray(incomingIds)) {
    for (const id of incomingIds) {
      if (id && typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed) {
          merged.add(trimmed);
          merged.add(trimmed.toLowerCase());
        }
      }
    }
  }
  return merged;
}

export function mergeEntitiesByRecency<T extends { id: string; slug?: string; updatedAt?: string; createdAt?: string }>(
  primary: T[],
  incoming: T[],
  deletedIds?: Set<string>
): T[] {
  const isDeleted = (item: T): boolean => {
    if (!item || !item.id || !deletedIds) return false;
    const idLower = item.id.trim().toLowerCase();
    const slugLower = item.slug ? item.slug.trim().toLowerCase() : '';
    return (
      deletedIds.has(item.id) ||
      deletedIds.has(idLower) ||
      (Boolean(slugLower) && (deletedIds.has(item.slug!) || deletedIds.has(slugLower)))
    );
  };

  const map = new Map<string, T>();
  for (const item of primary) {
    if (!item || !item.id || isDeleted(item)) continue;
    map.set(item.id, item);
  }

  for (const item of incoming) {
    if (!item || !item.id || isDeleted(item)) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const incomingTs = getEntityTimestamp(item);
    const existingTs = getEntityTimestamp(existing);
    if (incomingTs > existingTs) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}
