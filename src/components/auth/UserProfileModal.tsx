import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  CreditCard, 
  Edit3, 
  Check, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const UserProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    closeProfileModal, 
    currentUser, 
    readerProfile, 
    logoutReader, 
    updateReaderProfileData 
  } = useData();

  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (readerProfile?.displayName) {
      setEditedName(readerProfile.displayName);
    } else if (currentUser?.displayName) {
      setEditedName(currentUser.displayName);
    }
  }, [readerProfile, currentUser]);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    if (!isProfileModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, closeProfileModal]);

  if (!isProfileModalOpen || !currentUser) return null;

  const displayName = readerProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Lecteur OZI';
  const email = currentUser.email || readerProfile?.email || 'Non renseigné';
  const photoURL = currentUser.photoURL || readerProfile?.photoURL;
  const createdAt = readerProfile?.createdAt 
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(readerProfile.createdAt))
    : 'Récemment';

  const handleSaveName = async () => {
    const clean = editedName.trim();
    if (!clean) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await updateReaderProfileData({ displayName: clean });
      if (res.success) {
        setIsEditing(false);
        setFeedback('Pseudonyme mis à jour avec succès.');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(res.error || 'Erreur lors de la mise à jour.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutReader();
    closeProfileModal();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeProfileModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div 
        className="relative w-full max-w-md bg-[#141418] border border-[#242436] rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#ff8679]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Card Top */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5 shadow-xl mb-3">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={displayName} 
                className="w-full h-full object-cover rounded-full bg-zinc-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black text-[#ff8679]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & Edit Form */}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1 mb-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-[#ff8679] text-white text-sm font-bold text-center focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-2 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white cursor-pointer disabled:opacity-50"
                title="Enregistrer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 id="profile-modal-title" className="text-xl font-black text-white tracking-tight">
                {displayName}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-zinc-400 hover:text-[#ff8679] transition-colors cursor-pointer"
                title="Modifier le pseudonyme"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-zinc-400 mt-0.5">{email}</p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compte Lecteur Vérifié</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Informations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'subscriptions' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mes Abonnements
          </button>
        </div>

        {feedback && (
          <div className="mb-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 text-center animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* TAB 1: Profile Information */}
        {activeTab === 'profile' && (
          <div className="space-y-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>Membre depuis</span>
              </span>
              <strong className="text-zinc-200">{createdAt}</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-500" />
                <span>Statut plateforme</span>
              </span>
              <span className="text-zinc-300 font-medium">Lecteur OZI</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-500" />
                <span>Identifiant unique (UID)</span>
              </span>
              <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[140px]" title={currentUser.uid}>
                {currentUser.uid}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Subscriptions (Reserved Space for Paystack) */}
        {activeTab === 'subscriptions' && (
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ff8679]/10 border border-[#ff8679]/20 flex items-center justify-center text-[#ff8679] mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Abonnements Premium par Œuvre</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Emplacement réservé — Le système de paiement Paystack (2 000 FCFA / 30 jours par œuvre) sera activé prochainement.
              </p>
            </div>
            <div className="text-[11px] text-zinc-500 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
              Aucun abonnement en cours pour le moment.
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
