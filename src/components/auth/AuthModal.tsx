import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  KeyRound
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { isValidEmail } from '../../services/authService';
import { OziLogo } from '../common/OziLogo';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalInitialTab, 
    signInReaderWithGoogle, 
    signInReaderWithEmail, 
    signUpReaderWithEmail, 
    sendReaderPasswordReset 
  } = useData();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab with initial prop when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalInitialTab || 'login');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isAuthModalOpen, authModalInitialTab]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await signInReaderWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Impossible de se connecter avec Google.');
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors de la connexion Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Format d\'adresse e-mail invalide. Exemple : lecteur@domaine.com');
      return;
    }

    if (activeTab === 'forgot') {
      setIsLoading(true);
      try {
        const res = await sendReaderPasswordReset(cleanEmail);
        if (res.success) {
          setSuccessMessage('Un e-mail contenant un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.');
        } else {
          setErrorMessage(res.error || 'Impossible d\'envoyer l\'e-mail de réinitialisation.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Veuillez renseigner votre mot de passe.');
      return;
    }

    if (activeTab === 'register') {
      const cleanName = displayName.trim();
      if (!cleanName) {
        setErrorMessage('Veuillez choisir un pseudonyme de lecteur.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Les deux mots de passe ne correspondent pas.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await signUpReaderWithEmail(cleanName, cleanEmail, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Échec de l\'inscription.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Login mode
    setIsLoading(true);
    try {
      const res = await signInReaderWithEmail(cleanEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Échec de la connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className="relative w-full max-w-md bg-[#141418] border border-[#242436] rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#ff8679]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#ff8679]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer la modale"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <OziLogo size="md" showSubtitle={false} />
          <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black text-white mt-3 font-almodobar tracking-tight">
            {activeTab === 'login' && 'Espace Lecteur OZI'}
            {activeTab === 'register' && 'Rejoindre la communauté OZI'}
            {activeTab === 'forgot' && 'Réinitialiser votre mot de passe'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            {activeTab === 'login' && 'Connectez-vous pour retrouver vos lectures et vos favoris.'}
            {activeTab === 'register' && 'Créez votre compte gratuit en quelques secondes.'}
            {activeTab === 'forgot' && 'Entrez votre e-mail pour recevoir un lien de réinitialisation.'}
          </p>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {activeTab !== 'forgot' && (
          <div className="flex items-center p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-[#ff8679] text-white shadow-md shadow-[#ff8679]/20' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-[#ff8679] text-white shadow-md shadow-[#ff8679]/20' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Créer un compte
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Google One-Click Auth */}
        {activeTab !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 shadow-md active:scale-[0.98]"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continuer avec Google</span>
            </button>

            <div className="flex items-center my-5 gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">ou avec e-mail</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          </>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Pseudonym (Register only) */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Pseudonyme *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ex: Kweku_Reader"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Adresse e-mail *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password (Login & Register) */}
          {activeTab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Mot de passe *
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                    className="text-[11px] text-[#ff8679] hover:text-[#eb6e60] transition-colors cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-[#ff8679] text-white text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#ff8679] hover:bg-[#eb6e60] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff8679]/25 hover:shadow-[#ff8679]/40 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>
                  {activeTab === 'login' && 'Se connecter'}
                  {activeTab === 'register' && 'Créer mon compte'}
                  {activeTab === 'forgot' && 'Envoyer le lien'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Login if on Forgot Tab */}
        {activeTab === 'forgot' && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(null); setSuccessMessage(null); }}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
