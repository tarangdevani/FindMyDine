
import React from 'react';
import { 
  LayoutDashboard, Utensils, Calendar, Settings, Menu, ChefHat, 
  Camera, Armchair, ShoppingBag, Receipt, Ticket, BookOpen, 
  ChevronRight, ChevronLeft, LogOut, Star, Wallet
} from 'lucide-react';
import { UserProfile } from '../../types';

export type DashboardView = 'overview' | 'reservations' | 'bookings' | 'orders' | 'billing' | 'offers' | 'reviews' | 'menu' | 'tables' | 'ai-photography' | 'customers' | 'settings' | 'profile' | 'wallet';

interface SidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
  user: UserProfile | null;
  onLogoutClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, setActiveView, 
  isCollapsed, setIsCollapsed, 
  isMobileMenuOpen, setIsMobileMenuOpen, 
  user, onLogoutClick 
}) => {

  const NavItem = ({ view, icon: Icon, label, badge }: { view: DashboardView, icon: any, label: string, badge?: string }) => (
    <button 
      onClick={() => { setActiveView(view); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 text-sm font-medium rounded-xl transition-all relative group
        ${activeView === view 
          ? 'bg-primary-50 text-primary-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      title={isCollapsed ? label : ''}
    >
      <Icon size={20} className="shrink-0" />
      
      {!isCollapsed && (
          <>
            <span className="ml-3 truncate">{label}</span>
            {badge && <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">{badge}</span>}
          </>
      )}
      
      {/* Collapsed Indicator / Tooltip */}
      {isCollapsed && (
          <>
            {badge && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {label}
            </div>
          </>
      )}
    </button>
  );

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-100 transform transition-all duration-300 flex flex-col overflow-x-hidden
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0 
      ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      
      {/* Sidebar Header */}
      <div className={`h-20 flex items-center border-b border-gray-50 shrink-0 relative ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        <div className="flex items-center gap-2 text-primary-600 overflow-hidden">
          <ChefHat size={28} className="shrink-0" />
          <span className={`text-xl font-bold text-gray-900 tracking-tight transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Partner</span>
        </div>
        
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-400"><Menu size={20}/></button>
        
        {/* Collapse Toggle (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-100 rounded-full p-1.5 text-gray-400 hover:text-primary-600 shadow-md z-50 hover:bg-gray-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <NavItem view="overview" icon={LayoutDashboard} label="Overview" />
        <NavItem view="bookings" icon={BookOpen} label="Live Sessions" />
        <NavItem view="reservations" icon={Calendar} label="Reservations" />
        <NavItem view="orders" icon={ShoppingBag} label="Kitchen Display" />
        <NavItem view="wallet" icon={Wallet} label="Wallet & Payouts" />
        <NavItem view="billing" icon={Receipt} label="Billing" />
        <NavItem view="reviews" icon={Star} label="Reviews & Ratings" />
        <NavItem view="offers" icon={Ticket} label="Offers & Coupons" />
        <NavItem view="tables" icon={Armchair} label="Tables" />
        <NavItem view="menu" icon={Utensils} label="Menu" />
        <NavItem view="ai-photography" icon={Camera} label="AI Photography" />
        <NavItem view="settings" icon={Settings} label="Settings" />
      </nav>

      {/* Footer / Profile */}
      <div className="p-3 border-t border-gray-50 bg-gray-50/30 overflow-x-hidden">
        <div 
          onClick={() => { setActiveView('profile'); setIsMobileMenuOpen(false); }} 
          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border mb-2 group relative
            ${activeView === 'profile' ? 'bg-white border-primary-200 shadow-md ring-1 ring-primary-100' : 'bg-white border-gray-100 hover:border-primary-200'}
            ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0 border-2 border-white shadow-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'R'}
          </div>
          
          {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || 'Restaurant'}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">View Profile</p>
              </div>
          )}

          {isCollapsed && (
              <div className="absolute left-full bottom-0 ml-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Profile
              </div>
          )}
        </div>
        
        <button 
          onClick={onLogoutClick} 
          className={`flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors group relative ${isCollapsed ? 'px-0' : 'px-4'}`}
        >
          <LogOut size={16} /> 
          {!isCollapsed && "Sign Out"}
          {isCollapsed && (
              <div className="absolute left-full bottom-0 ml-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Sign Out
              </div>
          )}
        </button>
      </div>
    </aside>
  );
};
