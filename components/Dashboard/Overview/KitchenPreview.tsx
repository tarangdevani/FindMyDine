
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Order, OrderItem } from '../../../types';

interface KitchenPreviewProps {
  activeItems: { uniqueId: string; order: Order; item: OrderItem }[];
  onViewBoard: () => void;
}

export const KitchenPreview: React.FC<KitchenPreviewProps> = ({ activeItems, onViewBoard }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Live Kitchen (Active Items)</h3>
            <button onClick={onViewBoard} className="text-xs font-bold text-primary-600 flex items-center">View Board <ChevronRight size={14}/></button>
        </div>
        <div className="p-4 overflow-x-auto">
            <div className="flex gap-4">
                {['ordered', 'preparing', 'served'].map(col => (
                    <div key={col} className="flex-1 min-w-[200px] bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2 px-2">{col}</p>
                        <div className="space-y-2">
                            {activeItems.filter(k => (k.item.status || 'ordered') === col).map(k => (
                                <div key={k.uniqueId} className="bg-white p-2 rounded shadow-sm text-xs border border-gray-100">
                                    <div className="flex justify-between font-bold mb-1"><span>{k.order.tableName}</span><span className="text-gray-400">#{k.order.id?.slice(-3)}</span></div>
                                    <p className="text-gray-700 font-medium">{k.item.quantity}x {k.item.name}</p>
                                    {k.item.selectedAddOns && k.item.selectedAddOns.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {k.item.selectedAddOns.map((addon, i) => (
                                                <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded border border-gray-200">+ {addon.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
