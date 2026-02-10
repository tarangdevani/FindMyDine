
import React from 'react';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import { PLATFORM_RAZORPAY_KEY } from '../../utils/billing';

interface RazorpayButtonProps {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  razorpayKeyId?: string; // Optional prop, usually undefined now
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: any) => void;
  onFailure?: (error: any) => void;
  disabled?: boolean;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({ 
  amount, 
  currency = 'INR', 
  name = 'FindMyDine', 
  description = 'Payment', 
  image,
  razorpayKeyId,
  prefill,
  onSuccess, 
  onFailure,
  disabled 
}) => {
  const { showToast } = useToast();

  // Use prop if provided (legacy), otherwise use global constant
  const keyToUse = razorpayKeyId || PLATFORM_RAZORPAY_KEY;

  const handlePayment = () => {
    if (!keyToUse) {
        showToast("Payment Gateway not configured.", "error");
        console.error("Missing Razorpay Key. Please set PLATFORM_RAZORPAY_KEY in utils/billing.ts");
        return;
    }

    if (typeof window.Razorpay === 'undefined') {
        showToast("Razorpay SDK not loaded. Check internet.", "error");
        return;
    }

    const options = {
        key: keyToUse, 
        amount: Math.round(amount * 100), // Amount is in smallest currency unit (e.g. paise)
        currency: currency,
        name: name,
        description: description,
        image: image,
        handler: function (response: any) {
            // Success Callback
            onSuccess(response);
        },
        prefill: {
            name: prefill?.name || '',
            email: prefill?.email || '',
            contact: prefill?.contact || ''
        },
        theme: {
            color: "#f97316" // Primary Orange
        },
        modal: {
            ondismiss: function() {
                if(onFailure) onFailure({ description: "Payment cancelled by user" });
            }
        }
    };

    try {
        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any){
            console.error(response.error);
            showToast(response.error.description || "Payment failed", "error");
            if(onFailure) onFailure(response.error);
        });
        rzp1.open();
    } catch (e) {
        console.error("Razorpay Error:", e);
        showToast("Could not initiate payment.", "error");
    }
  };

  return (
    <Button 
        size="lg" 
        fullWidth 
        onClick={handlePayment} 
        disabled={disabled || amount <= 0}
        className="bg-[#3395ff] hover:bg-[#287acc] shadow-lg text-white"
    >
        Pay Now
    </Button>
  );
};
