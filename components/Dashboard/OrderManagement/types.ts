
import { Order, OrderItem, OrderStatus } from '../../../types';

export interface KanbanCardItem {
    uniqueId: string; // constructed as orderId_itemIndex
    orderId: string;
    itemIndex: number;
    item: OrderItem;
    order: Order;
}

export interface KanbanColumnConfig {
    id: OrderStatus;
    label: string;
    color: string;
    bg: string;
    border: string;
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: 'ordered', label: 'Placed', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'preparing', label: 'Preparing', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'served', label: 'Served', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
];
