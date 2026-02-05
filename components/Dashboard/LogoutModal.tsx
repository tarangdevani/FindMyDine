
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
       <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-600 mx-auto"><AlertCircle size={24} /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Sign Out?</h3>
          <p className="text-gray-500 mb-6 text-sm text-center">Are you sure you want to end your session?</p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
            <Button fullWidth onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20">Sign Out</Button>
          </div>
       </div>
    </div>
  );
};
