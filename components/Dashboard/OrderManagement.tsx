
import React, { useState, useEffect } from 'react';
import { getOrdersByRestaurant, updateOrderItemStatus } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { KanbanCardItem } from './OrderManagement/types';

// Child Components
import { OrderManagementHeader } from './OrderManagement/OrderManagementHeader';
import { KanbanBoard } from './OrderManagement/KanbanBoard';
import { OrderHistory } from './OrderManagement/OrderHistory';

interface OrderManagementProps {
  userId: string;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Poll every 15s for snappier updates
    return () => clearInterval(interval);
  }, [userId]);

  const fetchOrders = async () => {
    const data = await getOrdersByRestaurant(userId);
    setOrders(data);
    setIsLoading(false);
  };

  // --- Logic ---

  const handleItemStatusUpdate = async (uniqueId: string, newStatus: OrderStatus) => {
    const [orderId, idxStr] = uniqueId.split('_');
    const itemIndex = parseInt(idxStr);

    // Optimistic Update using functional state to prevent stale closures
    setOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return prevOrders;
        
        const newOrders = [...prevOrders];
        // Create shallow copy of the order to update
        const updatedOrder = { ...newOrders[orderIndex] };
        // Create shallow copy of items array
        const newItems = [...updatedOrder.items];
        
        // Update specific item
        if (newItems[itemIndex]) {
            newItems[itemIndex] = { ...newItems[itemIndex], status: newStatus };
            updatedOrder.items = newItems;
            newOrders[orderIndex] = updatedOrder;
        }
        
        return newOrders;
    });

    // API Call
    const success = await updateOrderItemStatus(orderId, itemIndex, newStatus);
    if (!success) {
        // Revert on failure (simple fetch for now to resync)
        fetchOrders(); 
    }
  };

  // --- Drag & Drop Handlers ---

  const onDragStart = (e: React.DragEvent, uniqueId: string) => {
    setDraggedCardId(uniqueId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedCardId) {
      handleItemStatusUpdate(draggedCardId, targetStatus);
      setDraggedCardId(null);
    }
  };

  // --- Filtered Lists ---

  // Flatten orders into items for the Kanban board
  const activeItems: KanbanCardItem[] = orders.flatMap(order => 
    order.items
        .map((item, idx) => ({
            uniqueId: `${order.id}_${idx}`,
            orderId: order.id!,
            itemIndex: idx,
            item: item,
            order: order
        }))
        // Filter out items that are cancelled or paid from the board
        .filter(kItem => ['ordered', 'preparing', 'served'].includes(kItem.item.status || 'ordered'))
  );

  // For history, we can show items that are 'paid' or 'cancelled'
  const historyItems: KanbanCardItem[] = orders.flatMap(order => 
    order.items
        .map((item, idx) => ({
            uniqueId: `${order.id}_${idx}`,
            orderId: order.id!,
            itemIndex: idx,
            item: item,
            order: order
        }))
        .filter(kItem => ['paid', 'cancelled'].includes(kItem.item.status || 'ordered'))
  );

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="animate-fade-in-up pb-10 h-[calc(100vh-140px)] flex flex-col">
      
      <OrderManagementHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {activeTab === 'board' && (
        <KanbanBoard 
            activeItems={activeItems}
            draggedCardId={draggedCardId}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onStatusUpdate={handleItemStatusUpdate}
        />
      )}

      {activeTab === 'history' && (
        <OrderHistory historyItems={historyItems} />
      )}
      
    </div>
  );
};
