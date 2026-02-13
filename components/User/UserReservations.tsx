
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Loader2, UtensilsCrossed, AlertTriangle, X, Info, CreditCard } from 'lucide-react';
import { Reservation, UserProfile, ReservationConfig } from '../../types';
import { getReservationsByUser, updateReservationStatus } from '../../services/reservationService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { calculateReservationRevenue } from '../../utils/billing';
import { Button } from '../UI/Button';
import { useToast } from '../../context/ToastContext';

interface UserReservationsProps {
  currentUser: UserProfile | null;
}

interface CancelPreview {
  reservation: Reservation;
  refundAmount: number;
  cancellationFee: number;
  isRefundable: boolean;
  refundPercentage: number;
}

export const UserReservations: React.FC<UserReservationsProps> = ({ currentUser }) => {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Cancellation State
  const [cancelPreview, setCancelPreview] = useState<CancelPreview | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleInitiateCancel = async (reservation: Reservation) => {
    setIsCalculating(true);
    try {
      // 1. Fetch Restaurant Config to check Refund Policy
      const profile = await getRestaurantProfile(reservation.restaurantId);
      const config = profile?.reservationConfig || { 
        reservationFee: 0, 
        isRefundable: false, 
        refundPercentage: 0 
      };

      // 2. Calculate Financials
      const amountPaid = reservation.amountPaid || 0;
      let refundAmount = 0;
      let cancellationFee = 0;

      if (amountPaid > 0) {
        // Use the same utility as the backend to ensure consistency
        const split = calculateReservationRevenue(amountPaid, 'cancelled', config.isRefundable ? config.refundPercentage : 0);
        refundAmount = split.userRefund;
        // Fee = What User Paid - What User Gets Back
        cancellationFee = amountPaid - refundAmount;
      }

      setCancelPreview({
        reservation,
        refundAmount,
        cancellationFee,
        isRefundable: config.isRefundable,
        refundPercentage: config.refundPercentage
      });

    } catch (error) {
      console.error("Error fetching policy:", error);
      showToast("Could not retrieve cancellation policy.", "error");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelPreview) return;
    
    setIsCancelling(true);
    try {
      // Pass the refund percentage used for calculation to the service
      const success = await updateReservationStatus(
        cancelPreview.reservation.id!, 
        'cancelled', 
        cancelPreview.isRefundable ? cancelPreview.refundPercentage : 0
      );

      if (success) {
        showToast("Reservation cancelled successfully.", "success");
        // Update local list
        setReservations(prev => prev.map(r => r.id === cancelPreview.reservation.id ? { ...r, status: 'cancelled' } : r));
        setCancelPreview(null);
      } else {
        showToast("Failed to cancel reservation.", "error");
      }
    } catch (error) {
      showToast("An error occurred.", "error");
    } finally {
      setIsCancelling(false);
    }
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
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
                         <MapPin size={14} /> {res.tableName}
                      </div>
                   </div>
                   
                   <div className="flex gap-3 mt-auto items-center">
                      <button 
                        onClick={() => navigate(`/restaurant/${res.restaurantId}`)}
                        className="text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        View Restaurant
                      </button>

                      {(res.status === 'confirmed' || res.status === 'pending') && (
                        <button 
                          onClick={() => handleInitiateCancel(res)}
                          disabled={isCalculating}
                          className="ml-auto text-sm font-medium text-gray-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                          {isCalculating && res.id === cancelPreview?.reservation?.id ? 'Calculating...' : 'Cancel Reservation'}
                        </button>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
              <div className="bg-red-50 p-6 flex justify-center border-b border-red-100">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                    <AlertTriangle size={32} />
                 </div>
              </div>
              
              <div className="p-6">
                 <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Cancel Reservation?</h3>
                 <p className="text-center text-gray-500 text-sm mb-6">
                    Are you sure you want to cancel your table at <strong>{cancelPreview.reservation.restaurantName}</strong>?
                 </p>

                 {/* Financial Breakdown if Paid */}
                 {cancelPreview.reservation.amountPaid && cancelPreview.reservation.amountPaid > 0 ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 mb-6">
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Amount Paid</span>
                          <span className="font-bold text-gray-900">${cancelPreview.reservation.amountPaid.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-red-500 flex items-center gap-1"><Info size={12}/> Cancellation Fee</span>
                          <span className="font-bold text-red-500">-${cancelPreview.cancellationFee.toFixed(2)}</span>
                       </div>
                       <div className="border-t border-gray-200 pt-2 flex justify-between text-base">
                          <span className="font-bold text-gray-700">Refund Amount</span>
                          <span className="font-black text-green-600">${cancelPreview.refundAmount.toFixed(2)}</span>
                       </div>
                       <p className="text-[10px] text-gray-400 mt-1 italic text-center">
                          {cancelPreview.isRefundable 
                            ? `Based on restaurant policy (${cancelPreview.refundPercentage}% refund).` 
                            : "This reservation is non-refundable."}
                       </p>
                    </div>
                 ) : (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs font-bold text-center mb-6 border border-blue-100">
                       No fees applied for this cancellation.
                    </div>
                 )}

                 <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => setCancelPreview(null)}>Keep Table</Button>
                    <Button 
                      fullWidth 
                      onClick={handleConfirmCancel} 
                      isLoading={isCancelling}
                      className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                    >
                       Confirm Cancel
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
