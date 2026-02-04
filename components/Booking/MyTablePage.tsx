
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle, Receipt, Utensils } from 'lucide-react';
import { getRestaurantById } from '../../services/restaurantService';
import { getTables } from '../../services/tableService';
import { getMenu, getCategories } from '../../services/menuService';
import { getOffers } from '../../services/offerService'; 
import { createReservation, requestCounterPayment, completeReservation } from '../../services/reservationService';
import { createOrder, getOrdersByReservation, updateOrderItemStatus, updateOrder } from '../../services/orderService';
import { UserProfile, RestaurantData, TableItem, Reservation, MenuItem, FoodCategory, OrderItem, Order, OrderStatus, Offer, FoodAddOn, BillingConfig } from '../../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculateBill, DEFAULT_BILLING_CONFIG } from '../../utils/billing';

// Components
import { ClaimView } from '../MyTable/ClaimView';
import { WaitingView } from '../MyTable/WaitingView';
import { SummaryView } from '../MyTable/SummaryView';
import { MenuView } from '../MyTable/MenuView';
import { BillView } from '../MyTable/BillView';
import { AddOnModal } from '../MyTable/AddOnModal';
import { OffersSheet } from '../MyTable/OffersSheet';
import { CartBottomSheet } from '../MyTable/CartBottomSheet';

interface MyTablePageProps {
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

type ViewMode = 'summary' | 'menu' | 'bill';
type PaymentMethod = 'online' | 'counter';

export const MyTablePage: React.FC<MyTablePageProps> = ({ currentUser, onLoginRequired }) => {
  const { restaurantId, tableId } = useParams<{ restaurantId: string; tableId: string }>();
  const navigate = useNavigate();
  
  // Data
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [table, setTable] = useState<TableItem | null>(null);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [existingOrders, setExistingOrders] = useState<Order[]>([]);
  const [billingConfig, setBillingConfig] = useState<BillingConfig>(DEFAULT_BILLING_CONFIG);
  
  // Menu & Offers
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  
  // UI State
  const [activeView, setActiveView] = useState<ViewMode>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Local Staging Cart
  const [localCart, setLocalCart] = useState<OrderItem[]>([]);
  
  // Modals
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [selectedMenuItemForAddOn, setSelectedMenuItemForAddOn] = useState<MenuItem | null>(null);
  const [tempSelectedAddOns, setTempSelectedAddOns] = useState<FoodAddOn[]>([]);
  const [isOffersSheetOpen, setIsOffersSheetOpen] = useState(false);

  // Billing - Default to Online
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [bestPublicOffer, setBestPublicOffer] = useState<Offer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  // Discount States
  const [offerDiscountAmount, setOfferDiscountAmount] = useState(0);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);

  // --- 1. Load Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !tableId) return;
      setIsLoading(true);
      try {
        const rData = await getRestaurantById(restaurantId);
        const tData = await getTables(restaurantId);
        const targetTable = tData.find(t => t.id === tableId);
        setRestaurant(rData);
        setTable(targetTable || null);
        
        if (rData) {
            // Load Billing Config
            if (rData.billingConfig) {
                setBillingConfig(rData.billingConfig);
            }

            const [m, c, o] = await Promise.all([
                getMenu(restaurantId), 
                getCategories(restaurantId),
                getOffers(restaurantId)
            ]);
            setMenuItems(m);
            setCategories(c);
            setOffers(o);
        }
      } catch (error) {
        console.error("Error loading table data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantId, tableId]);

  // --- 2. Listen for Reservation ---
  useEffect(() => {
    if (!currentUser || !tableId || !restaurantId) return;
    const q = query(
        collection(db, "reservations"),
        where("userId", "==", currentUser.uid),
        where("restaurantId", "==", restaurantId),
        where("tableId", "==", tableId),
        where("status", "in", ["pending", "active", "completed"])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const res = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Reservation;
            if (res.status === 'completed') {
                alert("Payment Confirmed! Thank you for dining with us.");
                navigate('/');
                return;
            }
            setCurrentReservation(res);
        } else {
            setCurrentReservation(null);
        }
    });
    return () => unsubscribe();
  }, [currentUser, tableId, restaurantId, navigate]);

  // --- 3. Fetch Orders ---
  useEffect(() => {
    const fetchOrders = async () => {
        if (currentReservation?.id && (currentReservation.status === 'active' || currentReservation.status === 'completed')) {
            const orders = await getOrdersByReservation(currentReservation.id);
            setExistingOrders(orders);
        }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
  }, [currentReservation, activeView]);

  // --- 4. Auto-Calculate Offers (Refined) ---
  useEffect(() => {
    if (activeView === 'bill') {
        const activeItems = existingOrders.flatMap(o => o.items).filter(i => (i.status || 'ordered') !== 'cancelled');
        // Calculate raw subtotal for discount logic
        const rawSubtotal = activeItems.reduce((acc, item) => {
            const addOnTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
            return acc + ((item.price + addOnTotal) * item.quantity);
        }, 0);
        
        // 1. Find Best Offer
        let maxSavings = 0;
        let best: Offer | null = null;
        const validOffers = offers.filter(o => o.type === 'offer' && o.isActive && new Date() <= new Date(o.validUntil) && new Date() >= new Date(o.validFrom));
        
        validOffers.forEach(offer => {
            const savings = calculatePotentialSavings(offer, rawSubtotal, activeItems);
            if (savings > maxSavings) {
                maxSavings = savings;
                best = offer;
            }
        });
        setBestPublicOffer(best);
        setOfferDiscountAmount(maxSavings);

        // 2. Recalculate Coupon if Applied
        if (appliedCoupon) {
            const savings = calculatePotentialSavings(appliedCoupon, rawSubtotal, activeItems);
            setCouponDiscountAmount(savings);
        } else {
            setCouponDiscountAmount(0);
        }
    }
  }, [activeView, existingOrders, offers, appliedCoupon]);

  const calculatePotentialSavings = (offer: Offer, subtotal: number = 0, items: OrderItem[] = []): number => {
      if (offer.minSpend && subtotal < offer.minSpend) return 0;
      
      // Filter items if applicable IDs exist
      let eligibleAmount = subtotal;
      if (offer.applicableItemIds && offer.applicableItemIds.length > 0) {
          eligibleAmount = items
            .filter(i => offer.applicableItemIds?.includes(i.menuItemId))
            .reduce((acc, item) => {
                const addOnTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                return acc + ((item.price + addOnTotal) * item.quantity);
            }, 0);
      }

      if (eligibleAmount === 0 && offer.applicableItemIds && offer.applicableItemIds.length > 0) return 0;

      if (offer.rewardType === 'discount') {
          if (offer.discountType === 'fixed') return Math.min(eligibleAmount, offer.discountValue);
          let discount = (eligibleAmount * offer.discountValue) / 100;
          if (offer.maxDiscount && offer.maxDiscount > 0) discount = Math.min(discount, offer.maxDiscount);
          return discount;
      } else if (offer.rewardType === 'free_item' && offer.freeItemId) {
          const freeItem = items.find(i => i.menuItemId === offer.freeItemId);
          return freeItem ? freeItem.price : 0;
      }
      return 0;
  };

  // --- Actions ---
  const handleOccupyTable = async () => {
    if (!currentUser) { onLoginRequired(); return; }
    if (!restaurant || !table) return;
    setIsProcessing(true);
    try {
        const now = new Date();
        await createReservation({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            restaurantImage: restaurant.imageUrl,
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Walk-in Guest',
            userEmail: currentUser.email,
            tableId: table.id!,
            tableName: table.name,
            date: now.toISOString().split('T')[0],
            startTime: now.toTimeString().slice(0, 5),
            endTime: new Date(now.getTime() + 2*60*60*1000).toTimeString().slice(0, 5),
            guestCount: table.seats,
            status: 'pending', 
            type: 'walk_in',
            createdAt: new Date().toISOString()
        });
    } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  const handleItemClick = (item: MenuItem) => {
      if (item.addOns && item.addOns.length > 0) {
          setSelectedMenuItemForAddOn(item);
          setTempSelectedAddOns([]);
          setIsAddOnModalOpen(true);
      } else {
          addToLocalCart(item, []);
      }
  };

  const addToLocalCart = (item: MenuItem, selectedAddOns: FoodAddOn[]) => {
      const newItem: OrderItem = {
          menuItemId: item.id!, 
          name: item.name, 
          price: item.price, 
          quantity: 1, 
          status: 'ordered', 
          selectedAddOns 
      };
      setLocalCart(prev => [...prev, newItem]);
  };

  const removeFromLocalCart = (index: number) => {
      setLocalCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmOrder = async () => {
      if (!currentReservation || !restaurant || !table || !currentUser) return;
      if (localCart.length === 0) return;

      setIsProcessing(true);
      try {
          const activeOrder = existingOrders.find(o => o.status === 'ordered' || o.status === 'preparing');

          if (activeOrder) {
              const updatedItems = [...activeOrder.items, ...localCart];
              // Recalculate basic total for the order document
              const newTotal = updatedItems.reduce((sum, i) => {
                  const addOnPrice = i.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                  return sum + ((i.price + addOnPrice) * i.quantity);
              }, 0);
              
              await updateOrder(activeOrder.id!, { items: updatedItems, totalAmount: newTotal });
          } else {
              const totalAmount = localCart.reduce((sum, i) => {
                  const addOnPrice = i.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                  return sum + ((i.price + addOnPrice) * i.quantity);
              }, 0);

              await createOrder({
                  restaurantId: restaurant.id, tableId: table.id!, tableName: table.name, reservationId: currentReservation.id!,
                  userId: currentUser.uid, userName: currentUser.displayName || 'Guest', items: localCart, 
                  totalAmount, status: 'ordered', createdAt: new Date().toISOString()
              });
          }
          
          setLocalCart([]); 
          setActiveView('summary'); 
          alert("Order Placed Successfully!");
      } catch (error) { 
          console.error(error); 
          alert("Failed to place order.");
      } finally { 
          setIsProcessing(false); 
      }
  };

  const handleApplyCoupon = () => {
      setCouponError('');
      if (!couponCodeInput.trim()) return;
      const code = couponCodeInput.trim().toUpperCase();
      const coupon = offers.find(o => o.type === 'coupon' && o.code === code && o.isActive);
      if (!coupon) { setCouponError('Invalid code.'); return; }
      
      const activeItems = existingOrders.flatMap(o => o.items).filter(i => (i.status || 'ordered') !== 'cancelled');
      const rawSubtotal = activeItems.reduce((acc, item) => {
          const addOnTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
          return acc + ((item.price + addOnTotal) * item.quantity);
      }, 0);

      const savings = calculatePotentialSavings(coupon, rawSubtotal, activeItems);
      if (savings <= 0) { setCouponError('Conditions not met.'); return; }

      setAppliedCoupon(coupon);
      setCouponCodeInput('');
  };

  const handleCounterPayment = async (grandTotal: number) => {
      if (!currentReservation) return;
      setIsProcessing(true);
      try {
          await requestCounterPayment(currentReservation.id!, grandTotal);
          alert("Check requested. Please proceed to counter.");
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleOnlinePaymentSuccess = async (paymentDetails: any, grandTotal: number) => {
      if (!currentReservation) return;
      setIsProcessing(true);
      try {
          await completeReservation(
              currentReservation.id!, 
              restaurantId!, 
              tableId!, 
              { 
                  paymentMethod: 'online', 
                  amountPaid: grandTotal, 
                  transactionId: paymentDetails.id 
              }
          );
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  // --- Render ---
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
  if (!restaurant || !table) return <div className="p-6 text-center">Invalid Table</div>;

  // View: Pending
  if (currentReservation && currentReservation.status === 'pending') {
      return <WaitingView table={table} />;
  }

  // View: Active
  if (currentReservation && (currentReservation.status === 'active' || currentReservation.status === 'completed')) {
      const displayItems = existingOrders.flatMap(order => 
          order.items.map((item, index) => ({ ...item, orderId: order.id!, itemIndex: index, orderTime: order.createdAt }))
      ).sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());

      // Prepare bill items for View
      const billItems: { key: string; item: OrderItem; quantity: number }[] = [];
      displayItems.filter(i => i.status !== 'cancelled').forEach(item => {
          const key = `${item.menuItemId}_${item.selectedAddOns?.map(a=>a.id).sort().join('_')||''}`;
          const existing = billItems.find(g => g.key === key);
          if (existing) existing.quantity += item.quantity;
          else billItems.push({ key, item, quantity: item.quantity });
      });

      // Calculate Totals using new utility
      const billBreakdown = calculateBill(existingOrders.flatMap(o => o.items), billingConfig);

      return (
        <div className="min-h-screen bg-gray-50 pb-28 relative">
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => activeView === 'summary' ? navigate(`/restaurant/${restaurantId}`) : setActiveView('summary')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600"/>
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> {table.name} Active</p>
                    </div>
                </div>
            </div>

            {activeView === 'summary' && <SummaryView restaurant={restaurant} table={table} displayItems={displayItems} />}
            {activeView === 'menu' && <MenuView categories={categories} menuItems={menuItems} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onItemClick={handleItemClick} />}
            {activeView === 'bill' && (
                <BillView 
                    restaurant={restaurant} 
                    table={table} 
                    items={billItems} 
                    breakdown={billBreakdown}
                    billingConfig={billingConfig}
                    // Pass calculated discounts
                    offerDiscount={offerDiscountAmount}
                    couponDiscount={couponDiscountAmount}
                    
                    paymentMethod={paymentMethod} 
                    setPaymentMethod={setPaymentMethod} 
                    isProcessing={isProcessing} 
                    
                    // Handlers
                    onPayCounter={handleCounterPayment}
                    onPayOnline={handleOnlinePaymentSuccess}

                    bestPublicOffer={bestPublicOffer} 
                    appliedCoupon={appliedCoupon} 
                    couponCode={couponCodeInput} 
                    setCouponCode={setCouponCodeInput}
                    onApplyCoupon={handleApplyCoupon} 
                    onRemoveCoupon={() => { setAppliedCoupon(null); setCouponDiscountAmount(0); setCouponError(''); }} 
                    couponError={couponError}
                    onOpenOffers={() => setIsOffersSheetOpen(true)} 
                    isAwaitingCounter={currentReservation.paymentStatus === 'pending_counter'}
                />
            )}

            {/* Bottom Nav */}
            {activeView === 'summary' && localCart.length === 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-30">
                    <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveView('bill')} className="flex items-center justify-center gap-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 font-bold py-3.5 rounded-xl transition-all shadow-sm"><Receipt size={18} /> Wind up & Bill</button>
                        <button onClick={() => setActiveView('menu')} className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"><Utensils size={18} /> Order Items</button>
                    </div>
                </div>
            )}

            {activeView === 'menu' && (
                <CartBottomSheet 
                    items={localCart} 
                    onPlaceOrder={handleConfirmOrder} 
                    onRemoveItem={removeFromLocalCart} 
                    isProcessing={isProcessing}
                />
            )}

            <AddOnModal 
                isOpen={isAddOnModalOpen} 
                item={selectedMenuItemForAddOn} 
                selectedAddOns={tempSelectedAddOns}
                onToggleAddOn={(addon) => setTempSelectedAddOns(prev => prev.some(a => a.id === addon.id) ? prev.filter(a => a.id !== addon.id) : [...prev, addon])}
                onConfirm={() => {
                    if (selectedMenuItemForAddOn) addToLocalCart(selectedMenuItemForAddOn, tempSelectedAddOns);
                    setIsAddOnModalOpen(false);
                    setSelectedMenuItemForAddOn(null);
                    setTempSelectedAddOns([]);
                }}
                onClose={() => setIsAddOnModalOpen(false)}
            />
            
            <OffersSheet 
                isOpen={isOffersSheetOpen} 
                offers={offers} 
                bestPublicOffer={bestPublicOffer} 
                onSelectOffer={(offer) => { setBestPublicOffer(offer); setIsOffersSheetOpen(false); }}
                onClose={() => setIsOffersSheetOpen(false)}
                calculateSavings={(offer) => calculatePotentialSavings(offer, calculateBill(existingOrders.flatMap(o => o.items)).menuSubtotal, existingOrders.flatMap(o => o.items))}
            />
        </div>
      );
  }

  // View: Claim
  return (
    <ClaimView 
        restaurant={restaurant} 
        table={table} 
        onBack={() => navigate(`/restaurant/${restaurantId}`)} 
        onOccupy={handleOccupyTable} 
        isProcessing={isProcessing}
    />
  );
};
