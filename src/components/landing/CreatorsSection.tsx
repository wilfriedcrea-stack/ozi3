import React, { useState } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  Globe, 
  Send, 
  CheckCircle2, 
  Palette, 
  HeartHandshake
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SeriesGenre } from '../../types';

const GENRES: SeriesGenre[] = [
  'Afro-Fantasy',
  'Sci-Fi & Cyberpunk',
  'Action & Shonen',
  'Romance & Drame',
  'Mythologie & Histoire',
  'Thriller & Mystère',
  'Arts Martiaux',
  'Jeunesse & Aventure'
];

export const CreatorsSection: React.FC = () => {
  const { submitCreatorProject } = useData();
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    creatorName: '',
    email: '',
    phone: '',
    country: 'Côte d\'Ivoire',
    seriesTitle: '',
    genre: 'Afro-Fantasy' as SeriesGenre,
    pitch: '',
    portfolioUrl: '',
    samplePagesUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.creatorName || !formData.email || !formData.seriesTitle || !formData.pitch) return;
    
    setSubmitting(true);
    await submitCreatorProject(formData);
    setSubmitting(false);
    setFormSent(true);

    setTimeout(() => {
      setFormData({
        creatorName: '',
        email: '',
        phone: '',
        country: 'Côte d\'Ivoire',
        seriesTitle: '',
        genre: 'Afro-Fantasy',
        pitch: '',
        portfolioUrl: '',
        samplePagesUrl: ''
      });
      setFormSent(false);
    }, 6000);
  };

  return (
    <section id="section-creators" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff5a50]/15 border border-[#ff5a50]/30 text-[#ff6b5b] text-xs font-bold uppercase tracking-wider mb-4 font-almodobar">
            <Sparkles className="w-4 h-4" />
            <span>Studio Créateurs & Auteurs OZI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-almodobar">
            Donnez Vie à Vos Histoires
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-body">
            Rejoignez la communauté de créateurs de webtoons et mangas. Rémunération transparente, liberté éditoriale et audience passionnée.
          </p>
        </div>

        {/* 3 Pillars for Creators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-8 rounded-3xl bg-[#0d0e15] border border-slate-800 flex flex-col items-start shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 font-almodobar">70% de Partage de Revenus</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-body">
              Vos créations vous appartiennent. Touchez la majorité des revenus générés par vos lecteurs et vos épisodes.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0d0e15] border border-slate-800 flex flex-col items-start shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5a50]/10 border border-[#ff5a50]/25 text-[#ff6b5b] flex items-center justify-center mb-6">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 font-almodobar">Audience Mondiale</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-body">
              Faites rayonner vos planches auprès de dizaines de milliers de passionnés de webtoons et de bandes dessinées.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#0d0e15] border border-slate-800 flex flex-col items-start shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-6">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 font-almodobar">Studio Grand Écran Dédié</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-body">
              Téléversez vos épisodes, organisez vos planches et suivez vos statistiques de lecture en temps réel depuis le panneau OZI.
            </p>
          </div>
        </div>

        {/* Creator Application Form Box */}
        <div className="rounded-3xl bg-[#0d0e15] border border-slate-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a50]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left pitch */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ff6b5b] mb-2 font-heading">
                  <HeartHandshake className="w-4 h-4" />
                  <span>Appel à Projets Ouvert</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4 font-almodobar">
                  Soumettez Votre Projet de Webtoon / BD
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-body">
                  Vous avez un synopsis captivant, quelques planches esquissées ou une saga déjà prête ? Remplissez ce formulaire. Notre comité éditorial examine chaque proposition avec attention.
                </p>

                <div className="space-y-3 text-xs text-slate-400 mb-6 font-body">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff5a50]" />
                    <span>Réponse éditoriale sous 5 jours ouvrés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff5a50]" />
                    <span>Accompagnement scénaristique et colorimétrique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ff5a50]" />
                    <span>Contrats transparents et protection des droits d'auteur</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#07080c] border border-slate-800 text-xs text-slate-400 font-body">
                💡 <strong className="text-slate-200">Conseil :</strong> Incluez un lien vers votre portfolio (ArtStation, Instagram, Behance ou Google Drive avec planches).
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7">
              {formSent ? (
                <div className="p-8 rounded-3xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-center flex flex-col items-center gap-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black text-white font-almodobar">Candidature Enregistrée !</h4>
                  <p className="text-sm text-emerald-300 max-w-md leading-relaxed font-body">
                    Merci pour votre soumission. Votre projet a été transmis directement au Studio Créateur OZI. Notre équipe éditoriale vous contactera par email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Nom / Pseudo d'Artiste *</label>
                    <input
                      type="text"
                      required
                      value={formData.creatorName}
                      onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                      placeholder="Ex: Tidiane Traoré"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Email de Contact *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre.email@domaine.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Pays de Résidence</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Ex: Sénégal, Côte d'Ivoire, Cameroun, France..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Genre Principal du Projet</label>
                    <select
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value as SeriesGenre })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-[#ff5a50] font-heading"
                    >
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Titre Provisoire de la Série *</label>
                    <input
                      type="text"
                      required
                      value={formData.seriesTitle}
                      onChange={(e) => setFormData({ ...formData, seriesTitle: e.target.value })}
                      placeholder="Ex: Chroniques de la Terre d'Or"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Pitch & Synopsis de l'Histoire *</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.pitch}
                      onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                      placeholder="Résumez l'univers, le conflit central et le personnage principal en quelques lignes..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Lien Portfolio / Planches (Google Drive, ArtStation, Instagram...)</label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ozi-primary hover:opacity-95 text-white font-black text-xs shadow-lg glow-ozi transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 font-almodobar tap-active"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Envoi en cours...' : 'Envoyer mon Projet de Série à OZI'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
