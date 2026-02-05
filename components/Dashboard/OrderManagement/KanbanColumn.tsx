
import React from 'react';
import { OrderStatus } from '../../../types';
import { KanbanCard } from './KanbanCard';
import { KanbanCardItem, KanbanColumnConfig } from './types';

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  items: KanbanCardItem[];
  draggedCardId: string | null;
  onDragStart: (e: React.DragEvent, uniqueId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: OrderStatus) => void;
  onStatusUpdate: (uniqueId: string, status: OrderStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  column, items, draggedCardId, onDragStart, onDragOver, onDrop, onStatusUpdate 
}) => {
  return (
    <div 
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
      className={`flex-1 flex flex-col rounded-2xl bg-gray-50 border border-gray-200 h-full max-h-full transition-colors ${draggedCardId ? 'bg-gray-100/80 border-dashed border-gray-300' : ''}`}
    >
      {/* Column Header */}
      <div className={`p-4 border-b border-gray-200 rounded-t-2xl bg-white flex justify-between items-center sticky top-0 z-10`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${column.bg.replace('bg-', 'bg-').replace('50', '500')}`}></span>
          <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">{column.label}</h3>
        </div>
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-bold">{items.length}</span>
      </div>

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm italic">
            No items in {column.label}
          </div>
        ) : (
          items.map((kItem) => (
            <KanbanCard 
                key={kItem.uniqueId} 
                kItem={kItem} 
                columnConfig={column}
                onDragStart={onDragStart}
                onStatusUpdate={onStatusUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};
