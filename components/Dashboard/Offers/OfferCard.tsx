
import React from 'react';
import { Calendar, Gift, Lock, Edit2, Trash2, BarChart2 } from 'lucide-react';
import { Offer } from '../../../types';

interface OfferCardProps {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (offer: Offer) => void;
  onViewStats: (offer: Offer) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onEdit, onDelete, onToggleStatus, onViewStats }) => {
  const isExpired = new Date(offer.validUntil) < new Date();
  
  // Calculations for Caps
  const totalGiven = offer.totalDiscountGiven || 0;
  const usageCount = offer.usageCount || 0;
  
  const budgetPercent = offer.globalBudget ? Math.min(100, (totalGiven / offer.globalBudget) * 100) : 0;
  const countPercent = offer.maxUsage ? Math.min(100, (usageCount / offer.maxUsage) * 100) : 0;

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all group flex flex-col ${offer.isActive && !isExpired ? 'border-primary-100 hover:border-primary-300' : 'border-gray-100 opacity-75'}`}>
       {/* Visual "Punch Out" Circles for Coupon Effect */}
       <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 transform -translate-y-1/2 z-10"></div>
       <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 transform -translate-y-1/2 z-10"></div>
       
       {/* Status Badge */}
       <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => onEdit(offer)} className="p-1.5 text-gray-400 hover:text-primary-600 bg-white rounded-full shadow-sm border border-gray-100"><Edit2 size={14}/></button>
          <button onClick={() => onDelete(offer.id!)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-full shadow-sm border border-gray-100"><Trash2 size={14}/></button>
       </div>

       <div className={`p-6 pb-4 border-b-2 border-dashed ${offer.isActive ? 'border-gray-100' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3 mb-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                offer.isActive ? 'bg-gradient-to-br from-primary-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-400'
             }`}>
                {offer.rewardType === 'free_item' ? <Gift size={24}/> : (offer.discountType === 'percentage' ? '%' : '$')}
             </div>
             <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{offer.title}</h3>
                {offer.type === 'coupon' ? (
                   <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-gray-600 uppercase mt-1">
                      <Lock size={8}/> {offer.code}
                   </span>
                ) : (
                   <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded uppercase mt-1">Public Offer</span>
                )}
             </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
             <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-bold uppercase">Reward</span>
                <span className="font-bold text-gray-900 text-lg">
                   {offer.rewardType === 'free_item' 
                     ? 'Free Item' 
                     : (offer.discountType === 'percentage' ? `${offer.discountValue}% Off` : `$${offer.discountValue} Off`)
                   }
                </span>
             </div>
             <div className="flex flex-col text-right">
                <span className="text-gray-400 text-xs font-bold uppercase">Condition</span>
                <span className="font-bold text-gray-900">
                   {offer.triggerItemId 
                     ? 'Buy Item' 
                     : (offer.minSpend ? `Min $${offer.minSpend}` : 'None')
                   }
                </span>
             </div>
          </div>
       </div>

       {/* Usage Stats Section */}
       <div className="p-4 bg-gray-50 flex-1 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
             <p className="text-xs font-bold text-gray-500 uppercase">Usage Stats</p>
             <button onClick={() => onViewStats(offer)} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                <BarChart2 size={12}/> View Details
             </button>
          </div>
          
          {/* Progress Bars for Limits */}
          <div className="space-y-3">
             {/* Global Budget Limit */}
             {offer.globalBudget ? (
                <div>
                   <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">Budget (${offer.globalBudget})</span>
                      <span className="font-bold text-gray-900">${(offer.globalBudget - totalGiven).toFixed(2)} Remaining</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${budgetPercent >= 100 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                   </div>
                </div>
             ) : (
                <div className="flex justify-between text-[10px]">
                   <span className="text-gray-500">Total Given</span>
                   <span className="font-bold text-gray-900">${totalGiven.toFixed(2)}</span>
                </div>
             )}

             {/* User Count Limit */}
             {offer.maxUsage ? (
                <div>
                   <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">Redemptions (Max {offer.maxUsage})</span>
                      <span className="font-bold text-gray-900">{offer.maxUsage - usageCount} Remaining</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${countPercent >= 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${countPercent}%` }}></div>
                   </div>
                </div>
             ) : (
                <div className="flex justify-between text-[10px]">
                   <span className="text-gray-500">Used By</span>
                   <span className="font-bold text-gray-900">{usageCount} People</span>
                </div>
             )}
          </div>
       </div>

       <div className="p-4 bg-white flex justify-between items-center mt-auto">
          <div className="text-xs text-gray-500">
             <p className="flex items-center gap-1"><Calendar size={12}/> Exp: {new Date(offer.validUntil).toLocaleDateString()}</p>
             {isExpired && <span className="text-red-500 font-bold mt-1 block">EXPIRED</span>}
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
             <input type="checkbox" className="sr-only peer" checked={offer.isActive} onChange={() => onToggleStatus(offer)} />
             <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
       </div>
    </div>
  );
};
