
import React from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../UI/Button';
import { MenuItem, FoodCategory, FoodAddOn } from '../../../types';
import { ImageSection } from './Form/ImageSection';
import { CategorySection } from './Form/CategorySection';
import { AddOnSection } from './Form/AddOnSection';
import { Checkbox } from '../../UI/Checkbox';

interface MenuFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  
  // Data State
  formData: MenuItem;
  setFormData: (data: MenuItem) => void;
  categories: FoodCategory[];
  globalAddOns: FoodAddOn[];
  
  // Image Handlers
  previewUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewImage: (url: string) => void;

  // Category Logic
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  onCreateCategory: () => void;

  // AddOn Logic
  addOnSearch: string;
  setAddOnSearch: (val: string) => void;
  newAddOnPrice: string;
  setNewAddOnPrice: (val: string) => void;
  isCreatingAddOn: boolean;
  onCreateAddOn: () => void;
  onToggleAddOn: (addon: FoodAddOn) => void;
}

export const MenuFormModal: React.FC<MenuFormModalProps> = ({
  isOpen, isEditing, isLoading, onClose, onSubmit,
  formData, setFormData, categories, globalAddOns,
  previewUrl, onFileChange, onViewImage,
  categorySearch, setCategorySearch, onCreateCategory,
  addOnSearch, setAddOnSearch, newAddOnPrice, setNewAddOnPrice, isCreatingAddOn, onCreateAddOn, onToggleAddOn
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <ImageSection 
              previewUrl={previewUrl}
              onFileChange={onFileChange}
              onViewImage={onViewImage}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                placeholder="e.g. Truffle Pasta"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>

            <CategorySection 
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onSelect={(cat) => {
                setFormData({...formData, categoryId: cat.id});
                setCategorySearch(cat.name);
              }}
              onCreate={onCreateCategory}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                required
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                placeholder="Describe the dish ingredients and taste..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <AddOnSection 
              allAddOns={globalAddOns}
              selectedAddOns={formData.addOns || []}
              onToggle={onToggleAddOn}
              onCreate={onCreateAddOn}
              addOnSearch={addOnSearch}
              setAddOnSearch={setAddOnSearch}
              newAddOnPrice={newAddOnPrice}
              setNewAddOnPrice={setNewAddOnPrice}
              isCreating={isCreatingAddOn}
            />

            {/* Checkboxes */}
            <div className="md:col-span-2 flex gap-8 pt-2">
              <Checkbox 
                checked={formData.isVegetarian}
                onChange={(checked) => setFormData({...formData, isVegetarian: checked})}
                label="Vegetarian"
              />
              
              <Checkbox 
                checked={formData.isAvailable}
                onChange={(checked) => setFormData({...formData, isAvailable: checked})}
                label="Available Now"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading} disabled={!formData.categoryId}>
              <Save size={18} className="mr-2" /> Save Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
