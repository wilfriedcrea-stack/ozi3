import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Eye, 
  MousePointerClick, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AdBanner } from '../../types';

export const AdminAdsManager: React.FC = () => {
  const { ads, addAdBanner, updateAdBanner, deleteAdBanner, toggleAdStatus } = useData();

  const [isAddingAd, setIsAddingAd] = useState(false);
  const [newAd, setNewAd] = useState<Omit<AdBanner, 'id' | 'impressions' | 'clicks'>>({
    title: '',
    advertiserName: '',
    placement: 'hero_home',
    imageUrl: '',
    redirectUrl: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    isActive: true,
    priority: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.imageUrl) return;

    addAdBanner(newAd);
    setIsAddingAd(false);
    setNewAd({
      title: '',
      advertiserName: '',
      placement: 'hero_home',
      imageUrl: '',
      redirectUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      isActive: true,
      priority: 1
    });
  };

  const totalImpressions = ads.reduce((acc, a) => acc + a.impressions, 0);
  const totalClicks = ads.reduce((acc, a) => acc + a.clicks, 0);
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Régie Publicitaire & Bannières Partenaires</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestion des Campagnes Sponsors & Encarts Webtoon
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Pilotez les bannières Hero de la page d'accueil, les interstitiels immersifs entre les chapitres et les sponsors de bas de page.
          </p>
        </div>

        <button
          onClick={() => setIsAddingAd(true)}
          className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Campagne</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">Impressions Totales</div>
            <div className="text-xl font-black text-white">{totalImpressions.toLocaleString('fr-FR')}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">Clics Partenaires</div>
            <div className="text-xl font-black text-white">{totalClicks.toLocaleString('fr-FR')}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold">Taux de Clic Moyen (CTR)</div>
            <div className="text-xl font-black text-amber-400">{overallCtr}%</div>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0';
          return (
            <div
              key={ad.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-amber-500/50 transition-all"
            >
              <div className="aspect-[16/9] relative bg-slate-950 overflow-hidden">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[11px] font-bold text-amber-400 border border-amber-500/30 uppercase">
                    {ad.placement.replace('_', ' ')}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleAdStatus(ad.id)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-sm transition-all ${
                      ad.isActive
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {ad.isActive ? '● En Ligne' : '○ En Pause'}
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{ad.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Annonceur : <strong className="text-slate-200">{ad.advertiserName}</strong></p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Vues</div>
                    <div className="text-xs font-bold text-white">{ad.impressions.toLocaleString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Clics</div>
                    <div className="text-xs font-bold text-emerald-400">{ad.clicks.toLocaleString('fr-FR')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">CTR</div>
                    <div className="text-xs font-bold text-amber-400">{ctr}%</div>
                  </div>
                </div>

                {/* Link & Date */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Expire le {ad.expiryDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ad.redirectUrl && (
                      <a
                        href={ad.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-amber-400 p-1"
                        title="Ouvrir le lien"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Voulez-vous supprimer cette campagne publicitaire ?')) {
                          deleteAdBanner(ad.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Supprimer la campagne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Ad Modal */}
      {isAddingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>Nouvelle Campagne Publicitaire</span>
              </h3>
              <button onClick={() => setIsAddingAd(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Titre de la Campagne</label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="Ex: Lancement Forfait Data Wave"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nom Annonceur / Marque</label>
                  <input
                    type="text"
                    value={newAd.advertiserName}
                    onChange={(e) => setNewAd({ ...newAd, advertiserName: e.target.value })}
                    placeholder="Ex: Wave Mobile Money"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Emplacement d'Affichage</label>
                  <select
                    value={newAd.placement}
                    onChange={(e) => setNewAd({ ...newAd, placement: e.target.value as AdBanner['placement'] })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="hero_home">Bannière Hero Accueil</option>
                    <option value="interstitial_chapter">Interstitiel Entre Chapitres</option>
                    <option value="footer_banner">Sponsor Pied de Page</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL de l'Image / Visuel WebP</label>
                <input
                  type="url"
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                  placeholder="https://ozibd.net/uploads/banners/wave_ad.webp"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL de Redirection au Clic</label>
                <input
                  type="url"
                  value={newAd.redirectUrl}
                  onChange={(e) => setNewAd({ ...newAd, redirectUrl: e.target.value })}
                  placeholder="https://wave.com/promo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date Début</label>
                  <input
                    type="date"
                    value={newAd.startDate}
                    onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={newAd.expiryDate}
                    onChange={(e) => setNewAd({ ...newAd, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingAd(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  Créer la Campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
