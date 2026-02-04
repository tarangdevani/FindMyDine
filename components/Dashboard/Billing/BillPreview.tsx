
import React from 'react';
import { Printer, CheckCircle, Store, Tag } from 'lucide-react';
import { Order, Reservation, BillingConfig, Offer } from '../../../types';
import { calculateBill } from '../../../utils/billing';
import { Button } from '../../UI/Button';

interface BillPreviewProps {
  order: Order;
  reservation?: Reservation;
  billingConfig: BillingConfig;
  onMarkPaid?: () => void;
  isProcessing?: boolean;
}

export const BillPreview: React.FC<BillPreviewProps> = ({ order, reservation, billingConfig, onMarkPaid, isProcessing }) => {
  
  // We don't have direct access to offers list here to re-calculate automatic offers, 
  // but we can display the custom discount stored on the order.
  // For this view, we assume `customDiscount` is the primary "Extra" discount.
  // Ideally, `order.totalAmount` should be the final source of truth, but we recalculate to show breakdown.
  
  const { 
    menuSubtotal, 
    serviceChargeAmount, 
    taxableAmount, 
    taxAmount, 
    customDiscountAmount, 
    grandTotal,
    activeItems
  } = calculateBill(order.items, billingConfig, order.customDiscount);

  // Platform fee logic (visual only if online)
  const isOnline = reservation?.paymentMethod === 'online';
  const platformFee = isOnline ? grandTotal * 0.02 : 0;
  const finalTotal = grandTotal + platformFee;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')?.innerHTML;
    const win = window.open('', '', 'height=700,width=500');
    if(win && printContent) {
        win.document.write('<html><head><title>Receipt</title>');
        win.document.write('<style>body{font-family:sans-serif; padding: 20px;} .receipt-header{text-align:center; margin-bottom:20px;} table{width:100%; border-collapse:collapse;} td{padding:5px 0;} .total{font-weight:bold; border-top:1px dashed #000;}</style>');
        win.document.write('</head><body>');
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 h-full flex flex-col">
       <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <h3 className="font-bold text-lg text-gray-900">Bill Details</h3>
          <div className="flex gap-2">
             <button onClick={handlePrint} className="p-2 text-gray-500 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"><Printer size={18}/></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6" id="receipt-content">
          <div className="text-center mb-6">
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">INVOICE</h2>
             <p className="text-sm text-gray-500 mt-1">#{order.id?.slice(-6).toUpperCase()}</p>
             <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <div className="mb-6 flex justify-between text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
                <p className="font-bold text-gray-900">{order.userName}</p>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Table</p>
                <p className="font-bold text-gray-900">{order.tableName}</p>
             </div>
          </div>

          <div className="space-y-3 mb-6">
             {activeItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-sm border-b border-dashed border-gray-100 pb-2 last:border-0">
                   <div className="flex gap-3">
                      <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                      <div>
                         <span className="text-gray-700 block">{item.name}</span>
                         {item.selectedAddOns?.map((addon, j) => (
                            <span key={j} className="text-[10px] text-gray-400 block">+ {addon.name}</span>
                         ))}
                      </div>
                   </div>
                   <span className="font-medium text-gray-900">
                      ${((item.price + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity).toFixed(2)}
                   </span>
                </div>
             ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 text-sm">
             <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${menuSubtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-500">
                <span>Service Charge ({billingConfig.serviceChargeRate}%)</span>
                <span>${serviceChargeAmount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-500">
                <span>Tax ({billingConfig.salesTaxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
             </div>
             
             {/* Discounts Section */}
             {customDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                   <span className="flex items-center gap-1"><Tag size={12}/> Extra Discount</span>
                   <span>- ${customDiscountAmount.toFixed(2)}</span>
                </div>
             )}

             {isOnline && (
               <div className="flex justify-between text-gray-500">
                  <span>Platform Fee (2%)</span>
                  <span>${platformFee.toFixed(2)}</span>
               </div>
             )}

             <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-200 mt-2">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
             </div>
          </div>
       </div>

       {/* Actions */}
       <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {reservation?.paymentStatus === 'pending_counter' ? (
             <Button fullWidth onClick={onMarkPaid} isLoading={isProcessing} className="bg-gray-900 text-white shadow-xl">
                <CheckCircle size={18} className="mr-2"/> Confirm Counter Payment
             </Button>
          ) : order.status === 'paid' || reservation?.status === 'completed' ? (
             <div className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl text-center flex items-center justify-center gap-2">
                <CheckCircle size={18}/> Paid & Closed
             </div>
          ) : (
             <div className="text-center text-gray-500 text-sm italic">
                Session Active
             </div>
          )}
       </div>
    </div>
  );
};
