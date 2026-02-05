
import React from 'react';
import { Ticket, Megaphone, Plus } from 'lucide-react';
import { Button } from '../../UI/Button';

interface OffersHeaderProps {
  activeTab: 'offer' | 'coupon';
  setActiveTab: (tab: 'offer' | 'coupon') => void;
  onAddClick: () => void;
}

export const OffersHeader: React.FC<OffersHeaderProps> = ({ activeTab, setActiveTab, onAddClick }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
         <h2 className="text-2xl font-bold text-gray-900">Offers & Coupons</h2>
         <p className="text-gray-500">Manage public deals and private coupon codes.</p>
      </div>
      <div className="flex bg-gray-100 p-1 rounded-xl">
         <button 
           onClick={() => setActiveTab('offer')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'offer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
         >
           <Megaphone size={16} /> Public Offers
         </button>
         <button 
           onClick={() => setActiveTab('coupon')}
           className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'coupon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
         >
           <Ticket size={16} /> Coupons
         </button>
      </div>
      <Button onClick={onAddClick}>
         <Plus size={20} className="mr-2" /> Create {activeTab === 'offer' ? 'Offer' : 'Coupon'}
      </Button>
    </div>
  );
};
