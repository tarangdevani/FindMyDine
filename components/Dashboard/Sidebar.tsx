
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Utensils, Calendar, Settings, Menu, 
  Camera, Armchair, ShoppingBag, Receipt, Ticket, BookOpen, 
  ChevronRight, ChevronLeft, LogOut, Star, Wallet, Store, 
  UtensilsCrossed, BarChart3, GripVertical, Users, CreditCard
} from 'lucide-react';
import { UserProfile, UserRole, RestaurantProfile } from '../../types';

export type DashboardView = 'overview' | 'reservations' | 'bookings' | 'orders' | 'billing' | 'offers' | 'reviews' | 'menu' | 'tables' | 'ai-photography' | 'customers' | 'settings' | 'profile' | 'wallet' | 'financials' | 'staff' | 'subscription';

interface NavItemConfig {
  id: DashboardView;
  icon: any;
  label: string;
  badge?: string;
  isLive?: boolean;
}

const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview', isLive: true },
  { id: 'bookings', icon: BookOpen, label: 'Live Sessions', isLive: true },
  { id: 'orders', icon: ShoppingBag, label: 'Kitchen Display', isLive: true },
  { id: 'billing', icon: Receipt, label: 'Billing', isLive: true },
  { id: 'financials', icon: BarChart3, label: 'Financial Stats' },
  { id: 'reservations', icon: Calendar, label: 'Reservations' },
  { id: 'wallet', icon: Wallet, label: 'Wallet & Payouts' },
  { id: 'subscription', icon: CreditCard, label: 'Subscription' },
  { id: 'reviews', icon: Star, label: 'Reviews & Ratings' },
  { id: 'offers', icon: Ticket, label: 'Offers & Coupons' },
  { id: 'tables', icon: Armchair, label: 'Tables' },
  { id: 'menu', icon: Utensils, label: 'Menu' },
  { id: 'ai-photography', icon: Camera, label: 'AI Photography' },
  { id: 'staff', icon: Users, label: 'Staff' },
  { id: 'settings', icon: Settings, label: 'Settings' }
];

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

  const restaurantName = (user as RestaurantProfile)?.restaurantName || user?.displayName || 'Restaurant';
  const restaurantLogoUrl = (user as RestaurantProfile)?.logoUrl; 

  const [navItems, setNavItems] = useState<NavItemConfig[]>(DEFAULT_NAV_ITEMS);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrderJson = localStorage.getItem('sidebarOrder');
    if (savedOrderJson) {
      try {
        const savedOrder = JSON.parse(savedOrderJson) as string[];
        // Sort items based on saved ID order, appending new items at the end
        const sorted = [...DEFAULT_NAV_ITEMS].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.id);
          const indexB = savedOrder.indexOf(b.id);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
        setNavItems(sorted);
      } catch (e) {
        console.error("Failed to parse sidebar order", e);
      }
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === index) return;

    const newItems = [...navItems];
    const [reorderedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, reorderedItem);

    setNavItems(newItems);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    const orderIds = navItems.map(item => item.id);
    localStorage.setItem('sidebarOrder', JSON.stringify(orderIds));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transform transition-all duration-300 flex flex-col overflow-visible
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0 
      ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      
      {/* Sidebar Header */}
      <div className={`h-28 flex items-center border-b border-gray-50 shrink-0 relative ${isCollapsed ? 'justify-center' : 'justify-between px-5'}`}>
        <div className={`flex flex-col transition-all duration-300 w-full ${isCollapsed ? 'items-center' : 'items-start'}`}>
          <div className="flex items-center">
             <div className="z-10 bg-primary-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white flex items-center justify-center" title="FindMyDine">
                <UtensilsCrossed size={18} />
             </div>
             <div className={`h-0.5 w-4 bg-gray-200 ${isCollapsed ? 'hidden' : 'block'}`}></div>
             <div className={`bg-white text-gray-700 p-0.5 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center ${isCollapsed ? '-ml-4 mt-6 z-20' : ''}`} style={{ width: '36px', height: '36px' }}>
                {restaurantLogoUrl ? (
                    <img src={restaurantLogoUrl} alt="Resto" className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <Store size={18} className="text-gray-400" />
                )}
             </div>
          </div>

          <div className={`mt-3 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 h-0' : 'w-auto opacity-100'}`}>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1 whitespace-nowrap">Partner Portal</p>
              <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    FindMyDine <span className="text-primary-500">&</span>
                  </span>
                  <span className="text-sm font-black text-gray-800 truncate max-w-[180px]">
                    {restaurantName}
                  </span>
              </div>
          </div>
        </div>
        
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-400 absolute top-4 right-4"><Menu size={20}/></button>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-100 rounded-full p-1.5 text-gray-400 hover:text-primary-600 shadow-md z-[60] hover:bg-gray-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map((item, index) => {
          // --- Permission Logic ---
          // 1. Staff can never see "Staff" Management
          if (item.id === 'staff' && user?.role === UserRole.STAFF) return null;
          // 2. Staff can never see "Financials" (assuming sensitive)
          if (item.id === 'financials' && user?.role === UserRole.STAFF) return null;
          // 3. Staff can never see "Subscription"
          if (item.id === 'subscription' && user?.role === UserRole.STAFF) return null;
          
          // 4. Staff can only see what is in their permissions
          if (user?.role === UserRole.STAFF && user.permissions && !user.permissions.includes(item.id) && item.id !== 'overview') {
             if (!user.permissions.includes(item.id)) return null;
          }

          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
            >
              <button 
                onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 text-sm font-medium rounded-xl transition-all relative group cursor-pointer
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                title={isCollapsed ? item.label : ''}
              >
                {!isCollapsed && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                    <GripVertical size={12} />
                  </span>
                )}

                <div className="relative">
                  <Icon size={20} className="shrink-0" />
                  {isCollapsed && item.isLive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </div>
                
                {!isCollapsed && (
                    <>
                      <span className="ml-3 truncate">{item.label}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {item.isLive && (
                          <div className="relative flex h-2.5 w-2.5 mr-1">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </div>
                        )}
                        {item.badge && <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">{item.badge}</span>}
                      </div>
                    </>
                )}
                
                {isCollapsed && (
                    <>
                      {(item.badge) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                          {item.label}
                      </div>
                    </>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-3 border-t border-gray-50 bg-gray-50/30 overflow-x-hidden shrink-0">
        <div 
          onClick={() => { setActiveView('profile'); setIsMobileMenuOpen(false); }} 
          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border mb-2 group relative
            ${activeView === 'profile' ? 'bg-white border-primary-200 shadow-md ring-1 ring-primary-100' : 'bg-white border-gray-100 hover:border-primary-200'}
            ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0 border-2 border-white shadow-sm overflow-hidden">
              {restaurantLogoUrl ? <img src={restaurantLogoUrl} className="w-full h-full object-cover"/> : (user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'R')}
          </div>
          
          {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || 'Restaurant'}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                    {user?.role === UserRole.STAFF ? 'Staff Account' : 'View Profile'}
                  </p>
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
