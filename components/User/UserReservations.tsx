import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Loader2, UtensilsCrossed } from 'lucide-react';
import { Reservation, UserProfile } from '../../types';
import { getReservationsByUser } from '../../services/reservationService';
import { Button } from '../UI/Button';

interface UserReservationsProps {
  currentUser: UserProfile | null;
}

export const UserReservations: React.FC<UserReservationsProps> = ({ currentUser }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    if (currentUser) {
      const data = await getReservationsByUser(currentUser.uid);
      // Filter: Only show standard reservations, not walk-ins
      setReservations(data.filter(r => r.type === 'reservation'));
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reservations</h1>
        <p className="text-gray-500">Track your dining history and upcoming bookings.</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
              <Calendar size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No reservations yet</h3>
           <p className="text-gray-500 mb-6">Explore our curated list of restaurants and book your first table!</p>
           <Button onClick={() => navigate('/')}>Find a Restaurant</Button>
        </div>
      ) : (
        <div className="space-y-4">
           {reservations.map(res => (
             <div key={res.id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md">
                
                {/* Date Badge */}
                <div className="flex md:flex-col items-center justify-center gap-2 md:gap-0 bg-gray-50 rounded-xl p-4 min-w-[80px] border border-gray-100">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{new Date(res.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                   <span className="text-2xl font-bold text-gray-900">{new Date(res.date).getDate()}</span>
                   <span className="text-xs font-medium text-gray-400">{new Date(res.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{res.restaurantName}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${getStatusColor(res.status)}`}>
                         {res.status}
                      </span>
                   </div>
                   
                   <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                         <Clock size={14} /> {res.startTime}
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                         <UtensilsCrossed size={14} /> {res.guestCount} Guests
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                         <MapPin size={14} /> {res.tableName}
                      </div>
                   </div>
                   
                   <div className="flex gap-3 mt-auto">
                      <button 
                        onClick={() => navigate(`/restaurant/${res.restaurantId}`)}
                        className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        View Restaurant
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};