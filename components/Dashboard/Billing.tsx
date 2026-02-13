
import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Receipt } from 'lucide-react';
import { Order, Reservation, TableItem, MenuItem, FoodCategory, Offer, OrderItem } from '../../types';
import { getOrdersByRestaurant, updateOrder, createOrder, markOrderAsPaid, getOrdersHistoryPaginated } from '../../services/orderService';
import { getReservationsByRestaurant, completeReservation, createReservation } from '../../services/reservationService';
import { getTables } from '../../services/tableService';
import { getMenu, getCategories } from '../../services/menuService';
import { getOffers, trackOfferUsage } from '../../services/offerService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { Button } from '../UI/Button';
import { useToast } from '../../context/ToastContext';
import { recordTransaction } from '../../services/walletService';

// Sub Components
import { BillingList } from './Billing/BillingList';
import { BillPreview } from './Billing/BillPreview';
import { POSView } from './Billing/POSView';
import { DEFAULT_BILLING_CONFIG } from '../../utils/billing';

interface BillingProps {
  userId: string;
}

const HISTORY_PAGE_SIZE = 15;

export const Billing: React.FC<BillingProps> = ({ userId }) => {
  const { showToast } = useToast();
  // Mode State
  const [activeView, setActiveView] = useState<'dashboard' | 'pos'>('dashboard');
  const [activeListTab, setActiveListTab] = useState<'requests' | 'history'>('requests');
  
  // --- Data State ---
  // Real-time / Live Data
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]); // needed to link live orders
  
  // Historical / Paginated Data
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLastDoc, setHistoryLastDoc] = useState<any>(null);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ search: '', startDate: '', endDate: '' });

  // Static Data
  const [tables, setTables] = useState<TableItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [billingConfig, setBillingConfig] = useState(DEFAULT_BILLING_CONFIG);
  
  // Selection State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Initial Load & Real-time Poll
  useEffect(() => {
    fetchStaticData();
    fetchLiveData(); // Initial fetch
    const interval = setInterval(fetchLiveData, 15000); // Poll live data
    return () => clearInterval(interval);
  }, [userId]);

  // 2. Fetch History when tab active or filters change
  useEffect(() => {
    if (activeListTab === 'history') {
        fetchHistory(true);
    }
  }, [activeListTab, historyFilters]);

  const fetchStaticData = async () => {
    const [tableData, menuData, catData, offerData, profileData] = await Promise.all([
      getTables(userId),
      getMenu(userId),
      getCategories(userId),
      getOffers(userId),
      getRestaurantProfile(userId)
    ]);
    setTables(tableData);
    setMenuItems(menuData);
    setCategories(catData);
    setOffers(offerData);
    if (profileData?.billingConfig) setBillingConfig(profileData.billingConfig);
    setIsLoadingInitial(false);
  };

  const fetchLiveData = async () => {
    // Fetch recent active orders for "Requests" view
    const [orderData, resData] = await Promise.all([
      getOrdersByRestaurant(userId), // returns limited recent batch
      getReservationsByRestaurant(userId)
    ]);
    setLiveOrders(orderData);
    setReservations(resData);
  };

  const fetchHistory = async (reset: boolean = false) => {
    if (reset) {
        setIsHistoryLoading(true);
        setHistoryOrders([]);
        setHistoryLastDoc(null);
        setHistoryHasMore(true);
    }

    // Determine doc to start after
    const startDoc = reset ? null : historyLastDoc;
    // Don't fetch if no more data (unless resetting)
    if (!reset && !historyHasMore) return;

    try {
        const result = await getOrdersHistoryPaginated(
            userId, 
            HISTORY_PAGE_SIZE, 
            startDoc,
            historyFilters
        );

        if (reset) {
            setHistoryOrders(result.data);
        } else {
            setHistoryOrders(prev => [...prev, ...result.data]);
        }
        
        setHistoryLastDoc(result.lastDoc);
        setHistoryHasMore(result.data.length === HISTORY_PAGE_SIZE);
    } catch (e) {
        console.error(e);
    } finally {
        setIsHistoryLoading(false);
    }
  };

  const handleHistorySearch = (search: string) => {
      setHistoryFilters(prev => ({ ...prev, search }));
  };

  const handleHistoryDateChange = (startDate: string, endDate: string) => {
      setHistoryFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleMarkPaid = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
        const res = reservations.find(r => r.id === selectedOrder.reservationId);
        await completeReservation(
            selectedOrder.reservationId, 
            userId, 
            selectedOrder.tableId,
            { totalBillAmount: selectedOrder.totalAmount }
        );
        
        await markOrderAsPaid(selectedOrder.id!);
        
        if (selectedOrder.appliedOfferId && selectedOrder.billDetails) {
            await trackOfferUsage(userId, selectedOrder.appliedOfferId, {
                userId: selectedOrder.userId,
                userName: selectedOrder.userName,
                orderId: selectedOrder.id!,
                discountAmount: selectedOrder.billDetails.discount
            });
        }
        
        // Refresh both lists
        await fetchLiveData();
        // If history is active, refresh it to show new paid order
        if (activeListTab === 'history') fetchHistory(true);
        
        setActiveListTab('history');
        setSelectedOrder(null);
        showToast("Payment confirmed and session closed", "success");
    } catch (error) {
        console.error(error);
        showToast("Failed to confirm payment", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCreateNewBill = async (posData: any) => {
    setIsProcessing(true);
    try {
        const resData: Reservation = {
            restaurantId: userId,
            restaurantName: 'POS Order',
            userId: 'walk-in-pos',
            userName: posData.customerName,
            userEmail: '',
            tableId: posData.tableId,
            tableName: posData.tableName,
            date: new Date().toISOString().split('T')[0],
            startTime: new Date().toTimeString().slice(0, 5),
            endTime: new Date().toTimeString().slice(0, 5),
            status: 'completed',
            type: 'walk_in',
            createdAt: new Date().toISOString(),
            paymentStatus: 'paid',
            paymentMethod: 'counter',
            totalBillAmount: posData.totalAmount
        };
        const resId = await createReservation(resData);

        const itemsWithPaidStatus = posData.items.map((i: OrderItem) => ({ ...i, status: 'paid' }));

        const orderData: Order = {
            restaurantId: userId,
            tableId: posData.tableId,
            tableName: posData.tableName,
            reservationId: resId!,
            userId: 'walk-in-pos',
            userName: posData.customerName,
            items: itemsWithPaidStatus,
            totalAmount: posData.totalAmount,
            status: 'paid',
            createdAt: new Date().toISOString(),
            customDiscount: posData.customDiscount,
            appliedOfferId: posData.appliedOfferId,
            billDetails: posData.billDetails
        };
        const orderId = await createOrder(orderData);

        if (posData.appliedOfferId && posData.billDetails) {
            await trackOfferUsage(userId, posData.appliedOfferId, {
                userId: 'walk-in-pos',
                userName: posData.customerName,
                orderId: orderId!,
                discountAmount: posData.billDetails.discount
            });
        }

        showToast("Bill Generated & Saved to History", "success");
        await fetchLiveData();
        setActiveView('dashboard');
        setActiveListTab('history');
        const newOrder = { ...orderData, id: orderId };
        setSelectedOrder(newOrder);

    } catch (error) {
        console.error(error);
        showToast("Failed to generate bill", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col animate-fade-in-up pb-6">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt size={24} className="text-primary-600"/> Billing & POS
               </h2>
               <p className="text-gray-500">Manage counter requests and generate invoices.</p>
            </div>
            <div className="flex gap-3">
               {activeView === 'pos' ? (
                   <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                      <LayoutDashboard size={18} className="mr-2"/> Back to Dashboard
                   </Button>
               ) : (
                   <Button onClick={() => setActiveView('pos')} className="shadow-xl shadow-primary-500/20">
                      <Plus size={18} className="mr-2"/> New Order (POS)
                   </Button>
               )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
            {activeView === 'pos' ? (
                <POSView 
                    menuItems={menuItems}
                    categories={categories}
                    tables={tables}
                    offers={offers}
                    onGenerateBill={handleCreateNewBill}
                    isProcessing={isProcessing}
                    billingConfig={billingConfig}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
                    {/* List Column */}
                    <div className="md:col-span-4 h-full overflow-hidden">
                        <BillingList 
                            activeTab={activeListTab}
                            setActiveTab={setActiveListTab}
                            onSelectOrder={handleSelectOrder}
                            selectedOrderId={selectedOrder?.id}
                            
                            // Real-time Data
                            requestsOrders={liveOrders}
                            reservations={reservations}
                            
                            // History Data
                            historyOrders={historyOrders}
                            onHistorySearch={handleHistorySearch}
                            onHistoryDateChange={handleHistoryDateChange}
                            onLoadMoreHistory={() => fetchHistory(false)}
                            hasMoreHistory={historyHasMore}
                            isLoadingHistory={isHistoryLoading}
                        />
                    </div>
                    {/* Preview Column */}
                    <div className="md:col-span-8 h-full overflow-hidden">
                        {selectedOrder ? (
                            <BillPreview 
                                order={selectedOrder}
                                reservation={reservations.find(r => r.id === selectedOrder.reservationId)}
                                billingConfig={billingConfig}
                                onMarkPaid={handleMarkPaid}
                                isProcessing={isProcessing}
                            />
                        ) : (
                            <div className="h-full bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shadow-sm">
                                <Receipt size={48} className="mb-4 opacity-20" />
                                <p>Select an order to view invoice details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
