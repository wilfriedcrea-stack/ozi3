import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  X, 
  Lock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminPasswordModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const { 
    isPasswordModalOpen, 
    setIsPasswordModalOpen, 
    changeAdminPassword, 
    adminUser, 
    adminAuth 
  } = useData();

  const isAuthenticated = Boolean(adminAuth?.isAuthenticated);

  const isOpen = propIsOpen !== undefined ? propIsOpen : isPasswordModalOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    setIsPasswordModalOpen(false);
    setFeedback(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuperAdminDirect, setIsSuperAdminDirect] = useState(isAuthenticated && adminUser.role === 'Super Admin');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({
        success: false,
        message: "Pour garantir une sécurité optimale, le nouveau mot de passe doit comporter au moins 8 caractères."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        success: false,
        message: "La confirmation ne correspond pas au nouveau mot de passe saisi."
      });
      return;
    }

    if (!isSuperAdminDirect && !currentPassword.trim()) {
      setFeedback({
        success: false,
        message: "Veuillez renseigner votre mot de passe actuel ou activer le mode Super-Admin direct."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await changeAdminPassword(currentPassword, newPassword, isSuperAdminDirect);
      if (res.success) {
        setFeedback({
          success: true,
          message: res.message || "Mot de passe administrateur mis à jour avec succès !"
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setFeedback({
          success: false,
          message: res.message || "Échec de la modification du mot de passe."
        });
      }
    } catch {
      setFeedback({
        success: false,
        message: "Une erreur inattendue est survenue lors de l'enregistrement du mot de passe."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="admin-password-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="admin-password-modal-content"
        className="bg-[#0b0d14] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/90 relative overflow-hidden"
      >
        {/* Glow ambient accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg tracking-tight font-heading">
                Modifier le Mot de Passe
              </h3>
              <p className="text-xs text-slate-400 font-body">
                Console Administrateur OZI • {adminUser.email}
              </p>
            </div>
          </div>
          <button 
            id="admin-password-modal-close-btn"
            onClick={handleClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Feedback Banner */}
        {feedback && (
          <div 
            id="admin-password-feedback"
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in duration-150 ${
              feedback.success 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="font-semibold leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Super Admin Direct Mode toggle (if logged in as Super Admin) */}
          {isAuthenticated && adminUser.role === 'Super Admin' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-200 font-medium">
                  Mode Super-Admin direct (vérifié via session active)
                </span>
              </div>
              <input
                id="super-admin-direct-toggle"
                type="checkbox"
                checked={isSuperAdminDirect}
                onChange={(e) => setIsSuperAdminDirect(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                title="Modifier sans réécrire l'ancien mot de passe grâce à votre session Super Admin vérifiée"
              />
            </div>
          )}

          {/* Current Password Field (only shown if not in direct super admin mode) */}
          {!isSuperAdminDirect && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-heading">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  id="admin-modal-current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  required={!isSuperAdminDirect}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe actuel"
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-4 pr-11 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Mot de passe initial par défaut : <span className="text-amber-400">OziAdmin2026!</span>
              </p>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 font-heading">
                Nouveau mot de passe
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {newPassword.length} / 8 min
              </span>
            </div>
            <div className="relative">
              <input
                id="admin-modal-new-pwd"
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-4 pr-11 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 font-heading">
                Confirmer le nouveau mot de passe
              </label>
              {newPassword.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isMatching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {isMatching ? 'Correspond' : 'Différent'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="admin-modal-confirm-pwd"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau mot de passe"
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-4 pr-11 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-200">Sécurité & Synchronisation Cloud :</span>
              <p className="text-[10.5px] leading-relaxed">
                Le nouveau mot de passe est haché en SHA-256 avec sel cryptographique, synchronisé avec Firestore et la session actuelle reste active sans coupure.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              id="admin-modal-cancel-btn"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              id="admin-modal-save-pwd-btn"
              type="submit"
              disabled={isSubmitting || !isMinLength || !isMatching}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none font-heading"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Enregistrement sécurisé...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Enregistrer le Mot de Passe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
