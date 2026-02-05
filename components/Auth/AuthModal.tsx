
import React, { useState, useEffect } from 'react';
import { X, Building2, User } from 'lucide-react';
import { Button } from '../UI/Button';
import { UserRole } from '../../types';
import { auth, db, googleProvider } from '../../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    name: '', // Restaurant Name or User Display Name
    logo: null as File | null
  });

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsLogin(true);
      setRole(UserRole.CUSTOMER);
      setIsLoading(false);
      setError(null);
      setFormData({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        mobile: '', 
        name: '', 
        logo: null 
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setError(null);
    if (name === 'logo' && files) {
      setFormData(prev => ({ ...prev, logo: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const createUserProfile = async (uid: string, email: string) => {
    const userProfile = {
      uid,
      email,
      role,
      displayName: formData.name || email.split('@')[0],
      mobile: formData.mobile || '',
      createdAt: new Date().toISOString(),
      // Add restaurant specific fields if applicable
      ...(role === UserRole.RESTAURANT && {
        restaurantName: formData.name,
      })
    };

    await setDoc(doc(db, "users", uid), userProfile);
    return userProfile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // --- Login Logic ---
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          onLoginSuccess(userDoc.data());
        } else {
          // Fallback if firestore doc is missing
          onLoginSuccess({
             uid: userCredential.user.uid,
             email: userCredential.user.email,
             role: UserRole.CUSTOMER // Default fallback
          });
        }
        onClose();

      } else {
        // --- Sign Up Logic ---
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Update Auth Profile Display Name
        if (formData.name) {
          await updateProfile(userCredential.user, {
            displayName: formData.name
          });
        }

        // Create User Document in Firestore
        const fullProfile = await createUserProfile(userCredential.user.uid, userCredential.user.email || '');
        
        onLoginSuccess(fullProfile);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Simplify error messages for UI
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        onLoginSuccess(userDoc.data());
      } else {
        // If first time Google login, create a default customer profile
        const newProfile = {
          uid: result.user.uid,
          email: result.user.email,
          role: UserRole.CUSTOMER, // Default to customer for Google Sign In
          displayName: result.user.displayName,
          mobile: '',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        onLoginSuccess(newProfile);
      }
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Join FindMyDine'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLogin ? 'Sign in to continue' : 'Create an account to start booking'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Google Login - Moved to Top */}
          <div className="mb-8">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">Or continue with email</span>
              </div>
            </div>
          </div>

          {/* Role Toggle - Only visible for Sign Up */}
          {!isLogin && (
            <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
              <button 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${role === UserRole.CUSTOMER ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setRole(UserRole.CUSTOMER)}
                type="button"
              >
                <User size={18} />
                User
              </button>
              <button 
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${role === UserRole.RESTAURANT ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setRole(UserRole.RESTAURANT)}
                type="button"
              >
                <Building2 size={18} />
                Restaurant
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Conditional Fields for Signup */}
            {!isLogin && (
              <>
                {role === UserRole.RESTAURANT && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white" 
                        placeholder="e.g. The Tasty Spoon"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}
                {role === UserRole.CUSTOMER && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white" 
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {/* Mobile (Signup only or if needed for login) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input 
                  type="tel" 
                  name="mobile" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white" 
                  placeholder="+1 234 567 8900"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                {isLogin && <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Forgot?</a>}
              </div>
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {/* Confirm Password (Signup Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  required 
                  className={`w-full px-4 py-3 rounded-xl border focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-300 focus:ring-red-100' 
                      : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-4 shadow-xl shadow-primary-500/20">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-center text-sm font-medium">
          <span className="text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button 
            className="ml-1.5 text-primary-600 font-bold hover:text-primary-700 focus:outline-none hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

      </div>
    </div>
  );
};
