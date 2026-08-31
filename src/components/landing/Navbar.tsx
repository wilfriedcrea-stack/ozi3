import React, { useState } from 'react';
import { 
  Menu, 
  X,
  Search
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';

export const Navbar: React.FC = () => {
  const { viewMode, setViewMode } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (mode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin') => {
    setMobileMenuOpen(false);
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      id="main-navbar"
      className="sticky top-0 z-40 w-full h-20 sm:h-22 bg-[#141418] border-b border-[#1e1f26] shadow-md transition-colors duration-200"
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

        {/* Center: Centered Navigation (Accueil, Œuvres, Articles) */}
        <nav 
          id="desktop-primary-nav"
          className="hidden md:flex items-center justify-center gap-10 lg:gap-14"
        >
          {/* 1. Accueil */}
          <button 
            id="nav-link-accueil"
            onClick={() => navigateTo('accueil')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              viewMode === 'accueil'
                ? 'text-[#ff5a50]'
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
                ? 'text-[#ff5a50]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Œuvres
          </button>

          {/* 3. Articles */}
          <button 
            id="nav-link-articles"
            onClick={() => navigateTo('articles')}
            className={`text-base font-semibold tracking-normal transition-colors py-2 focus:outline-none cursor-pointer ${
              viewMode === 'articles'
                ? 'text-[#ff5a50]'
                : 'text-[#d4d4d8] hover:text-white'
            }`}
          >
            Articles
          </button>
        </nav>

        {/* Right Side: Search Button & Mobile Hamburger */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Desktop Search Button */}
          <button
            id="nav-search-btn"
            onClick={() => navigateTo('recherche')}
            className={`hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
              viewMode === 'recherche'
                ? 'bg-[#ff5a50]/15 text-[#ff5a50] border-[#ff5a50]/50 shadow-sm shadow-[#ff5a50]/10'
                : 'bg-[#1a1b22] hover:bg-[#22232c] text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
            }`}
            title="Rechercher une œuvre, un auteur, un article"
          >
            <Search className={`w-4 h-4 ${viewMode === 'recherche' ? 'text-[#ff5a50]' : 'text-zinc-400'}`} />
            <span className="font-semibold">Recherche</span>
          </button>

          {/* Mobile Search Button */}
          <button
            id="nav-mobile-search-btn"
            onClick={() => navigateTo('recherche')}
            className={`md:hidden p-2 rounded-lg text-zinc-300 hover:text-white focus:outline-none cursor-pointer transition-colors ${
              viewMode === 'recherche' ? 'text-[#ff5a50] bg-[#ff5a50]/10' : ''
            }`}
            aria-label="Rechercher"
            title="Rechercher"
          >
            <Search className="w-5 h-5" />
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
              viewMode === 'accueil' ? 'text-[#ff5a50]' : 'text-zinc-200'
            }`}
          >
            Accueil
          </button>

          <button
            onClick={() => navigateTo('oeuvres')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'oeuvres' ? 'text-[#ff5a50]' : 'text-zinc-200'
            }`}
          >
            Œuvres
          </button>

          <button
            onClick={() => navigateTo('articles')}
            className={`text-center py-2.5 text-base font-semibold border-b border-zinc-800/60 ${
              viewMode === 'articles' ? 'text-[#ff5a50]' : 'text-zinc-200'
            }`}
          >
            Articles
          </button>

          <button
            onClick={() => navigateTo('recherche')}
            className={`flex items-center justify-center gap-2 text-center py-2.5 text-base font-semibold ${
              viewMode === 'recherche' ? 'text-[#ff5a50]' : 'text-zinc-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Recherche</span>
          </button>
        </div>
      )}
    </header>
  );
};
