
import React, { useState } from 'react';
import { Store, History, Search, Clock, ArrowRight, User, Utensils } from 'lucide-react';
import { Order, Reservation } from '../../../types';

interface BillingListProps {
  orders: Order[];
  reservations: Reservation[];
  activeTab: 'requests' | 'history';
  setActiveTab: (tab: 'requests' | 'history') => void;
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

export const BillingList: React.FC<BillingListProps> = ({ orders, reservations, activeTab, setActiveTab, onSelectOrder, selectedOrderId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => {
    const res = reservations.find(r => r.id === order.reservationId);
    // If it's a POS order without a reservation linked in the reservations array (legacy), we still might want to show it if it matches criteria
    // But typically POS orders create a reservation entry too.
    
    // Filter Logic
    if (activeTab === 'requests') {
        // Show only pending counter payments
        if (!res || res.paymentStatus !== 'pending_counter') return false;
    } else {
        // Show paid/completed history
        // Includes orders that are paid OR reservations that are completed/paid
        const isPaid = order.status === 'paid' || (res && (res.status === 'completed' || res.paymentStatus === 'paid'));
        if (!isPaid) return false;
    }

    // Search Logic
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
            order.tableName.toLowerCase().includes(term) || 
            order.userName.toLowerCase().includes(term) ||
            (order.id && order.id.toLowerCase().includes(term))
        );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-5 border-b border-gray-100 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoices</h3>
            <div className="flex bg-gray-100/80 p-1 rounded-xl mb-4">
                <button 
                    onClick={() => setActiveTab('requests')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Store size={16}/> Requests
                    {activeTab === 'requests' && filteredOrders.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem]">{filteredOrders.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <History size={16}/> History
                </button>
            </div>
            
            <div className="relative group">
                <Search size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search table, guest, or ID..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50/30">
            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        {activeTab === 'requests' ? <Store size={24} className="opacity-40"/> : <History size={24} className="opacity-40"/>}
                    </div>
                    <p className="text-sm font-medium">No {activeTab === 'requests' ? 'pending requests' : 'history records'} found.</p>
                </div>
            ) : (
                filteredOrders.map(order => {
                    const res = reservations.find(r => r.id === order.reservationId);
                    const totalAmount = res?.totalBillAmount || order.totalAmount || 0;
                    
                    return (
                        <div 
                            key={order.id} 
                            onClick={() => onSelectOrder(order)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex justify-between items-center group relative overflow-hidden ${
                                selectedOrderId === order.id 
                                    ? 'bg-white border-primary-500 shadow-md ring-1 ring-primary-100' 
                                    : 'bg-white border-gray-100 hover:border-primary-300 hover:shadow-sm'
                            }`}
                        >
                            {selectedOrderId === order.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>}
                            
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`font-bold text-base truncate ${selectedOrderId === order.id ? 'text-primary-900' : 'text-gray-900'}`}>
                                        {order.tableName}
                                    </span>
                                    {activeTab === 'requests' && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <User size={12}/> 
                                        <span className="truncate max-w-[80px]">{order.userName}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                        <Clock size={12}/> 
                                        {new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="block font-black text-gray-900 text-lg tracking-tight">
                                    ${totalAmount.toFixed(2)}
                                </span>
                                <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase text-gray-400 mt-0.5">
                                    <Utensils size={10} />
                                    <span>{order.items.length} Items</span>
                                </div>
                            </div>
                            
                            <ArrowRight size={16} className={`ml-3 text-gray-300 transition-transform duration-300 ${selectedOrderId === order.id ? 'text-primary-500 translate-x-1' : 'group-hover:translate-x-1 group-hover:text-primary-400'}`}/>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
