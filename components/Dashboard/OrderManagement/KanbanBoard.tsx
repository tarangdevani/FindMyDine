
import React from 'react';
import { OrderStatus } from '../../../types';
import { KanbanColumn } from './KanbanColumn';
import { KANBAN_COLUMNS, KanbanCardItem } from './types';

interface KanbanBoardProps {
  activeItems: KanbanCardItem[];
  draggedCardId: string | null;
  onDragStart: (e: React.DragEvent, uniqueId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: OrderStatus) => void;
  onStatusUpdate: (uniqueId: string, status: OrderStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  activeItems, draggedCardId, onDragStart, onDragOver, onDrop, onStatusUpdate 
}) => {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-6 h-full min-w-[1000px]">
        {KANBAN_COLUMNS.map((column) => {
          const columnItems = activeItems.filter(k => (k.item.status || 'ordered') === column.id);
          
          return (
            <KanbanColumn 
                key={column.id}
                column={column}
                items={columnItems}
                draggedCardId={draggedCardId}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onStatusUpdate={onStatusUpdate}
            />
          );
        })}
      </div>
    </div>
  );
};
