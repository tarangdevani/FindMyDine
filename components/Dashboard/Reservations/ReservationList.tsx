
import React from 'react';
import { Calendar } from 'lucide-react';
import { Reservation, ReservationStatus, ReservationConfig } from '../../../types';
import { ReservationCard } from './ReservationCard';
import { Skeleton } from '../../UI/Skeleton';

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  config?: ReservationConfig; // Add config prop
}

export const ReservationList: React.FC<ReservationListProps> = ({ 
  reservations, 
  isLoading, 
  onStatusChange 
}) => {
  if (isLoading) {
    return (
       <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
       </div>
    );
  }

  if (reservations.length === 0) {
    return (
       <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No reservations found</h3>
          <p className="text-gray-500">You don't have any bookings matching this filter.</p>
       </div>
    );
  }

  return (
     <div className="grid grid-cols-1 gap-4">
        {reservations.map(res => (
          <ReservationCard 
            key={res.id} 
            reservation={res} 
            onStatusChange={onStatusChange} 
          />
        ))}
     </div>
  );
};
