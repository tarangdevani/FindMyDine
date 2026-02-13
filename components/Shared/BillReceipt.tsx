
import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { OrderItem, BillingConfig, BillSnapshot } from '../../types';
import { calculateBill, DEFAULT_BILLING_CONFIG } from '../../utils/billing';

interface BillReceiptProps {
  items: OrderItem[];
  billingConfig?: BillingConfig; // Required for live calculation
  billDetails?: BillSnapshot; // If provided, uses this snapshot instead of recalculating (for history)
  
  // Live Calculation Props (ignored if billDetails is present)
  customDiscount?: { type: 'percentage' | 'fixed'; value: number };
  offerDiscount?: number;
  couponDiscount?: number;
  platformFeeRate?: number; // e.g., 0.03 for 3%
  
  // Display Props
  showItems?: boolean;
  className?: string;
  itemClassName?: string;
  hideTotal?: boolean;
  discountDescription?: string;
}

export const BillReceipt: React.FC<BillReceiptProps> = ({ 
  items, 
  billingConfig = DEFAULT_BILLING_CONFIG, 
  billDetails,
  customDiscount,
  offerDiscount = 0,
  couponDiscount = 0,
  platformFeeRate = 0,
  showItems = true,
  className = '',
  itemClassName = '',
  hideTotal = false,
  discountDescription
}) => {

  const data = useMemo(() => {
    if (billDetails) {
        // Use historical snapshot
        const totalDisc = billDetails.discount;
        const net = Math.max(0, billDetails.grandTotal - (platformFeeRate > 0 ? 0 : 0)); // Snapshot usually stores user payable. Platform fee might be additive.
        // Re-deriving platform fee if it wasn't stored in snapshot but is requested now (rare case)
        // Usually snapshot grandTotal is the final amount.
        return {
            menuSubtotal: billDetails.subtotal,
            serviceCharge: billDetails.serviceCharge,
            tax: billDetails.tax,
            totalDiscount: totalDisc,
            grandTotal: billDetails.grandTotal,
            platformFee: 0, // Assume included or not applicable for history unless stored
            activeItems: items // Items passed for display
        };
    }

    // Live Calculation
    const breakdown = calculateBill(items, billingConfig, customDiscount);
    
    // Aggregate external discounts (Offers/Coupons) + Manual Discount from breakdown
    const totalDiscount = breakdown.customDiscountAmount + offerDiscount + couponDiscount;
    
    // Grand Total logic: calculateBill.grandTotal includes Tax & Service, minus Custom Discount.
    // We need to subtract Offer/Coupon discounts from that result.
    const netAmount = Math.max(0, breakdown.grandTotal - offerDiscount - couponDiscount);
    
    const platformFee = netAmount * platformFeeRate;
    const finalTotal = netAmount + platformFee;

    return {
        menuSubtotal: breakdown.menuSubtotal,
        serviceCharge: breakdown.serviceChargeAmount,
        tax: breakdown.taxAmount,
        totalDiscount: totalDiscount,
        grandTotal: finalTotal,
        platformFee: platformFee,
        activeItems: breakdown.activeItems
    };
  }, [items, billingConfig, billDetails, customDiscount, offerDiscount, couponDiscount, platformFeeRate]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Items List */}
      {showItems && (
        <div className={`space-y-3 ${itemClassName}`}>
            {data.activeItems.map((item, i) => {
                const addOnTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
                const itemTotal = (item.price + addOnTotal) * item.quantity;
                return (
                    <div key={i} className="flex justify-between items-start text-sm border-b border-dashed border-gray-200 pb-2 last:border-0">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
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
      )}

      {/* Totals Breakdown */}
      <div className={`space-y-2 text-xs font-mono border-t border-dashed border-gray-300 pt-4`}>
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${data.menuSubtotal.toFixed(2)}</span>
          </div>
          
          {data.serviceCharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service Charge ({billingConfig.serviceChargeRate}%)</span>
                <span>+${data.serviceCharge.toFixed(2)}</span>
              </div>
          )}
          
          <div className="flex justify-between text-gray-600">
            <span>Tax ({billingConfig.salesTaxRate}%)</span>
            <span>+${data.tax.toFixed(2)}</span>
          </div>

          {/* Discount Section */}
          {data.totalDiscount > 0 && (
            <div className="flex justify-between text-green-700 font-bold bg-green-50/50 p-1 -mx-1 rounded">
                <span className="flex items-center gap-1">
                  <Tag size={10} className="fill-current"/> Discount
                </span>
                <span>-${data.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          
          {/* Discount Description */}
          {(discountDescription || (billDetails?.discountDetails)) && (
              <div className="text-[10px] text-green-600 text-right italic -mt-1 pb-1 justify-end">
                  ({discountDescription || billDetails?.discountDetails})
              </div>
          )}

          {/* Platform Fee */}
          {data.platformFee > 0 && (
            <div className="flex justify-between text-gray-500 italic">
              <span>Platform Fee ({(platformFeeRate * 100).toFixed(0)}%)</span>
              <span>+${data.platformFee.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total */}
          {!hideTotal && (
            <div className="flex justify-between text-lg font-black text-gray-900 border-t-2 border-gray-900 pt-3 mt-2">
              <span>TOTAL</span>
              <span>${data.grandTotal.toFixed(2)}</span>
            </div>
          )}
      </div>
    </div>
  );
};
