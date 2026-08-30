import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminSeriesManager } from './AdminSeriesManager';
import { AdminTeasersManager } from './AdminTeasersManager';
import { AdminPressManager } from './AdminPressManager';
import { AdminVersionManager } from './AdminVersionManager';
import { AdminSubmissionsManager } from './AdminSubmissionsManager';
import { AdminFirebaseSync } from './AdminFirebaseSync';
import { AdminSeriesModal } from './AdminSeriesModal';
import { AdminModerationManager } from './AdminModerationManager';
import { AdminMonetizationManager } from './AdminMonetizationManager';
import { AdminUsersManager } from './AdminUsersManager';
import { AdminAdsManager } from './AdminAdsManager';
import { AdminStorageManager } from './AdminStorageManager';
import { useData } from '../../context/DataContext';

export const AdminStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [newSeriesModalOpen, setNewSeriesModalOpen] = useState<boolean>(false);
  const { addSeries } = useData();

  const handleSaveNewSeries = async (data: any) => {
    await addSeries(data);
    setNewSeriesModalOpen(false);
    setActiveTab('series');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Fixed Left Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <AdminHeader 
          activeTab={activeTab} 
          onNewSeriesClick={() => setNewSeriesModalOpen(true)} 
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950/90 scrollbar-thin">
          {activeTab === 'dashboard' && (
            <AdminDashboard 
              onNavigate={setActiveTab} 
              onNewSeriesClick={() => setNewSeriesModalOpen(true)} 
            />
          )}

          {activeTab === 'series' && <AdminSeriesManager />}

          {activeTab === 'monetization' && <AdminMonetizationManager />}

          {activeTab === 'users' && <AdminUsersManager />}

          {activeTab === 'moderation' && <AdminModerationManager />}

          {activeTab === 'ads' && <AdminAdsManager />}

          {activeTab === 'storage' && <AdminStorageManager />}

          {activeTab === 'submissions' && <AdminSubmissionsManager />}

          {activeTab === 'teasers' && <AdminTeasersManager />}

          {activeTab === 'press' && <AdminPressManager />}

          {activeTab === 'version' && <AdminVersionManager />}

          {activeTab === 'firebase' && <AdminFirebaseSync />}
        </main>
      </div>

      {/* Global New Series Modal */}
      {newSeriesModalOpen && (
        <AdminSeriesModal
          series={null}
          onClose={() => setNewSeriesModalOpen(false)}
          onSave={handleSaveNewSeries}
        />
      )}
    </div>
  );
};


