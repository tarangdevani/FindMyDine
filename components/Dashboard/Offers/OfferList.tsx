
import React from 'react';
import { Loader2, Megaphone, Ticket } from 'lucide-react';
import { Offer } from '../../../types';
import { OfferCard } from './OfferCard';
import { Button } from '../../UI/Button';
import { Skeleton } from '../../UI/Skeleton';

interface OfferListProps {
  offers: Offer[];
  isLoading: boolean;
  activeTab: 'offer' | 'coupon';
  onEdit: (offer: Offer) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (offer: Offer) => void;
  onAddClick: () => void;
  onViewStats: (offer: Offer) => void;
}

export const OfferList: React.FC<OfferListProps> = ({ 
  offers, isLoading, activeTab, onEdit, onDelete, onToggleStatus, onAddClick, onViewStats
}) => {
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
    );
  }

  if (offers.length === 0) {
    return (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              {activeTab === 'offer' ? <Megaphone size={32} /> : <Ticket size={32} />}
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No Active {activeTab === 'offer' ? 'Offers' : 'Coupons'}</h3>
           <p className="text-gray-500 mb-6">Create a new {activeTab} to drive more sales.</p>
           <Button variant="outline" onClick={onAddClick}>Create First {activeTab === 'offer' ? 'Offer' : 'Coupon'}</Button>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {offers.map(offer => (
         <OfferCard 
            key={offer.id} 
            offer={offer} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onToggleStatus={onToggleStatus} 
            onViewStats={onViewStats}
         />
       ))}
    </div>
  );
};
