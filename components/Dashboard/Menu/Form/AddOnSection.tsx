
import React from 'react';
import { Search, Check, X } from 'lucide-react';
import { Button } from '../../../UI/Button';
import { FoodAddOn } from '../../../../types';

interface AddOnSectionProps {
  allAddOns: FoodAddOn[];
  selectedAddOns: FoodAddOn[];
  onToggle: (addon: FoodAddOn) => void;
  onCreate: () => void;
  addOnSearch: string;
  setAddOnSearch: (val: string) => void;
  newAddOnPrice: string;
  setNewAddOnPrice: (val: string) => void;
  isCreating: boolean;
}

export const AddOnSection: React.FC<AddOnSectionProps> = ({ 
  allAddOns, 
  selectedAddOns, 
  onToggle, 
  onCreate, 
  addOnSearch, 
  setAddOnSearch,
  newAddOnPrice,
  setNewAddOnPrice,
  isCreating
}) => {
  
  const filteredAddOns = allAddOns.filter(a => 
    a.name.toLowerCase().includes(addOnSearch.toLowerCase())
  );

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Applicable Add-ons / Toppings</label>
      
      {/* Add-ons Search Bar */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search to add toppings..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder-gray-400"
          value={addOnSearch}
          onChange={(e) => setAddOnSearch(e.target.value)}
        />
      </div>

      {/* Search Results / Global List - ONLY visible when searching */}
      {addOnSearch.trim() && (
        <div className="absolute z-10 w-full max-w-lg bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden mt-1">
          <div className="max-h-60 overflow-y-auto p-2">
            {/* Create New Item Option */}
            {!filteredAddOns.some(a => a.name.toLowerCase() === addOnSearch.toLowerCase()) && (
              <div className="p-3 rounded-lg bg-primary-50 flex items-center gap-3 mb-2">
                <span className="flex-1 font-medium text-gray-700 text-sm">Create "{addOnSearch}"</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-20">
                    <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01"
                      className="w-full pl-5 pr-2 py-1 text-sm rounded border border-gray-300 outline-none bg-white text-gray-900"
                      value={newAddOnPrice}
                      onChange={(e) => setNewAddOnPrice(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={onCreate} isLoading={isCreating} disabled={!newAddOnPrice}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {filteredAddOns.length > 0 ? (
              filteredAddOns.map(addon => {
                const isSelected = selectedAddOns.some(a => a.id === addon.id);
                return (
                  <div 
                    key={addon.id} 
                    onClick={() => onToggle(addon)}
                    className="cursor-pointer flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                        {isSelected && <Check size={10} className="text-white"/>}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{addon.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">+${addon.price.toFixed(2)}</span>
                  </div>
                );
              })
            ) : (
              !newAddOnPrice && <p className="text-center text-xs text-gray-400 py-2">No existing add-ons found.</p>
            )}
          </div>
        </div>
      )}

      {/* Applied Add-ons - Section below search */}
      <div className="mt-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Applied Add-ons</label>
        <div className="flex flex-wrap gap-2">
          {selectedAddOns.length > 0 ? (
            selectedAddOns.map(addon => (
              <div key={addon.id} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-primary-50 border border-primary-100 rounded-lg text-primary-700 text-sm font-medium">
                <span>{addon.name}</span>
                <span className="text-xs bg-white/50 px-1.5 rounded text-primary-800 font-bold">+${addon.price}</span>
                <button 
                  type="button" 
                  onClick={() => onToggle(addon)}
                  className="p-0.5 hover:bg-primary-200 rounded text-primary-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">No add-ons selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};
