
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { AuthModal } from './components/Auth/AuthModal';
import { HomePage } from './components/Home/HomePage';
import { RestaurantDashboard } from './components/Dashboard/RestaurantDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard'; // New Import
import { RestaurantDetailsPage } from './components/Restaurant/RestaurantDetailsPage';
import { TableSelectionPage } from './components/Booking/TableSelectionPage';
import { MyTablePage } from './components/Booking/MyTablePage'; 
import { UserReservations } from './components/User/UserReservations';
import { UserBookings } from './components/User/UserBookings';
import { UserFavorites } from './components/User/UserFavorites';
import { UserProfile, RestaurantData, UserRole, Reservation } from './types';
import { auth, db } from './lib/firebase';
import { getRestaurants } from './services/restaurantService';
import { ArrowRight, Armchair, Loader2 } from 'lucide-react';
import { Button } from './components/UI/Button';

const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Global Auth Loading State
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Restaurant Data Loading State
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // Fetch detailed profile from Firestore (contains Role)
          const docRef = db.collection("users").doc(user.uid);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            const userData = docSnap.data() as UserProfile;
            
            // SECURITY CHECK: If staff is blocked, force logout
            if (userData.role === UserRole.STAFF && userData.isStaffBlocked) {
                await auth.signOut();
                alert("Your access has been revoked by the restaurant administrator.");
                setCurrentUser(null);
            } else {
                setCurrentUser(userData);
                
                // Redirect based on role if at root
                if (location.pathname === '/') {
                    if (userData.role === UserRole.RESTAURANT) navigate('/dashboard');
                    if (userData.role === UserRole.ADMIN) navigate('/admin');
                }
            }
          } else {
             // Basic fallback
             setCurrentUser({
               uid: user.uid,
               email: user.email || '',
               role: UserRole.CUSTOMER, // Default fallback
               displayName: user.displayName || 'User'
             });
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false); // Stop loading once auth check is complete
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for Active Reservations
  useEffect(() => {
    if (!currentUser || (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.STAFF)) {
      setActiveReservation(null);
      return;
    }

    const unsubscribe = db.collection("reservations")
      .where("userId", "==", currentUser.uid)
      .where("status", "==", "active")
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const res = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Reservation;
          setActiveReservation(res);
        } else {
          setActiveReservation(null);
        }
      });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Restaurants
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getRestaurants();
      setRestaurants(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === UserRole.RESTAURANT) navigate('/dashboard');
    if (user.role === UserRole.ADMIN) navigate('/admin');
    // Staff acts like user but gets dashboard access
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      navigate('/'); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleGoToTable = () => {
    if (activeReservation) {
      navigate(`/restaurant/${activeReservation.restaurantId}/table/${activeReservation.tableId}/claim`);
    }
  };

  // Determine if we should show standard header/footer
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  const isClaimPage = location.pathname.includes('/claim');
  
  const showActiveTablePopup = activeReservation && !location.pathname.includes(`/table/${activeReservation.tableId}/claim`);

  // Render Global Loader during Initial Auth Check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      {!isDashboard && !isClaimPage && (
        <Header 
          onLoginClick={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* Main Routes */}
      <main className={`flex-grow ${!isDashboard && !isClaimPage && !location.pathname.startsWith('/restaurant/') ? 'pt-20' : ''}`}>
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                restaurants={restaurants} 
                isLoading={isLoading} 
                currentUser={currentUser}
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />
          <Route 
            path="/restaurant/:id" 
            element={
              <RestaurantDetailsPage 
                currentUser={currentUser}
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />
          <Route 
            path="/restaurant/:id/book" 
            element={
              <TableSelectionPage 
                currentUser={currentUser} 
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />
          
          <Route 
            path="/restaurant/:restaurantId/table/:tableId/claim" 
            element={
              <MyTablePage
                currentUser={currentUser} 
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />
          
          <Route path="/my-reservations" element={<UserReservations currentUser={currentUser} />} />
          <Route path="/my-bookings" element={<UserBookings currentUser={currentUser} />} />
          <Route 
            path="/my-favorites" 
            element={
              <UserFavorites 
                currentUser={currentUser} 
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />

          <Route 
            path="/dashboard/*" 
            element={
              (currentUser?.role === UserRole.RESTAURANT || currentUser?.role === UserRole.STAFF)
                ? <RestaurantDashboard user={currentUser} onLogout={handleLogout} />
                : <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Unauthorized access.</div>
            } 
          />

          {/* ADMIN ROUTE - Updated to wildcard for nested routing */}
          <Route 
            path="/admin/*" 
            element={
              currentUser?.role === UserRole.ADMIN
                ? <AdminDashboard user={currentUser} onLogout={handleLogout} />
                : <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Access Denied. Admins Only.</div>
            } 
          />
        </Routes>
      </main>

      {/* Active Table Popup */}
      {showActiveTablePopup && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-4 flex items-center gap-4 max-w-sm">
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0 animate-pulse">
                <Armchair size={24} />
             </div>
             <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Active Session</p>
                <p className="font-bold text-gray-900 text-sm">{activeReservation.tableName} is active</p>
             </div>
             <Button size="sm" onClick={handleGoToTable} className="ml-2 shadow-green-500/20 bg-green-600 hover:bg-green-700">
                Go <ArrowRight size={16} className="ml-1" />
             </Button>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
    </div>
  );
};

export default App;
