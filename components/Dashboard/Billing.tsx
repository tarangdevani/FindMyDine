
import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, Receipt } from 'lucide-react';
import { Order, Reservation, TableItem, MenuItem, FoodCategory, Offer } from '../../types';
import { getOrdersByRestaurant, updateOrder, createOrder } from '../../services/orderService';
import { getReservationsByRestaurant, completeReservation, createReservation } from '../../services/reservationService';
import { getTables } from '../../services/tableService';
import { getMenu, getCategories } from '../../services/menuService';
import { getOffers } from '../../services/offerService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { Button } from '../UI/Button';

// Sub Components
import { BillingList } from './Billing/BillingList';
import { BillPreview } from './Billing/BillPreview';
import { POSView } from './Billing/POSView';
import { DEFAULT_BILLING_CONFIG } from '../../utils/billing';

interface BillingProps {
  userId: string;
}

export const Billing: React.FC<BillingProps> = ({ userId }) => {
  // Mode State
  const [activeView, setActiveView] = useState<'dashboard' | 'pos'>('dashboard');
  const [activeListTab, setActiveListTab] = useState<'requests' | 'history'>('requests');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [billingConfig, setBillingConfig] = useState(DEFAULT_BILLING_CONFIG);
  
  // Selection State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchData = async () => {
    const [orderData, resData, tableData, menuData, catData, offerData, profileData] = await Promise.all([
      getOrdersByRestaurant(userId),
      getReservationsByRestaurant(userId),
      getTables(userId),
      getMenu(userId),
      getCategories(userId),
      getOffers(userId),
      getRestaurantProfile(userId)
    ]);
    
    setOrders(orderData);
    setReservations(resData);
    setTables(tableData);
    setMenuItems(menuData);
    setCategories(catData);
    setOffers(offerData);
    if (profileData?.billingConfig) setBillingConfig(profileData.billingConfig);
    setIsLoading(false);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleMarkPaid = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
        const res = reservations.find(r => r.id === selectedOrder.reservationId);
        // We use the helper to close reservation and mark paid
        // Total amount is usually re-calc'd in backend or passed here. 
        // We trust the Order Total or re-calc it if needed.
        await completeReservation(
            selectedOrder.reservationId, 
            userId, 
            selectedOrder.tableId,
            { totalBillAmount: selectedOrder.totalAmount }
        );
        await updateOrder(selectedOrder.id!, { status: 'paid' });
        
        // Refresh and switch tab
        await fetchData();
        setActiveListTab('history');
        setSelectedOrder(null);
    } catch (error) {
        console.error(error);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCreateNewBill = async (posData: any) => {
    setIsProcessing(true);
    try {
        // 1. Create a "completed" reservation entry for record keeping
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
            guestCount: 1,
            status: 'completed',
            type: 'walk_in',
            createdAt: new Date().toISOString(),
            paymentStatus: 'paid',
            paymentMethod: 'counter',
            totalBillAmount: posData.totalAmount
        };
        const resId = await createReservation(resData);

        // 2. Create the Order
        const orderData: Order = {
            restaurantId: userId,
            tableId: posData.tableId,
            tableName: posData.tableName,
            reservationId: resId!,
            userId: 'walk-in-pos',
            userName: posData.customerName,
            items: posData.items,
            totalAmount: posData.totalAmount,
            status: 'paid',
            createdAt: new Date().toISOString(),
            customDiscount: posData.customDiscount
        };
        await createOrder(orderData);

        alert("Bill Generated & Saved to History");
        await fetchData();
        setActiveView('dashboard');
        setActiveListTab('history');
    } catch (error) {
        console.error(error);
        alert("Failed to generate bill");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in-up">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt size={24}/> Billing & POS
               </h2>
               <p className="text-gray-500">Manage counter requests and generate invoices.</p>
            </div>
            <div className="flex gap-3">
               {activeView === 'pos' ? (
                   <Button variant="outline" onClick={() => setActiveView('dashboard')}>
                      <LayoutDashboard size={18} className="mr-2"/> Back to Dashboard
                   </Button>
               ) : (
                   <Button onClick={() => setActiveView('pos')}>
                      <Plus size={18} className="mr-2"/> Generate New Bill
                   </Button>
               )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
            {activeView === 'pos' ? (
                <POSView 
                    menuItems={menuItems}
                    categories={categories}
                    tables={tables}
                    offers={offers}
                    onGenerateBill={handleCreateNewBill}
                    isProcessing={isProcessing}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                    {/* List Column */}
                    <div className="md:col-span-5 h-full">
                        <BillingList 
                            orders={orders}
                            reservations={reservations}
                            activeTab={activeListTab}
                            setActiveTab={setActiveListTab}
                            onSelectOrder={handleSelectOrder}
                            selectedOrderId={selectedOrder?.id}
                        />
                    </div>
                    {/* Preview Column */}
                    <div className="md:col-span-7 h-full">
                        {selectedOrder ? (
                            <BillPreview 
                                order={selectedOrder}
                                reservation={reservations.find(r => r.id === selectedOrder.reservationId)}
                                billingConfig={billingConfig}
                                onMarkPaid={handleMarkPaid}
                                isProcessing={isProcessing}
                            />
                        ) : (
                            <div className="h-full bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                <Receipt size={48} className="mb-4 opacity-20" />
                                <p>Select an order to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
