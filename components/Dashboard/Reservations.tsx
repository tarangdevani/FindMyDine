import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Settings, DollarSign, Save } from 'lucide-react';
import { Button } from '../UI/Button';
import { Reservation, ReservationStatus, ReservationConfig } from '../../types';
import { getReservationsByRestaurant, updateReservationStatus } from '../../services/reservationService';
import { updateRestaurantProfile, getRestaurantProfile } from '../../services/restaurantService';

interface ReservationsProps {
  userId: string;
}

export const Reservations: React.FC<ReservationsProps> = ({ userId }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // Config State
  const [config, setConfig] = useState<ReservationConfig>({
    reservationFee: 0,
    isRefundable: false,
    refundPercentage: 50
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [resData, profileData] = await Promise.all([
      getReservationsByRestaurant(userId),
      getRestaurantProfile(userId)
    ]);
    // Filter strictly for type === 'reservation'
    setReservations(resData.filter(r => r.type === 'reservation'));
    if (profileData?.reservationConfig) {
      setConfig(profileData.reservationConfig);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    const success = await updateReservationStatus(id, status);
    if (success) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await updateRestaurantProfile(userId, { reservationConfig: config });
      setShowConfig(false);
    } catch (error) {
      console.error("Failed to save config");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

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
    <div className="animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Reservations</h2>
           <p className="text-gray-500">Manage upcoming booking requests.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="white" onClick={() => setShowConfig(!showConfig)}>
             <Settings size={18} className="mr-2"/> Configuration
           </Button>
           {(['all', 'pending', 'confirmed'] as const).map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 mb-8 animate-scale-in">
           <h3 className="text-lg font-bold text-gray-900 mb-4">Reservation Settings</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Reservation Fee ($)</label>
                 <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="number" 
                      min="0"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-primary-500"
                      value={config.reservationFee}
                      onChange={(e) => setConfig({...config, reservationFee: parseFloat(e.target.value) || 0})}
                    />
                 </div>
                 {config.reservationFee === 0 && (
                   <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                     <CheckCircle size={12}/> Pro Tip: Free reservations attract 40% more customers!
                   </p>
                 )}
              </div>

              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
                 <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                         checked={config.isRefundable}
                         onChange={(e) => setConfig({...config, isRefundable: e.target.checked})}
                       />
                       <span className="text-gray-700">Refund Available</span>
                    </label>
                 </div>
                 {config.isRefundable && (
                   <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Refund Amount:</span>
                      <input 
                        type="number" 
                        min="0" max="100"
                        className="w-20 px-2 py-1 rounded border border-gray-200 text-center"
                        value={config.refundPercentage}
                        onChange={(e) => setConfig({...config, refundPercentage: parseInt(e.target.value) || 0})}
                      />
                      <span className="text-sm text-gray-500">%</span>
                   </div>
                 )}
              </div>
           </div>
           <div className="flex justify-end mt-6">
              <Button onClick={handleSaveConfig} isLoading={isSavingConfig}>
                 <Save size={18} className="mr-2"/> Save Configuration
              </Button>
           </div>
        </div>
      )}

      {isLoading ? (
         <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
         </div>
      ) : filteredReservations.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No reservations found</h3>
            <p className="text-gray-500">You don't have any bookings matching this filter.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 gap-4">
            {filteredReservations.map(res => (
              <div key={res.id} className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                 <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gray-100 flex flex-col items-center justify-center shrink-0 border border-gray-200">
                       <span className="text-xs font-bold text-gray-500 uppercase">{new Date(res.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                       <span className="text-xl font-bold text-gray-900">{new Date(res.date).getDate()}</span>
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-gray-900">{res.userName}</h3>
                       <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1.5"><Clock size={14}/> {res.startTime} - {res.endTime}</span>
                          <span className="flex items-center gap-1.5"><AlertCircle size={14}/> {res.tableName}</span>
                          <span>{res.guestCount} Guests</span>
                          {res.amountPaid && res.amountPaid > 0 && (
                             <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold text-xs border border-green-100">Paid ${res.amountPaid}</span>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${getStatusColor(res.status)}`}>
                       {res.status}
                    </span>
                    
                    {res.status === 'pending' && (
                       <div className="flex gap-2 ml-auto md:ml-0">
                          <Button 
                             size="sm" variant="outline" 
                             onClick={() => handleStatusChange(res.id!, 'declined')}
                             className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                          >
                             Decline
                          </Button>
                          <Button 
                             size="sm" 
                             onClick={() => handleStatusChange(res.id!, 'confirmed')}
                             className="bg-green-600 hover:bg-green-700 shadow-green-500/20"
                          >
                             Accept
                          </Button>
                       </div>
                    )}
                 </div>
              </div>
            ))}
         </div>
      )}
    </div>
  );
};