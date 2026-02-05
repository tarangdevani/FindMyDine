
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { MenuManagement } from './MenuManagement';
import { Settings } from './Settings';
import { AIPhotography } from './AIPhotography';
import { TableManagement } from './TableManagement';
import { RestaurantDetails } from './RestaurantDetails';
import { Reservations } from './Reservations';
import { OrderManagement } from './OrderManagement';
import { Billing } from './Billing';
import { Offers } from './Offers';
import { Bookings } from './Bookings';
import { Reviews } from './Reviews';
import { Wallet } from './Wallet';
import { Sidebar, DashboardView } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { LogoutModal } from './LogoutModal';
import { Overview } from './Overview';

interface RestaurantDashboardProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'profile': return <RestaurantDetails userId={user?.uid || ''} />;
      case 'menu': return <MenuManagement userId={user?.uid || ''} />;
      case 'tables': return <TableManagement userId={user?.uid || ''} />;
      case 'ai-photography': return <AIPhotography />;
      case 'settings': return <Settings userId={user?.uid || ''} />;
      case 'reservations': return <Reservations userId={user?.uid || ''} />;
      case 'bookings': return <Bookings userId={user?.uid || ''} />;
      case 'orders': return <OrderManagement userId={user?.uid || ''} />;
      case 'billing': return <Billing userId={user?.uid || ''} />;
      case 'offers': return <Offers userId={user?.uid || ''} />;
      case 'reviews': return <Reviews userId={user?.uid || ''} />;
      case 'wallet': return <Wallet userId={user?.uid || ''} onNavigate={setActiveView} />;
      case 'overview':
      default: return <Overview userId={user?.uid || ''} onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Sidebar Child Component */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        user={user}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <DashboardHeader 
          activeView={activeView} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {renderContent()}
        </main>
      </div>

      {/* Logout Modal Child Component */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onLogout={onLogout} 
      />
    </div>
  );
};
