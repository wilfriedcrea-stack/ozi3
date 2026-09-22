import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  KeyRound,
  ShieldAlert,
  Clock,
  Fingerprint
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';
import { checkLoginRateLimit } from '../../utils/securityUtils';
import { AdminPasswordModal } from './AdminPasswordModal';

export const AdminLoginPage: React.FC = () => {
  const { loginWithCredentials, setViewMode, openPasswordModal } = useData();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Poll rate limit status on mount and tick countdown
  useEffect(() => {
    const checkRate = checkLoginRateLimit();
    if (checkRate.isLocked && checkRate.remainingLockoutSeconds > 0) {
      setLockoutSeconds(checkRate.remainingLockoutSeconds);
    }

    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Veuillez renseigner à la fois votre identifiant et votre mot de passe administrateur.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWithCredentials(username, password, rememberMe);

      if (res.success) {
        setSuccessMessage("Accès vérifié ! Déverrouillage sécurisé du Studio OZI...");
      } else {
        if (res.isLocked && res.remainingSeconds) {
          setLockoutSeconds(res.remainingSeconds);
        }
        setErrorMessage(res.message || "Identifiants ou mot de passe invalides.");
      }
    } catch {
      setErrorMessage("Échec de la liaison de sécurité lors de l'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#ff5a50] selection:text-white">
      {/* Dynamic ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-[#ff5a50]/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-3">
          <OziLogo size="sm" showBadge={false} />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Console Verrouillée • v3.0</span>
          </div>
        </div>

        <button
          id="admin-login-back-btn"
          onClick={() => setViewMode('accueil')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all tap-active"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>
      </header>

      {/* Central Login Card */}
      <main className="w-full max-w-md my-auto z-10">
        <div className="bg-[#0a0c12] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 relative backdrop-blur-md">
          
          {/* Lock Icon & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-xl transition-all ${
              isLocked 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/20 animate-pulse'
                : 'bg-gradient-to-tr from-[#ff5a50]/20 to-amber-500/20 border-[#ff5a50]/30 text-[#ff5a50] shadow-[#ff5a50]/15'
            }`}>
              {isLocked ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-2 font-almodobar ${
              isLocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-[#ff5a50]/10 border-[#ff5a50]/30 text-[#ff6b5b]'
            }`}>
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{isLocked ? 'Accès Bloqué (Anti-Brute Force)' : 'Accès Restreint Administrateur'}</span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight font-almodobar">
              Portail Studio OZI
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Ce système est strictement réservé aux administrateurs autorisés. Toute action est enregistrée et auditée.
            </p>
          </div>

          {/* Feedback messages */}
          {isLocked && (
            <div 
              role="alert"
              className="mb-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in"
            >
              <Clock className="w-5 h-5 text-rose-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
              <div>
                <div className="font-bold text-rose-200">Verrouillage de protection actif</div>
                <div className="mt-0.5 text-[11px]">
                  Trop de tentatives erronées. Nouvelle tentative autorisée dans <span className="font-mono font-bold text-white text-sm">{lockoutSeconds}s</span>.
                </div>
              </div>
            </div>
          )}

          {!isLocked && errorMessage && (
            <div 
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div 
              role="status"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field: Username / Email */}
            <div>
              <label 
                htmlFor="admin-username-input" 
                className="block text-xs font-bold text-slate-300 mb-1.5 font-almodobar"
              >
                Identifiant ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  disabled={isLocked || isLoading}
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Saisissez votre identifiant administrateur"
                  className="w-full bg-[#11131c] border border-slate-800 focus:border-[#ff5a50] focus:ring-1 focus:ring-[#ff5a50] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="admin-password-input" 
                  className="block text-xs font-bold text-slate-300 font-almodobar"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked || isLoading}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[#11131c] border border-slate-800 focus:border-[#ff5a50] focus:ring-1 focus:ring-[#ff5a50] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 transition-colors outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Remember Me checkbox & Forgot/Change Password */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  id="admin-remember-me-checkbox"
                  type="checkbox"
                  disabled={isLocked}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#ff5a50] focus:ring-[#ff5a50] focus:ring-offset-slate-950"
                />
                <span className="text-xs text-slate-300">Rester connecté</span>
              </label>

              <button
                id="admin-login-change-pwd-btn"
                type="button"
                onClick={openPasswordModal}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 font-almodobar"
              >
                <KeyRound className="w-3 h-3" />
                <span>Changer mot de passe</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading || isLocked}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all font-almodobar ${
                isLocked 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#ff5a50] via-orange-500 to-amber-500 hover:from-[#ff4438] hover:to-amber-400 text-white shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Vérification cryptographique...</span>
                </>
              ) : isLocked ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Verrouillé ({lockoutSeconds}s)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Déverrouiller le Studio OZI</span>
                </>
              )}
            </button>
          </form>

          {/* Security Features Overview */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/90 flex flex-col gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-almodobar">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sécurité & Verrouillage Incontournable</span>
              </div>
              <ul className="space-y-1 text-[10.5px] text-slate-400">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>Hachage salé SHA-256 avec protection contre les attaques par dictionnaire</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>Verrouillage automatique après 5 tentatives infructueuses</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>Signature cryptographique de session & déconnexion d'inactivité (30 min)</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Security Note */}
      <footer className="w-full max-w-5xl py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Protection SSL • Sessions Signées HMAC SHA-256</span>
        </div>
        <span>OZI Webtoon & Manga Platform • Système de Sécurité v3.0</span>
      </footer>

      {/* Password Change Modal */}
      <AdminPasswordModal />
    </div>
  );
};

export default AdminLoginPage;
