
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../UI/Button';
import { RazorpayButton } from '../../UI/RazorpayButton';
import { TableItem } from '../../../types';

interface BookingActionProps {
  selectedTable: TableItem | null;
  reservationFee: number;
  isBooking: boolean;
  onConfirmBooking: (paymentData?: any) => void;
  compact?: boolean;
}

export const BookingAction: React.FC<BookingActionProps> = ({
  selectedTable, reservationFee, isBooking, onConfirmBooking, compact = false
}) => {
  if (!selectedTable) {
      if (compact) return null; // Don't show anything on mobile if nothing selected
      return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <p className="text-sm text-gray-400 italic">Please select a table to proceed.</p>
        </div>
      );
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-4 h-full'}`}>
        {!compact && (
            <div className="space-y-4 flex-1">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Table</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{selectedTable.name}</p>
                            <p className="text-sm text-gray-500">{selectedTable.seats} Seats • {selectedTable.area}</p>
                        </div>
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-blue-50 text-blue-700 p-3 rounded-lg flex gap-2 items-start">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p>Reservation held for 15 minutes.</p>
                </div>
            </div>
        )}

        {/* Action Area */}
        <div className={compact ? "" : "pt-6 border-t border-gray-100 mt-auto"}>
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium text-sm">{compact ? selectedTable.name : 'Reservation Fee'}</span>
                <span className="text-gray-900 font-bold">
                    {reservationFee > 0 ? `$${reservationFee.toFixed(2)}` : 'Free'}
                </span>
            </div>
            
            {reservationFee > 0 ? (
                <div className="w-full">
                    <RazorpayButton 
                        amount={reservationFee}
                        name="Reservation Fee"
                        description={`Booking for ${selectedTable.name}`}
                        onSuccess={(response) => onConfirmBooking({ id: response.razorpay_payment_id, purchase_units: [{ amount: { value: reservationFee } }] })}
                        disabled={!selectedTable}
                    />
                </div>
            ) : (
                <Button 
                    size="lg" 
                    fullWidth 
                    onClick={() => onConfirmBooking()}
                    disabled={!selectedTable || isBooking}
                    isLoading={isBooking}
                    className="shadow-xl shadow-primary-500/20"
                >
                    {compact ? 'Confirm Booking' : 'Request Reservation'}
                </Button>
            )}
        </div>
    </div>
  );
};
