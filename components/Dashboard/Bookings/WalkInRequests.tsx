
import React from 'react';
import { Clock, User } from 'lucide-react';
import { Reservation } from '../../../types';
import { Button } from '../../UI/Button';

interface WalkInRequestsProps {
  requests: Reservation[];
  onAction: (id: string, action: 'approve' | 'decline') => void;
}

export const WalkInRequests: React.FC<WalkInRequestsProps> = ({ requests, onAction }) => {
  if (requests.length === 0) return null;

  return (
    <div className="mb-10">
       <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
          Walk-in Requests ({requests.length})
       </h3>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(booking => (
             <div key={booking.id} className="bg-white p-5 rounded-2xl shadow-soft border-l-4 border-l-orange-500 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-gray-900 text-lg">{booking.tableName}</h4>
                   <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded">PENDING</span>
                </div>
                
                <div className="space-y-1 mb-4">
                   <p className="text-gray-600 text-sm flex items-center gap-2"><User size={14}/> {booking.userName} ({booking.guestCount} Guests)</p>
                   <p className="text-gray-400 text-xs flex items-center gap-2"><Clock size={14}/> Request: {new Date(booking.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>

                <div className="flex gap-2 mt-auto">
                    <Button 
                       variant="outline" 
                       fullWidth 
                       size="sm"
                       onClick={() => onAction(booking.id!, 'decline')}
                       className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                       Decline
                    </Button>
                    <Button 
                       fullWidth 
                       size="sm"
                       onClick={() => onAction(booking.id!, 'approve')}
                       className="bg-green-600 hover:bg-green-700 shadow-green-500/20"
                    >
                       Seating Table
                    </Button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
