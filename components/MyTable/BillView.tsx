
import React from 'react';
import { Store, CreditCard, Gift, ChevronRight, Tag } from 'lucide-react';
import { Button } from '../UI/Button';
import { RestaurantData, TableItem, OrderItem, Offer, BillingConfig } from '../../types';
import { BillBreakdown, calculateBill } from '../../utils/billing';
import { RazorpayButton } from '../UI/RazorpayButton';
import { BillReceipt } from '../Shared/BillReceipt';

interface BillViewProps {
  restaurant: RestaurantData;
  table: TableItem;
  items: { key: string; item: OrderItem; quantity: number }[];
  breakdown: BillBreakdown; // We can use this or let BillReceipt calculate. Using passed props for consistency with parent logic if any.
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
  
  // Reconstruct flat item list for BillReceipt from grouped items
  const flatItems = items.map(g => ({ ...g.item, quantity: g.quantity }));

  // Calculate final total locally for the Pay Button (BillReceipt handles display)
  const rawTotal = calculateBill(flatItems, billingConfig);
  const totalDiscount = offerDiscount + couponDiscount;
  const netAmount = Math.max(0, rawTotal.grandTotal - totalDiscount);
  const platformFee = paymentMethod === 'online' ? netAmount * 0.03 : 0;
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

            {/* Bill Receipt Component */}
            <div className="flex-1 overflow-y-auto mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <BillReceipt 
                    items={flatItems}
                    billingConfig={billingConfig}
                    offerDiscount={offerDiscount}
                    couponDiscount={couponDiscount}
                    platformFeeRate={paymentMethod === 'online' ? 0.03 : 0}
                    discountDescription={
                        [
                            appliedCoupon ? `Coupon ${appliedCoupon.code}` : '',
                            bestPublicOffer ? `Offer ${bestPublicOffer.title}` : ''
                        ].filter(Boolean).join(', ')
                    }
                />
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
                            <RazorpayButton 
                                amount={finalTotal}
                                name={restaurant.name}
                                description={`Bill Payment - Table ${table.name}`}
                                image={restaurant.logoUrl}
                                onSuccess={(details) => onPayOnline({ id: details.razorpay_payment_id, ...details }, finalTotal)}
                                disabled={finalTotal <= 0}
                            />
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
