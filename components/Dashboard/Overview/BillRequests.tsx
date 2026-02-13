
import React from 'react';
import { Receipt, CheckCircle, User, Clock, Armchair } from 'lucide-react';
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
    <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-900/5 overflow-hidden flex flex-col h-full animate-fade-in-up">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex justify-between items-center">
            <div>
                <h3 className="font-extrabold text-blue-900 text-lg flex items-center gap-2">
                    <Receipt size={20} className="text-blue-600"/> Bill Requests
                </h3>
                <p className="text-xs text-blue-600/80 font-medium mt-1">Pending payments at counter</p>
            </div>
            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                {pendingPayments.length} Waiting
            </div>
        </div>
        
        {/* List */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar bg-slate-50/50">
            {pendingPayments.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    {/* Decorative Background Element */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <Armchair size={16} />
                                </div>
                                <span className="font-black text-gray-900 text-lg">{req.tableName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <User size={12} className="text-gray-400"/> {req.userName || 'Guest'}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Amount</p>
                            <p className="text-2xl font-black text-gray-900 tracking-tight flex items-baseline justify-end gap-0.5">
                                <span className="text-sm text-gray-400 font-bold">$</span>{req.totalBillAmount?.toFixed(2)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-3 relative z-10">
                        <div className="flex-1 text-xs text-gray-400 flex items-center gap-1.5">
                            <Clock size={12}/> 
                            <span>Requested just now</span>
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => onMarkPaid(req)}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white px-6 rounded-xl"
                        >
                            <CheckCircle size={16} className="mr-2"/> Mark Paid
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
