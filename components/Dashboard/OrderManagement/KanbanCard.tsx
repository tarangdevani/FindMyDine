
import React from 'react';
import { Clock, GripVertical, Ban, Play, Utensils, DollarSign } from 'lucide-react';
import { OrderStatus } from '../../../types';
import { KanbanCardItem, KanbanColumnConfig } from './types';

interface KanbanCardProps {
  kItem: KanbanCardItem;
  columnConfig: KanbanColumnConfig;
  onDragStart: (e: React.DragEvent, uniqueId: string) => void;
  onStatusUpdate: (uniqueId: string, newStatus: OrderStatus) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ kItem, columnConfig, onDragStart, onStatusUpdate }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, kItem.uniqueId)}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative overflow-hidden"
    >
      {/* Left Accent Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${columnConfig.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>

      <div className="flex justify-between items-start mb-2 pl-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 text-lg">{kItem.order.tableName}</span>
            <GripVertical size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Clock size={10} /> {new Date(kItem.order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">#{kItem.order.id?.slice(-4)}</span>
      </div>

      <div className="mb-2 pl-2">
          <div className="flex gap-2 text-base leading-tight items-start">
            <span className="font-bold text-gray-900 bg-gray-100 px-1.5 rounded">{kItem.item.quantity}x</span>
            <span className="text-gray-900 font-bold">{kItem.item.name}</span>
          </div>
          {kItem.item.selectedAddOns && kItem.item.selectedAddOns.length > 0 && (
             <div className="mt-1 ml-6 flex flex-wrap gap-1">
                {kItem.item.selectedAddOns.map((addon, i) => (
                   <span key={i} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      + {addon.name}
                   </span>
                ))}
             </div>
          )}
          {kItem.item.notes && (
            <p className="text-xs text-orange-600 mt-1 italic pl-1">Note: {kItem.item.notes}</p>
          )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-50 pl-2">
        <span className="text-xs font-semibold text-gray-400">{kItem.order.userName}</span>
        
        {/* Actions Group */}
        <div className="flex items-center gap-2">
            
            {/* Cancel for Placed */}
            {columnConfig.id === 'ordered' && (
               <button 
                 onClick={() => onStatusUpdate(kItem.uniqueId, 'cancelled')}
                 className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
                 title="Cancel Item"
               >
                 <Ban size={14} />
               </button>
            )}

            {/* PRIMARY ACTIONS: Advance Workflow */}
            {columnConfig.id === 'ordered' && (
                <button 
                  onClick={() => onStatusUpdate(kItem.uniqueId, 'preparing')}
                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
                >
                  Start <Play size={12} className="ml-0.5"/>
                </button>
            )}

            {columnConfig.id === 'preparing' && (
                <button 
                  onClick={() => onStatusUpdate(kItem.uniqueId, 'served')}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                >
                  Serve <Utensils size={12} className="ml-0.5"/>
                </button>
            )}

            {columnConfig.id === 'served' && (
              <button 
                onClick={() => onStatusUpdate(kItem.uniqueId, 'paid')}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
              >
                <DollarSign size={12} /> Paid
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
