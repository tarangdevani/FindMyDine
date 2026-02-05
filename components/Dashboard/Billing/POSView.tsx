
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, ChevronDown, Percent, DollarSign, Save, Gift, X, LayoutGrid } from 'lucide-react';
import { MenuItem, FoodCategory, OrderItem, Offer, TableItem, BillingConfig } from '../../../types';
import { Button } from '../../UI/Button';
import { calculateBill } from '../../../utils/billing';
import { useToast } from '../../../context/ToastContext';
import { OffersSheet } from '../../MyTable/OffersSheet';

interface POSViewProps {
  menuItems: MenuItem[];
  categories: FoodCategory[];
  tables: TableItem[];
  offers: Offer[];
  onGenerateBill: (data: any) => void;
  isProcessing: boolean;
  billingConfig: BillingConfig;
}

export const POSView: React.FC<POSViewProps> = ({ menuItems, categories, tables, offers, onGenerateBill, isProcessing, billingConfig }) => {
  const { showToast } = useToast();
  // State
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Discount State
  const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  
  // Offer Logic
  const [isOffersSheetOpen, setIsOffersSheetOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [couponCode, setCouponCode] = useState('');

  // Filter Logic
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
        const matchesCat = activeCategory === 'All' || item.categoryName === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch && item.isAvailable;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Cart Actions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
        const existingIdx = prev.findIndex(i => i.menuItemId === item.id);
        if (existingIdx > -1) {
            const newCart = [...prev];
            newCart[existingIdx].quantity += 1;
            return newCart;
        }
        return [...prev, { menuItemId: item.id!, name: item.name, price: item.price, quantity: 1, status: 'served', selectedAddOns: [] }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
        const newCart = [...prev];
        const newQty = newCart[index].quantity + delta;
        if (newQty <= 0) return prev.filter((_, i) => i !== index);
        newCart[index].quantity = newQty;
        return newCart;
    });
  };

  // Calculations Helpers
  const calculateSavings = (offer: Offer) => {
      const activeItems = cart;
      const rawSubtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      
      // Check limits
      if (offer.globalBudget && (offer.totalDiscountGiven || 0) >= offer.globalBudget) return 0;
      if (offer.maxUsage && offer.usageCount >= offer.maxUsage) return 0;

      if (offer.minSpend && rawSubtotal < offer.minSpend) return 0;
      
      let eligibleAmount = rawSubtotal;
      if (offer.applicableItemIds && offer.applicableItemIds.length > 0) {
          eligibleAmount = activeItems
            .filter(i => offer.applicableItemIds?.includes(i.menuItemId))
            .reduce((acc, item) => acc + (item.price * item.quantity), 0);
      }

      if (eligibleAmount === 0 && offer.applicableItemIds && offer.applicableItemIds.length > 0) return 0;

      if (offer.rewardType === 'discount') {
          if (offer.discountType === 'fixed') return Math.min(eligibleAmount, offer.discountValue);
          let discount = (eligibleAmount * offer.discountValue) / 100;
          if (offer.maxDiscount && offer.maxDiscount > 0) discount = Math.min(discount, offer.maxDiscount);
          return discount;
      } else if (offer.rewardType === 'free_item' && offer.freeItemId) {
          const freeItem = activeItems.find(i => i.menuItemId === offer.freeItemId);
          return freeItem ? freeItem.price : 0;
      }
      return 0;
  };

  // Auto-Apply Best Offer Logic
  useEffect(() => {
    if (appliedCoupon) {
        setSelectedOffer(null); // Coupon overrides auto-offers
        return;
    }

    let bestOffer: Offer | null = null;
    let maxSavings = 0;

    const validOffers = offers.filter(o => 
        o.type === 'offer' && 
        o.isActive && 
        new Date() <= new Date(o.validUntil) && 
        new Date() >= new Date(o.validFrom)
    );

    validOffers.forEach(offer => {
        const savings = calculateSavings(offer);
        if (savings > maxSavings) {
            maxSavings = savings;
            bestOffer = offer;
        }
    });

    // Only update if it changed to prevent loops
    if (bestOffer?.id !== selectedOffer?.id) {
        setSelectedOffer(bestOffer);
    }
  }, [cart, offers, appliedCoupon]);

  const handleApplyCoupon = () => {
      if (!couponCode.trim()) return;
      const coupon = offers.find(o => o.type === 'coupon' && o.code === couponCode.toUpperCase() && o.isActive);
      if (!coupon) {
          showToast("Invalid coupon code", "error");
          return;
      }
      const savings = calculateSavings(coupon);
      if (savings <= 0) {
          showToast("Coupon conditions not met", "warning");
          return;
      }
      setAppliedCoupon(coupon);
      setCouponCode('');
      showToast("Coupon applied!", "success");
  };

  // Calculate Finals
  // Use passed billingConfig, or fallback to default
  const breakdown = calculateBill(
      cart, 
      billingConfig, 
      manualDiscountValue > 0 ? { type: manualDiscountType, value: manualDiscountValue } : undefined
  );
  
  // Calculate extra offer/coupon deductions
  const offerSavings = selectedOffer ? calculateSavings(selectedOffer) : 0;
  const couponSavings = appliedCoupon ? calculateSavings(appliedCoupon) : 0;
  
  // Adjusted Grand Total
  // Discount is usually applied after tax in some regions, but typically before tax in others.
  // Here we subtract from Grand Total as a simple discount on final bill. 
  // If complex tax logic is needed (discount reduces taxable amount), it should be done inside calculateBill.
  // For POS simplicity here, we treat offer/coupon as payment method or post-tax discount.
  const finalGrandTotal = Math.max(0, breakdown.grandTotal - offerSavings - couponSavings);

  const handleSubmit = () => {
    if (!selectedTableId) { showToast("Please select a table.", "warning"); return; }
    if (cart.length === 0) { showToast("Cart is empty.", "warning"); return; }

    const selectedTable = tables.find(t => t.id === selectedTableId);
    
    // Store exact snapshot of bill details so history matches exactly what was generated
    const billDetailsSnapshot = {
        subtotal: breakdown.menuSubtotal,
        serviceCharge: breakdown.serviceChargeAmount,
        tax: breakdown.taxAmount,
        discount: breakdown.customDiscountAmount + offerSavings + couponSavings,
        grandTotal: finalGrandTotal,
        discountDetails: [
            manualDiscountValue > 0 ? 'Manual' : '',
            selectedOffer ? `Offer: ${selectedOffer.title}` : '',
            appliedCoupon ? `Coupon: ${appliedCoupon.code}` : ''
        ].filter(Boolean).join(', ')
    };

    const payload = {
        tableId: selectedTableId,
        tableName: selectedTable?.name || 'Unknown',
        customerName,
        items: cart,
        customDiscount: manualDiscountValue > 0 ? { type: manualDiscountType, value: manualDiscountValue } : undefined,
        appliedOfferId: selectedOffer?.id || appliedCoupon?.id,
        totalAmount: finalGrandTotal,
        billDetails: billDetailsSnapshot
    };
    
    onGenerateBill(payload);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] min-h-[600px] gap-6 animate-fade-in">
        
        {/* LEFT: MENU SECTION */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="p-5 border-b border-gray-100">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-3.5 text-gray-400"/>
                    <input 
                        type="text" 
                        placeholder="Search for items..." 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="px-5 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar bg-gray-50/50">
                <button 
                    onClick={() => setActiveCategory('All')} 
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                    <LayoutGrid size={14} className="inline mr-2"/> All Items
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.name)} 
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.name ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => addToCart(item)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{item.name}</h4>
                                <span className="font-bold text-primary-600 text-sm">${item.price}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{item.description}</p>
                            <div className="mt-auto flex justify-end">
                                <span className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                    <Plus size={16}/>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: CART SECTION */}
        <div className="w-full lg:w-[400px] bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header / Config */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
                    <h3 className="font-bold text-gray-900 text-lg">Current Order</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block ml-1">Table</label>
                        <select 
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 outline-none focus:border-primary-500 transition-all appearance-none"
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                        >
                            <option value="">Select Table</option>
                            {tables.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.area})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block ml-1">Customer</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 outline-none focus:border-primary-500 transition-all"
                            placeholder="Guest Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <p className="text-sm font-medium">Add items to start order</p>
                    </div>
                ) : (
                    cart.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary-100 transition-colors shadow-sm group">
                            <div className="flex flex-col items-center gap-1">
                                <button onClick={() => updateQuantity(idx, 1)} className="text-gray-400 hover:text-green-600 transition-colors"><ChevronDown size={14} className="rotate-180"/></button>
                                <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(idx, -1)} className="text-gray-400 hover:text-red-600 transition-colors"><ChevronDown size={14}/></button>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                    <span className="font-bold text-gray-900 text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between items-center mt-0.5">
                                    <span>${item.price} each</span>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Billing Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50">
                {/* Discount Controls */}
                <div className="flex gap-2 mb-4">
                    {selectedOffer ? (
                        <div className="flex-1 flex items-center justify-between bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-xs font-bold">
                            <span>{selectedOffer.title} (-${offerSavings.toFixed(2)})</span>
                            <button onClick={() => setSelectedOffer(null)}><X size={14}/></button>
                        </div>
                    ) : appliedCoupon ? (
                        <div className="flex-1 flex items-center justify-between bg-green-100 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-xs font-bold">
                            <span>Coupon: {appliedCoupon.code} (-${couponSavings.toFixed(2)})</span>
                            <button onClick={() => {setAppliedCoupon(null); setSelectedOffer(null);}}><X size={14}/></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsOffersSheetOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-dashed border-primary-300 text-primary-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors">
                            <Gift size={14}/> Offers
                        </button>
                    )}
                    
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 w-1/3">
                        <input 
                            type="number" min="0" placeholder="Disc."
                            className="w-full bg-transparent text-xs outline-none py-2 text-gray-900 font-bold"
                            value={manualDiscountValue || ''}
                            onChange={(e) => setManualDiscountValue(parseFloat(e.target.value) || 0)}
                        />
                        <button onClick={() => setManualDiscountType(manualDiscountType === 'percentage' ? 'fixed' : 'percentage')} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                            {manualDiscountType === 'percentage' ? '%' : '$'}
                        </button>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Subtotal</span>
                        <span>${breakdown.menuSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Tax ({billingConfig.salesTaxRate}%) & Service ({billingConfig.serviceChargeRate}%)</span>
                        <span>+${(breakdown.taxAmount + breakdown.serviceChargeAmount).toFixed(2)}</span>
                    </div>
                    {(breakdown.customDiscountAmount > 0 || offerSavings > 0 || couponSavings > 0) && (
                        <div className="flex justify-between text-xs text-green-600 font-bold">
                            <span>Total Discount</span>
                            <span>-${(breakdown.customDiscountAmount + offerSavings + couponSavings).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200 mt-2">
                        <span>Total</span>
                        <span>${finalGrandTotal.toFixed(2)}</span>
                    </div>
                </div>

                <Button fullWidth size="lg" onClick={handleSubmit} isLoading={isProcessing} className="shadow-lg shadow-primary-500/20">
                    Generate Bill & Print
                </Button>
            </div>
        </div>

        {/* Offers Sheet */}
        <OffersSheet 
            isOpen={isOffersSheetOpen}
            offers={offers}
            bestPublicOffer={selectedOffer}
            onSelectOffer={(o) => { setSelectedOffer(o); setAppliedCoupon(null); setIsOffersSheetOpen(false); }}
            onClose={() => setIsOffersSheetOpen(false)}
            calculateSavings={calculateSavings}
        />
    </div>
  );
};
