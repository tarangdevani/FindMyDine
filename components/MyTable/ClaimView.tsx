import React from 'react';
import { ArrowLeft, Armchair } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantData, TableItem } from '../../types';

interface ClaimViewProps {
  restaurant: RestaurantData;
  table: TableItem;
  onBack: () => void;
  onOccupy: () => void;
  isProcessing: boolean;
}

export const ClaimView: React.FC<ClaimViewProps> = ({ restaurant, table, onBack, onOccupy, isProcessing }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <div className="bg-white p-4 shadow-sm flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-gray-600"/></button>
          <span className="font-bold text-gray-900">{restaurant.name}</span>
       </div>
       <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
          <div className="bg-white w-full rounded-3xl shadow-soft-lg border border-gray-100 p-8 text-center relative overflow-hidden">
             <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-full mx-auto shadow-lg flex items-center justify-center mb-6 text-primary-600 border-4 border-primary-50"><Armchair size={40} /></div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{table.name}</h1>
                <p className="text-gray-500 font-medium mb-8">{table.area} • {table.seats} Seats</p>
                <Button size="lg" fullWidth onClick={onOccupy} isLoading={isProcessing} disabled={table.status === 'occupied'}>{table.status === 'occupied' ? 'Table Occupied' : 'Check In & Order'}</Button>
             </div>
          </div>
       </div>
    </div>
  );
};