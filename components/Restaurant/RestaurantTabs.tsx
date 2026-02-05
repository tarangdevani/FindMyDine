
import React from 'react';

interface RestaurantTabsProps {
  activeTab: 'menu' | 'about';
  onTabChange: (tab: 'menu' | 'about') => void;
}

export const RestaurantTabs: React.FC<RestaurantTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
       <button 
         onClick={() => onTabChange('menu')}
         className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'menu' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'}`}
       >
         Menu
         {activeTab === 'menu' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></span>}
       </button>
       <button 
         onClick={() => onTabChange('about')}
         className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'about' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'}`}
       >
         About
         {activeTab === 'about' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></span>}
       </button>
    </div>
  );
};
