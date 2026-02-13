
import React, { useState } from 'react';
import { Printer, CheckCircle, Share2, Receipt } from 'lucide-react';
import { Order, Reservation, BillingConfig } from '../../../types';
import { Button } from '../../UI/Button';
import { BillReceipt } from '../../Shared/BillReceipt';

interface BillPreviewProps {
  order: Order;
  reservation?: Reservation;
  billingConfig: BillingConfig;
  onMarkPaid?: () => void;
  isProcessing?: boolean;
}

type PrintSize = 'small' | 'medium' | 'large';

export const BillPreview: React.FC<BillPreviewProps> = ({ order, reservation, billingConfig, onMarkPaid, isProcessing }) => {
  const [printSize, setPrintSize] = useState<PrintSize>('small');
  
  // Platform fee logic (visual only if online)
  const isOnline = reservation?.paymentMethod === 'online';
  const platformFeeRate = isOnline ? 0.03 : 0; 

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content')?.innerHTML;
    const win = window.open('', '', 'height=800,width=600');
    
    // Define styles based on print size
    let maxWidth = '300px';
    let fontSize = '10px';
    let containerPadding = '10px';

    if (printSize === 'medium') {
        maxWidth = '500px';
        fontSize = '12px';
        containerPadding = '20px';
    } else if (printSize === 'large') {
        maxWidth = '100%';
        fontSize = '14px';
        containerPadding = '40px';
    }

    if(win && printContent) {
        win.document.write('<html><head><title>Receipt</title>');
        win.document.write(`
            <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 20px; background: #fff; }
                .receipt-container { 
                    width: 100%; 
                    max-width: ${maxWidth}; 
                    margin: 0 auto; 
                    font-size: ${fontSize};
                    padding: ${containerPadding};
                    border: ${printSize === 'large' ? 'none' : '1px solid #ddd'};
                }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .header h1 { font-size: ${printSize === 'large' ? '24px' : '20px'}; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 900; }
                .header p { margin: 2px 0; color: #555; }
                
                .meta { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px; }
                .meta div { display: flex; flex-direction: column; }
                .meta span.label { font-size: 0.8em; color: #888; text-transform: uppercase; }
                .meta span.value { font-weight: bold; }

                /* Hide UI elements that shouldn't print */
                .no-print { display: none !important; }
                
                /* Ensure BillReceipt styles work in print */
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .border-b { border-bottom: 1px solid #eee; }
                .border-dashed { border-style: dashed; }
                .pt-4 { padding-top: 1rem; }
                .mt-2 { margin-top: 0.5rem; }
            </style>
        `);
        win.document.write('</head><body>');
        win.document.write(`<div class="receipt-container">${printContent}</div>`);
        win.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
        win.document.write('</body></html>');
        win.document.close();
    }
  };

  return (
    <div className="bg-gray-100 h-full flex flex-col rounded-2xl overflow-hidden relative">
       
       {/* Actions Bar */}
       <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div>
             <h3 className="font-bold text-gray-900">Invoice Preview</h3>
             <p className="text-xs text-gray-500">#{order.id?.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-gray-50 rounded-lg p-1 flex text-xs font-medium border border-gray-100 mr-2">
                <button onClick={() => setPrintSize('small')} className={`px-2 py-1 rounded-md transition-all ${printSize === 'small' ? 'bg-white shadow-sm text-primary-600 font-bold' : 'text-gray-500'}`}>Sm</button>
                <button onClick={() => setPrintSize('medium')} className={`px-2 py-1 rounded-md transition-all ${printSize === 'medium' ? 'bg-white shadow-sm text-primary-600 font-bold' : 'text-gray-500'}`}>Md</button>
                <button onClick={() => setPrintSize('large')} className={`px-2 py-1 rounded-md transition-all ${printSize === 'large' ? 'bg-white shadow-sm text-primary-600 font-bold' : 'text-gray-500'}`}>Lg</button>
             </div>
             <Button variant="ghost" size="sm" onClick={handlePrint} title="Print Receipt">
                <Printer size={18}/>
             </Button>
             <Button variant="ghost" size="sm" title="Share">
                <Share2 size={18}/>
             </Button>
          </div>
       </div>

       {/* Receipt Container */}
       <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-gray-100 custom-scrollbar">
          <div 
            id="receipt-content" 
            className="w-full bg-white shadow-xl shadow-gray-200/50 flex flex-col relative transition-all duration-300"
            style={{ 
                maxWidth: printSize === 'small' ? '300px' : printSize === 'medium' ? '500px' : '100%',
                minHeight: 'fit-content'
            }}
          >
             {/* Receipt Top Decoration (Screen Only) */}
             <div className="h-2 bg-primary-600 w-full no-print"></div>

             <div className="p-6 md:p-8">
                {/* Header */}
                <div className="header text-center mb-6 pb-6 border-b border-dashed border-gray-300">
                   <h1 className="text-xl font-black text-gray-900 tracking-wider uppercase mb-2">FindMyDine</h1>
                   <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Fine Dining & POS System</p>
                   <div className="text-xs text-gray-500 mt-3 space-y-1">
                      <p>{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                      <p>Ticket #{order.id?.slice(-4).toUpperCase()}</p>
                   </div>
                </div>

                {/* Customer Info */}
                <div className="meta flex justify-between text-xs font-mono text-gray-600 mb-6 pb-4 border-b border-dashed border-gray-100">
                   <div>
                      <span className="label block text-gray-400 text-[10px] uppercase">Guest</span>
                      <span className="value font-bold text-gray-900">{order.userName}</span>
                   </div>
                   <div className="text-right">
                      <span className="label block text-gray-400 text-[10px] uppercase">Table</span>
                      <span className="value font-bold text-gray-900">{order.tableName}</span>
                   </div>
                </div>

                {/* Bill Content via Shared Component */}
                <BillReceipt 
                    items={order.items}
                    billingConfig={billingConfig}
                    billDetails={order.billDetails}
                    customDiscount={order.customDiscount}
                    offerDiscount={order.appliedDiscountAmount}
                    platformFeeRate={platformFeeRate}
                    // For discount description in live mode
                    discountDescription={[
                        order.customDiscount ? 'Manual' : '',
                        order.appliedOfferId ? 'Offer Applied' : ''
                    ].filter(Boolean).join(', ')}
                />

                {/* Footer */}
                <div className="footer mt-8 text-center">
                   <div className="text-[10px] text-gray-400 font-mono mb-2">
                      {order.id}
                   </div>
                   <p className="text-xs font-bold text-gray-800">Thank you for visiting!</p>
                   <p className="text-[10px] text-gray-500 mt-1">Please come again soon.</p>
                </div>
             </div>
             
             {/* Bottom Serrated Visual (Screen Only) */}
             <div className="h-4 bg-gray-100 no-print" style={{ 
                 backgroundImage: 'radial-gradient(circle, transparent 70%, #f3f4f6 70%)', 
                 backgroundSize: '16px 16px', 
                 backgroundPosition: '0 10px' 
             }}></div>
          </div>
       </div>

       {/* Action Footer */}
       <div className="p-6 bg-white border-t border-gray-200 shrink-0 z-10">
          {reservation?.paymentStatus === 'pending_counter' ? (
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2">
                    <Receipt size={16}/>
                    <span className="font-bold">Payment requested at counter.</span>
                </div>
                <Button fullWidth onClick={onMarkPaid} isLoading={isProcessing} className="bg-gray-900 text-white shadow-xl h-12 text-sm">
                   <CheckCircle size={18} className="mr-2"/> Confirm Payment Received
                </Button>
             </div>
          ) : order.status === 'paid' || reservation?.status === 'completed' ? (
             <div className="w-full py-4 bg-green-50 text-green-700 font-bold rounded-xl text-center flex items-center justify-center gap-2 border border-green-100">
                <CheckCircle size={20} className="fill-green-100 text-green-600"/> Payment Completed
             </div>
          ) : (
             <div className="text-center text-gray-400 text-sm italic py-2">
                Session Active - Bill Unpaid
             </div>
          )}
       </div>
    </div>
  );
};
