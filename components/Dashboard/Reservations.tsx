
import React, { useState, useEffect } from 'react';
import { Reservation, ReservationStatus, ReservationConfig } from '../../types';
import { getReservationsByRestaurant, updateReservationStatus } from '../../services/reservationService';
import { updateRestaurantProfile, getRestaurantProfile } from '../../services/restaurantService';

// Child Components
import { ReservationsHeader } from './Reservations/ReservationsHeader';
import { ReservationConfigPanel } from './Reservations/ReservationConfigPanel';
import { ReservationList } from './Reservations/ReservationList';

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
    // If cancelling, pass the refund percentage from config
    const refundPct = (status === 'cancelled' || status === 'declined') && config.isRefundable ? config.refundPercentage : 0;
    
    const success = await updateReservationStatus(id, status, refundPct);
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

  return (
    <div className="animate-fade-in-up pb-10">
      
      <ReservationsHeader 
        showConfig={showConfig} 
        setShowConfig={setShowConfig}
        filter={filter}
        setFilter={setFilter}
      />

      {showConfig && (
        <ReservationConfigPanel 
          config={config}
          setConfig={setConfig}
          onSave={handleSaveConfig}
          isSaving={isSavingConfig}
        />
      )}

      <ReservationList 
        reservations={filteredReservations}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
        config={config}
      />
      
    </div>
  );
};
