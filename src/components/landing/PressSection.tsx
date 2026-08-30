import React, { useState, useMemo } from 'react';
import { 
  Newspaper, 
  Download, 
  FileText, 
  Mail, 
  CheckCircle2, 
  Calendar, 
  Send,
  X,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PressRelease, MediaKitAsset } from '../../types';

export const PressSection: React.FC = () => {
  const { pressReleases, mediaKit } = useData();
  const [selectedPress, setSelectedPress] = useState<PressRelease | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [pressFormSent, setPressFormSent] = useState(false);
  const [pressContact, setPressContact] = useState({
    name: '',
    outlet: '',
    email: '',
    message: ''
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Tous');
    pressReleases.forEach(pr => cats.add(pr.category));
    return Array.from(cats);
  }, [pressReleases]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Tous') return pressReleases;
    return pressReleases.filter(pr => pr.category === selectedCategory);
  }, [pressReleases, selectedCategory]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pressContact.email || !pressContact.name) return;
    setPressFormSent(true);
    setTimeout(() => {
      setPressContact({ name: '', outlet: '', email: '', message: '' });
      setPressFormSent(false);
    }, 5000);
  };

  const handleDownloadAsset = (asset: MediaKitAsset) => {
    const element = document.createElement('a');
    const file = new Blob([
      `OZI Brand Media Kit Asset: ${asset.name}\nCatégorie: ${asset.category}\nFormat: ${asset.format}\nRésolution: ${asset.resolution}\n\nMerci d'utiliser les visuels officiels OZI sous réserve des droits de marque.`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `OZI-${asset.name.replace(/[^a-z0-9]/gi, '_')}.${asset.format.toLowerCase() === 'svg' ? 'svg' : 'txt'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section id="section-articles" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative">
      {/* Anchor alias for press links */}
      <span id="section-press" className="absolute -top-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-bold uppercase tracking-wider mb-3 font-almodobar">
              <Newspaper className="w-3.5 h-3.5" />
              <span>Articles, Carnets & Actualités</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-almodobar">
              Carnets de Création & Presse OZI
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl font-body">
              Interviews des dessinateurs, analyses de récits, coulisses des univers graphiques et communiqués officiels de la plateforme.
            </p>
          </div>

          <button
            onClick={() => {
              if (mediaKit.length > 0) handleDownloadAsset(mediaKit[1]);
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-ozi-primary hover:opacity-95 text-white font-black text-xs shadow-lg glow-ozi transition-all hover:scale-105 shrink-0 font-almodobar tap-active"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le Dossier de Presse (PDF)</span>
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all tap-active font-heading ${
                selectedCategory === cat
                  ? 'bg-ozi-primary text-white shadow-lg glow-ozi scale-105'
                  : 'bg-[#0d0e15] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2-Column Grid: Articles & Media Kit Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Left Column: Official Articles & News Cards */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2 font-almodobar mb-2">
              <FileText className="w-5 h-5 text-[#ff5a50]" />
              <span>Dernières Publications & Carnets</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredArticles.map((pr) => (
                <div
                  key={pr.id}
                  id={`article-card-${pr.id}`}
                  onClick={() => setSelectedPress(pr)}
                  className="rounded-3xl bg-[#0d0e15] border border-slate-800 hover:border-[#ff5a50]/50 transition-all duration-300 cursor-pointer group shadow-xl flex flex-col overflow-hidden tap-active hover:-translate-y-1"
                >
                  {/* Article cover image */}
                  {pr.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden bg-[#07080c]">
                      <img 
                        src={pr.imageUrl} 
                        alt={pr.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#07080c]/80 backdrop-blur-md text-[#ff6b5b] border border-[#ff5a50]/30 font-heading">
                        {pr.category}
                      </span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2.5 font-body">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{pr.date}</span>
                        </div>
                        {pr.readTime && (
                          <div className="flex items-center gap-1 text-slate-400 font-mono">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{pr.readTime}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-base font-black text-white group-hover:text-[#ffd4cf] transition-colors mb-2 line-clamp-2 leading-snug font-almodobar">
                        {pr.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 font-body">
                        {pr.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                      <span className="text-slate-400 text-[11px] truncate max-w-[130px] font-body">{pr.author}</span>
                      <span className="text-[#ff6b5b] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform font-heading">
                        <span>Lire</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Media Kit Assets */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2 font-almodobar mb-2">
              <Download className="w-5 h-5 text-amber-400" />
              <span>Media Kit & Visuels HD</span>
            </h3>

            <div className="flex flex-col gap-3">
              {mediaKit.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-2xl bg-[#0d0e15] border border-slate-800 flex items-center justify-between gap-3 hover:bg-[#161724] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#07080c] border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={asset.previewUrl} alt={asset.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white line-clamp-1 font-heading">{asset.name}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span className="text-[#ff6b5b] font-bold">{asset.format}</span>
                        <span>•</span>
                        <span>{asset.resolution}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadAsset(asset)}
                    className="p-2.5 rounded-xl bg-[#161724] hover:bg-[#ff5a50] hover:text-white text-slate-300 border border-slate-800 transition-colors shrink-0 tap-active"
                    title="Télécharger l'asset"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quote box */}
            <div className="mt-2 p-5 rounded-2xl bg-[#0d0e15] border border-slate-800/80 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2 font-heading">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Espace Presse Certifié</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-body">
                Tous les logos, affiches et textes publiés dans cet espace sont libres de droits pour une utilisation éditoriale sous réserve de mentionner <strong className="text-white">OZI Publishing</strong>.
              </p>
            </div>
          </div>

        </div>

        {/* Press & Editorial Contact Box */}
        <div className="rounded-3xl bg-[#0d0e15] border border-slate-800 p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6b5b] mb-2 font-heading">
                <Mail className="w-4 h-4" />
                <span>Contact Rédaction & Relations Publiques</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2 font-almodobar">
                Une question, un article ou une interview ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 font-body">
                Notre équipe éditoriale répond aux journalistes, blogueurs et créateurs sous 24h.
              </p>
              <div className="text-xs text-slate-400 font-mono">
                Email direct : <span className="text-amber-400">contact@ozi-app.com</span>
              </div>
            </div>

            <div className="lg:col-span-7">
              {pressFormSent ? (
                <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="font-bold block text-emerald-200 font-almodobar">Message envoyé avec succès !</strong>
                    L'équipe communication d'OZI vous recontactera très rapidement.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Votre Nom</label>
                    <input
                      type="text"
                      required
                      value={pressContact.name}
                      onChange={(e) => setPressContact({ ...pressContact, name: e.target.value })}
                      placeholder="Ex: Sarah Touré"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Média / Organisation</label>
                    <input
                      type="text"
                      value={pressContact.outlet}
                      onChange={(e) => setPressContact({ ...pressContact, outlet: e.target.value })}
                      placeholder="Ex: Jeune Afrique, RFI, Blog..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Email Professionnel</label>
                    <input
                      type="email"
                      required
                      value={pressContact.email}
                      onChange={(e) => setPressContact({ ...pressContact, email: e.target.value })}
                      placeholder="votre.email@media.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1 font-body">Votre Demande</label>
                    <textarea
                      rows={3}
                      required
                      value={pressContact.message}
                      onChange={(e) => setPressContact({ ...pressContact, message: e.target.value })}
                      placeholder="Détails de votre sujet, interview souhaitée, délais..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#07080c] border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#ff5a50]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ozi-primary hover:opacity-95 text-white font-black text-xs shadow-md glow-ozi transition-all font-almodobar tap-active"
                    >
                      <Send className="w-4 h-4" />
                      <span>Envoyer la demande</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Press Full Article Detail Modal */}
      {selectedPress && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedPress(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#0d0e15] border border-slate-800 p-6 sm:p-8 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPress(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#161724] hover:bg-[#1f2033] text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedPress.imageUrl && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-6">
                <img src={selectedPress.imageUrl} alt={selectedPress.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-[#ff6b5b] font-bold mb-2">
              <span className="px-2.5 py-0.5 rounded bg-[#ff5a50]/20 border border-[#ff5a50]/30 font-heading">
                {selectedPress.category}
              </span>
              <span>•</span>
              <span className="font-body text-slate-400">{selectedPress.date}</span>
              {selectedPress.readTime && (
                <>
                  <span>•</span>
                  <span className="font-mono text-amber-400">{selectedPress.readTime}</span>
                </>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 font-almodobar">
              {selectedPress.title}
            </h2>

            <div className="text-xs text-slate-400 mb-6 italic font-body flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#ff5a50]" />
              <span>Par {selectedPress.author}</span>
            </div>

            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4 font-body">
              {selectedPress.content}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPress(null)}
                className="px-5 py-2.5 rounded-xl bg-[#161724] hover:bg-[#1f2033] text-slate-200 text-xs font-bold font-almodobar"
              >
                Fermer l'article
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
