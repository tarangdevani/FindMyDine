import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ShoppingBag, Trash2, X } from 'lucide-react';
import { Button } from '../UI/Button';
import { OrderItem } from '../../types';

interface CartBottomSheetProps {
  items: OrderItem[];
  onPlaceOrder: () => void;
  onRemoveItem: (index: number) => void;
  isProcessing: boolean;
}

export const CartBottomSheet: React.FC<CartBottomSheetProps> = ({ items, onPlaceOrder, onRemoveItem, isProcessing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  const totalAmount = items.reduce((sum, item) => {
    const addonTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
    return sum + ((item.price + addonTotal) * item.quantity);
  }, 0);

  return (
    <div className={`fixed inset-x-0 bottom-0 z-50 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-t-3xl border-t border-gray-100 flex flex-col ${isExpanded ? 'h-[80vh]' : 'h-auto'}`}>
        
        {/* Handle / Header (Always Visible) */}
        <div 
            className="w-full flex flex-col items-center pt-2 pb-4 cursor-pointer bg-white rounded-t-3xl"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-3"></div>
            <div className="w-full px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold relative">
                        {items.reduce((acc, i) => acc + i.quantity, 0)}
                        <ShoppingBag size={14} className="absolute -top-1 -right-1 text-primary-500 bg-white rounded-full p-0.5 border border-white box-content" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</p>
                        <p className="text-lg font-black text-gray-900">${totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <Button 
                            onClick={(e) => { e.stopPropagation(); onPlaceOrder(); }} 
                            isLoading={isProcessing}
                            className="shadow-lg shadow-primary-500/30"
                        >
                            Place Order
                        </Button>
                    )}
                    {isExpanded ? <ChevronDown className="text-gray-400"/> : <ChevronUp className="text-gray-400"/>}
                </div>
            </div>
        </div>

        {/* Expanded Content (List) */}
        {isExpanded && (
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">Your Tray</h3>
                    <button onClick={() => setIsExpanded(false)} className="text-xs font-bold text-gray-500">Minimize</button>
                </div>
                
                {items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="font-bold text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200">
                                {item.quantity}x
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{item.name}</h4>
                                <p className="text-primary-600 font-bold text-sm">${item.price}</p>
                                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.selectedAddOns.map((addon, i) => (
                                            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                + {addon.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => onRemoveItem(index)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Expanded Footer Button */}
        {isExpanded && (
            <div className="p-6 bg-white border-t border-gray-100 pb-8">
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={onPlaceOrder} 
                    isLoading={isProcessing}
                    className="shadow-xl"
                >
                    Confirm & Place Order (${totalAmount.toFixed(2)})
                </Button>
            </div>
        )}
    </div>
  );
};