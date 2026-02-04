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
    // Redirect Logic
    if (user.role === UserRole.RESTAURANT) {
      navigate('/dashboard');
    }
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
      
      {!isDashboard && !isClaimPage && (
        <footer className="bg-white border-t border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-1">
                <span className="text-xl font-bold text-gray-900 tracking-tight block mb-4">FindMyDine</span>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Making dining experiences memorable, one reservation at a time.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Discover</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Dining Rewards</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Private Events</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Reserve for Others</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Cuisines Near Me</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4">Business</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-primary-600 transition-colors">For Restaurateurs</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Business Blog</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Success Stories</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Join Marketplace</a></li>
                </ul>
              </div>

              <div>
                 <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
                 <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Cookie Policy</a></li>
                 </ul>
              </div>
            </div>
            
            <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
               <p>&copy; 2024 FindMyDine Inc. All rights reserved.</p>
               <div className="flex gap-6 mt-4 md:mt-0">
                  <span>English (US)</span>
                  <span>$ USD</span>
               </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;