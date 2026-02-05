
import React from 'react';
import { ShoppingBag, History } from 'lucide-react';

interface OrderManagementHeaderProps {
  activeTab: 'board' | 'history';
  setActiveTab: (tab: 'board' | 'history') => void;
}

export const OrderManagementHeader: React.FC<OrderManagementHeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
      <div>
         <h2 className="text-2xl font-bold text-gray-900">Kitchen Display</h2>
         <p className="text-gray-500">Manage individual item flow.</p>
      </div>
      
      <div className="bg-gray-100 p-1 rounded-xl flex">
         <button 
           onClick={() => setActiveTab('board')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
         >
           <ShoppingBag size={16} /> Active Board
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
         >
           <History size={16} /> Item History
         </button>
      </div>
    </div>
  );
};
