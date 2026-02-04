
import React, { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../UI/Button';
import { FoodCategory } from '../../../types';
import { addCategory, deleteCategory } from '../../../services/menuService';

interface CategorySettingsProps {
  userId: string;
  categories: FoodCategory[];
  setCategories: React.Dispatch<React.SetStateAction<FoodCategory[]>>;
  isLoading: boolean;
}

export const CategorySettings: React.FC<CategorySettingsProps> = ({ userId, categories, setCategories, isLoading }) => {
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setIsAddingCat(true);
    const added = await addCategory(userId, newCategory.trim());
    if (added) {
      setCategories(prev => [...prev, added]);
      setNewCategory('');
    }
    setIsAddingCat(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const success = await deleteCategory(userId, id);
      if (success) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
         <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
           <span className="font-bold text-lg">1</span>
         </div>
         <h3 className="text-xl font-bold text-gray-900">Food Categories</h3>
      </div>
      
      <p className="text-gray-500 mb-6 text-sm">
        Define the categories for your menu (e.g., Starters, Main Course, Desserts, Drinks).
      </p>

      <div className="max-w-xl">
         <div className="flex gap-3 mb-6">
           <input 
             type="text" 
             placeholder="Enter category name (e.g. Appetizers)" 
             className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white text-gray-900"
             value={newCategory}
             onChange={(e) => setNewCategory(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
           />
           <Button onClick={handleAddCategory} isLoading={isAddingCat} disabled={!newCategory.trim()}>
             <Plus size={18} className="mr-2" /> Add
           </Button>
         </div>

         {isLoading ? (
           <div className="flex justify-center py-4">
             <Loader2 className="animate-spin text-gray-400" />
           </div>
         ) : (
           <div className="flex flex-wrap gap-3">
             {categories.length === 0 && (
               <p className="text-gray-400 italic text-sm">No categories added yet.</p>
             )}
             {categories.map((category) => (
               <div key={category.id} className="group flex items-center gap-2 pl-4 pr-2 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-white transition-all">
                 <span className="font-medium text-gray-700">{category.name}</span>
                 <button 
                   onClick={() => handleDeleteCategory(category.id)}
                   className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};
