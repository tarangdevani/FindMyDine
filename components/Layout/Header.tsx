
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Menu, LayoutDashboard, Heart, Calendar, LogOut, AlertCircle, X, BookOpen, UtensilsCrossed } from 'lucide-react';
import { Button } from '../UI/Button';
import { UserProfile, UserRole } from '../../types';

interface HeaderProps {
  onLoginClick: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
    setIsMobileMenuOpen(false);
  };

  const confirmLogout = () => {
    onLogout();
    setIsLogoutConfirmOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="bg-primary-600 text-white p-2.5 rounded-xl shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform duration-300">
                <UtensilsCrossed size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                FindMyDine
              </span>
            </div>

            {/* Desktop Navigation (Logged In Customer/Staff) */}
            {currentUser && (currentUser.role === UserRole.CUSTOMER || currentUser.role === UserRole.STAFF) && (
              <nav className="hidden md:flex items-center gap-1">
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive('/my-bookings') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'}`}
                >
                  <BookOpen size={18} /> Bookings
                </button>
                <button 
                  onClick={() => navigate('/my-reservations')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive('/my-reservations') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'}`}
                >
                  <Calendar size={18} /> Reservations
                </button>
                <button 
                  onClick={() => navigate('/my-favorites')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive('/my-favorites') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'}`}
                >
                  <Heart size={18} /> Favorites
                </button>
              </nav>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              {currentUser ? (
                currentUser.role === UserRole.RESTAURANT || currentUser.role === UserRole.STAFF ? (
                  <div className="flex items-center gap-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 hidden md:flex"
                      >
                        <LayoutDashboard size={16} />
                        {currentUser.role === UserRole.STAFF ? 'Staff Portal' : 'Dashboard'}
                      </Button>
                      
                      {/* Avatar for Staff/Resto too */}
                      <div className="flex items-center gap-2 bg-gray-50 pl-1 pr-1 py-1 rounded-full border border-gray-200">
                        <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary-600 border border-gray-100">
                          <User size={16} />
                        </div>
                        <button 
                          onClick={handleLogoutClick}
                          className="p-1.5 rounded-full hover:bg-white hover:text-red-500 hover:shadow-sm transition-all text-gray-400"
                          title="Log out"
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                  </div>
                ) : (
                  // Customer Profile Pill
                  <div className="flex items-center gap-2 bg-gray-50 pl-1 pr-1 py-1 rounded-full border border-gray-200">
                    <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-primary-600 border border-gray-100">
                      <User size={16} />
                    </div>
                    <span className="hidden sm:block text-sm font-bold text-gray-700 mr-2 truncate max-w-[100px]">
                      {currentUser.displayName || "User"}
                    </span>
                    <button 
                      onClick={handleLogoutClick}
                      className="p-1.5 rounded-full hover:bg-white hover:text-red-500 hover:shadow-sm transition-all text-gray-400"
                      title="Log out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="primary" onClick={onLoginClick}>
                    Log in
                  </Button>
                </div>
              )}
              
              {/* Mobile Menu Button - Only visible if logged in */}
              {currentUser && (
                <button 
                  className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden animate-fade-in flex flex-col">
           <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <span className="text-xl font-bold text-gray-900">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-full"><X size={20}/></button>
           </div>
           <div className="flex-1 p-6 space-y-4">
              <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }} className="w-full text-left text-lg font-medium text-gray-900 py-2">Home</button>
              
              {currentUser && (currentUser.role === UserRole.RESTAURANT || currentUser.role === UserRole.STAFF) && (
                 <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left text-lg font-bold text-primary-600 py-2 flex items-center gap-3"><LayoutDashboard size={20}/> Go to Dashboard</button>
              )}

              {currentUser && (
                <>
                  <button onClick={() => { navigate('/my-bookings'); setIsMobileMenuOpen(false); }} className="w-full text-left text-lg font-medium text-gray-900 py-2 flex items-center gap-3"><BookOpen size={20}/> My Bookings</button>
                  <button onClick={() => { navigate('/my-reservations'); setIsMobileMenuOpen(false); }} className="w-full text-left text-lg font-medium text-gray-900 py-2 flex items-center gap-3"><Calendar size={20}/> My Reservations</button>
                  <button onClick={() => { navigate('/my-favorites'); setIsMobileMenuOpen(false); }} className="w-full text-left text-lg font-medium text-gray-900 py-2 flex items-center gap-3"><Heart size={20}/> Favorites</button>
                </>
              )}
              {currentUser && (
                 <button onClick={handleLogoutClick} className="w-full text-left text-lg font-bold text-red-500 py-2 mt-4 flex items-center gap-3"><LogOut size={20}/> Log Out</button>
              )}
              {!currentUser && (
                 <Button fullWidth onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}>Log In / Sign Up</Button>
              )}
           </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLogoutConfirmOpen(false)}>
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-600 mx-auto">
                 <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Log Out?</h3>
              <p className="text-gray-500 mb-6 text-sm text-center">Are you sure you want to end your session?</p>
              <div className="flex gap-3">
                 <Button variant="ghost" fullWidth onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                 <Button fullWidth onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20">Log Out</Button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
