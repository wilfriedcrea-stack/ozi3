import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X,
  Search,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';

export const Navbar: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    currentUser, 
    readerProfile, 
    isReaderAuthLoading, 
    openAuthModal, 
    openProfileModal, 
    logoutReader 
  } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigateTo = (mode: 'accueil' | 'oeuvres' | 'artistes' | 'articles' | 'recherche' | 'admin') => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const readerDisplayName = readerProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Lecteur OZI';
  const readerPhotoURL = currentUser?.photoURL || readerProfile?.photoURL;

  return (
    <header 
      id="main-navbar"
      className="sticky top-0 z-40 w-full h-20 sm:h-22 bg-[#141418] border-none shadow-none transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center justify-start">
          <button 
            onClick={() => navigateTo('accueil')}
            id="brand-logo-link"
            className="flex items-center focus:outline-none shrink-0 cursor-pointer py-1"
            title="OZI - Accueil"
          >
            <OziLogo size="md" showSubtitle={false} />
          </button>
        </div>

        {/* Center: Centered Navigation (Accueil, Œuvres, Artistes, Articles) */}
        <nav 
          id="desktop-primary-nav"
          className="hidden md:flex items-center justify-center gap-8 lg:gap-11"
        >
          {/* 1. Accueil */}
          <button 
            id="nav-link-accueil"
            onClick={() => navigateTo('accueil')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              viewMode === 'accueil'
                ? 'text-[#ff8679]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Accueil
          </button>

          {/* 2. Œuvres */}
          <button 
            id="nav-link-oeuvres"
            onClick={() => navigateTo('oeuvres')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              viewMode === 'oeuvres'
                ? 'text-[#ff8679]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Œuvres
          </button>

          {/* 3. Artistes */}
          <button 
            id="nav-link-artistes"
            onClick={() => navigateTo('artistes')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              ['artistes', 'artiste-detail', 'artbook-detail'].includes(viewMode)
                ? 'text-[#ff8679]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Artistes
          </button>

          {/* 4. Articles */}
          <button 
            id="nav-link-articles"
            onClick={() => navigateTo('articles')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              viewMode === 'articles'
                ? 'text-[#ff8679]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Articles
          </button>
        </nav>

        {/* Right Side: Search Button, Auth State & Mobile Hamburger */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Desktop Search Button */}
          <button
            id="nav-search-btn"
            onClick={() => navigateTo('recherche')}
            className={`hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
              viewMode === 'recherche'
                ? 'bg-[#ff8679]/15 text-[#ff8679] border-[#ff8679]/50 shadow-sm shadow-[#ff8679]/10'
                : 'bg-[#1a1b22] hover:bg-[#22232c] text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
            }`}
            title="Rechercher une œuvre, un auteur, un article"
          >
            <Search className={`w-4 h-4 ${viewMode === 'recherche' ? 'text-[#ff8679]' : 'text-zinc-400'}`} />
            <span className="font-semibold">Recherche</span>
          </button>

          {/* Desktop Reader Auth Area */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            {isReaderAuthLoading ? (
              <div className="w-28 h-9 rounded-xl bg-zinc-900/60 animate-pulse border border-zinc-800" />
            ) : currentUser ? (
              /* User logged in: Avatar & Dropdown */
              <div>
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-[#1a1b22] hover:bg-[#22232c] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5 shrink-0">
                    {readerPhotoURL ? (
                      <img 
                        src={readerPhotoURL} 
                        alt="" 
                        className="w-full h-full object-cover rounded-full bg-zinc-900" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black text-[#ff8679]">
                        {readerDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate max-w-[110px]">
                    {readerDisplayName}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#141418] border border-[#242436] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-zinc-800 mb-1">
                      <div className="text-xs font-bold text-white truncate">{readerDisplayName}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
                    </div>

                    <button
                      onClick={() => { setUserDropdownOpen(false); openProfileModal(); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#ff8679]" />
                      <span>Mon Profil</span>
                    </button>

                    <button
                      onClick={() => { setUserDropdownOpen(false); openProfileModal(); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#fb923c]" />
                      <span>Mes Abonnements</span>
                    </button>

                    <div className="h-px bg-zinc-800 my-1" />

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logoutReader();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* User logged out: "Se connecter" button */
              <button
                id="nav-login-btn"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#ff8679]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans"
              >
                <User className="w-3.5 h-3.5" />
                <span>Se connecter</span>
              </button>
            )}
          </div>

          {/* Mobile Search Button */}
          <button
            id="nav-mobile-search-btn"
            onClick={() => navigateTo('recherche')}
            className={`md:hidden p-2 rounded-lg text-zinc-300 hover:text-white focus:outline-none cursor-pointer transition-colors ${
              viewMode === 'recherche' ? 'text-[#ff8679] bg-[#ff8679]/10' : ''
            }`}
            aria-label="Rechercher"
            title="Rechercher"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile User Icon Button (direct access to Auth or Profile) */}
          <button
            onClick={() => {
              if (currentUser) {
                openProfileModal();
              } else {
                openAuthModal('login');
              }
            }}
            className="md:hidden p-2 rounded-lg text-zinc-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label={currentUser ? 'Profil lecteur' : 'Se connecter'}
          >
            {currentUser ? (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5">
                {readerPhotoURL ? (
                  <img src={readerPhotoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-[#ff8679]">
                    {readerDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <User className="w-5 h-5 text-[#ff8679]" />
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            id="nav-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Flat Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-drawer-menu"
          className="md:hidden bg-[#121216] border-b border-[#22232b] px-5 py-4 flex flex-col gap-3 animate-in slide-in-from-top duration-150 shadow-2xl"
        >
          <button
            onClick={() => navigateTo('accueil')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'accueil' ? 'text-[#ff8679]' : 'text-zinc-200'
            }`}
          >
            Accueil
          </button>

          <button
            onClick={() => navigateTo('oeuvres')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'oeuvres' ? 'text-[#ff8679]' : 'text-zinc-200'
            }`}
          >
            Œuvres
          </button>

          <button
            onClick={() => navigateTo('artistes')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              ['artistes', 'artiste-detail', 'artbook-detail'].includes(viewMode) ? 'text-[#ff8679]' : 'text-zinc-200'
            }`}
          >
            Artistes & Artbooks
          </button>

          <button
            onClick={() => navigateTo('articles')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'articles' ? 'text-[#ff8679]' : 'text-zinc-200'
            }`}
          >
            Articles
          </button>

          <button
            onClick={() => navigateTo('recherche')}
            className={`flex items-center justify-center gap-2 text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'recherche' ? 'text-[#ff8679]' : 'text-zinc-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Recherche</span>
          </button>

          {/* Mobile Auth Drawer Section */}
          <div className="pt-2">
            {currentUser ? (
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5 shrink-0">
                    {readerPhotoURL ? (
                      <img src={readerPhotoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black text-[#ff8679]">
                        {readerDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{readerDisplayName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openProfileModal(); }}
                    className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white text-center cursor-pointer"
                  >
                    Mon Profil
                  </button>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logoutReader();
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-950/60 text-xs font-bold text-center cursor-pointer"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-3 rounded-2xl bg-[#ff8679] hover:bg-[#eb6e60] text-white font-bold text-sm shadow-md shadow-[#ff8679]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Se connecter / S'inscrire</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
