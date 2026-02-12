
import React from 'react';
import { Store, Receipt, CheckCircle } from 'lucide-react';
import { Reservation } from '../../../types';
import { Button } from '../../UI/Button';

interface BillRequestsProps {
  pendingPayments: Reservation[];
  onMarkPaid: (res: Reservation) => void;
  isProcessing?: boolean;
}

export const BillRequests: React.FC<BillRequestsProps> = ({ pendingPayments, onMarkPaid, isProcessing }) => {
  if (pendingPayments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <Store size={18} className="text-blue-600"/> Bill Requests
            </h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{pendingPayments.length}</span>
        </div>
        
        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            {pendingPayments.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-black text-gray-900 text-lg">{req.tableName}</p>
                            <p className="text-xs text-gray-500 font-medium">{req.userName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</p>
                            <p className="text-xl font-black text-gray-900">${req.totalBillAmount?.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-50">
                        <Button 
                            size="sm" 
                            fullWidth 
                            onClick={() => onMarkPaid(req)}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        >
                            <CheckCircle size={16} className="mr-2"/> Confirm Payment
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
