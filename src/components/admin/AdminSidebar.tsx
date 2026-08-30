import React from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Film, 
  Newspaper, 
  Smartphone, 
  Users, 
  Database, 
  LogOut,
  Coins,
  ShieldAlert,
  Megaphone,
  HardDrive,
  UserCheck,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { OziLogo } from '../common/OziLogo';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { setViewMode, series, submissions, firebaseConfig, creatorPayouts, reportedComments, users, ads, lwsFiles, articles } = useData();

  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;
  const pendingPayoutsCount = creatorPayouts.filter(p => p.status === 'pending').length;
  const pendingReportsCount = reportedComments.filter(c => c.status === 'pending').length;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: BarChart3, badge: null },
    { id: 'series', label: 'Séries & Chapitres', icon: BookOpen, badge: `${series.length}` },
    { id: 'articles', label: 'Articles & Magazine', icon: FileText, badge: `${articles.length}` },
    { id: 'monetization', label: 'Monétisation & Payouts', icon: Coins, badge: pendingPayoutsCount > 0 ? `${pendingPayoutsCount} virement` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { id: 'users', label: 'Utilisateurs & VIP', icon: UserCheck, badge: `${users.length}` },
    { id: 'moderation', label: 'Modération & Charte', icon: ShieldAlert, badge: pendingReportsCount > 0 ? `${pendingReportsCount} report` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
    { id: 'submissions', label: 'Projets Créateurs', icon: Users, badge: pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} new` : null, badgeColor: 'bg-[#ff5a50] text-white' },
    { id: 'ads', label: 'Publicités & Bannières', icon: Megaphone, badge: `${ads.length}` },
    { id: 'storage', label: 'Stockage LWS CDN', icon: HardDrive, badge: `${lwsFiles.length}` },
    { id: 'teasers', label: 'Teasers & Vidéos', icon: Film, badge: null },
    { id: 'press', label: 'Presse & Médias', icon: Newspaper, badge: null },
    { id: 'version', label: 'Distribution APK', icon: Smartphone, badge: 'v2.4.0' },
    { id: 'firebase', label: 'Sync Firestore', icon: Database, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
  ];

  return (
    <aside className="w-64 bg-[#07080c] border-r border-slate-800 flex flex-col justify-between shrink-0 h-full">
      
      {/* Top Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <OziLogo size="sm" showBadge={false} />
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`admin-tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 font-almodobar tap-active ${
                  isActive
                    ? 'bg-ozi-primary text-white shadow-lg glow-ozi font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#0d0e15]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.badgeColor || (isActive ? 'bg-black/20 text-white' : 'bg-[#161724] text-slate-300')}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info & Quick Exit */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        {/* Firestore live indicator */}
        <div className="p-3 rounded-xl bg-[#0d0e15] border border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium truncate max-w-[130px] font-mono">
              {firebaseConfig.projectId.slice(0, 16)}...
            </span>
          </div>
          <span className="text-emerald-400 font-bold text-[10px] font-almodobar">SYNC</span>
        </div>

        <button
          onClick={() => setViewMode('accueil')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0d0e15] hover:bg-[#161724] text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-colors font-almodobar tap-active"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Quitter l'Admin</span>
        </button>
      </div>

    </aside>
  );
};
