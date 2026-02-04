import React, { useState, useEffect } from 'react';
import { Loader2, Armchair, Clock, User, CheckCircle, Ban, Utensils, Receipt } from 'lucide-react';
import { Reservation, Order, ReservationStatus } from '../../types';
import { getReservationsByRestaurant, updateReservationStatus } from '../../services/reservationService';
import { getOrdersByRestaurant } from '../../services/orderService';
import { Button } from '../UI/Button';

interface BookingsProps {
  userId: string;
}

export const Bookings: React.FC<BookingsProps> = ({ userId }) => {
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll for updates every 15 seconds to keep active orders live
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchData = async () => {
    try {
      const [resData, orderData] = await Promise.all([
        getReservationsByRestaurant(userId),
        getOrdersByRestaurant(userId)
      ]);

      // Filter: Show 'active' bookings (any type) OR 'pending' bookings (type='walk_in')
      const relevantBookings = resData.filter(r => 
        r.status === 'active' || (r.type === 'walk_in' && r.status === 'pending')
      );
      
      setBookings(relevantBookings);
      setOrders(orderData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'decline' | 'complete') => {
    let newStatus: ReservationStatus | null = null;
    
    if (action === 'approve') newStatus = 'active'; // Walk-in becomes active immediately
    if (action === 'decline') newStatus = 'declined';
    if (action === 'complete') newStatus = 'completed'; // Session ends

    if (newStatus) {
      const success = await updateReservationStatus(id, newStatus);
      if (success) {
        if (action === 'complete' || action === 'decline') {
            setBookings(prev => prev.filter(b => b.id !== id));
        } else {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus! } : b));
        }
      }
    }
  };

  // Helper to get orders for a specific reservation
  const getReservationOrders = (resId: string) => {
    return orders.filter(o => o.reservationId === resId);
  };

  // Helper to calculate total bill for a reservation
  const calculateTotal = (resId: string) => {
    const resOrders = getReservationOrders(resId);
    let total = 0;
    let itemCount = 0;
    
    resOrders.forEach(order => {
        // Exclude cancelled items from calculation if your logic requires
        // Here we use order.totalAmount which should be updated on backend/orderService
        // But let's calculate active items manually to be safe based on UI requirements
        const activeItems = order.items.filter(i => i.status !== 'cancelled');
        total += activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        itemCount += activeItems.length;
    });
    
    return { total, itemCount, orders: resOrders };
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

  // Split bookings
  const pendingWalkIns = bookings.filter(b => b.status === 'pending' && b.type === 'walk_in');
  const activeSessions = bookings.filter(b => b.status === 'active');

  return (
    <div className="animate-fade-in-up pb-10">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bookings & Live Sessions</h2>
        <p className="text-gray-500">Manage walk-ins and track active table orders.</p>
      </div>

      {/* 1. Walk-in Requests Section */}
      {pendingWalkIns.length > 0 && (
        <div className="mb-10">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
              Walk-in Requests ({pendingWalkIns.length})
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingWalkIns.map(booking => (
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
                           onClick={() => handleAction(booking.id!, 'decline')}
                           className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                           Decline
                        </Button>
                        <Button 
                           fullWidth 
                           size="sm"
                           onClick={() => handleAction(booking.id!, 'approve')}
                           className="bg-green-600 hover:bg-green-700 shadow-green-500/20"
                        >
                           Seating Table
                        </Button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* 2. Active Sessions Section */}
      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Armchair size={20} className="text-primary-600"/>
            Active Tables ({activeSessions.length})
         </h3>

         {activeSessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Utensils size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No active sessions</h3>
               <p className="text-gray-500">Guests will appear here when seated.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {activeSessions.map(session => {
                  const { total, itemCount, orders: sessionOrders } = calculateTotal(session.id!);
                  
                  // Collect unique item names for preview
                  const itemNames = Array.from(new Set(
                      sessionOrders.flatMap(o => o.items.filter(i => i.status !== 'cancelled').map(i => `${i.quantity}x ${i.name}`))
                  )).slice(0, 3);

                  return (
                     <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-extrabold text-xl text-gray-900">{session.tableName}</h4>
                                 {session.type === 'walk_in' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Walk-in</span>}
                              </div>
                              <p className="text-sm text-gray-500">{session.userName} • {session.guestCount} Guests</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Bill</p>
                              <p className="text-xl font-black text-gray-900">${total.toFixed(2)}</p>
                           </div>
                        </div>

                        <div className="p-5 flex-1">
                           <div className="mb-4">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                 <Receipt size={12}/> Orders Summary
                              </p>
                              {itemCount > 0 ? (
                                 <ul className="space-y-1">
                                    {itemNames.map((name, idx) => (
                                       <li key={idx} className="text-sm text-gray-700 truncate">• {name}</li>
                                    ))}
                                    {itemCount > 3 && <li className="text-xs text-gray-400 italic pl-2">...and more items</li>}
                                 </ul>
                              ) : (
                                 <p className="text-sm text-gray-400 italic">No orders placed yet.</p>
                              )}
                           </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                           <Button 
                              variant="white" 
                              fullWidth 
                              size="sm"
                              className="text-gray-600"
                              onClick={() => { /* Could open detail modal */ }}
                           >
                              View Details
                           </Button>
                           <Button 
                              fullWidth 
                              size="sm"
                              onClick={() => handleAction(session.id!, 'complete')}
                              className="bg-gray-900 text-white hover:bg-black"
                           >
                              Complete Session
                           </Button>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
    </div>
  );
};