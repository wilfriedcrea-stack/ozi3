import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminAccountRecord, AdminAccountRole, UserRole } from '../types';
import { isWilfriedEmail } from './discussionService';

const ADMIN_ACCOUNTS_COLLECTION = 'admin_accounts';

export const ADMIN_PERMISSION_OPTIONS: Array<{
  id: string;
  label: string;
  description: string;
}> = [
  {
    id: 'messages:delete',
    label: 'Supprimer des messages',
    description: 'Modérer et supprimer les messages dans #discussion et commentaires',
  },
  {
    id: 'gallery:moderate',
    label: 'Modérer #galerie',
    description: 'Supprimer ou gérer les créations publiées dans la galerie communautaire',
  },
  {
    id: 'catalog:manage',
    label: 'Gérer le catalogue',
    description: 'Publier et éditer les séries, chapitres, artistes et artbooks',
  },
  {
    id: 'users:manage',
    label: 'Gérer les utilisateurs',
    description: 'Attribuer des rôles, ajuster les Coins et gérer les statuts VIP',
  },
  {
    id: 'monetization:manage',
    label: 'Monétisation & Paystack',
    description: 'Consulter les paiements, abonnements et reversements créateurs',
  },
  {
    id: 'admins:manage',
    label: 'Gérer les administrateurs',
    description: 'Ajouter, modifier ou révoquer les accès de l’équipe d’administration',
  },
];

export const DEFAULT_OWNER_ADMIN_ACCOUNT: AdminAccountRecord = {
  id: 'wilfriedcrea@gmail.com',
  email: 'wilfriedcrea@gmail.com',
  name: 'Wilfried Créa',
  role: 'w.s.k',
  permissions: ADMIN_PERMISSION_OPTIONS.map((p) => p.id),
  status: 'active',
  photoURL: '',
  addedBy: 'system',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2026-08-28T11:20:00.000Z',
};

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getDefaultPermissionsForRole(role: AdminAccountRole): string[] {
  if (role === 'w.s.k' || role === 'super_admin') {
    return ADMIN_PERMISSION_OPTIONS.map((p) => p.id);
  }
  if (role === 'admin') {
    return ['messages:delete', 'gallery:moderate', 'catalog:manage', 'users:manage'];
  }
  return ['messages:delete', 'gallery:moderate'];
}

export function mapAdminRoleToUserRole(role: AdminAccountRole): UserRole {
  if (role === 'w.s.k') return 'w.s.k';
  if (role === 'super_admin' || role === 'admin') return 'super_admin';
  return 'moderator';
}

function normalizeAdminDoc(id: string, data: Record<string, any>): AdminAccountRecord {
  const email = normalizeAdminEmail(String(data.email || id));
  const isOwner = isWilfriedEmail(email);
  const rawRole = String(data.role || 'admin');
  const role: AdminAccountRole = isOwner
    ? 'w.s.k'
    : rawRole === 'super_admin' || rawRole === 'admin' || rawRole === 'moderator'
    ? rawRole
    : 'admin';

  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter((p): p is string => typeof p === 'string').slice(0, 20)
    : getDefaultPermissionsForRole(role);

  return {
    id: email,
    email,
    name: String(data.name || email.split('@')[0] || 'Administrateur').slice(0, 80),
    role,
    permissions,
    status: isOwner ? 'active' : data.status === 'suspended' ? 'suspended' : 'active',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : '',
    userId: typeof data.userId === 'string' && data.userId ? data.userId : undefined,
    addedBy: typeof data.addedBy === 'string' ? data.addedBy : undefined,
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || new Date().toISOString()),
  };
}

export function subscribeToAdminAccounts(
  onAccounts: (accounts: AdminAccountRecord[]) => void,
  onError?: (errMsg: string) => void
): () => void {
  const ref = collection(db, ADMIN_ACCOUNTS_COLLECTION);

  return onSnapshot(
    ref,
    (snapshot) => {
      const list: AdminAccountRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(normalizeAdminDoc(docSnap.id, docSnap.data()));
      });

      const hasOwner = list.some((a) => isWilfriedEmail(a.email));
      const merged = hasOwner ? list : [DEFAULT_OWNER_ADMIN_ACCOUNT, ...list];

      merged.sort((a, b) => {
        if (a.role === 'w.s.k' && b.role !== 'w.s.k') return -1;
        if (b.role === 'w.s.k' && a.role !== 'w.s.k') return 1;
        return a.name.localeCompare(b.name, 'fr');
      });

      onAccounts(merged);
    },
    (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (onError && !message.toLowerCase().includes('permission')) {
        onError('Impossible de synchroniser les administrateurs pour le moment.');
      }
    }
  );
}

export async function fetchMyAdminAccountRecord(
  email?: string | null
): Promise<AdminAccountRecord | null> {
  const clean = normalizeAdminEmail(email || '');
  if (!clean) return null;
  if (isWilfriedEmail(clean)) return DEFAULT_OWNER_ADMIN_ACCOUNT;

  try {
    const snap = await getDoc(doc(db, ADMIN_ACCOUNTS_COLLECTION, clean));
    if (!snap.exists()) return null;
    return normalizeAdminDoc(snap.id, snap.data());
  } catch {
    return null;
  }
}

export async function saveAdminAccountToFirestore(
  record: AdminAccountRecord
): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> {
  const email = normalizeAdminEmail(record.email);
  const isOwner = isWilfriedEmail(email);
  const role: AdminAccountRole = isOwner ? 'w.s.k' : record.role;
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    id: email,
    email,
    name: record.name.trim().slice(0, 80) || email.split('@')[0],
    role,
    permissions: record.permissions.slice(0, 20),
    status: isOwner ? 'active' : record.status,
    createdAt: record.createdAt || now,
    updatedAt: now,
  };

  if (record.photoURL) payload.photoURL = record.photoURL.slice(0, 120000);
  if (record.userId) payload.userId = record.userId.slice(0, 128);
  if (record.addedBy) payload.addedBy = record.addedBy.slice(0, 160);

  if (!auth.currentUser) {
    return {
      success: true,
      syncedToCloud: false,
    };
  }

  try {
    await setDoc(doc(db, ADMIN_ACCOUNTS_COLLECTION, email), payload);
    if (record.userId) {
      const targetUserRole: UserRole =
        record.status === 'suspended' ? 'reader' : mapAdminRoleToUserRole(role);
      try {
        await setDoc(
          doc(db, 'users', record.userId),
          { role: targetUserRole, updatedAt: now },
          { merge: true }
        );
      } catch {
        // Ignore if user doc doesn't exist yet or permissions differ
      }
    }
    return { success: true, syncedToCloud: true };
  } catch (err) {
    console.warn('[AdminService] Firestore admin save notice:', err);
    return {
      success: true,
      syncedToCloud: false,
      error: err instanceof Error ? err.message : 'Synchronisation cloud différée.',
    };
  }
}

export async function deleteAdminAccountFromFirestore(
  email: string,
  userId?: string
): Promise<{ success: boolean; syncedToCloud: boolean }> {
  const clean = normalizeAdminEmail(email);
  if (isWilfriedEmail(clean)) {
    return { success: false, syncedToCloud: false };
  }

  if (!auth.currentUser) {
    return { success: true, syncedToCloud: false };
  }

  try {
    await deleteDoc(doc(db, ADMIN_ACCOUNTS_COLLECTION, clean));
    if (userId) {
      try {
        await setDoc(
          doc(db, 'users', userId),
          { role: 'reader', updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch {}
    }
    return { success: true, syncedToCloud: true };
  } catch (err) {
    console.warn('[AdminService] Firestore admin delete notice:', err);
    return { success: true, syncedToCloud: false };
  }
}
