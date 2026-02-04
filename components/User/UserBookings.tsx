import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, MapPin, Loader2, Utensils, Receipt, CheckCircle, XCircle } from 'lucide-react';
import { Reservation, UserProfile, Order } from '../../types';
import { getReservationsByUser } from '../../services/reservationService';
import { getOrdersByReservation } from '../../services/orderService';
import { Button } from '../UI/Button';

interface UserBookingsProps {
  currentUser: UserProfile | null;
}

interface BookingWithOrders extends Reservation {
  orders?: Order[];
  totalBill?: number;
}

export const UserBookings: React.FC<UserBookingsProps> = ({ currentUser }) => {
  const [bookings, setBookings] = useState<BookingWithOrders[]>([]);
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
      const allReservations = await getReservationsByUser(currentUser.uid);
      
      // Filter for Walk-ins OR any reservation that is Active/Completed (has potential orders)
      const relevantReservations = allReservations.filter(r => 
        r.type === 'walk_in' || r.status === 'active' || r.status === 'completed'
      );

      // Fetch orders for each relevant reservation
      const detailedBookings = await Promise.all(relevantReservations.map(async (res) => {
        const orders = await getOrdersByReservation(res.id!);
        // Calculate total excluding cancelled items
        const totalBill = orders.reduce((total, order) => {
            const orderTotal = order.items
                .filter(item => item.status !== 'cancelled')
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return total + orderTotal;
        }, 0);

        return { ...res, orders, totalBill };
      }));

      setBookings(detailedBookings);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings & Orders</h1>
        <p className="text-gray-500">View your walk-in sessions and order details.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
              <BookOpen size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings yet</h3>
           <p className="text-gray-500 mb-6">Walk-in sessions and live orders will appear here.</p>
           <Button onClick={() => navigate('/')}>Find a Restaurant</Button>
        </div>
      ) : (
        <div className="space-y-6">
           {bookings.map(booking => {
             const hasOrders = booking.orders && booking.orders.length > 0;
             const isLive = booking.status === 'active';

             return (
               <div key={booking.id} className={`bg-white rounded-2xl shadow-soft border overflow-hidden transition-all hover:shadow-md ${isLive ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-100'}`}>
                  
                  {/* Header */}
                  <div className={`p-5 flex justify-between items-center ${isLive ? 'bg-primary-50/50' : 'bg-white border-b border-gray-50'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isLive ? 'bg-white text-primary-600 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                           {booking.type === 'walk_in' ? 'W' : 'R'}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg">{booking.restaurantName}</h3>
                           <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><MapPin size={12}/> {booking.tableName}</span>
                              <span className="flex items-center gap-1"><Clock size={12}/> {new Date(booking.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                           booking.status === 'active' ? 'bg-green-100 text-green-700' : 
                           booking.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                           'bg-gray-100 text-gray-600'
                        }`}>
                           {booking.status}
                        </span>
                     </div>
                  </div>

                  {/* Order Summary */}
                  {hasOrders ? (
                     <div className="p-5 bg-gray-50/30">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                           <Receipt size={14}/> Order Details
                        </div>
                        <div className="space-y-2">
                           {booking.orders?.flatMap(o => o.items).filter(i => i.status !== 'cancelled').map((item, idx) => (
                              <div key={`${item.menuItemId}_${idx}`} className="flex justify-between text-sm">
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{item.quantity}x</span>
                                    <span className="text-gray-700">{item.name}</span>
                                 </div>
                                 <span className="text-gray-500 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                           ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                           <span className="font-bold text-gray-700">Total Bill</span>
                           <span className="font-black text-xl text-gray-900">${booking.totalBill?.toFixed(2)}</span>
                        </div>
                     </div>
                  ) : (
                     <div className="p-5 text-center text-sm text-gray-400 italic">
                        No orders placed for this session.
                     </div>
                  )}

                  {/* Footer Actions */}
                  {isLive && (
                     <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
                        <Button size="sm" onClick={() => navigate(`/restaurant/${booking.restaurantId}/table/${booking.tableId}/claim`)}>
                           View Live Session
                        </Button>
                     </div>
                  )}
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
};