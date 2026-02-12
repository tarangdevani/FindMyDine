
import React from 'react';
import { ChevronRight, Play, Utensils, Check, Clock } from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '../../../types';

interface InteractiveKitchenProps {
  activeItems: { uniqueId: string; order: Order; item: OrderItem }[];
  onViewBoard: () => void;
  onUpdateStatus: (uniqueId: string, status: OrderStatus) => void;
}

export const InteractiveKitchen: React.FC<InteractiveKitchenProps> = ({ activeItems, onViewBoard, onUpdateStatus }) => {
  
  // Sort: Ordered first, then Preparing. Within that, oldest first.
  const sortedItems = [...activeItems].sort((a, b) => {
      const statusPriority = { 'ordered': 0, 'preparing': 1, 'served': 2 };
      const statusA = statusPriority[a.item.status as keyof typeof statusPriority] || 0;
      const statusB = statusPriority[b.item.status as keyof typeof statusPriority] || 0;
      
      if (statusA !== statusB) return statusA - statusB;
      return new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime();
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Utensils size={20} className="text-orange-500"/> Live Kitchen Queue
            </h3>
            <button onClick={onViewBoard} className="text-xs font-bold text-primary-600 flex items-center hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-gray-200">
                Full Board <ChevronRight size={14} className="ml-1"/>
            </button>
        </div>
        
        <div className="p-0">
            {sortedItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic">No active orders in the kitchen.</div>
            ) : (
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {sortedItems.map(({ uniqueId, order, item }) => {
                        const status = item.status || 'ordered';
                        return (
                            <div key={uniqueId} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                
                                {/* Item Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border font-bold text-gray-700 shrink-0 ${status === 'preparing' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200'}`}>
                                        <span className="text-[10px] uppercase font-normal text-gray-400 leading-none mb-0.5">Table</span>
                                        <span className="text-sm leading-none">{order.tableName.replace(/\D/g,'')}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">
                                            <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded mr-2 text-xs">{item.quantity}x</span>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <Clock size={10}/> {new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                                <span className="text-primary-600 font-medium">+ {item.selectedAddOns.length} Add-ons</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {status === 'ordered' && (
                                        <button 
                                            onClick={() => onUpdateStatus(uniqueId, 'preparing')}
                                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                                        >
                                            Start <Play size={12} className="fill-current"/>
                                        </button>
                                    )}
                                    {status === 'preparing' && (
                                        <button 
                                            onClick={() => onUpdateStatus(uniqueId, 'served')}
                                            className="flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                        >
                                            Serve <Check size={12}/>
                                        </button>
                                    )}
                                    {status === 'served' && (
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Served</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};
