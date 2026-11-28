import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  ADMIN_PERMISSION_OPTIONS,
  getDefaultPermissionsForRole,
  normalizeAdminEmail,
} from '../../services/adminService';
import { isWilfriedEmail } from '../../services/discussionService';
import { AdminAccountRecord, AdminAccountRole } from '../../types';

const ROLE_LABELS: Record<AdminAccountRole, string> = {
  'w.s.k': 'w.s.k (Fondateur)',
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Modérateur',
};

function formatDateFr(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export const AdminAdminsManager: React.FC = () => {
  const {
    adminAccounts,
    users,
    adminUser,
    isFirebaseAdminConnected,
    upsertAdminAccount,
    toggleAdminAccountStatus,
    removeAdminAccount,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminAccountRole>('all');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminAccountRecord | null>(null);
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AdminAccountRole>('admin');
  const [formPermissions, setFormPermissions] = useState<string[]>(
    getDefaultPermissionsForRole('admin')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Two-click delete confirmation without browser confirm()
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const filteredAdmins = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return adminAccounts.filter((acc) => {
      const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchesQuery =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        ROLE_LABELS[acc.role].toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [adminAccounts, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const total = adminAccounts.length;
    const activeAdmins = adminAccounts.filter(
      (a) => a.status === 'active' && (a.role === 'w.s.k' || a.role === 'super_admin' || a.role === 'admin')
    ).length;
    const moderators = adminAccounts.filter(
      (a) => a.status === 'active' && a.role === 'moderator'
    ).length;
    const suspended = adminAccounts.filter((a) => a.status === 'suspended').length;
    return { total, activeAdmins, moderators, suspended };
  }, [adminAccounts]);

  const candidateUsers = useMemo(() => {
    const existingSet = new Set(adminAccounts.map((a) => normalizeAdminEmail(a.email)));
    return users.filter(
      (u) => u.email && !existingSet.has(normalizeAdminEmail(u.email)) && !isWilfriedEmail(u.email)
    );
  }, [users, adminAccounts]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setSelectedExistingUserId('');
    setFormName('');
    setFormEmail('');
    setFormRole('admin');
    setFormPermissions(getDefaultPermissionsForRole('admin'));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: AdminAccountRecord) => {
    setEditingRecord(record);
    setSelectedExistingUserId(record.userId || '');
    setFormName(record.name);
    setFormEmail(record.email);
    setFormRole(record.role);
    setFormPermissions(
      record.permissions.length > 0
        ? record.permissions
        : getDefaultPermissionsForRole(record.role)
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSelectExistingUser = (userId: string) => {
    setSelectedExistingUserId(userId);
    const found = users.find((u) => u.id === userId);
    if (found) {
      setFormName(found.name || '');
      setFormEmail(found.email || '');
    }
  };

  const handleFormRoleChange = (nextRole: AdminAccountRole) => {
    setFormRole(nextRole);
    setFormPermissions(getDefaultPermissionsForRole(nextRole));
  };

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEmail.trim()) {
      setFormError('Veuillez renseigner une adresse e-mail.');
      return;
    }

    setIsSaving(true);
    const res = await upsertAdminAccount({
      email: formEmail,
      name: formName,
      role: formRole,
      permissions: formPermissions,
      status: editingRecord?.status || 'active',
      userId: selectedExistingUserId || editingRecord?.userId,
      photoURL: editingRecord?.photoURL,
    });
    setIsSaving(false);

    if (!res.success) {
      setFormError(res.error || 'Impossible d’enregistrer cet administrateur.');
      return;
    }

    setIsModalOpen(false);
    setFeedback({
      type: res.syncedToCloud ? 'success' : 'warning',
      text: res.syncedToCloud
        ? `Administrateur ${formEmail.toLowerCase()} enregistré et synchronisé sur Firestore.`
        : `Administrateur ${formEmail.toLowerCase()} enregistré localement. Connectez-vous avec votre compte Google w.s.k pour pousser les règles sur Firestore.`,
    });
  };

  const handleInlineRoleChange = async (record: AdminAccountRecord, nextRole: AdminAccountRole) => {
    if (isWilfriedEmail(record.email)) return;
    setBusyEmail(record.email);
    const res = await upsertAdminAccount({
      email: record.email,
      name: record.name,
      role: nextRole,
      permissions: getDefaultPermissionsForRole(nextRole),
      status: record.status,
      photoURL: record.photoURL,
      userId: record.userId,
    });
    setBusyEmail(null);
    setFeedback({
      type: res.syncedToCloud ? 'success' : 'warning',
      text: `Rôle mis à jour pour ${record.name} : ${ROLE_LABELS[nextRole]}.`,
    });
  };

  const handleToggleStatus = async (record: AdminAccountRecord) => {
    setBusyEmail(record.email);
    const res = await toggleAdminAccountStatus(record.email);
    setBusyEmail(null);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Action refusée.' });
      return;
    }
    setFeedback({
      type: 'success',
      text:
        record.status === 'active'
          ? `Accès administrateur suspendu pour ${record.name}.`
          : `Accès administrateur réactivé pour ${record.name}.`,
    });
  };

  const handleRemoveAdmin = async (record: AdminAccountRecord) => {
    setBusyEmail(record.email);
    const res = await removeAdminAccount(record.email);
    setBusyEmail(null);
    setConfirmDeleteEmail(null);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Suppression refusée.' });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Droits administrateur révoqués pour ${record.name} (${record.email}).`,
    });
  };

  const permissionLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    ADMIN_PERMISSION_OPTIONS.forEach((opt) => map.set(opt.id, opt.label));
    return map;
  }, []);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans">
      {/* Header Surface */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Gouvernance Studio & Communauté</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Gestion des Administrateurs
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Ajoutez des administrateurs ou modérateurs, attribuez leurs droits (suppression de messages dans #discussion et #galerie, gestion catalogue) et contrôlez l’accès au Studio.
          </p>
        </div>

        <button
          id="admin-add-admin-btn"
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Ajouter un administrateur</span>
        </button>
      </div>

      {/* Feedback Notice */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : feedback.type === 'warning'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Firebase Sync Advisory if Studio Auth only */}
      {!isFirebaseAdminConnected && (
        <div className="px-4 py-3 rounded-xl bg-slate-900 border border-yellow-500/30 text-xs text-slate-300 flex items-center justify-between gap-3">
          <span>
            Session Studio active ({adminUser.email}). Pour appliquer en direct les droits Firestore à vos nouveaux administrateurs sur tous les appareils, connectez aussi votre compte lecteur <strong className="text-yellow-300">w.s.k</strong>.
          </span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Équipe totale
          </div>
          <div className="mt-1.5 text-2xl font-black text-white tabular-nums font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Comptes enregistrés</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-yellow-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">
            Titulaire w.s.k
          </div>
          <div className="mt-1.5 text-base font-black text-yellow-300 truncate">
            wilfriedcrea@gmail.com
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Accès souverain protégé</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Admins actifs
          </div>
          <div className="mt-1.5 text-2xl font-black text-emerald-400 tabular-nums font-mono">
            {stats.activeAdmins}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">w.s.k · Super Admin · Admin</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Modérateurs & Suspendus
          </div>
          <div className="mt-1.5 text-2xl font-black text-white tabular-nums font-mono">
            {stats.moderators} <span className="text-sm font-normal text-slate-500">/ {stats.suspended} susp.</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Modération #discussion · #galerie</div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un administrateur (nom, e-mail)..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(['all', 'w.s.k', 'super_admin', 'admin', 'moderator'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                roleFilter === r
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'all' ? 'Tous' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Administrateur</th>
                <th className="px-5 py-3.5">Rôle</th>
                <th className="px-5 py-3.5">Permissions actives</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5">Mis à jour</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAdmins.map((acc) => {
                const isOwner = isWilfriedEmail(acc.email) || acc.role === 'w.s.k';
                const isSuspended = acc.status === 'suspended';
                const isBusy = busyEmail === acc.email;
                const permSummary = acc.permissions
                  .map((p) => permissionLabelMap.get(p) || p)
                  .slice(0, 3)
                  .join(' · ');
                const remainingCount = Math.max(0, acc.permissions.length - 3);

                return (
                  <tr
                    key={acc.email}
                    className={`hover:bg-slate-800/35 transition-colors ${
                      isSuspended ? 'opacity-65' : ''
                    }`}
                  >
                    {/* Identity */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div
                          className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${
                            isOwner || !isSuspended
                              ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2px] ring-2 ring-yellow-400/80'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {acc.photoURL ? (
                            <img
                              src={acc.photoURL}
                              alt={acc.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-full bg-slate-950"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-black text-yellow-300">
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold truncate ${
                                isOwner || !isSuspended ? 'text-yellow-300' : 'text-slate-200'
                              }`}
                            >
                              {acc.name}
                            </span>
                            {isOwner && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-yellow-400">
                                <Lock className="w-3 h-3" />
                                w.s.k
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono truncate">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-400/40 text-yellow-300 text-xs font-bold whitespace-nowrap">
                          <KeyRound className="w-3.5 h-3.5" />
                          w.s.k
                        </span>
                      ) : (
                        <select
                          value={acc.role}
                          disabled={isBusy}
                          onChange={(e) =>
                            handleInlineRoleChange(acc, e.target.value as AdminAccountRole)
                          }
                          className="bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="moderator">Modérateur</option>
                        </select>
                      )}
                    </td>

                    {/* Permissions */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-xs text-slate-300 leading-relaxed">
                        {permSummary || 'Aucune permission sélectionnée'}
                        {remainingCount > 0 && (
                          <span className="text-slate-500 font-mono">
                            {' '}
                            · +{remainingCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isSuspended ? (
                        <span className="text-xs font-bold text-rose-400">Suspendu</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">Actif</span>
                      )}
                    </td>

                    {/* Updated At */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-400 tabular-nums font-mono">
                        {formatDateFr(acc.updatedAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {isOwner ? (
                        <span className="text-xs font-medium text-slate-500">
                          Compte protégé
                        </span>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(acc)}
                            disabled={isBusy}
                            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Modifier rôle et permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            disabled={isBusy}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                            }`}
                            title={isSuspended ? 'Réactiver cet administrateur' : 'Suspendre temporairement'}
                          >
                            {isSuspended ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Réactiver</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>Suspendre</span>
                              </>
                            )}
                          </button>

                          {confirmDeleteEmail === acc.email ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleRemoveAdmin(acc)}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                              >
                                Confirmer
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteEmail(null)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEmail(acc.email)}
                              disabled={isBusy}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                              title="Révoquer les droits administrateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                    Aucun administrateur ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Admin Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setIsModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSubmitForm}
            className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingRecord
                    ? `Modifier : ${editingRecord.name}`
                    : 'Ajouter un administrateur'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Optional quick-fill from registered users */}
              {!editingRecord && candidateUsers.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Promouvoir un compte lecteur existant (optionnel)
                  </label>
                  <select
                    value={selectedExistingUserId}
                    onChange={(e) => handleSelectExistingUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  >
                    <option value="">— Saisir manuellement ci-dessous —</option>
                    {candidateUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nom affiché
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex : Kouadio Konan"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Adresse e-mail Google / OZI
                  </label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingRecord)}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="admin@exemple.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Rôle attribué
                </label>
                <select
                  value={formRole}
                  onChange={(e) => handleFormRoleChange(e.target.value as AdminAccountRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none"
                >
                  <option value="super_admin">Super Admin (accès complet Studio & Modération)</option>
                  <option value="admin">Admin (catalogue, utilisateurs et suppression messages)</option>
                  <option value="moderator">Modérateur (#discussion, #galerie et commentaires)</option>
                </select>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-300 mb-2">
                  Permissions autorisées
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADMIN_PERMISSION_OPTIONS.map((perm) => {
                    const checked = formPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 accent-amber-500"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{perm.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                  {formError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="admin-save-admin-btn"
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Enregistrement...'
                    : editingRecord
                    ? 'Mettre à jour'
                    : 'Accorder l’accès admin'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
