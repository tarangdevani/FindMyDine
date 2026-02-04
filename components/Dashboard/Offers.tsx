import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Tag, Calendar, Percent, DollarSign, Trash2, Edit2, CheckCircle, XCircle, AlertCircle, Loader2, Gift, Megaphone, Lock, FileText, Check, ListFilter } from 'lucide-react';
import { Button } from '../UI/Button';
import { Offer, MenuItem } from '../../types';
import { getOffers, addOffer, updateOffer, deleteOffer } from '../../services/offerService';
import { getMenu } from '../../services/menuService';

interface OffersProps {
  userId: string;
}

export const Offers: React.FC<OffersProps> = ({ userId }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // For item selection
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offer' | 'coupon'>('offer');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Offer>>({
    type: 'offer',
    code: '',
    title: '',
    description: '',
    rewardType: 'discount',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 0,
    minSpend: 0,
    maxUsage: 0,
    applicableItemIds: [], // Empty = All
    freeItemId: '',
    triggerItemId: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    isActive: true,
    termsAndConditions: ''
  });

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [fetchedOffers, fetchedMenu] = await Promise.all([
        getOffers(userId),
        getMenu(userId)
      ]);
      setOffers(fetchedOffers);
      setMenuItems(fetchedMenu);
      setIsLoading(false);
    };
    init();
  }, [userId]);

  const handleOpenModal = (type: 'offer' | 'coupon', offer?: Offer) => {
    if (offer) {
      setEditingId(offer.id!);
      setFormData(offer);
    } else {
      setEditingId(null);
      setFormData({
        type: type,
        code: type === 'coupon' ? '' : `OFFER-${Date.now().toString().slice(-6)}`,
        title: '',
        description: '',
        rewardType: 'discount',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 0,
        minSpend: 0,
        maxUsage: 0,
        applicableItemIds: [],
        freeItemId: '',
        triggerItemId: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        isActive: true,
        termsAndConditions: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    if (formData.type === 'coupon' && !formData.code) return;
    
    // Validation for Free Item
    if (formData.rewardType === 'free_item' && !formData.freeItemId) {
      alert("Please select a free item to gift.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateOffer(userId, { ...formData, id: editingId } as any);
      } else {
        await addOffer(userId, formData as any);
      }
      // Refresh
      const data = await getOffers(userId);
      setOffers(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save offer", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this?")) {
      await deleteOffer(userId, id);
      setOffers(prev => prev.filter(o => o.id !== id));
    }
  };

  const toggleStatus = async (offer: Offer) => {
    const newStatus = !offer.isActive;
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: newStatus } : o));
    await updateOffer(userId, { id: offer.id!, isActive: newStatus });
  };

  // Helper to append terms
  const appendTerm = (text: string) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions ? prev.termsAndConditions + '\n- ' + text : '- ' + text
    }));
  };

  const generateTerms = () => {
    let terms: string[] = [];
    if (formData.minSpend && formData.minSpend > 0) terms.push(`Minimum spend of $${formData.minSpend} required.`);
    if (formData.maxDiscount && formData.maxDiscount > 0) terms.push(`Maximum discount capped at $${formData.maxDiscount}.`);
    if (formData.type === 'coupon' && formData.maxUsage && formData.maxUsage > 0) terms.push(`Limited to first ${formData.maxUsage} redemptions.`);
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

  const filteredOffers = offers.filter(o => o.type === activeTab);

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Offers & Coupons</h2>
           <p className="text-gray-500">Manage public deals and private coupon codes.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('offer')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'offer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <Megaphone size={16} /> Public Offers
           </button>
           <button 
             onClick={() => setActiveTab('coupon')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'coupon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
             <Ticket size={16} /> Coupons
           </button>
        </div>
        <Button onClick={() => handleOpenModal(activeTab)}>
           <Plus size={20} className="mr-2" /> Create {activeTab === 'offer' ? 'Offer' : 'Coupon'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              {activeTab === 'offer' ? <Megaphone size={32} /> : <Ticket size={32} />}
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">No Active {activeTab === 'offer' ? 'Offers' : 'Coupons'}</h3>
           <p className="text-gray-500 mb-6">Create a new {activeTab} to drive more sales.</p>
           <Button variant="outline" onClick={() => handleOpenModal(activeTab)}>Create First {activeTab === 'offer' ? 'Offer' : 'Coupon'}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredOffers.map(offer => {
             const isExpired = new Date(offer.validUntil) < new Date();
             
             return (
               <div key={offer.id} className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all group ${offer.isActive && !isExpired ? 'border-primary-100 hover:border-primary-300' : 'border-gray-100 opacity-75'}`}>
                  {/* Visual "Punch Out" Circles for Coupon Effect */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 transform -translate-y-1/2 z-10"></div>
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 transform -translate-y-1/2 z-10"></div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex gap-2">
                     <button onClick={() => handleOpenModal(offer.type, offer)} className="p-1.5 text-gray-400 hover:text-primary-600 bg-white rounded-full shadow-sm border border-gray-100"><Edit2 size={14}/></button>
                     <button onClick={() => handleDelete(offer.id!)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-full shadow-sm border border-gray-100"><Trash2 size={14}/></button>
                  </div>

                  <div className={`p-6 pb-4 border-b-2 border-dashed ${offer.isActive ? 'border-gray-100' : 'border-gray-100'}`}>
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                           offer.isActive ? 'bg-gradient-to-br from-primary-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                           {offer.rewardType === 'free_item' ? <Gift size={24}/> : (offer.discountType === 'percentage' ? '%' : '$')}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{offer.title}</h3>
                           {offer.type === 'coupon' ? (
                              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-gray-600 uppercase mt-1">
                                 <Lock size={8}/> {offer.code}
                              </span>
                           ) : (
                              <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded uppercase mt-1">Public Offer</span>
                           )}
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between text-sm">
                        <div className="flex flex-col">
                           <span className="text-gray-400 text-xs font-bold uppercase">Reward</span>
                           <span className="font-bold text-gray-900 text-lg">
                              {offer.rewardType === 'free_item' 
                                ? 'Free Item' 
                                : (offer.discountType === 'percentage' ? `${offer.discountValue}% Off` : `$${offer.discountValue} Off`)
                              }
                           </span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-gray-400 text-xs font-bold uppercase">Condition</span>
                           <span className="font-bold text-gray-900">
                              {offer.triggerItemId 
                                ? 'Buy Item' 
                                : (offer.minSpend ? `Min $${offer.minSpend}` : 'None')
                              }
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-gray-50/50 flex justify-between items-center">
                     <div className="text-xs text-gray-500">
                        <p className="flex items-center gap-1"><Calendar size={12}/> Exp: {new Date(offer.validUntil).toLocaleDateString()}</p>
                        {isExpired && <span className="text-red-500 font-bold mt-1 block">EXPIRED</span>}
                     </div>
                     
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={offer.isActive} onChange={() => toggleStatus(offer)} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                     </label>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit' : 'New'} {formData.type === 'coupon' ? 'Coupon' : 'Public Offer'}</h3>
                    <p className="text-xs text-gray-500">{formData.type === 'coupon' ? 'Requires code to redeem.' : 'Visible to all customers.'}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={20} className="text-gray-400"/></button>
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
                        {/* Coupon Specific: Max People */}
                        {formData.type === 'coupon' && (
                           <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-600 mb-1">Max Total Redemptions <span className="font-normal text-gray-400">(Global limit)</span></label>
                              <input 
                                type="number" min="0"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:border-primary-500 outline-none text-sm"
                                placeholder="e.g. 50 (0 for unlimited)"
                                value={formData.maxUsage}
                                onChange={(e) => setFormData({...formData, maxUsage: parseFloat(e.target.value)})}
                              />
                           </div>
                        )}
                    </div>

                    {/* Applicable Items Selection */}
                    <div>
                       <label className="block text-xs font-bold text-gray-600 mb-2">Applicable On</label>
                       <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100 cursor-pointer hover:border-primary-200">
                             <input 
                               type="checkbox" 
                               className="rounded text-primary-600 focus:ring-primary-500"
                               checked={!formData.applicableItemIds || formData.applicableItemIds.length === 0}
                               onChange={(e) => setFormData({...formData, applicableItemIds: e.target.checked ? [] : menuItems.map(i => i.id!)})}
                             />
                             <span className="text-sm font-bold text-gray-900">All Items</span>
                          </label>
                          {menuItems.map(item => {
                             const isSelected = formData.applicableItemIds?.includes(item.id!);
                             const isAllSelected = !formData.applicableItemIds || formData.applicableItemIds.length === 0;
                             
                             return (
                               <label key={item.id} className={`flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:border-primary-200 ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100'} ${isAllSelected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <input 
                                    type="checkbox" 
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                    checked={isSelected}
                                    disabled={isAllSelected}
                                    onChange={(e) => {
                                       const current = formData.applicableItemIds || [];
                                       if (e.target.checked) {
                                          setFormData({...formData, applicableItemIds: [...current, item.id!]});
                                       } else {
                                          setFormData({...formData, applicableItemIds: current.filter(id => id !== item.id)});
                                       }
                                    }}
                                  />
                                  <span className="text-sm truncate text-gray-900">{item.name}</span>
                               </label>
                             );
                          })}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Valid From</label>
                          <input type="date" required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" value={formData.validFrom} onChange={(e) => setFormData({...formData, validFrom: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Valid Until</label>
                          <input type="date" required className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} />
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
                 <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button fullWidth onClick={handleSave} isLoading={isSaving}>Save {formData.type === 'coupon' ? 'Coupon' : 'Offer'}</Button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};