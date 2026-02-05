
import React from 'react';
import { DollarSign, CheckCircle, Save, Info, AlertTriangle } from 'lucide-react';
import { Button } from '../../UI/Button';
import { ReservationConfig } from '../../../types';
import { Checkbox } from '../../UI/Checkbox';

interface ReservationConfigPanelProps {
  config: ReservationConfig;
  setConfig: (config: ReservationConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const ReservationConfigPanel: React.FC<ReservationConfigPanelProps> = ({ 
  config, 
  setConfig, 
  onSave, 
  isSaving 
}) => {
  
  // Enforce Max 70% Refund
  const handleRefundChange = (val: number) => {
      const safeVal = Math.min(Math.max(0, val), 70);
      setConfig({...config, refundPercentage: safeVal});
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 mb-8 animate-scale-in">
       <h3 className="text-lg font-bold text-gray-900 mb-4">Reservation Settings</h3>
       
       {/* Info Banner about Splits */}
       <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 space-y-1">
             <p className="font-bold">Revenue & Fee Structure:</p>
             <ul className="list-disc pl-4 space-y-1 text-blue-700/80">
                <li><strong>Successful Bookings:</strong> Platform fee is <span className="font-bold">20%</span>. You receive <span className="font-bold">80%</span>.</li>
                <li><strong>Cancellations:</strong> Platform retains a fixed <span className="font-bold">30%</span> processing fee.</li>
                <li>Refunds are capped at <strong>70%</strong> to account for the platform fee.</li>
             </ul>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Reservation Fee ($)</label>
             <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                  type="number" 
                  min="0"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500"
                  value={config.reservationFee}
                  onChange={(e) => setConfig({...config, reservationFee: parseFloat(e.target.value) || 0})}
                />
             </div>
             {config.reservationFee === 0 && (
               <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                 <CheckCircle size={12}/> Pro Tip: Free reservations attract 40% more customers!
               </p>
             )}
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
             <div className="flex items-center gap-3 mb-3">
                <Checkbox 
                    checked={config.isRefundable}
                    onChange={(checked) => setConfig({...config, isRefundable: checked})}
                    label="Refund Available"
                />
             </div>
             {config.isRefundable && (
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                   <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-600 whitespace-nowrap">User Refund:</span>
                      <div className="relative flex-1">
                        <input 
                            type="number" 
                            min="0" max="70"
                            className="w-full px-3 py-1.5 rounded border border-gray-300 text-center font-bold bg-white"
                            value={config.refundPercentage}
                            onChange={(e) => handleRefundChange(parseInt(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1.5 text-gray-400 font-bold">%</span>
                      </div>
                   </div>
                   
                   {/* Dynamic Preview */}
                   <div className="text-xs space-y-1 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-gray-500">
                            <span>User Gets:</span>
                            <span className="font-bold">{config.refundPercentage}%</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Platform Fee:</span>
                            <span className="font-bold">30%</span>
                        </div>
                        <div className="flex justify-between text-green-700 font-bold bg-green-50 p-1 rounded">
                            <span>You Keep:</span>
                            <span>{Math.max(0, 100 - 30 - config.refundPercentage)}%</span>
                        </div>
                   </div>
                   {config.refundPercentage >= 70 && (
                       <p className="text-[10px] text-orange-600 flex items-center gap-1">
                           <AlertTriangle size={10} /> Max refund is 70%.
                       </p>
                   )}
               </div>
             )}
          </div>
       </div>
       <div className="flex justify-end mt-6">
          <Button onClick={onSave} isLoading={isSaving}>
             <Save size={18} className="mr-2"/> Save Configuration
          </Button>
       </div>
    </div>
  );
};
