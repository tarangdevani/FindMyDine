
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Reservation, Order, ReservationStatus } from '../../types';
import { getReservationsByRestaurant, updateReservationStatus } from '../../services/reservationService';
import { getOrdersByRestaurant } from '../../services/orderService';
import { Skeleton } from '../UI/Skeleton';

// Child Components
import { BookingsHeader } from './Bookings/BookingsHeader';
import { WalkInRequests } from './Bookings/WalkInRequests';
import { ActiveSessions } from './Bookings/ActiveSessions';

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

  if (isLoading) {
    return (
        <div className="animate-fade-in-up pb-10 space-y-8">
            <Skeleton className="h-20 w-full mb-8 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
        </div>
    );
  }

  // Split bookings
  const pendingWalkIns = bookings.filter(b => b.status === 'pending' && b.type === 'walk_in');
  const activeSessions = bookings.filter(b => b.status === 'active');

  return (
    <div className="animate-fade-in-up pb-10">
      
      <BookingsHeader />

      <WalkInRequests 
        requests={pendingWalkIns} 
        onAction={(id, action) => handleAction(id, action)} 
      />

      <ActiveSessions 
        sessions={activeSessions} 
        orders={orders} 
        onComplete={(id) => handleAction(id, 'complete')} 
      />
      
    </div>
  );
};
