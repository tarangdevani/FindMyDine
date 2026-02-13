
import React from 'react';
import { Armchair } from 'lucide-react';
import { Button } from '../../UI/Button';
import { TableItem } from '../../../types';
import { BookingInputs } from './BookingInputs';
import { BookingAction } from './BookingAction';
import { useToast } from '../../../context/ToastContext';

interface BookingSidebarProps {
  isReservationMode: boolean;
  setIsReservationMode: (v: boolean) => void;
  date: string; setDate: (v: string) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  selectedTable: TableItem | null;
  reservationFee: number;
  isBooking: boolean;
  onConfirmBooking: (paymentData?: any) => void;
  minDate: string;
}

export const BookingSidebar: React.FC<BookingSidebarProps> = ({
  isReservationMode, setIsReservationMode,
  date, setDate,
  startTime, setStartTime,
  endTime, setEndTime,
  selectedTable, reservationFee, isBooking, onConfirmBooking, minDate
}) => {
  const { showToast } = useToast();

  const validateAndConfirm = (paymentData?: any) => {
    // 1. Parse Dates
    const today = new Date();
    const selectedDate = new Date(date);
    
    // Reset hours to compare just dates
    const todayStr = today.toISOString().split('T')[0];
    const selectedStr = date;

    // 2. Validate Time Range
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
        showToast("End time must be after start time.", "error");
        return;
    }

    // 3. Validate Past Time (if today)
    if (selectedStr === todayStr) {
        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        // Buffer of 15 mins for booking processing
        if (startMinutes < currentMinutes + 15) {
            showToast("Cannot book a time in the past. Please select a future time.", "error");
            return;
        }
    }

    // 4. Validate Duration (e.g., max 4 hours, min 30 mins)
    const duration = endMinutes - startMinutes;
    if (duration < 30) {
        showToast("Minimum reservation duration is 30 minutes.", "warning");
        return;
    }
    if (duration > 240) {
        showToast("Maximum reservation duration is 4 hours.", "warning");
        return;
    }

    onConfirmBooking(paymentData);
  };
  
  if (!isReservationMode) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Reservation</h3>
            <button onClick={() => setIsReservationMode(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
        </div>

        <BookingInputs 
            date={date} setDate={setDate}
            startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime}
            minDate={minDate}
            className="mb-6"
        />

        <BookingAction 
            selectedTable={selectedTable}
            reservationFee={reservationFee}
            isBooking={isBooking}
            onConfirmBooking={validateAndConfirm}
        />
    </div>
  );
};
