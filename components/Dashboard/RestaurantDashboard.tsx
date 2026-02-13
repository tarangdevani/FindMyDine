
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Robust Active View Detection
  // Assuming route is /dashboard/*
  // We strip '/dashboard/' and check the first segment
  const pathSegments = location.pathname.split('/');
  const dashboardIndex = pathSegments.indexOf('dashboard');
  let currentView: DashboardView = 'overview';
  
  const validViews: DashboardView[] = [
    'overview', 'reservations', 'bookings', 'orders', 'billing', 
    'offers', 'reviews', 'menu', 'tables', 'ai-photography', 
    'customers', 'settings', 'profile', 'wallet', 'financials', 
    'staff', 'subscription'
  ];

  if (dashboardIndex !== -1 && pathSegments.length > dashboardIndex + 1) {
      const potentialView = pathSegments[dashboardIndex + 1];
      if (validViews.includes(potentialView as DashboardView)) {
          currentView = potentialView as DashboardView;
      }
  }

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

  const handleNavigation = (view: DashboardView) => {
    if (view === 'overview') {
        navigate('/dashboard');
    } else {
        navigate(`/dashboard/${view}`);
    }
  };

  // Common Props for components that need write access control
  const writeProps = { userId: effectiveRestaurantId, isReadOnly };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Sidebar Child Component */}
      <Sidebar 
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
          activeView={currentView} 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />
        
        {/* Read Only Banner */}
        {isReadOnly && currentView !== 'subscription' && (
            <div className="bg-red-500 text-white text-xs font-bold text-center py-1">
                Free Plan Active. Write access restricted. Upgrade to Base/Pro/Ultra to manage data. 
                <button onClick={() => navigate('/dashboard/subscription')} className="underline ml-2 text-white">Upgrade Now</button>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Routes>
            <Route index element={<Overview userId={effectiveRestaurantId} onViewChange={handleNavigation} />} />
            
            <Route path="profile" element={<RestaurantDetails userId={effectiveRestaurantId} />} />
            <Route path="menu" element={<MenuManagement {...writeProps} />} />
            <Route path="tables" element={<TableManagement userId={effectiveRestaurantId} />} />
            <Route path="ai-photography" element={<AIPhotography userId={effectiveRestaurantId} />} />
            <Route path="settings" element={<Settings {...writeProps} currentUserRole={user?.role} />} />
            <Route path="reservations" element={<Reservations userId={effectiveRestaurantId} />} />
            <Route path="bookings" element={<Bookings userId={effectiveRestaurantId} />} />
            <Route path="orders" element={<OrderManagement userId={effectiveRestaurantId} />} />
            <Route path="billing" element={<Billing userId={effectiveRestaurantId} />} />
            <Route path="offers" element={<Offers userId={effectiveRestaurantId} />} />
            <Route path="reviews" element={<Reviews userId={effectiveRestaurantId} />} />
            <Route path="wallet" element={<Wallet userId={effectiveRestaurantId} onNavigate={handleNavigation} />} />
            <Route path="financials" element={<FinancialStats userId={effectiveRestaurantId} />} />
            <Route path="staff" element={<StaffManagement userId={effectiveRestaurantId} />} />
            <Route path="subscription" element={<Subscription userId={effectiveRestaurantId} />} />
            
            {/* Redirect any unknown dashboard sub-paths to the root dashboard (Overview) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
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
