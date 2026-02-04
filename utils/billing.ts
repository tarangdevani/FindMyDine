
import { BillingConfig, OrderItem } from '../types';

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
  isSalesTaxInclusive: false
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
