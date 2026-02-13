
import React from 'react';
import { Clock, User, Check, X } from 'lucide-react';
import { Reservation } from '../../../types';
import { Button } from '../../UI/Button';

interface WalkInRequestsProps {
  requests: Reservation[];
  onAction: (reservation: Reservation, action: 'confirm' | 'decline') => void;
}

export const WalkInRequests: React.FC<WalkInRequestsProps> = ({ requests, onAction }) => {
  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col h-full">
       <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex justify-between items-center">
          <h3 className="font-bold text-orange-900 flex items-center gap-2">
             <Clock size={18} className="text-orange-600"/> Walk-in Requests
          </h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">{requests.length}</span>
       </div>
       
       <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
          {requests.map(req => (
             <div key={req.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <div>
                       <p className="font-bold text-gray-900 text-lg">{req.tableName}</p>
                       <p className="text-xs text-gray-500 flex items-center gap-1"><User size={12}/> {req.userName}</p>
                   </div>
                   <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded">WAITING</span>
                </div>
                
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => onAction(req, 'decline')} className="flex-1 p-2 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-100 transition-colors flex justify-center"><X size={18}/></button>
                    <button onClick={() => onAction(req, 'confirm')} className="flex-1 bg-green-600 text-white p-2 rounded-lg shadow-sm hover:bg-green-700 transition-colors flex justify-center"><Check size={18}/></button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
