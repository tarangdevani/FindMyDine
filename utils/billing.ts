
import { BillingConfig, OrderItem } from '../types';

// REPLACE THIS WITH YOUR ACTUAL RAZORPAY MERCHANT KEY ID
export const PLATFORM_RAZORPAY_KEY = "rzp_test_SEQ9KLTd0x65a4"; 

export interface BillBreakdown {
  rawSubtotal: number;
  menuSubtotal: number;
  serviceChargeAmount: number;
  taxableAmount: number;
  taxAmount: number;
  customDiscountAmount: number;
  grandTotal: number;
  activeItems: OrderItem[];
}

export const DEFAULT_BILLING_CONFIG: BillingConfig = {
  serviceChargeRate: 18, // Default US Service Charge
  salesTaxRate: 8.25,    // Default US Sales Tax
  isServiceChargeInclusive: false,
  isSalesTaxInclusive: false,
};

export const calculateBill = (
  items: OrderItem[], 
  config: BillingConfig = DEFAULT_BILLING_CONFIG,
  customDiscount?: { type: 'percentage' | 'fixed', value: number }
): BillBreakdown => {
  const activeItems = items.filter(i => i.status !== 'cancelled');
  
  // 1. Calculate Raw Sum (Quantity * Price) of all items
  const rawTotal = activeItems.reduce((acc, item) => {
    const addOnTotal = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
    return acc + ((item.price + addOnTotal) * item.quantity);
  }, 0);

  const { serviceChargeRate, salesTaxRate, isServiceChargeInclusive, isSalesTaxInclusive } = config;

  let menuSubtotal = 0;
  let serviceChargeAmount = 0;
  let taxableAmount = 0;
  let taxAmount = 0;
  let grandTotal = 0;
  let customDiscountAmount = 0;

  // Logic: 
  // Grand Total = Taxable Amount + Tax
  // Taxable Amount = Menu Subtotal + Service Charge

  // Case 1: Both Exclusive (Standard US Model)
  if (!isServiceChargeInclusive && !isSalesTaxInclusive) {
    menuSubtotal = rawTotal;
    serviceChargeAmount = menuSubtotal * (serviceChargeRate / 100);
    taxableAmount = menuSubtotal + serviceChargeAmount;
    taxAmount = taxableAmount * (salesTaxRate / 100);
    grandTotal = taxableAmount + taxAmount;
  }
  
  // Case 2: Both Inclusive (Reverse Engineering)
  else if (isServiceChargeInclusive && isSalesTaxInclusive) {
    grandTotal = rawTotal;
    const combinedRate = (1 + serviceChargeRate / 100) * (1 + salesTaxRate / 100);
    menuSubtotal = grandTotal / combinedRate;
    
    serviceChargeAmount = menuSubtotal * (serviceChargeRate / 100);
    taxableAmount = menuSubtotal + serviceChargeAmount;
    taxAmount = grandTotal - taxableAmount;
  }

  // Case 3: Service Inclusive, Tax Exclusive
  else if (isServiceChargeInclusive && !isSalesTaxInclusive) {
    const serviceMultiplier = 1 + (serviceChargeRate / 100);
    
    taxableAmount = rawTotal;
    menuSubtotal = taxableAmount / serviceMultiplier;
    serviceChargeAmount = taxableAmount - menuSubtotal;
    
    taxAmount = taxableAmount * (salesTaxRate / 100);
    grandTotal = taxableAmount + taxAmount;
  }

  // Case 4: Service Exclusive, Tax Inclusive
  else if (!isServiceChargeInclusive && isSalesTaxInclusive) {
    grandTotal = rawTotal * (1 + serviceChargeRate / 100); 
    taxableAmount = grandTotal / (1 + salesTaxRate / 100);
    taxAmount = grandTotal - taxableAmount;
    
    menuSubtotal = taxableAmount / (1 + serviceChargeRate / 100);
    serviceChargeAmount = taxableAmount - menuSubtotal;
  }

  // Apply Custom Discount at the end (subtract from Grand Total or Taxable? Usually Grand Total)
  if (customDiscount) {
    if (customDiscount.type === 'fixed') {
        customDiscountAmount = Math.min(grandTotal, customDiscount.value);
    } else {
        customDiscountAmount = grandTotal * (customDiscount.value / 100);
    }
    grandTotal = Math.max(0, grandTotal - customDiscountAmount);
  }

  return {
    rawSubtotal: rawTotal, 
    menuSubtotal,
    serviceChargeAmount,
    taxableAmount,
    taxAmount,
    customDiscountAmount,
    grandTotal,
    activeItems
  };
};

/**
 * Calculates the split of reservation fees.
 * 
 * Rules:
 * 1. Active/Completed: Platform 20%, Restaurant 80%.
 * 2. Cancelled/Declined: Platform 30%, User (Refund %), Restaurant (Remainder).
 */
export const calculateReservationRevenue = (amountPaid: number, status: 'completed' | 'cancelled', refundPercentage: number = 0) => {
    if (amountPaid <= 0) return { platform: 0, restaurant: 0, userRefund: 0 };

    if (status === 'completed') {
        // Platform 20%, Restaurant 80%
        return {
            platform: Number((amountPaid * 0.20).toFixed(2)),
            restaurant: Number((amountPaid * 0.80).toFixed(2)),
            userRefund: 0
        };
    } else {
        // Cancelled
        // Platform keeps 30% of TOTAL
        const platformShare = Number((amountPaid * 0.30).toFixed(2));
        
        // User gets Refund Percentage of TOTAL
        // Cap refund at 70% effectively because Platform takes 30%
        const safeRefundPercent = Math.min(refundPercentage, 70); 
        const userShare = Number((amountPaid * (safeRefundPercent / 100)).toFixed(2));
        
        // Restaurant gets whatever is left
        const restaurantShare = Number(Math.max(0, amountPaid - platformShare - userShare).toFixed(2));

        return {
            platform: platformShare,
            restaurant: restaurantShare,
            userRefund: userShare
        };
    }
};
