
import React, { useState, useEffect } from 'react';
import { UserProfile, SubscriptionPlan } from '../../types';
import { getRestaurantProfile } from '../../services/restaurantService';
import { checkSubscriptionValidity } from '../../services/subscriptionService';
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
import { FinancialStats } from './FinancialStats';
import { StaffManagement } from './StaffManagement';
import { Subscription } from './Subscription';

interface RestaurantDashboardProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Subscription State
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [isReadOnly, setIsReadOnly] = useState(false);

  // If user is staff, use employerId as the restaurant context ID
  const effectiveRestaurantId = user?.role === 'staff' ? user.employerId! : user?.uid || '';

  useEffect(() => {
    // Check subscription status on load to set Read-Only mode
    const checkSub = async () => {
        const profile = await getRestaurantProfile(effectiveRestaurantId);
        if (profile?.subscription) {
            setPlan(profile.subscription.plan);
            // Free plan = Read Only for Database Writes
            // Or if expired
            const isValid = checkSubscriptionValidity(profile.subscription);
            setIsReadOnly(profile.subscription.plan === 'free' || !isValid);
        } else {
            // Default Free
            setIsReadOnly(true);
        }
    };
    checkSub();
  }, [effectiveRestaurantId]);

  const renderContent = () => {
    // Common Props for components that need write access control
    const writeProps = { userId: effectiveRestaurantId, isReadOnly };

    switch (activeView) {
      case 'profile': return <RestaurantDetails userId={effectiveRestaurantId} />; // Usually editable even on free to set up? Or restrict? Restricting for consistency.
      case 'menu': return <MenuManagement {...writeProps} />;
      case 'tables': return <TableManagement {...writeProps} />;
      case 'ai-photography': return <AIPhotography userId={effectiveRestaurantId} />; // Has its own limit check
      case 'settings': return <Settings {...writeProps} currentUserRole={user?.role} />;
      case 'reservations': return <Reservations userId={effectiveRestaurantId} />;
      case 'bookings': return <Bookings userId={effectiveRestaurantId} />;
      case 'orders': return <OrderManagement userId={effectiveRestaurantId} />;
      case 'billing': return <Billing userId={effectiveRestaurantId} />;
      case 'offers': return <Offers userId={effectiveRestaurantId} />;
      case 'reviews': return <Reviews userId={effectiveRestaurantId} />;
      case 'wallet': return <Wallet userId={effectiveRestaurantId} onNavigate={setActiveView} />;
      case 'financials': return <FinancialStats userId={effectiveRestaurantId} />;
      case 'staff': return <StaffManagement userId={effectiveRestaurantId} />;
      case 'subscription': return <Subscription userId={effectiveRestaurantId} />;
      case 'overview':
      default: return <Overview userId={effectiveRestaurantId} onViewChange={setActiveView} />;
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
        
        {/* Read Only Banner */}
        {isReadOnly && activeView !== 'subscription' && (
            <div className="bg-red-500 text-white text-xs font-bold text-center py-1">
                Free Plan Active. Write access restricted. Upgrade to Base/Pro/Ultra to manage data. 
                <button onClick={() => setActiveView('subscription')} className="underline ml-2 text-white">Upgrade Now</button>
            </div>
        )}

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
