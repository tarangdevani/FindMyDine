
import React, { useState } from 'react';
import { DollarSign, Percent, Save, Receipt, CheckSquare, Square } from 'lucide-react';
import { Button } from '../../UI/Button';
import { BillingConfig } from '../../../types';
import { updateRestaurantProfile } from '../../../services/restaurantService';

interface BillingSettingsProps {
  userId: string;
  initialConfig?: BillingConfig;
}

export const BillingSettings: React.FC<BillingSettingsProps> = ({ userId, initialConfig }) => {
  const [config, setConfig] = useState<BillingConfig>(initialConfig || {
    serviceChargeRate: 18,
    salesTaxRate: 8.25,
    isServiceChargeInclusive: false,
    isSalesTaxInclusive: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRestaurantProfile(userId, { billingConfig: config });
      alert("Billing settings saved.");
    } catch (error) {
      console.error("Failed to save billing config", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleServiceInclusive = () => setConfig(p => ({ ...p, isServiceChargeInclusive: !p.isServiceChargeInclusive }));
  const toggleTaxInclusive = () => setConfig(p => ({ ...p, isSalesTaxInclusive: !p.isSalesTaxInclusive }));

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
         <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
           <Receipt size={20} />
         </div>
         <div>
            <h3 className="text-xl font-bold text-gray-900">Billing & Taxes</h3>
            <p className="text-xs text-gray-500">Configure tax rates and service charges.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         
         {/* Service Charge Section */}
         <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                Service Charge
                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border">Added to Subtotal</span>
            </h4>
            
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Percentage (%)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        min="0" 
                        step="0.1"
                        className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900"
                        value={config.serviceChargeRate}
                        onChange={(e) => setConfig({...config, serviceChargeRate: parseFloat(e.target.value) || 0})}
                    />
                    <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                </div>
            </div>

            <div 
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={toggleServiceInclusive}
            >
                <div className={`mt-0.5 ${config.isServiceChargeInclusive ? 'text-blue-600' : 'text-gray-300'}`}>
                    {config.isServiceChargeInclusive ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div>
                    <span className="text-sm font-bold text-gray-800 block">Include in Item Rate</span>
                    <span className="text-xs text-gray-500">If checked, item prices already include this charge.</span>
                </div>
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
                <div className="relative">
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-gray-900"
                        value={config.salesTaxRate}
                        onChange={(e) => setConfig({...config, salesTaxRate: parseFloat(e.target.value) || 0})}
                    />
                    <Percent size={16} className="absolute right-3 top-3 text-gray-400" />
                </div>
            </div>

            <div 
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={toggleTaxInclusive}
            >
                <div className={`mt-0.5 ${config.isSalesTaxInclusive ? 'text-blue-600' : 'text-gray-300'}`}>
                    {config.isSalesTaxInclusive ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div>
                    <span className="text-sm font-bold text-gray-800 block">Include in Item Rate</span>
                    <span className="text-xs text-gray-500">If checked, tax is part of the listed price.</span>
                </div>
            </div>
         </div>

      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
         <Button onClick={handleSave} isLoading={isSaving}>
            <Save size={18} className="mr-2"/> Save Settings
         </Button>
      </div>
    </div>
  );
};
