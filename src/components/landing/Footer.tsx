import React from 'react';
import { 
  Layers, 
  Globe, 
  ShieldCheck, 
  ArrowUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';

export const Footer: React.FC = () => {
  const { setViewMode, appVersion } = useData();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (mode: 'accueil' | 'oeuvres' | 'articles' | 'recherche' | 'admin', anchorId?: string) => {
    setViewMode(mode);
    setTimeout(() => {
      if (anchorId) {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <footer className="bg-[#07080c] border-t border-slate-800/80 pt-16 pb-12 text-slate-400 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Bio (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start gap-4">
            <OziLogo size="md" />

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm font-body">
              OZI est la vitrine officielle et l'application mobile dédiée à la lecture immersive de webtoons, mangas et bandes dessinées. Propulsée par le Studio Créateur et synchronisée en temps réel.
            </p>

            {/* Hosting Domain Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d0e15] border border-slate-800 text-xs text-slate-300">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Hébergé sur domaine officiel sécurisé</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-almodobar">Pages & Navigation</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-body">
              <li>
                <button onClick={() => navigateTo('accueil')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('oeuvres')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Œuvres & Catalogue
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('articles')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Articles & Carnets de Création
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('recherche')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Recherche globale
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('accueil', 'section-teasers')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Bandes-Annonces & Teasers
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('accueil', 'section-download')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Téléchargement APK Android ({appVersion.version})
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('accueil', 'section-creators')} className="hover:text-[#ff6b5b] transition-colors cursor-pointer">
                  Espace Créateurs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Studio & Tech (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-almodobar">Espace Professionnel</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-body">
              Vous êtes administrateur, éditeur ou créateur de séries ? Accédez au studio grand écran pour publier de nouveaux épisodes et gérer le catalogue.
            </p>

            <button
              id="footer-admin-btn"
              onClick={() => navigateTo('admin')}
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#0d0e15] hover:bg-[#161724] text-[#ff6b5b] font-bold text-xs border border-[#ff5a50]/40 shadow-lg glow-ozi transition-all hover:scale-[1.02] font-almodobar cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#ff5a50]" />
              <span>Ouvrir le Grand Panneau d'Administration / Studio</span>
            </button>
          </div>

        </div>

        {/* Bottom copyright & Scroll to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-body">
            <span>© {new Date().getFullYear()} OZI Plateforme. Tous droits réservés.</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Firestore Cloud Sync
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#ff6b5b] transition-colors font-bold font-almodobar cursor-pointer"
          >
            <span>Haut de page</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
