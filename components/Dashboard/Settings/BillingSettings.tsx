
import React, { useState, useEffect } from 'react';
import { Save, Receipt } from 'lucide-react';
import { Button } from '../../UI/Button';
import { BillingConfig } from '../../../types';
import { updateRestaurantProfile } from '../../../services/restaurantService';
import { useToast } from '../../../context/ToastContext';
import { Checkbox } from '../../UI/Checkbox';

interface BillingSettingsProps {
  userId: string;
  initialConfig?: BillingConfig;
}

export const BillingSettings: React.FC<BillingSettingsProps> = ({ userId, initialConfig }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<BillingConfig>({
    serviceChargeRate: 18,
    salesTaxRate: 8.25,
    isServiceChargeInclusive: false,
    isSalesTaxInclusive: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when initialConfig loads from DB
  useEffect(() => {
    if (initialConfig) {
        setConfig(prev => ({
            ...prev,
            ...initialConfig
        }));
    }
  }, [initialConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRestaurantProfile(userId, { billingConfig: config });
      showToast("Billing settings saved successfully.", "success");
    } catch (error) {
      console.error("Failed to save billing config", error);
      showToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
         <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
           <Receipt size={20} />
         </div>
         <div>
            <h3 className="text-xl font-bold text-gray-900">Billing Configuration</h3>
            <p className="text-xs text-gray-500">Configure taxes and service charges.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         
         {/* Service Charge Section */}
         <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                Service Charge
                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border">Added to Subtotal</span>
            </h4>
            
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Percentage (%)</label>
                <input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-bold text-gray-900"
                    value={config.serviceChargeRate}
                    onChange={(e) => setConfig({...config, serviceChargeRate: parseFloat(e.target.value) || 0})}
                />
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <Checkbox 
                    checked={config.isServiceChargeInclusive}
                    onChange={(checked) => setConfig(p => ({ ...p, isServiceChargeInclusive: checked }))}
                    label={
                        <div>
                            <span className="text-sm font-bold text-gray-800 block">Include in Item Rate</span>
                            <span className="text-xs text-gray-500 font-normal">If checked, item prices already include this charge.</span>
                        </div>
                    }
                />
            </div>
         </div>

         {/* Sales Tax Section */}
         <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                Sales Tax
                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border">Calculated on Taxable Amt</span>
            </h4>
            
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Percentage (%)</label>
                <input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all font-bold text-gray-900"
                    value={config.salesTaxRate}
                    onChange={(e) => setConfig({...config, salesTaxRate: parseFloat(e.target.value) || 0})}
                />
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <Checkbox 
                    checked={config.isSalesTaxInclusive}
                    onChange={(checked) => setConfig(p => ({ ...p, isSalesTaxInclusive: checked }))}
                    label={
                        <div>
                            <span className="text-sm font-bold text-gray-800 block">Include in Item Rate</span>
                            <span className="text-xs text-gray-500 font-normal">If checked, tax is part of the listed price.</span>
                        </div>
                    }
                />
            </div>
         </div>

      </div>

      <div className="mt-8 flex justify-end">
         <Button onClick={handleSave} isLoading={isSaving}>
            <Save size={18} className="mr-2"/> Save Settings
         </Button>
      </div>
    </div>
  );
};
