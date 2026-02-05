
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { AuthModal } from './components/Auth/AuthModal';
import { HomePage } from './components/Home/HomePage';
import { RestaurantDashboard } from './components/Dashboard/RestaurantDashboard';
import { RestaurantDetailsPage } from './components/Restaurant/RestaurantDetailsPage';
import { TableSelectionPage } from './components/Booking/TableSelectionPage';
import { MyTablePage } from './components/Booking/MyTablePage'; // Import new page
import { UserReservations } from './components/User/UserReservations';
import { UserBookings } from './components/User/UserBookings';
import { UserFavorites } from './components/User/UserFavorites';
import { UserProfile, RestaurantData, UserRole, Reservation } from './types';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getRestaurants } from './services/restaurantService';
import { ArrowRight, Armchair } from 'lucide-react';
import { Button } from './components/UI/Button';

const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch detailed profile from Firestore (contains Role)
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as UserProfile);
          } else {
             // Basic fallback
             setCurrentUser({
               uid: user.uid,
               email: user.email || '',
               role: UserRole.CUSTOMER, // Default fallback
               displayName: user.displayName || 'User'
             });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for Active Reservations
  useEffect(() => {
    if (!currentUser) {
      setActiveReservation(null);
      return;
    }

    // Query for any reservation with status 'active' for this user
    const q = query(
      collection(db, "reservations"),
      where("userId", "==", currentUser.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Take the first active reservation
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
    // User stays on the same page
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      navigate('/'); // Redirect to home on logout
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
  const isDashboard = location.pathname === '/dashboard';
  // Hide header on My Table Claim page to keep it minimal
  const isClaimPage = location.pathname.includes('/claim');
  
  // Check if we need to show the popup (Active reservation exists AND we are NOT on the claim page)
  const showActiveTablePopup = activeReservation && !location.pathname.includes(`/table/${activeReservation.tableId}/claim`);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      {!isDashboard && !isClaimPage && (
        <Header 
          onLoginClick={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* Adjust padding based on route. Dashboard controls its own layout. */}
      {/* Remove padding for details page to allow hero image full width/height impact */}
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
          
          {/* My Table / QR Code Route */}
          <Route 
            path="/restaurant/:restaurantId/table/:tableId/claim" 
            element={
              <MyTablePage
                currentUser={currentUser} 
                onLoginRequired={() => setIsAuthModalOpen(true)}
              />
            } 
          />
          
          {/* User Routes */}
          <Route 
            path="/my-reservations" 
            element={<UserReservations currentUser={currentUser} />} 
          />
          <Route 
            path="/my-bookings" 
            element={<UserBookings currentUser={currentUser} />} 
          />
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
            path="/dashboard" 
            element={
              currentUser?.role === UserRole.RESTAURANT 
                ? <RestaurantDashboard user={currentUser} onLogout={handleLogout} />
                : <HomePage 
                    restaurants={restaurants} 
                    isLoading={isLoading} 
                    currentUser={currentUser}
                    onLoginRequired={() => setIsAuthModalOpen(true)}
                  /> 
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
