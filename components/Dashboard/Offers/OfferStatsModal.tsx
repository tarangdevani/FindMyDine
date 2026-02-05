
import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Clock, DollarSign } from 'lucide-react';
import { Offer, OfferUsage } from '../../../types';
import { getOfferUsageHistory } from '../../../services/offerService';

interface OfferStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  userId: string;
}

export const OfferStatsModal: React.FC<OfferStatsModalProps> = ({ isOpen, onClose, offer, userId }) => {
  const [history, setHistory] = useState<OfferUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && offer && offer.id) {
        setIsLoading(true);
        getOfferUsageHistory(userId, offer.id).then(data => {
            setHistory(data);
            setIsLoading(false);
        });
    }
  }, [isOpen, offer, userId]);

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{offer.title} Stats</h3>
                    <p className="text-xs text-gray-500 mt-1">Usage history and redemption details.</p>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} className="text-gray-500"/>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Given</p>
                        <p className="text-2xl font-black text-gray-900">${(offer.totalDiscountGiven || 0).toFixed(2)}</p>
                        {offer.globalBudget && (
                            <div className="mt-2 text-[10px] text-gray-500">
                                <span className="font-bold text-gray-900">${(offer.globalBudget - (offer.totalDiscountGiven || 0)).toFixed(2)}</span> remaining of budget
                            </div>
                        )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Redemptions</p>
                        <p className="text-2xl font-black text-gray-900">{offer.usageCount}</p>
                        {offer.maxUsage && (
                            <div className="mt-2 text-[10px] text-gray-500">
                                <span className="font-bold text-gray-900">{offer.maxUsage - offer.usageCount}</span> uses remaining
                            </div>
                        )}
                    </div>
                </div>

                {/* History List */}
                <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-gray-400"/> Redemption History
                </h4>
                
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-500"/></div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
                        No usage history recorded yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map((record, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <User size={14}/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{record.userName}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(record.usedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600">-${record.discountAmount.toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">#{record.orderId?.slice(-4)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
