
import React, { useState, useEffect } from 'react';
import { CreditCard, Save, Landmark } from 'lucide-react';
import { Button } from '../../UI/Button';
import { PayoutConfig } from '../../../types';
import { updateRestaurantProfile } from '../../../services/restaurantService';
import { useToast } from '../../../context/ToastContext';

interface PayoutSettingsProps {
  userId: string;
  initialConfig?: PayoutConfig;
}

export const PayoutSettings: React.FC<PayoutSettingsProps> = ({ userId, initialConfig }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<PayoutConfig>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleSave = async () => {
    // Basic validation
    if (!config.accountHolderName || !config.bankName || !config.accountNumber || !config.routingNumber) {
        showToast("All payout fields are required.", "error");
        return;
    }

    setIsSaving(true);
    try {
      await updateRestaurantProfile(userId, { 
          payoutConfig: config,
          bankInfoConfigured: true 
      });
      showToast("Payout information saved successfully.", "success");
    } catch (error) {
      console.error("Failed to save payout config", error);
      showToast("Failed to save payout information.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
         <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
           <Landmark size={20} />
         </div>
         <div>
            <h3 className="text-xl font-bold text-gray-900">Payout Information</h3>
            <p className="text-xs text-gray-500">Bank details for receiving withdrawals.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         
         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 transition-all"
                placeholder="e.g. John Doe / Business Name"
                value={config.accountHolderName}
                onChange={(e) => setConfig({...config, accountHolderName: e.target.value})}
            />
         </div>

         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 transition-all"
                placeholder="e.g. Chase, Bank of America"
                value={config.bankName}
                onChange={(e) => setConfig({...config, bankName: e.target.value})}
            />
         </div>

         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 transition-all font-mono"
                placeholder="0000000000"
                value={config.accountNumber}
                onChange={(e) => setConfig({...config, accountNumber: e.target.value})}
            />
         </div>

         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Routing Number / IFSC</label>
            <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-primary-500 transition-all font-mono"
                placeholder="000000000"
                value={config.routingNumber}
                onChange={(e) => setConfig({...config, routingNumber: e.target.value})}
            />
         </div>

      </div>

      <div className="flex justify-end">
         <Button onClick={handleSave} isLoading={isSaving}>
            <Save size={18} className="mr-2"/> Save Bank Details
         </Button>
      </div>
    </div>
  );
};
