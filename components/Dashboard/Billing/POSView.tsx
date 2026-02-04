
import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Tag, ChevronDown, Check, Percent, DollarSign, Save } from 'lucide-react';
import { MenuItem, FoodCategory, OrderItem, Offer, TableItem } from '../../../types';
import { Button } from '../../UI/Button';
import { calculateBill, DEFAULT_BILLING_CONFIG } from '../../../utils/billing';

interface POSViewProps {
  menuItems: MenuItem[];
  categories: FoodCategory[];
  tables: TableItem[];
  offers: Offer[];
  onGenerateBill: (data: any) => void;
  isProcessing: boolean;
}

export const POSView: React.FC<POSViewProps> = ({ menuItems, categories, tables, offers, onGenerateBill, isProcessing }) => {
  // State
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Discount State
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);

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

  // Calculations
  const breakdown = calculateBill(cart, DEFAULT_BILLING_CONFIG, manualDiscountValue > 0 ? { type: manualDiscountType, value: manualDiscountValue } : undefined);

  const handleSubmit = () => {
    if (!selectedTableId) { alert("Please select a table."); return; }
    if (cart.length === 0) { alert("Cart is empty."); return; }

    const selectedTable = tables.find(t => t.id === selectedTableId);
    
    const payload = {
        tableId: selectedTableId,
        tableName: selectedTable?.name || 'Unknown',
        customerName,
        items: cart,
        customDiscount: manualDiscountValue > 0 ? { type: manualDiscountType, value: manualDiscountValue } : undefined,
        totalAmount: breakdown.grandTotal
    };
    
    onGenerateBill(payload);
  };

  return (
    <div className="flex h-full gap-6 animate-fade-in">
        
        {/* LEFT: MENU SELECTOR */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
            {/* Search & Categories */}
            <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                        type="text" 
                        placeholder="Search menu..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-primary-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    <button 
                        onClick={() => setActiveCategory('All')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.name)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat.name ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => addToCart(item)}
                            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-2">{item.name}</h4>
                                <span className="font-bold text-primary-600 text-xs">${item.price}</span>
                            </div>
                            <div className="text-right mt-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                    <Plus size={14}/>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: BILL CONFIG */}
        <div className="w-96 bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 mb-3">Bill Settings</h3>
                <div className="space-y-3">
                    <select 
                        className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-primary-500"
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(e.target.value)}
                    >
                        <option value="">Select Table</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.area})</option>
                        ))}
                    </select>
                    <input 
                        type="text" 
                        className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-primary-500"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>
            </div>

            {/* Cart List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm italic">Cart is empty</div>
                ) : (
                    cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                                <p className="text-xs text-gray-500">${item.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-white rounded">-</button>
                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-white rounded">+</button>
                            </div>
                            <button onClick={() => removeFromCart(idx)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                    ))
                )}
            </div>

            {/* Discounts & Total */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <span>Extra Discount</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            <button 
                                onClick={() => setManualDiscountType('percentage')} 
                                className={`p-1.5 rounded ${manualDiscountType === 'percentage' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}
                            >
                                <Percent size={14}/>
                            </button>
                            <button 
                                onClick={() => setManualDiscountType('fixed')} 
                                className={`p-1.5 rounded ${manualDiscountType === 'fixed' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}
                            >
                                <DollarSign size={14}/>
                            </button>
                        </div>
                        <input 
                            type="number" 
                            min="0"
                            className="flex-1 p-2 rounded-lg border border-gray-200 text-sm outline-none"
                            placeholder="Value"
                            value={manualDiscountValue}
                            onChange={(e) => setManualDiscountValue(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="space-y-1 text-sm border-t border-gray-200 pt-2 mb-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>${breakdown.menuSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs text-gray-500"><span>Service & Tax</span><span>+ ${(breakdown.serviceChargeAmount + breakdown.taxAmount).toFixed(2)}</span></div>
                    {breakdown.customDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-600"><span>Discount</span><span>- ${breakdown.customDiscountAmount.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between font-black text-lg text-gray-900 pt-2"><span>Total</span><span>${breakdown.grandTotal.toFixed(2)}</span></div>
                </div>

                <Button fullWidth onClick={handleSubmit} isLoading={isProcessing}>
                    <Save size={18} className="mr-2"/> Generate Bill
                </Button>
            </div>
        </div>
    </div>
  );
};
