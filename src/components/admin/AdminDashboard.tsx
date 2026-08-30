import React from 'react';
import { 
  Eye, 
  Users, 
  Download, 
  DollarSign, 
  BookOpen, 
  Flame, 
  Star, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onNewSeriesClick: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onNewSeriesClick }) => {
  const { series, appVersion, analytics, submissions, firebaseConfig } = useData();

  const totalReads = series.reduce((acc, s) => acc + s.totalReads, 0);
  const totalLikes = series.reduce((acc, s) => acc + s.totalLikes, 0);
  const topSeries = [...series].sort((a, b) => b.totalReads - a.totalReads).slice(0, 4);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Créateur Panafricain</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bienvenue sur le Grand Panneau OZI
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
            Toutes vos modifications sont immédiatement propagées en temps réel dans l'application mobile des lecteurs via Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={onNewSeriesClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Série</span>
          </button>

          <button
            onClick={() => onNavigate('firebase')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>État Sync Firestore</span>
          </button>
        </div>

        <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Reads */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Lectures Totales</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalReads.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% ce mois-ci</span>
            </div>
          </div>
        </div>

        {/* APK Downloads */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Téléchargements APK</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {appVersion.downloadsCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
              <span>Version active : {appVersion.version}</span>
            </div>
          </div>
        </div>

        {/* Revenue CFA */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenus Créateurs</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {(analytics.creatorEarningsCfa).toLocaleString()} FCFA
            </div>
            <div className="text-[11px] text-zinc-400 font-medium mt-1">
              70% reversés directement aux auteurs
            </div>
          </div>
        </div>

        {/* Series Count & Likes */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalogue Actif</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {series.length} séries
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium mt-1">
              <span>{totalLikes.toLocaleString()} mentions J'aime</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2-Column Grid: Leaderboard & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Series Leaderboard (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-bold text-white">Classement des Séries les Plus Lues</h3>
            </div>
            <button 
              onClick={() => onNavigate('series')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Gérer tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topSeries.map((s, index) => (
              <div 
                key={s.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-black text-sm ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    #{index + 1}
                  </span>
                  <img src={s.coverUrl} alt={s.title} className="w-10 h-10 rounded-xl object-cover border border-zinc-700" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white line-clamp-1">{s.title}</span>
                    <span className="text-[11px] text-zinc-400">{s.author} • {s.genre}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{s.totalReads.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">lectures</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{s.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Creator Submissions & Actions (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Derniers Projets Artistes</h3>
            </div>
            <button 
              onClick={() => onNavigate('submissions')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {submissions.slice(0, 3).map((sub) => (
              <div key={sub.id} className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{sub.seriesTitle}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {sub.status === 'pending' ? 'En attente' : 'Examiné'}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">Par {sub.creatorName} ({sub.country})</span>
                <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-0.5">« {sub.pitch} »</p>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('monetization')}
              className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-bold text-zinc-200 transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Monétisation & Payouts</span>
            </button>
            <button
              onClick={() => onNavigate('moderation')}
              className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-bold text-zinc-200 transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Modération & Signalements</span>
            </button>
            <button
              onClick={() => onNavigate('version')}
              className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-bold text-zinc-200 transition-colors flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Gérer l'APK {appVersion.version}</span>
            </button>
            <button
              onClick={() => onNavigate('series')}
              className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-bold text-zinc-200 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Catalogue & Chapitres</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
