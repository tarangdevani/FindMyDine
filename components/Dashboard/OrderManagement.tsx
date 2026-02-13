
import React, { useState, useEffect } from 'react';
import { getOrdersByRestaurant, updateOrderItemStatus, getOrdersHistoryPaginated } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { KanbanCardItem } from './OrderManagement/types';
import { Skeleton } from '../UI/Skeleton';

// Child Components
import { OrderManagementHeader } from './OrderManagement/OrderManagementHeader';
import { KanbanBoard } from './OrderManagement/KanbanBoard';
import { OrderHistory } from './OrderManagement/OrderHistory';

interface OrderManagementProps {
  userId: string;
}

const HISTORY_PAGE_SIZE = 20;

export const OrderManagement: React.FC<OrderManagementProps> = ({ userId }) => {
  // Real-time Board Data
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  
  // History Data
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLastDoc, setHistoryLastDoc] = useState<any>(null);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // 1. Initial Load & Polling for Board
  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000); 
    return () => clearInterval(interval);
  }, [userId]);

  // 2. Fetch History when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'history') {
        fetchHistory(true);
    }
  }, [activeTab, startDate, endDate]);

  const fetchActiveOrders = async () => {
    const data = await getOrdersByRestaurant(userId);
    setActiveOrders(data);
    setIsLoadingInitial(false);
  };

  const fetchHistory = async (reset: boolean = false) => {
    if (reset) {
        setIsHistoryLoading(true);
        setHistoryOrders([]);
        setHistoryLastDoc(null);
        setHistoryHasMore(true);
    }

    const startDoc = reset ? null : historyLastDoc;
    if (!reset && !historyHasMore) return;

    try {
        const result = await getOrdersHistoryPaginated(
            userId,
            HISTORY_PAGE_SIZE,
            startDoc,
            { startDate, endDate }
        );

        if (reset) {
            setHistoryOrders(result.data);
        } else {
            setHistoryOrders(prev => [...prev, ...result.data]);
        }
        
        setHistoryLastDoc(result.lastDoc);
        setHistoryHasMore(result.data.length === HISTORY_PAGE_SIZE);
    } catch(e) {
        console.error(e);
    } finally {
        setIsHistoryLoading(false);
    }
  };

  // --- Logic ---

  const handleItemStatusUpdate = async (uniqueId: string, newStatus: OrderStatus) => {
    const [orderId, idxStr] = uniqueId.split('_');
    const itemIndex = parseInt(idxStr);

    // Optimistic Update
    setActiveOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return prevOrders;
        
        const newOrders = [...prevOrders];
        const updatedOrder = { ...newOrders[orderIndex] };
        const newItems = [...updatedOrder.items];
        
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
        fetchActiveOrders(); 
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

  // --- Transform Data for Props ---

  // Active Items for Kanban (Flattened)
  const activeItems: KanbanCardItem[] = activeOrders.flatMap(order => 
    order.items
        .map((item, idx) => ({
            uniqueId: `${order.id}_${idx}`,
            orderId: order.id!,
            itemIndex: idx,
            item: item,
            order: order
        }))
        .filter(kItem => ['ordered', 'preparing', 'served'].includes(kItem.item.status || 'ordered'))
  );

  // History Items (Flattened from Paginated Orders)
  const historyItems: KanbanCardItem[] = historyOrders.flatMap(order => 
    order.items
        .map((item, idx) => ({
            uniqueId: `${order.id}_${idx}`,
            orderId: order.id!,
            itemIndex: idx,
            item: item,
            order: order
        }))
        // Optionally filter for paid/cancelled if you only want finished items in history
        // .filter(kItem => ['paid', 'cancelled'].includes(kItem.item.status || 'ordered'))
        // Or show ALL items in history context
  );

  if (isLoadingInitial) {
      return (
        <div className="animate-fade-in-up pb-10 h-[calc(100vh-140px)] flex flex-col">
            <OrderManagementHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex gap-6 h-full mt-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="flex-1 h-full rounded-2xl" />)}
            </div>
        </div>
      );
  }

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
        <OrderHistory 
            historyItems={historyItems} 
            hasMore={historyHasMore}
            onLoadMore={() => fetchHistory(false)}
            isLoadingMore={isHistoryLoading}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
        />
      )}
      
    </div>
  );
};
