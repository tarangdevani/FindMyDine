
import React, { useState, useEffect, useRef } from 'react';
import { Store, History, Search, Clock, ArrowRight, User, Utensils, Calendar } from 'lucide-react';
import { Order, Reservation } from '../../../types';
import { DatePicker } from '../../UI/DatePicker';

interface BillingListProps {
  // Common Data
  activeTab: 'requests' | 'history';
  setActiveTab: (tab: 'requests' | 'history') => void;
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;

  // Requests Data (Real-time)
  requestsOrders: Order[];
  reservations: Reservation[]; // Used to cross-reference requests

  // History Data (Paginated)
  historyOrders: Order[];
  onHistorySearch: (term: string) => void;
  onHistoryDateChange: (start: string, end: string) => void;
  onLoadMoreHistory: () => void;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
}

export const BillingList: React.FC<BillingListProps> = ({ 
  activeTab, setActiveTab, onSelectOrder, selectedOrderId,
  requestsOrders, reservations,
  historyOrders, onHistorySearch, onHistoryDateChange, onLoadMoreHistory, hasMoreHistory, isLoadingHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Ref for infinite scroll
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
        // Only trigger search if active tab is history to avoid double calling on tab switch
        // The parent handles initial load on tab switch
        // This ensures subsequent searches update the list
        if (activeTab === 'history') {
            onHistorySearch(searchTerm);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]); // Removed activeTab dependency to prevent double fetch on switch

  // Date Change
  useEffect(() => {
    if (activeTab === 'history') {
        onHistoryDateChange(startDate, endDate);
    }
  }, [startDate, endDate, activeTab]);

  // Infinite Scroll Handler
  const handleScroll = () => {
    if (activeTab !== 'history' || isLoadingHistory || !hasMoreHistory || !listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Load more when scrolled to bottom (within 50px)
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        onLoadMoreHistory();
    }
  };

  // 1. FILTERING LOGIC FOR REQUESTS (Real-time)
  // We keep client-side filtering for the small set of active requests
  const filteredRequests = activeTab === 'requests' ? requestsOrders.filter(order => {
    const res = reservations.find(r => r.id === order.reservationId);
    if (!res || res.paymentStatus !== 'pending_counter') return false;
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
            order.tableName.toLowerCase().includes(term) || 
            order.userName.toLowerCase().includes(term)
        );
    }
    return true;
  }) : [];

  // 2. DATA SOURCE SELECTION
  const displayedOrders = activeTab === 'requests' ? filteredRequests : historyOrders;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-5 border-b border-gray-100 bg-white z-10 shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoices</h3>
            <div className="flex bg-gray-100/80 p-1 rounded-xl mb-4">
                <button 
                    onClick={() => { setActiveTab('requests'); setSearchTerm(''); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Store size={16}/> Requests
                    {activeTab === 'requests' && filteredRequests.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem]">{filteredRequests.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => { setActiveTab('history'); setSearchTerm(''); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <History size={16}/> History
                </button>
            </div>
            
            <div className="space-y-3">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'requests' ? "Filter requests..." : "Search history..."} 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'history' && (
                    <div className="flex gap-2 items-center">
                        <div className="flex-1"><DatePicker value={startDate} onChange={setStartDate} max={endDate} /></div>
                        <span className="text-gray-300">-</span>
                        <div className="flex-1"><DatePicker value={endDate} onChange={setEndDate} min={startDate} /></div>
                    </div>
                )}
            </div>
        </div>

        {/* List */}
        <div 
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50/30"
        >
            {displayedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        {activeTab === 'requests' ? <Store size={24} className="opacity-40"/> : <History size={24} className="opacity-40"/>}
                    </div>
                    <p className="text-sm font-medium">
                        {isLoadingHistory && activeTab === 'history' ? 'Loading history...' : `No ${activeTab === 'requests' ? 'pending requests' : 'history records'} found.`}
                    </p>
                </div>
            ) : (
                displayedOrders.map(order => {
                    const res = reservations.find(r => r.id === order.reservationId);
                    
                    // Prioritization Logic:
                    // 1. If paid/snapshot exists, use that (Exact final)
                    // 2. If pending counter payment, use the requested amount from reservation (Grand Total)
                    // 3. Fallback to order total (Menu Total)
                    let displayAmount = 0;
                    
                    if (order.billDetails?.grandTotal) {
                        displayAmount = order.billDetails.grandTotal;
                    } else if (res?.totalBillAmount && res.paymentStatus === 'pending_counter') {
                        displayAmount = res.totalBillAmount;
                    } else {
                        displayAmount = order.totalAmount || 0;
                    }
                    
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
                                    ${displayAmount.toFixed(2)}
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
            
            {/* Infinite Scroll Loader */}
            {activeTab === 'history' && isLoadingHistory && (
                <div className="py-4 text-center text-xs text-gray-400 font-bold animate-pulse">
                    Loading more records...
                </div>
            )}
        </div>
    </div>
  );
};
