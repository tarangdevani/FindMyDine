
import React from 'react';
import { Store, History, Search, Clock, ArrowRight } from 'lucide-react';
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
  
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOrders = orders.filter(order => {
    const res = reservations.find(r => r.id === order.reservationId);
    if (!res) return false;

    // Filter Logic
    if (activeTab === 'requests') {
        // Show only pending counter payments
        if (res.paymentStatus !== 'pending_counter') return false;
    } else {
        // Show paid/completed history
        if (res.status !== 'completed' && res.paymentStatus !== 'paid' && order.status !== 'paid') return false;
    }

    // Search Logic
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return order.tableName.toLowerCase().includes(term) || order.userName.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-4 border-b border-gray-100">
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button 
                    onClick={() => setActiveTab('requests')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Store size={16}/> Pay to Counter
                    {/* Badge count could go here */}
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <History size={16}/> History
                </button>
            </div>
            
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search table or guest..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    {activeTab === 'requests' ? <Store size={32} className="mb-2 opacity-20"/> : <History size={32} className="mb-2 opacity-20"/>}
                    <p className="text-sm">No {activeTab === 'requests' ? 'payment requests' : 'history'} found.</p>
                </div>
            ) : (
                filteredOrders.map(order => {
                    const res = reservations.find(r => r.id === order.reservationId);
                    return (
                        <div 
                            key={order.id} 
                            onClick={() => onSelectOrder(order)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${
                                selectedOrderId === order.id 
                                    ? 'bg-primary-50 border-primary-200 shadow-sm' 
                                    : 'bg-white border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-bold ${selectedOrderId === order.id ? 'text-primary-900' : 'text-gray-900'}`}>
                                        {order.tableName}
                                    </span>
                                    {activeTab === 'requests' && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{order.userName}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span className="block font-black text-gray-900">${res?.totalBillAmount?.toFixed(2) || '0.00'}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{order.items.length} Items</span>
                                </div>
                                <ArrowRight size={16} className={`text-gray-300 ${selectedOrderId === order.id ? 'text-primary-400' : 'group-hover:text-gray-500'}`}/>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
