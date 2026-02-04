
import React, { useState } from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Button } from '../../UI/Button';
import { FoodAddOn } from '../../../types';
import { addGlobalAddOn, deleteGlobalAddOn } from '../../../services/menuService';

interface AddOnSettingsProps {
  userId: string;
  addOns: FoodAddOn[];
  setAddOns: React.Dispatch<React.SetStateAction<FoodAddOn[]>>;
  isLoading: boolean;
}

export const AddOnSettings: React.FC<AddOnSettingsProps> = ({ userId, addOns, setAddOns, isLoading }) => {
  const [newAddOnName, setNewAddOnName] = useState('');
  const [newAddOnPrice, setNewAddOnPrice] = useState('');
  const [isAddingAddOn, setIsAddingAddOn] = useState(false);

  const handleAddAddOn = async () => {
    if (!newAddOnName.trim() || !newAddOnPrice) return;
    setIsAddingAddOn(true);
    const added = await addGlobalAddOn(userId, newAddOnName.trim(), parseFloat(newAddOnPrice));
    if (added) {
      setAddOns(prev => [...prev, added]);
      setNewAddOnName('');
      setNewAddOnPrice('');
    }
    setIsAddingAddOn(false);
  };

  const handleDeleteAddOn = async (id: string) => {
    if (confirm('Are you sure you want to delete this add-on?')) {
      const success = await deleteGlobalAddOn(userId, id);
      if (success) {
        setAddOns(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
         <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
           <span className="font-bold text-lg">2</span>
         </div>
         <h3 className="text-xl font-bold text-gray-900">Add-ons & Toppings</h3>
      </div>
      
      <p className="text-gray-500 mb-6 text-sm">
        Create a library of available add-ons (e.g., Extra Cheese, Avocado, Bacon) with their prices. 
        You can select from these when adding dishes to your menu.
      </p>

      <div className="max-w-2xl">
         <div className="flex gap-3 mb-6 items-start">
           <div className="flex-1">
             <input 
               type="text" 
               placeholder="Add-on Name (e.g. Extra Cheese)" 
               className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white text-gray-900"
               value={newAddOnName}
               onChange={(e) => setNewAddOnName(e.target.value)}
             />
           </div>
           <div className="w-32 relative">
             <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
             <input 
               type="number" 
               placeholder="0.00" 
               min="0"
               step="0.01"
               className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white text-gray-900"
               value={newAddOnPrice}
               onChange={(e) => setNewAddOnPrice(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddAddOn()}
             />
           </div>
           <Button onClick={handleAddAddOn} isLoading={isAddingAddOn} disabled={!newAddOnName.trim() || !newAddOnPrice}>
             <Plus size={18} className="mr-2" /> Add
           </Button>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {addOns.length === 0 && !isLoading && (
               <p className="text-gray-400 italic text-sm">No add-ons created yet.</p>
             )}
             {addOns.map((addon) => (
               <div key={addon.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-white transition-all">
                 <div className="flex items-center gap-3">
                   <span className="font-medium text-gray-700">{addon.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                      +${addon.price.toFixed(2)}
                   </span>
                   <button 
                     onClick={() => handleDeleteAddOn(addon.id)}
                     className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
             ))}
         </div>
      </div>
    </div>
  );
};
