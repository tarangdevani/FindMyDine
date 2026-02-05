
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SelectionHeaderProps {
  isReservationMode: boolean;
  onBack: () => void;
}

export const SelectionHeader: React.FC<SelectionHeaderProps> = ({ isReservationMode, onBack }) => {
  return (
    <div className="mb-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-4">
        <ArrowLeft size={18} /> Back to Restaurant
      </button>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
            {isReservationMode ? 'Select a Table for Reservation' : 'Select Your Table'}
        </h1>
        <p className="text-gray-500">
            {isReservationMode ? 'Choose a table for your upcoming visit.' : 'Tap a table to occupy it immediately.'}
        </p>
      </div>
    </div>
  );
};
