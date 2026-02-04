import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ShoppingBag, GripVertical, Check, X, DollarSign, History, Ban, Play, ChefHat, Utensils } from 'lucide-react';
import { getOrdersByRestaurant, updateOrderItemStatus, updateOrder } from '../../services/orderService';
import { Order, OrderStatus, OrderItem } from '../../types';
import { Button } from '../UI/Button';

interface OrderManagementProps {
  userId: string;
}

// Kanban Columns Configuration
const KANBAN_COLUMNS: { id: OrderStatus; label: string; color: string; bg: string; border: string }[] = [
  { id: 'ordered', label: 'Placed', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'preparing', label: 'Preparing', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'served', label: 'Served', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
];

// Helper interface for flattening items
interface KanbanCardItem {
    uniqueId: string; // constructed as orderId_itemIndex
    orderId: string;
    itemIndex: number;
    item: OrderItem;
    order: Order;
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

    // Optimistic Update
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const newOrders = [...orders];
    const newItems = [...newOrders[orderIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], status: newStatus };
    newOrders[orderIndex] = { ...newOrders[orderIndex], items: newItems };
    
    setOrders(newOrders);

    // API Call
    const success = await updateOrderItemStatus(orderId, itemIndex, newStatus);
    if (!success) fetchOrders(); // Revert on failure
  };

  // --- Drag & Drop Handlers ---

  const onDragStart = (e: React.DragEvent, uniqueId: string) => {
    setDraggedCardId(uniqueId);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set drag image
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
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Kitchen Display</h2>
           <p className="text-gray-500">Manage individual item flow.</p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-xl flex">
           <button 
             onClick={() => setActiveTab('board')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <ShoppingBag size={16} /> Active Board
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <History size={16} /> Item History
           </button>
        </div>
      </div>

      {/* --- KANBAN BOARD VIEW (ITEM WISE) --- */}
      {activeTab === 'board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-6 h-full min-w-[1000px]">
            {KANBAN_COLUMNS.map((column) => {
              const columnItems = activeItems.filter(k => (k.item.status || 'ordered') === column.id);
              
              return (
                <div 
                  key={column.id}
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
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-bold">{columnItems.length}</span>
                  </div>

                  {/* Cards Area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {columnItems.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm italic">
                        No items in {column.label}
                      </div>
                    ) : (
                      columnItems.map((kItem) => (
                        <div
                          key={kItem.uniqueId}
                          draggable
                          onDragStart={(e) => onDragStart(e, kItem.uniqueId)}
                          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          {/* Left Accent Border */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>

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
                              {kItem.item.notes && (
                                <p className="text-xs text-orange-600 mt-1 italic pl-1">Note: {kItem.item.notes}</p>
                              )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-50 pl-2">
                            <span className="text-xs font-semibold text-gray-400">{kItem.order.userName}</span>
                            
                            {/* Actions Group */}
                            <div className="flex items-center gap-2">
                                
                                {/* Cancel for Placed */}
                                {column.id === 'ordered' && (
                                   <button 
                                     onClick={() => handleItemStatusUpdate(kItem.uniqueId, 'cancelled')}
                                     className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
                                     title="Cancel Item"
                                   >
                                     <Ban size={14} />
                                   </button>
                                )}

                                {/* PRIMARY ACTIONS: Advance Workflow */}
                                {column.id === 'ordered' && (
                                    <button 
                                      onClick={() => handleItemStatusUpdate(kItem.uniqueId, 'preparing')}
                                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
                                    >
                                      Start <Play size={12} className="ml-0.5"/>
                                    </button>
                                )}

                                {column.id === 'preparing' && (
                                    <button 
                                      onClick={() => handleItemStatusUpdate(kItem.uniqueId, 'served')}
                                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                                    >
                                      Serve <Utensils size={12} className="ml-0.5"/>
                                    </button>
                                )}

                                {column.id === 'served' && (
                                  <button 
                                    onClick={() => handleItemStatusUpdate(kItem.uniqueId, 'paid')}
                                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2 py-1.5 rounded-lg font-bold transition-colors"
                                  >
                                    <DollarSign size={12} /> Paid
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- HISTORY LIST VIEW (ITEM WISE) --- */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-soft border border-gray-100">
           {historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <History size={48} className="text-gray-200 mb-4" />
                 <p className="text-gray-500 font-medium">No item history yet.</p>
              </div>
           ) : (
              <table className="w-full">
                 <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Table</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Item</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                       <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {historyItems.map((kItem) => (
                       <tr key={kItem.uniqueId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(kItem.order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{kItem.order.tableName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                             <span className="font-bold text-gray-900 mr-2">{kItem.item.quantity}x</span> 
                             {kItem.item.name}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">${(kItem.item.price * kItem.item.quantity).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                kItem.item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             }`}>
                                {kItem.item.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
      )}
    </div>
  );
};
