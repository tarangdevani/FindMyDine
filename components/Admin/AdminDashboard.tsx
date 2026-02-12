
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { AdminSidebar, AdminView } from './AdminSidebar';
import { AdminOverview } from './Views/AdminOverview';
import { AdminRestaurants } from './Views/AdminRestaurants';
import { AdminPayouts } from './Views/AdminPayouts';
import { AdminUsers } from './Views/AdminUsers';

interface AdminDashboardProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview');

  const renderContent = () => {
    switch (activeView) {
      case 'restaurants': return <AdminRestaurants />;
      case 'users': return <AdminUsers />;
      case 'payouts': return <AdminPayouts />;
      case 'overview':
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans pl-64">
      <AdminSidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        user={user} 
        onLogoutClick={onLogout} 
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
           <h2 className="text-xl font-bold text-slate-800 capitalize">{activeView}</h2>
           <div className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">v1.0.0 Stable</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};
