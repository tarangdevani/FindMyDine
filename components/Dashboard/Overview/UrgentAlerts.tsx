
import React from 'react';
import { Clock, Store, Check, X } from 'lucide-react';
import { Reservation } from '../../../types';
import { Button } from '../../UI/Button';

interface UrgentAlertsProps {
  liveRequests: Reservation[];
  pendingPayments: Reservation[];
  onRequestAction: (reservation: Reservation, action: 'confirm' | 'decline') => void;
  onMarkPaid: (res: Reservation) => void;
}

export const UrgentAlerts: React.FC<UrgentAlertsProps> = ({ liveRequests, pendingPayments, onRequestAction, onMarkPaid }) => {
  if (liveRequests.length === 0 && pendingPayments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveRequests.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Walk-in Requests</h3>
                <div className="space-y-3">
                    {liveRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl shadow-soft border-l-4 border-orange-500 flex justify-between items-center">
                            <div><p className="font-bold text-gray-900">{req.tableName}</p><p className="text-xs text-gray-500">{req.userName} • {req.guestCount}p</p></div>
                            <div className="flex gap-2"><button onClick={() => onRequestAction(req, 'decline')} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><X size={18}/></button><button onClick={() => onRequestAction(req, 'confirm')} className="bg-green-600 text-white p-2 rounded-lg shadow-sm"><Check size={18}/></button></div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {pendingPayments.length > 0 && (
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Store size={16} className="text-blue-500"/> Awaiting Counter Payment</h3>
                <div className="space-y-3">
                    {pendingPayments.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl shadow-soft border-l-4 border-blue-500 flex justify-between items-center">
                            <div><p className="font-bold text-gray-900">{req.tableName}</p><p className="text-xs text-blue-600 font-bold">Bill: ${req.totalBillAmount?.toFixed(2)}</p></div>
                            <Button size="sm" onClick={() => onMarkPaid(req)} className="bg-blue-600 hover:bg-blue-700">Mark Paid</Button>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
