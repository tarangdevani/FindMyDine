
import React from 'react';
import { Menu, Bell } from 'lucide-react';

interface DashboardHeaderProps {
  activeView: string;
  setIsMobileMenuOpen: (v: boolean) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeView, setIsMobileMenuOpen }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4">
         <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"><Menu size={24} /></button>
         <h2 className="text-xl font-bold text-gray-900 capitalize">{activeView.replace('-', ' ')}</h2>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
         <button className="relative p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
         </button>
      </div>
    </header>
  );
};
