
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Calendar } from 'lucide-react';
import { TableItem, RestaurantData, UserProfile } from '../../types';
import { getRestaurantById } from '../../services/restaurantService';
import { getTables } from '../../services/tableService';
import { createReservation, getOccupiedTableIds } from '../../services/reservationService';
import { ArchitecturalFloorPlan } from '../Dashboard/ArchitecturalFloorPlan';
import { useToast } from '../../context/ToastContext';

// Child Components
import { SelectionHeader } from './Selection/SelectionHeader';
import { ViewToolbar } from './Selection/ViewToolbar';
import { TableGrid } from './Selection/TableGrid';
import { BookingSidebar } from './Selection/BookingSidebar';
import { BookingInputs } from './Selection/BookingInputs';
import { BookingAction } from './Selection/BookingAction';
import { Button } from '../UI/Button';

interface TableSelectionPageProps {
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

const getNextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toTimeString().slice(0, 5);
};

const getTwoHoursLater = (startTime: string) => {
  const [h, m] = startTime.split(':').map(Number);
  const d = new Date();
  d.setHours(h + 2, m);
  return d.toTimeString().slice(0, 5);
};

const getTodayString = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export const TableSelectionPage: React.FC<TableSelectionPageProps> = ({ currentUser, onLoginRequired }) => {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Local State
  const [date, setDate] = useState(searchParams.get('date') || getTodayString());
  const [startTime, setStartTime] = useState(searchParams.get('start') || getNextHour());
  const [endTime, setEndTime] = useState(searchParams.get('end') || getTwoHoursLater(searchParams.get('start') || getNextHour()));
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'));

  const [isReservationMode, setIsReservationMode] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [occupiedTableIds, setOccupiedTableIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  const [areas, setAreas] = useState<string[]>([]);
  const [activeArea, setActiveArea] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      const rData = await getRestaurantById(id);
      const tData = await getTables(id);
      
      setRestaurant(rData);
      setTables(tData);
      
      const distinctAreas = Array.from(new Set(tData.map(t => t.area)));
      setAreas(distinctAreas);
      if (distinctAreas.length > 0) setActiveArea(distinctAreas[0]);
      
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!id) return;
      let checkDate = date;
      let checkStart = startTime;
      let checkEnd = endTime;

      if (!isReservationMode) {
        checkDate = getTodayString();
        checkStart = getCurrentTime();
        checkEnd = getTwoHoursLater(checkStart);
      }

      const occupied = await getOccupiedTableIds(id, checkDate, checkStart, checkEnd);
      setOccupiedTableIds(occupied);
      
      if (selectedTable && occupied.includes(selectedTable.id!)) {
        setSelectedTable(null);
      }
    };
    
    fetchAvailability();
    let interval: any;
    if (!isReservationMode) {
       interval = setInterval(fetchAvailability, 30000); 
    }
    return () => { if(interval) clearInterval(interval); };
  }, [id, date, startTime, endTime, isReservationMode]);

  const isTableOccupied = (table: TableItem) => {
      if (isReservationMode) return occupiedTableIds.includes(table.id!);
      return occupiedTableIds.includes(table.id!) || table.status === 'occupied' || table.status === 'reserved';
  };

  const handleTableClick = (table: TableItem) => {
      if (isTableOccupied(table)) {
          showToast("This table is currently unavailable.", "warning");
          return;
      }
      if (isReservationMode) {
          setSelectedTable(table);
      } else {
          navigate(`/restaurant/${id}/table/${table.id}/claim`);
      }
  };

  const handleConfirmBooking = async (paymentData?: any) => {
    if (!currentUser) { onLoginRequired(); return; }
    if (!restaurant || !selectedTable) return;
    setIsBooking(true);
    try {
      const reservationId = await createReservation({
        restaurantId: restaurant.id, restaurantName: restaurant.name, restaurantImage: restaurant.imageUrl,
        userId: currentUser.uid, userName: currentUser.displayName || 'Guest', userEmail: currentUser.email,
        tableId: selectedTable.id!, tableName: selectedTable.name,
        date, startTime, endTime, guestCount: guests,
        status: paymentData ? 'confirmed' : 'pending', type: 'reservation',
        createdAt: new Date().toISOString(),
        amountPaid: paymentData ? parseFloat(paymentData.purchase_units[0].amount.value) : 0,
        paymentStatus: paymentData ? 'paid' : 'unpaid', transactionId: paymentData ? paymentData.id : undefined
      });
      if (reservationId) {
        showToast("Reservation Successful!", "success");
        navigate('/my-reservations');
      } else {
        showToast("Failed to create reservation.", "error");
      }
    } catch (error) { 
        console.error(error); 
        showToast("An unexpected error occurred.", "error"); 
    } finally { 
        setIsBooking(false); 
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40}/></div>;
  if (!restaurant) return <div>Restaurant not found</div>;

  const reservationFee = restaurant.reservationConfig?.reservationFee || 0;
  const displayedTables = tables.map(t => ({ ...t, isUnavailable: isTableOccupied(t) }));

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20 md:pb-8 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
        
        <SelectionHeader isReservationMode={isReservationMode} onBack={() => navigate(-1)} />

        {/* MOBILE CONTROLS */}
        <div className="lg:hidden mb-4 space-y-4">
            {!isReservationMode ? (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Walk-in Mode</h4>
                        <p className="text-xs text-gray-500">Tap table to occupy instantly</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setIsReservationMode(true)}>Reserve Later</Button>
                </div>
            ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Calendar size={16}/> Reservation Details</h4>
                        <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="text-xs font-bold text-primary-600">
                            {showMobileFilters ? 'Hide' : 'Edit'}
                        </button>
                    </div>
                    
                    {/* Compact preview when collapsed */}
                    {!showMobileFilters && (
                        <div className="flex gap-4 text-xs font-medium text-gray-600" onClick={() => setShowMobileFilters(true)}>
                            <span>{new Date(date).toLocaleDateString()}</span>
                            <span>{startTime} - {endTime}</span>
                            <span>{guests} Guests</span>
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="animate-fade-in space-y-3">
                            <BookingInputs 
                                date={date} setDate={setDate}
                                startTime={startTime} setStartTime={setStartTime}
                                endTime={endTime} setEndTime={setEndTime}
                                guests={guests} setGuests={setGuests}
                                minDate={getTodayString()}
                                compact={true}
                            />
                            <Button size="sm" variant="ghost" fullWidth onClick={() => setIsReservationMode(false)} className="text-gray-400 font-normal">Switch to Walk-in</Button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          
          {/* Main Selection Area */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden flex flex-col min-h-[50vh] lg:min-h-[600px]">
             <ViewToolbar 
                viewMode={viewMode} setViewMode={setViewMode}
                areas={areas} activeArea={activeArea} setActiveArea={setActiveArea}
             />
             <div className="flex-1 overflow-y-auto relative bg-gray-50/50">
                {viewMode === 'grid' ? (
                   <TableGrid tables={displayedTables} selectedTableId={selectedTable?.id} onTableSelect={handleTableClick} />
                ) : (
                   <div className="w-full h-full relative">
                      <ArchitecturalFloorPlan userId={id!} activeArea={activeArea} readOnly={true} onTableSelect={handleTableClick} />
                      {tables.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><p className="text-gray-500 font-medium">No floor plan available.</p></div>
                      )}
                   </div>
                )}
             </div>
          </div>

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:flex bg-white rounded-3xl shadow-soft border border-gray-100 p-6 flex-col h-full overflow-y-auto">
             <BookingSidebar 
                isReservationMode={isReservationMode} setIsReservationMode={setIsReservationMode}
                date={date} setDate={setDate} startTime={startTime} setStartTime={setStartTime}
                endTime={endTime} setEndTime={setEndTime} guests={guests} setGuests={setGuests}
                selectedTable={selectedTable} reservationFee={reservationFee}
                isBooking={isBooking} onConfirmBooking={handleConfirmBooking} minDate={getTodayString()}
             />
          </div>

        </div>
      </div>

      {/* MOBILE BOTTOM SHEET ACTION */}
      {isReservationMode && selectedTable && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-4 z-50 animate-slide-up">
              <BookingAction 
                  selectedTable={selectedTable}
                  reservationFee={reservationFee}
                  isBooking={isBooking}
                  onConfirmBooking={handleConfirmBooking}
                  compact={true}
              />
          </div>
      )}
    </div>
  );
};
