
import React from 'react';
import { Store, CreditCard, Gift, ChevronRight, Tag, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantData, TableItem, OrderItem, Offer, BillingConfig } from '../../types';
import { BillBreakdown } from '../../utils/billing';
import { PayPalButton } from '../UI/PayPalButton';

interface BillViewProps {
  restaurant: RestaurantData;
  table: TableItem;
  items: { key: string; item: OrderItem; quantity: number }[];
  breakdown: BillBreakdown;
  billingConfig: BillingConfig;
  offerDiscount: number;
  couponDiscount: number;
  paymentMethod: 'online' | 'counter';
  setPaymentMethod: (method: 'online' | 'counter') => void;
  isProcessing: boolean;
  onPayCounter: (amount: number) => void;
  onPayOnline: (details: any, amount: number) => void;
  bestPublicOffer: Offer | null;
  appliedCoupon: Offer | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  couponError: string;
  onOpenOffers: () => void;
  isAwaitingCounter: boolean;
}

export const BillView: React.FC<BillViewProps> = ({ 
  restaurant, table, items, breakdown, billingConfig, 
  offerDiscount, couponDiscount,
  paymentMethod, setPaymentMethod, isProcessing, onPayCounter, onPayOnline,
  bestPublicOffer, appliedCoupon, couponCode, setCouponCode, onApplyCoupon, onRemoveCoupon, couponError, onOpenOffers, isAwaitingCounter
}) => {
  
  const { menuSubtotal, serviceChargeAmount, taxableAmount, taxAmount, grandTotal: rawGrandTotal } = breakdown;
  
  // Logic: 
  // 1. Calculate Grand Total from billing.ts (Subtotal + Service + Tax)
  // 2. Subtract Discounts
  // 3. Add Platform Fee (2% of net amount)
  
  const totalDiscount = offerDiscount + couponDiscount;
  const netAmount = Math.max(0, rawGrandTotal - totalDiscount);
  
  const platformFee = paymentMethod === 'online' ? netAmount * 0.02 : 0;
  
  const finalTotal = netAmount + platformFee;

  return (
    <div className="p-4 animate-fade-in flex flex-col min-h-[calc(100vh-140px)]">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col flex-1">
            
            {/* Summary */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <p className="text-gray-500 text-sm">Table {table.name} • {restaurant.name}</p>
            </div>

            {/* Payment Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                    onClick={() => setPaymentMethod('online')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'online' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' : 'border-gray-100 text-gray-500 bg-gray-50'}`}
                >
                    <CreditCard size={24}/>
                    <span className="text-sm font-bold">Pay Online</span>
                </button>
                <button 
                    onClick={() => setPaymentMethod('counter')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'counter' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' : 'border-gray-100 text-gray-500 bg-gray-50'}`}
                >
                    <Store size={24}/>
                    <span className="text-sm font-bold">Pay at Counter</span>
                </button>
            </div>

            {/* Bill Items */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {items.map((entry, i) => {
                    const { item, quantity } = entry;
                    const itemTotal = (item.price + (item.selectedAddOns?.reduce((s,a) => s+a.price, 0) || 0)) * quantity;
                    return (
                        <div key={i} className="flex justify-between items-start text-sm border-b border-dashed border-gray-200 pb-2 last:border-0">
                            <div className="flex gap-3">
                                <span className="font-bold text-gray-900 w-6">{quantity}x</span>
                                <div>
                                    <span className="text-gray-700 block">{item.name}</span>
                                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                        <div className="text-[10px] text-gray-400 flex flex-wrap gap-1 mt-0.5">
                                            {item.selectedAddOns.map((addon, j) => (
                                                <span key={j}>+ {addon.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-gray-900 font-medium">${itemTotal.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>

            {/* Structured Totals as per Request */}
            <div className="border-t border-dashed border-gray-300 pt-4 space-y-3">
                
                {/* 1. Menu Subtotal */}
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Menu Subtotal</span>
                    <span className="font-medium">${menuSubtotal.toFixed(2)}</span>
                </div>

                {/* 2. Service Charge */}
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        Service Charge ({billingConfig.serviceChargeRate}%)
                        {billingConfig.isServiceChargeInclusive && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Incl.</span>}
                    </span>
                    <span className="font-medium">+ ${serviceChargeAmount.toFixed(2)}</span>
                </div>

                {/* 3. Taxable Amount */}
                <div className="flex justify-between text-sm text-gray-900 font-bold bg-gray-50 p-2 rounded">
                    <span>Taxable Amount</span>
                    <span>${taxableAmount.toFixed(2)}</span>
                </div>

                {/* 4. Sales Tax */}
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        Sales Tax ({billingConfig.salesTaxRate}%)
                        {billingConfig.isSalesTaxInclusive && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Incl.</span>}
                    </span>
                    <span className="font-medium">+ ${taxAmount.toFixed(2)}</span>
                </div>

                {/* Discounts */}
                {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Discounts (Offer/Coupon)</span>
                        <span>- ${totalDiscount.toFixed(2)}</span>
                    </div>
                )}

                {/* Platform Fee */}
                {paymentMethod === 'online' && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Platform Fee (2%)</span>
                        <span className="font-medium">+ ${platformFee.toFixed(2)}</span>
                    </div>
                )}

                {/* 5. Grand Total */}
                <div className="flex justify-between items-center pt-2 text-2xl font-black text-gray-900 border-t border-gray-100 mt-2">
                    <span>Grand Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Offer Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                 <div 
                    onClick={onOpenOffers}
                    className="flex justify-between text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg cursor-pointer hover:bg-green-100 transition-colors mb-2"
                >
                    <span className="flex items-center gap-1">
                        <Gift size={14}/> 
                        {bestPublicOffer ? bestPublicOffer.title : 'View Offers'}
                        <ChevronRight size={14} className="opacity-50"/>
                    </span>
                    <span>Available</span>
                </div>
                {/* Coupon Code Input */}
                {!appliedCoupon && (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Coupon Code" 
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs outline-none bg-white uppercase font-bold text-gray-900"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                        <button onClick={onApplyCoupon} className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-bold">Apply</button>
                    </div>
                )}
                {appliedCoupon && (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-100">
                        <span className="text-xs font-bold text-green-700 flex items-center gap-1"><Tag size={12}/> {appliedCoupon.code} Applied (-${couponDiscount.toFixed(2)})</span>
                        <button onClick={onRemoveCoupon} className="text-xs text-red-500 font-bold">Remove</button>
                    </div>
                )}
                {couponError && <p className="text-[10px] text-red-500 mt-1">{couponError}</p>}
            </div>

            {isAwaitingCounter ? (
                    <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                    <p className="text-orange-700 font-bold text-sm">Waiting for staff confirmation...</p>
                    <p className="text-orange-600 text-xs mt-1 italic">Please show your order ID at the counter.</p>
                    </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {paymentMethod === 'online' ? (
                        <>
                            <PayPalButton 
                                amount={finalTotal} 
                                onSuccess={(details) => onPayOnline(details, finalTotal)}
                                disabled={finalTotal <= 0}
                            />
                            {/* Standard Button Fallback/Alternative */}
                            <Button 
                                size="lg" 
                                className="w-full bg-primary-600 shadow-xl" 
                                onClick={() => onPayOnline({ id: 'manual-' + Date.now() }, finalTotal)}
                                isLoading={isProcessing}
                                disabled={finalTotal <= 0}
                            >
                                Pay ${finalTotal.toFixed(2)}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            size="lg" 
                            className="w-full bg-gray-900 shadow-xl" 
                            onClick={() => onPayCounter(finalTotal)}
                            isLoading={isProcessing}
                        >
                            Request Check at Counter
                        </Button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
