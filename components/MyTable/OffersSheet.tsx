import React from 'react';
import { Gift, X } from 'lucide-react';
import { Offer } from '../../types';

interface OffersSheetProps {
  isOpen: boolean;
  offers: Offer[];
  bestPublicOffer: Offer | null;
  onSelectOffer: (offer: Offer) => void;
  onClose: () => void;
  calculateSavings: (offer: Offer) => number;
}

export const OffersSheet: React.FC<OffersSheetProps> = ({ isOpen, offers, bestPublicOffer, onSelectOffer, onClose, calculateSavings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Gift className="text-primary-500"/> Available Offers</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
                {offers.filter(o => o.type === 'offer' && o.isActive).map(offer => {
                    const savings = calculateSavings(offer);
                    const isApplied = bestPublicOffer?.id === offer.id;
                    const isApplicable = savings > 0;

                    return (
                        <div 
                            key={offer.id} 
                            onClick={() => {
                                if (isApplicable) onSelectOffer(offer);
                            }}
                            className={`p-4 rounded-2xl border-2 flex flex-col gap-2 cursor-pointer transition-all ${
                                isApplied 
                                    ? 'border-green-500 bg-green-50' 
                                    : isApplicable 
                                        ? 'border-gray-200 hover:border-primary-300 bg-white' 
                                        : 'border-gray-100 bg-gray-50 opacity-60 grayscale'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900">{offer.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{offer.description}</p>
                                </div>
                                {isApplied ? (
                                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">APPLIED</span>
                                ) : isApplicable ? (
                                    <span className="text-green-600 font-bold text-sm">Save ${savings.toFixed(2)}</span>
                                ) : (
                                    <span className="text-gray-400 text-[10px] font-bold">Conditions not met</span>
                                )}
                            </div>
                            {offer.minSpend > 0 && <p className="text-[10px] text-gray-400 font-medium">Min Spend: ${offer.minSpend}</p>}
                        </div>
                    );
                })}
                {offers.filter(o => o.type === 'offer' && o.isActive).length === 0 && (
                    <p className="text-center text-gray-400 py-4">No offers available at this time.</p>
                )}
            </div>
        </div>
    </div>
  );
};