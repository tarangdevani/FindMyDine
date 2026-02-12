
import React from 'react';
import { 
  LayoutDashboard, Store, Users, DollarSign, LogOut, ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../../types';

export type AdminView = 'overview' | 'restaurants' | 'users' | 'payouts';

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  user: UserProfile | null;
  onLogoutClick: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeView, setActiveView, user, onLogoutClick 
}) => {

  const NavItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all mb-1
        ${activeView === view 
          ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <Icon size={20} className="shrink-0" />
      <span className="ml-3">{label}</span>
    </button>
  );

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} className="text-emerald-400" />
          <span className="text-xl font-bold tracking-tight">Admin<span className="text-slate-500">Panel</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <NavItem view="overview" icon={LayoutDashboard} label="Overview" />
        <NavItem view="restaurants" icon={Store} label="Restaurants" />
        <NavItem view="users" icon={Users} label="User Management" />
        <NavItem view="payouts" icon={DollarSign} label="Payout Requests" />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.displayName || 'Administrator'}</p>
              <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Super User</p>
          </div>
        </div>
        
        <button 
          onClick={onLogoutClick} 
          className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 rounded-lg transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
