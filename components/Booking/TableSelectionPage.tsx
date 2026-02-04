import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, LayoutTemplate, List, Map, CheckCircle2, AlertCircle, Loader2, Armchair, ChevronRight, Ban } from 'lucide-react';
import { Button } from '../UI/Button';
import { TableItem, RestaurantData, UserProfile } from '../../types';
import { getRestaurantById } from '../../services/restaurantService';
import { getTables } from '../../services/tableService';
import { createReservation, getOccupiedTableIds } from '../../services/reservationService';
import { ArchitecturalFloorPlan } from '../Dashboard/ArchitecturalFloorPlan';

interface TableSelectionPageProps {
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

// Helper for default time (next hour)
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
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Local State for Selection
  const [date, setDate] = useState(searchParams.get('date') || getTodayString());
  const [startTime, setStartTime] = useState(searchParams.get('start') || getNextHour());
  const [endTime, setEndTime] = useState(searchParams.get('end') || getTwoHoursLater(searchParams.get('start') || getNextHour()));
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'));

  // Modes
  const [isReservationMode, setIsReservationMode] = useState(false);

  // Data State
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [occupiedTableIds, setOccupiedTableIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  // For Map View Area switching
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

  // Check availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!id) return;
      
      let checkDate = date;
      let checkStart = startTime;
      let checkEnd = endTime;

      // If NOT in reservation mode (Walk-in), check availability for NOW + 2 hours
      if (!isReservationMode) {
        checkDate = getTodayString();
        checkStart = getCurrentTime();
        checkEnd = getTwoHoursLater(checkStart);
      }

      const occupied = await getOccupiedTableIds(id, checkDate, checkStart, checkEnd);
      setOccupiedTableIds(occupied);
      
      // Deselect if currently selected table becomes occupied
      if (selectedTable && occupied.includes(selectedTable.id!)) {
        setSelectedTable(null);
      }
    };
    
    // Fetch immediately and set up interval for walk-in mode updates
    fetchAvailability();
    
    let interval: any;
    if (!isReservationMode) {
       interval = setInterval(fetchAvailability, 30000); // Check every 30s for walk-in
    }

    return () => {
        if(interval) clearInterval(interval);
    };
  }, [id, date, startTime, endTime, isReservationMode]);

  const isTableOccupied = (table: TableItem) => {
      // It is occupied if:
      // 1. It is in the occupied list calculated by reservation service (overlap logic)
      // 2. OR the table document itself is marked 'occupied' or 'reserved' (physical status)
      //    We usually ignore physical status if in future reservation mode, but for walk-in (now) it matters.
      if (isReservationMode) {
          return occupiedTableIds.includes(table.id!);
      } else {
          return occupiedTableIds.includes(table.id!) || table.status === 'occupied' || table.status === 'reserved';
      }
  };

  const handleTableClick = (table: TableItem) => {
      if (isTableOccupied(table)) {
          alert("This table is currently unavailable.");
          return;
      }

      if (isReservationMode) {
          setSelectedTable(table);
      } else {
          // Redirect to "My Table" page for immediate booking
          navigate(`/restaurant/${id}/table/${table.id}/claim`);
      }
  };

  const handleConfirmBooking = async (paymentData?: any) => {
    if (!currentUser) {
        onLoginRequired();
        return;
    }
    
    if (!restaurant || !selectedTable) return;
    
    setIsBooking(true);
    try {
      const reservationId = await createReservation({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.imageUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Guest',
        userEmail: currentUser.email,
        tableId: selectedTable.id!,
        tableName: selectedTable.name,
        date,
        startTime,
        endTime,
        guestCount: guests,
        status: paymentData ? 'confirmed' : 'pending',
        type: 'reservation',
        createdAt: new Date().toISOString(),
        amountPaid: paymentData ? parseFloat(paymentData.purchase_units[0].amount.value) : 0,
        paymentStatus: paymentData ? 'paid' : 'unpaid',
        transactionId: paymentData ? paymentData.id : undefined
      });

      if (reservationId) {
        alert("Reservation Successful!");
        navigate('/my-reservations');
      } else {
        alert("Failed to create reservation.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={40}/></div>;
  if (!restaurant) return <div>Restaurant not found</div>;

  const reservationFee = restaurant.reservationConfig?.reservationFee || 0;

  // Process tables
  const displayedTables = tables.map(t => ({
      ...t,
      isUnavailable: isTableOccupied(t)
  }));

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-4">
            <ArrowLeft size={18} /> Back to Restaurant
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
                {isReservationMode ? 'Select a Table for Reservation' : 'Select Your Table'}
            </h1>
            <p className="text-gray-500">
                {isReservationMode ? 'Choose a table for your upcoming visit.' : 'Tap a table to occupy it immediately.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
          
          {/* Main Selection Area */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden flex flex-col">
             
             {/* Toolbar */}
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <div className="flex gap-2">
                   <button 
                     onClick={() => setViewMode('grid')}
                     className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                   >
                     <List size={18} /> List View
                   </button>
                   <button 
                     onClick={() => setViewMode('map')}
                     className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                   >
                     <Map size={18} /> Floor Plan
                   </button>
                </div>
                
                {viewMode === 'map' && areas.length > 1 && (
                   <select 
                     className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                     value={activeArea}
                     onChange={(e) => setActiveArea(e.target.value)}
                   >
                     {areas.map(area => <option key={area} value={area}>{area}</option>)}
                   </select>
                )}
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto relative bg-gray-50/50">
                {viewMode === 'grid' ? (
                   <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {displayedTables.map(table => {
                        const unavailable = table.isUnavailable;
                        const isSelected = selectedTable?.id === table.id;
                        
                        return (
                            <button
                            key={table.id}
                            disabled={unavailable}
                            onClick={() => handleTableClick(table)}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-32 relative ${
                                unavailable
                                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale' 
                                    : isSelected
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md ring-2 ring-primary-200' 
                                        : 'border-white bg-white hover:border-primary-200 hover:shadow-sm'
                            }`}
                            >
                            <LayoutTemplate size={24} className={isSelected ? 'text-primary-500' : 'text-gray-300'} />
                            <span className="font-bold">{table.name}</span>
                            <span className="text-xs text-gray-500">{table.seats} Seats</span>
                            
                            {/* Status Badges */}
                            {unavailable && (
                                <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded absolute top-2 right-2 flex items-center gap-1 border border-red-100">
                                    <Ban size={10} /> Not Available
                                </span>
                            )}
                            {isSelected && !unavailable && (
                                <div className="absolute top-2 right-2 text-primary-600"><CheckCircle2 size={16} /></div>
                            )}
                            </button>
                        );
                      })}
                   </div>
                ) : (
                   <div className="w-full h-full relative">
                      <ArchitecturalFloorPlan 
                        userId={id!} 
                        activeArea={activeArea} 
                        readOnly={true}
                        onTableSelect={handleTableClick}
                      />
                      {tables.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <p className="text-gray-500 font-medium">No floor plan available.</p>
                         </div>
                      )}
                   </div>
                )}
             </div>
          </div>

          {/* Right Panel: Logic Switcher */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
             
             {!isReservationMode ? (
                 // DEFAULT MODE: WALK-IN / PROMPT TO RESERVE
                 <div className="flex flex-col h-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">My Table</h3>
                    <p className="text-gray-500 text-sm mb-6">Tap a table on the left to occupy it immediately.</p>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                        <Armchair size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-400 font-medium text-sm">Select a table from the list to view details and check-in.</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 mb-4">
                            <h4 className="font-bold text-primary-900 text-sm mb-1">Planning for later?</h4>
                            <p className="text-xs text-primary-700 mb-3">Book a table in advance to secure your spot.</p>
                            <Button fullWidth onClick={() => setIsReservationMode(true)} className="shadow-none bg-primary-600 hover:bg-primary-700">
                                Reserve for Later
                            </Button>
                        </div>
                    </div>
                 </div>
             ) : (
                 // RESERVATION MODE
                 <div className="flex flex-col h-full animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Reservation</h3>
                        <button onClick={() => setIsReservationMode(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>

                    {/* Inputs moved here */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                                <input 
                                    type="date" 
                                    min={getTodayString()}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 outline-none font-bold text-sm text-gray-900 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">From</label>
                                <input 
                                    type="time" 
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 outline-none font-bold text-sm text-gray-900 transition-all text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">To</label>
                                <input 
                                    type="time" 
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 outline-none font-bold text-sm text-gray-900 transition-all text-center"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Guests</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 text-gray-400" size={16} />
                                <select 
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary-500 outline-none font-bold text-sm text-gray-900 transition-all appearance-none cursor-pointer"
                                >
                                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => <option key={n} value={n}>{n} Guests</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Table</p>
                            {selectedTable ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">{selectedTable.name}</p>
                                        <p className="text-sm text-gray-500">{selectedTable.seats} Seats • {selectedTable.area}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={16} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Please select a table from the left.</p>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 bg-blue-50 text-blue-700 p-3 rounded-lg flex gap-2 items-start">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <p>Reservation held for 15 minutes.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium">Reservation Fee</span>
                            <span className="text-gray-900 font-bold">
                                {reservationFee > 0 ? `$${reservationFee.toFixed(2)}` : 'Free'}
                            </span>
                        </div>
                        
                        {reservationFee > 0 ? (
                            <div id="paypal-button-container" className="w-full">
                                <PayPalButtonWrapper 
                                    amount={reservationFee} 
                                    onSuccess={handleConfirmBooking}
                                    disabled={!selectedTable}
                                />
                            </div>
                        ) : (
                            <Button 
                                size="lg" 
                                fullWidth 
                                onClick={() => handleConfirmBooking()}
                                disabled={!selectedTable || isBooking}
                                isLoading={isBooking}
                                className="shadow-xl shadow-primary-500/20"
                            >
                                Request Reservation
                            </Button>
                        )}
                    </div>
                 </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Sub-component for PayPal
const PayPalButtonWrapper: React.FC<{amount: number, onSuccess: (details: any) => void, disabled?: boolean}> = ({ amount, onSuccess, disabled }) => {
   const paypalRef = React.useRef<HTMLDivElement>(null);
   const [scriptLoaded, setScriptLoaded] = useState(false);

   useEffect(() => {
      if (window.paypal) {
         setScriptLoaded(true);
      } else {
         const interval = setInterval(() => {
            if (window.paypal) {
               setScriptLoaded(true);
               clearInterval(interval);
            }
         }, 500);
         return () => clearInterval(interval);
      }
   }, []);

   useEffect(() => {
      if (!disabled && scriptLoaded && window.paypal && paypalRef.current) {
         try {
             paypalRef.current.innerHTML = ""; 
             window.paypal.Buttons({
                style: { layout: 'horizontal', color: 'black', shape: 'rect', label: 'pay' },
                createOrder: (data: any, actions: any) => {
                   return actions.order.create({
                      purchase_units: [{
                         amount: { value: amount.toFixed(2) }
                      }]
                   });
                },
                onApprove: async (data: any, actions: any) => {
                   const details = await actions.order.capture();
                   onSuccess(details);
                },
                onError: (err: any) => {
                    console.error("PayPal Error:", err);
                    alert("Payment failed. Please try again.");
                }
             }).render(paypalRef.current);
         } catch(e) {
             console.error("Failed to render PayPal:", e);
         }
      }
   }, [amount, disabled, scriptLoaded]);

   if (!scriptLoaded) return <div className="text-center text-xs text-gray-400 py-2">Loading Payment...</div>;
   if (disabled) return <Button size="lg" fullWidth disabled>Select a table to pay</Button>;

   return <div ref={paypalRef} className="w-full"></div>;
};