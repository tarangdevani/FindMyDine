
import React, { useEffect, useState, useRef } from 'react';
import { Button } from './Button';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
  disabled?: boolean;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, onSuccess, disabled }) => {
   const paypalRef = useRef<HTMLDivElement>(null);
   const [scriptLoaded, setScriptLoaded] = useState(false);

   useEffect(() => {
      if (window.paypal) {
         setScriptLoaded(true);
      } else {
         const interval = setInterval(() => {
            if (window.paypal) {
               setScriptLoaded(true);
               clearInterval(interval);
            }
         }, 500);
         return () => clearInterval(interval);
      }
   }, []);

   useEffect(() => {
      if (!disabled && scriptLoaded && window.paypal && paypalRef.current) {
         try {
             paypalRef.current.innerHTML = ""; 
             window.paypal.Buttons({
                style: { layout: 'horizontal', color: 'gold', shape: 'rect', label: 'pay' },
                createOrder: (data: any, actions: any) => {
                   return actions.order.create({
                      purchase_units: [{
                         amount: { value: amount.toFixed(2) }
                      }]
                   });
                },
                onApprove: async (data: any, actions: any) => {
                   const details = await actions.order.capture();
                   onSuccess(details);
                },
                onError: (err: any) => {
                    console.error("PayPal Error:", err);
                    alert("Payment failed. Please try again.");
                }
             }).render(paypalRef.current);
         } catch(e) {
             console.error("Failed to render PayPal:", e);
         }
      }
   }, [amount, disabled, scriptLoaded]);

   if (!scriptLoaded) return <div className="text-center text-xs text-gray-400 py-2">Loading Payment...</div>;
   if (disabled) return <Button size="lg" fullWidth disabled>Amount too low</Button>;

   return <div ref={paypalRef} className="w-full relative z-0"></div>;
};
