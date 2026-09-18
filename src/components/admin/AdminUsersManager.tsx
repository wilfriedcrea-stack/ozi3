import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Coins, 
  Crown, 
  Ban, 
  CheckCircle2, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Edit, 
  PlusCircle, 
  MinusCircle,
  Globe,
  BookOpen,
  Calendar,
  AlertTriangle,
  KeyRound,
  Lock,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { UserAccount } from '../../types';

export const AdminUsersManager: React.FC = () => {
  const { 
    users, 
    updateUserRole, 
    adjustUserCoins, 
    toggleUserBan, 
    toggleUserVip,
    adminUser,
    changeAdminPassword,
    adminCredentials
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserAccount['role']>('all');
  
  // Coin Adjustment Modal
  const [adjustingUser, setAdjustingUser] = useState<UserAccount | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(100);
  const [coinReason, setCoinReason] = useState<string>('Bonus de bienvenue');

  // Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState<{ success?: boolean; text: string } | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (newPassword !== confirmPassword) {
      setPwdFeedback({ success: false, text: "Les deux nouveaux mots de passe ne correspondent pas." });
      return;
    }

    if (newPassword.length < 6) {
      setPwdFeedback({ success: false, text: "Le nouveau mot de passe doit comporter au moins 6 caractères." });
      return;
    }

    setIsSubmittingPwd(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setPwdFeedback({ success: true, text: res.message || "Mot de passe modifié avec succès !" });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdFeedback(null);
        }, 2200);
      } else {
        setPwdFeedback({ success: false, text: res.message || "Erreur lors du changement de mot de passe." });
      }
    } catch {
      setPwdFeedback({ success: false, text: "Erreur technique lors de la mise à jour." });
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    adjustUserCoins(adjustingUser.id, coinAmount, coinReason);
    setAdjustingUser(null);
    setCoinAmount(100);
    setCoinReason('Bonus d\'animation de communauté');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Gestion des Utilisateurs & Auteurs OZI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Comptes Lecteurs, Auteurs & Équipe Modération
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Attribuez des rôles (Créateurs, Modérateurs, Admins), créditez des portefeuilles de Coins et activez les Pass VIP illimités.
          </p>
        </div>

        {/* Stats & Security Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Comptes</div>
              <div className="text-xl font-black text-white">{users.length}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Abonnés VIP</div>
              <div className="text-xl font-black text-amber-400">{users.filter(u => u.isVip).length}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Créateurs</div>
              <div className="text-xl font-black text-emerald-400">{users.filter(u => u.role === 'creator').length}</div>
            </div>
          </div>

          <button
            id="admin-users-change-pwd-btn"
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md hover:scale-105 font-almodobar"
            title="Modifier le mot de passe du compte administrateur"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Sécurité & Mot de Passe</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['all', 'super_admin', 'creator', 'moderator', 'reader'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'all' && 'Tous'}
              {r === 'super_admin' && 'Super Admins'}
              {r === 'creator' && 'Créateurs'}
              {r === 'moderator' && 'Modérateurs'}
              {r === 'reader' && 'Lecteurs'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Utilisateur / Profil</th>
                <th className="px-5 py-4">Rôle</th>
                <th className="px-5 py-4">Solde Coins</th>
                <th className="px-5 py-4">Statut VIP</th>
                <th className="px-5 py-4">Origine & Activité</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.isBanned && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              Banni
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as UserAccount['role'])}
                      disabled={user.email === 'wilfriedcrea@gmail.com'}
                      className="bg-slate-950 border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="reader">Lecteur</option>
                      <option value="creator">Créateur / Auteur</option>
                      <option value="moderator">Modérateur</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        <span>{user.coinsBalance.toLocaleString('fr-FR')}</span>
                      </div>
                      <button
                        onClick={() => setAdjustingUser(user)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold"
                        title="Ajuster le solde"
                      >
                        ±
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleUserVip(user.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        user.isVip
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      <Crown className={`w-3.5 h-3.5 ${user.isVip ? 'fill-amber-400' : ''}`} />
                      <span>{user.isVip ? 'Pass VIP Actif' : 'Standard'}</span>
                    </button>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1 font-medium text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.country}</span>
                    </div>
                    <div className="text-[11px] mt-0.5 text-slate-500">
                      {user.readChaptersCount} chapitres lus
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleUserBan(user.id)}
                        disabled={user.email === 'wilfriedcrea@gmail.com'}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          user.isBanned
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        } disabled:opacity-30`}
                        title={user.isBanned ? 'Débannir' : 'Bannir'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Coins Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Ajuster Solde Coins : {adjustingUser.name}</span>
              </h3>
              <button onClick={() => setAdjustingUser(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Montant en Coins (Positif pour créditer, Négatif pour déduire)
                </label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-lg focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Motif de l'opération</label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="Ex: Récompense concours de fan-art, régularisation..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  Confirmer l'Ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0b0d14] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-almodobar">
                    Sécurité Administrateur
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compte : <span className="text-white font-mono">{adminUser.email}</span>
                  </p>
                </div>
              </div>
              <button 
                id="admin-close-pwd-modal-btn"
                onClick={() => { setShowPasswordModal(false); setPwdFeedback(null); }} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdFeedback && (
              <div 
                className={`mb-4 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                  pwdFeedback.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {pwdFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span className="font-medium">{pwdFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-almodobar">
                  Mot de passe actuel
                </label>
                <input
                  id="admin-current-pwd-input"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Saisissez le mot de passe actuel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Mot de passe par défaut d'origine : <code className="text-amber-300/80">OziAdmin2026!</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-almodobar">
                  Nouveau mot de passe
                </label>
                <input
                  id="admin-new-pwd-input"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-almodobar">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  id="admin-confirm-pwd-input"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le nouveau mot de passe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                <div className="font-bold text-slate-300 mb-0.5">Identifiants reconnus pour la connexion :</div>
                <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                  {adminCredentials.allowedUsernames.map(u => (
                    <span key={u} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPwdFeedback(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  id="admin-submit-pwd-change-btn"
                  type="submit"
                  disabled={isSubmittingPwd}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 font-almodobar"
                >
                  {isSubmittingPwd ? 'Mise à jour...' : 'Enregistrer le Mot de Passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
