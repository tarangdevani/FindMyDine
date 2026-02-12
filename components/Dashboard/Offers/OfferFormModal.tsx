
import React from 'react';
import { XCircle, Tag, Gift, ListFilter, FileText, Percent, AlertCircle } from 'lucide-react';
import { Button } from '../../UI/Button';
import { Offer, MenuItem } from '../../../types';
import { Checkbox } from '../../UI/Checkbox';
import { useToast } from '../../../context/ToastContext';

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: Partial<Offer>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Offer>>>;
  isSaving: boolean;
  isEditing: boolean;
  menuItems: MenuItem[];
}

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen, onClose, onSubmit, formData, setFormData, isSaving, isEditing, menuItems
}) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const appendTerm = (text: string) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions ? prev.termsAndConditions + '\n- ' + text : '- ' + text
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // VALIDATION
      if (!formData.title?.trim()) {
          showToast("Offer title is required.", "error");
          return;
      }

      if (formData.type === 'coupon' && !formData.code?.trim()) {
          showToast("Coupon code is required.", "error");
          return;
      }

      // Date Logic
      if (formData.validFrom && formData.validUntil) {
          if (new Date(formData.validUntil) < new Date(formData.validFrom)) {
              showToast("Expiration date cannot be before start date.", "error");
              return;
          }
      }

      // Discount Logic
      if (formData.rewardType === 'discount') {
          if ((formData.discountValue || 0) <= 0) {
              showToast("Discount value must be greater than 0.", "error");
              return;
          }
          if (formData.discountType === 'percentage' && (formData.discountValue || 0) > 100) {
              showToast("Percentage discount cannot exceed 100%.", "error");
              return;
          }
      }

      if (formData.rewardType === 'free_item' && !formData.freeItemId) {
          showToast("Please select the free item to be gifted.", "error");
          return;
      }

      // Negative checks
      if ((formData.minSpend || 0) < 0) { showToast("Min spend cannot be negative.", "error"); return; }
      if ((formData.maxUsage || 0) < 0) { showToast("Usage limit cannot be negative.", "error"); return; }
      if ((formData.globalBudget || 0) < 0) { showToast("Budget cannot be negative.", "error"); return; }

      onSubmit(e);
  };

  const generateTerms = () => {
    let terms: string[] = [];
    if (formData.minSpend && formData.minSpend > 0) terms.push(`Minimum spend of $${formData.minSpend} required.`);
    if (formData.maxDiscount && formData.maxDiscount > 0) terms.push(`Maximum discount capped at $${formData.maxDiscount}.`);
    if (formData.maxUsage && formData.maxUsage > 0) terms.push(`Limited to first ${formData.maxUsage} redemptions.`);
    if (formData.validUntil) terms.push(`Offer expires on ${new Date(formData.validUntil).toLocaleDateString()}.`);
    
    if (formData.applicableItemIds && formData.applicableItemIds.length > 0) {
       terms.push("Valid only on selected items.");
    } else {
       terms.push("Valid on all items.");
    }

    if (formData.rewardType === 'free_item') {
       if (formData.triggerItemId) {
          const trigger = menuItems.find(m => m.id === formData.triggerItemId);
          terms.push(`Must purchase ${trigger?.name || 'specific item'} to redeem.`);
       }
       terms.push("Free item subject to availability.");
    }

    setFormData(prev => ({ ...prev, termsAndConditions: terms.map(t => `- ${t}`).join('\n') }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
             <div>
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit' : 'New'} {formData.type === 'coupon' ? 'Coupon' : 'Public Offer'}</h3>
                <p className="text-xs text-gray-500">{formData.type === 'coupon' ? 'Requires code to redeem.' : 'Visible to all customers.'}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={20} className="text-gray-400"/></button>
          </div>
          
          {/* Scrollable Form */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
             
             {/* SECTION 1: BASICS */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-1">
                   <Tag size={14}/> Basic Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   {formData.type === 'coupon' && (
                      <div>
                         <label className="block text-xs font-bold text-gray-600 mb-1">Code <span className="text-red-500">*</span></label>
                         <input 
                           type="text" 
                           required
                           className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white font-mono font-bold uppercase text-gray-900 focus:border-primary-500 outline-none"
                           placeholder="SAVE20"
                           value={formData.code}
                           onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                         />
                      </div>
                   )}
                   <div className={formData.type === 'coupon' ? '' : 'col-span-2'}>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary-500 outline-none"
                        placeholder="e.g. Summer Lunch Special"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                   <textarea 
                     rows={2}
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary-500 outline-none resize-none text-sm"
                     placeholder="Briefly describe the offer..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                   />
                </div>
             </div>

             {/* SECTION 2: REWARD LOGIC */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-1">
                   <Gift size={14}/> Reward Type
                </h4>
                
                {/* Toggle Reward Type */}
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                   <button type="button" onClick={() => setFormData({...formData, rewardType: 'discount'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 ${formData.rewardType === 'discount' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}><Percent size={16}/> Discount</button>
                   <button type="button" onClick={() => setFormData({...formData, rewardType: 'free_item'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 ${formData.rewardType === 'free_item' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}><Gift size={16}/> Free Item</button>
                </div>

                {/* Dynamic Inputs Based on Reward Type */}
                {formData.rewardType === 'discount' ? (
                   <div className="grid grid-cols-2 gap-4 bg-primary-50 p-4 rounded-xl border border-primary-100">
                      <div>
                         <label className="block text-xs font-bold text-primary-800 mb-1">Discount Mode</label>
                         <select 
                           className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white text-gray-900 text-sm outline-none"
                           value={formData.discountType}
                           onChange={(e) => setFormData({...formData, discountType: e.target.value as any})}
                         >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-primary-800 mb-1">Value</label>
                         <input 
                           type="number" min="0" required
                           className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white text-gray-900 text-sm outline-none font-bold"
                           value={formData.discountValue}
                           onChange={(e) => setFormData({...formData, discountValue: parseFloat(e.target.value)})}
                         />
                      </div>
                      {formData.discountType === 'percentage' && (
                         <div className="col-span-2">
                            <label className="block text-xs font-bold text-primary-800 mb-1">Max Discount Cap ($) <span className="font-normal text-gray-500">(Optional)</span></label>
                            <input 
                              type="number" min="0"
                              className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white text-gray-900 text-sm outline-none"
                              placeholder="e.g. 50"
                              value={formData.maxDiscount}
                              onChange={(e) => setFormData({...formData, maxDiscount: parseFloat(e.target.value)})}
                            />
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-primary-800 mb-1">Select Free Item <span className="text-red-500">*</span></label>
                         <select 
                           className="w-full px-3 py-2 rounded-lg border border-primary-200 bg-white text-gray-900 text-sm outline-none"
                           value={formData.freeItemId}
                           onChange={(e) => setFormData({...formData, freeItemId: e.target.value})}
                         >
                            <option value="">-- Choose Item --</option>
                            {menuItems.map(item => <option key={item.id} value={item.id}>{item.name} (${item.price})</option>)}
                         </select>
                      </div>
                      <div className="flex gap-2 text-xs text-primary-700 bg-white p-2 rounded border border-primary-200">
                         <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                         This item will be priced at $0.00 when conditions are met.
                      </div>
                   </div>
                )}
             </div>

             {/* SECTION 3: CONDITIONS & LIMITS */}
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-1">
                   <ListFilter size={14}/> Conditions & Applicability
                </h4>

                {/* Trigger: Min Spend vs Specific Item */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-600 mb-1">Min Spend ($)</label>
                       <input 
                         type="number" min="0"
                         className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary-500 outline-none text-sm"
                         placeholder="0 for none"
                         value={formData.minSpend}
                         disabled={!!formData.triggerItemId} // Disable if buying specific item
                         onChange={(e) => setFormData({...formData, minSpend: parseFloat(e.target.value)})}
                       />
                    </div>
                    {formData.rewardType === 'free_item' && (
                       <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">OR Buy Specific Item</label>
                          <select 
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm outline-none"
                            value={formData.triggerItemId}
                            onChange={(e) => setFormData({...formData, triggerItemId: e.target.value, minSpend: e.target.value ? 0 : formData.minSpend})}
                          >
                             <option value="">-- No Item Trigger --</option>
                             {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                       </div>
                    )}
                    
                    {/* Usage Limits */}
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Total Users Cap <span className="font-normal text-gray-400">(Opt)</span></label>
                            <input 
                                type="number" min="0"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none text-sm"
                                placeholder="0 for unlimited"
                                value={formData.maxUsage}
                                onChange={(e) => setFormData({...formData, maxUsage: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Global Budget Cap ($) <span className="font-normal text-gray-400">(Opt)</span></label>
                            <input 
                                type="number" min="0"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none text-sm"
                                placeholder="Total $ budget"
                                value={formData.globalBudget}
                                onChange={(e) => setFormData({...formData, globalBudget: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                {/* Applicable Items Selection */}
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-2">Applicable On</label>
                   <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded border border-gray-100 hover:border-primary-200">
                         <Checkbox 
                           checked={!formData.applicableItemIds || formData.applicableItemIds.length === 0}
                           onChange={(checked) => setFormData({...formData, applicableItemIds: checked ? [] : menuItems.map(i => i.id!)})}
                           label="All Items"
                         />
                      </div>
                      {menuItems.map(item => {
                         const isSelected = formData.applicableItemIds?.includes(item.id!);
                         const isAllSelected = !formData.applicableItemIds || formData.applicableItemIds.length === 0;
                         
                         return (
                           <div key={item.id} className={`p-2 bg-white rounded border ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100'} ${isAllSelected ? 'opacity-50' : ''}`}>
                              <Checkbox 
                                checked={isSelected}
                                disabled={isAllSelected}
                                onChange={(checked) => {
                                   const current = formData.applicableItemIds || [];
                                   if (checked) {
                                      setFormData({...formData, applicableItemIds: [...current, item.id!]});
                                   } else {
                                      setFormData({...formData, applicableItemIds: current.filter(id => id !== item.id)});
                                   }
                                }}
                                label={<span className="text-sm truncate text-gray-900">{item.name}</span>}
                              />
                           </div>
                         );
                      })}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Valid From</label>
                      <input 
                        type="date" 
                        required 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" 
                        value={formData.validFrom} 
                        onChange={(e) => setFormData({...formData, validFrom: e.target.value})} 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Valid Until</label>
                      <input 
                        type="date" 
                        required 
                        min={formData.validFrom}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" 
                        value={formData.validUntil} 
                        onChange={(e) => setFormData({...formData, validUntil: e.target.value})} 
                      />
                   </div>
                </div>
             </div>

             {/* SECTION 4: TERMS & CONDITIONS */}
             <div>
                <div className="flex justify-between items-end mb-2">
                   <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2"><FileText size={14}/> Terms & Conditions</label>
                   <button type="button" onClick={generateTerms} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold transition-colors">Auto-Generate</button>
                </div>
                <textarea 
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary-500 outline-none text-sm resize-none"
                  placeholder="- Valid for dine-in only&#10;- Cannot be combined with other offers"
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                   {['Dine-in only', 'No cash value', 'One per table'].map(suggestion => (
                      <button 
                        key={suggestion} type="button" 
                        onClick={() => appendTerm(suggestion)}
                        className="text-[10px] border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 text-gray-600"
                      >
                         + {suggestion}
                      </button>
                   ))}
                </div>
             </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0 shrink-0">
             <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
             <Button fullWidth onClick={handleFormSubmit} isLoading={isSaving}>Save {formData.type === 'coupon' ? 'Coupon' : 'Offer'}</Button>
          </div>

       </div>
    </div>
  );
};
