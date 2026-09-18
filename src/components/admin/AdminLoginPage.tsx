import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';

export const AdminLoginPage: React.FC = () => {
  const { loginWithCredentials, setViewMode } = useData();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Veuillez saisir à la fois un nom d'utilisateur et un mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate short authenticating transition for smooth UX
      const res = await loginWithCredentials(username, password, rememberMe);

      if (res.success) {
        setSuccessMessage("Authentification réussie ! Accès au Studio en cours...");
      } else {
        setErrorMessage(res.message || "Identifiants invalides. Veuillez vérifier vos accès administrateur.");
      }
    } catch {
      setErrorMessage("Une erreur est survenue lors de la tentative de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-[#ff5a50] selection:text-white">
      {/* Subtle background ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#ff5a50]/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-3">
          <OziLogo size="sm" showBadge={false} />
          <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            Console Sécurisée
          </span>
        </div>

        <button
          id="admin-login-back-btn"
          onClick={() => setViewMode('accueil')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all tap-active"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au site</span>
        </button>
      </header>

      {/* Central Login Card */}
      <main className="w-full max-w-md my-auto z-10">
        <div className="bg-[#0b0d14] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative backdrop-blur-sm">
          
          {/* Lock Icon & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff5a50]/20 to-amber-500/20 border border-[#ff5a50]/30 flex items-center justify-center text-[#ff5a50] mb-4 shadow-lg shadow-[#ff5a50]/10">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a50]/10 border border-[#ff5a50]/30 text-[#ff6b5b] text-[11px] font-bold uppercase tracking-wider mb-2 font-almodobar">
              <Lock className="w-3 h-3" />
              <span>Accès Protégé Administrateur</span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight font-almodobar">
              Connexion au Studio OZI
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Veuillez entrer vos identifiants administrateur pour gérer le catalogue, les chapitres et les utilisateurs.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
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
                Nom d'utilisateur ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="wilfriedcrea@gmail.com ou admin"
                  className="w-full bg-[#12141f] border border-slate-800 focus:border-[#ff5a50] focus:ring-1 focus:ring-[#ff5a50] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors outline-none"
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#12141f] border border-slate-800 focus:border-[#ff5a50] focus:ring-1 focus:ring-[#ff5a50] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  id="admin-remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#ff5a50] focus:ring-[#ff5a50] focus:ring-offset-slate-950"
                />
                <span className="text-xs text-slate-300">Rester connecté sur cet appareil</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5a50] via-orange-500 to-amber-500 hover:from-[#ff4438] hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none font-almodobar"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Vérification des accès...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Déverrouiller le Studio OZI</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance Box for Administrator */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-almodobar">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accès Propriétaire OZI</span>
              </div>
              <p className="leading-normal">
                Utilisez votre compte <span className="font-mono text-slate-200">wilfriedcrea@gmail.com</span> ou <span className="font-mono text-slate-200">admin</span> avec votre mot de passe administrateur pour vous connecter.
              </p>
              <div className="text-[10px] text-slate-500 mt-1">
                Mot de passe initial par défaut : <code className="text-amber-300/80 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">OziAdmin2026!</code> (modifiable dans l'espace utilisateurs).
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Security Note */}
      <footer className="w-full max-w-5xl py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Protection SSL • Chiffrement SHA-256</span>
        </div>
        <span>OZI Webtoon & Manga Platform • Système de Sécurité v2.4</span>
      </footer>
    </div>
  );
};

export default AdminLoginPage;
