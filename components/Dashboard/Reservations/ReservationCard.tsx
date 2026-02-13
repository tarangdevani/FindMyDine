
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../UI/Button';
import { Reservation, ReservationStatus } from '../../../types';

interface ReservationCardProps {
  reservation: Reservation;
  onStatusChange: (id: string, status: ReservationStatus) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, onStatusChange }) => {
  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
       <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex flex-col items-center justify-center shrink-0 border border-gray-200">
             <span className="text-xs font-bold text-gray-500 uppercase">{new Date(reservation.date).toLocaleDateString('en-US', { month: 'short' })}</span>
             <span className="text-xl font-bold text-gray-900">{new Date(reservation.date).getDate()}</span>
          </div>
          <div>
             <h3 className="text-lg font-bold text-gray-900">{reservation.userName}</h3>
             <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1.5"><Clock size={14}/> {reservation.startTime} - {reservation.endTime}</span>
                <span className="flex items-center gap-1.5"><AlertCircle size={14}/> {reservation.tableName}</span>
                {reservation.amountPaid && reservation.amountPaid > 0 ? (
                   <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold text-xs border border-green-100">Paid ${reservation.amountPaid}</span>
                ) : null}
             </div>
          </div>
       </div>

       <div className="flex items-center gap-4 w-full md:w-auto">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${getStatusColor(reservation.status)}`}>
             {reservation.status}
          </span>
          
          {reservation.status === 'pending' && (
             <div className="flex gap-2 ml-auto md:ml-0">
                <Button 
                   size="sm" variant="outline" 
                   onClick={() => onStatusChange(reservation.id!, 'declined')}
                   className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                >
                   Decline
                </Button>
                <Button 
                   size="sm" 
                   onClick={() => onStatusChange(reservation.id!, 'confirmed')}
                   className="bg-green-600 hover:bg-green-700 shadow-green-500/20"
                >
                   Accept
                </Button>
             </div>
          )}
       </div>
    </div>
  );
};
