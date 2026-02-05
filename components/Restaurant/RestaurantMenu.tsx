
import React from 'react';
import { Utensils } from 'lucide-react';
import { MenuItem } from '../../types';

interface RestaurantMenuProps {
  menuItems: MenuItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const RestaurantMenu: React.FC<RestaurantMenuProps> = ({ menuItems, categories, activeCategory, onCategoryChange }) => {
  
  const filteredItems = menuItems.filter(i => activeCategory === 'All' || i.categoryName === activeCategory);

  return (
    <>
      {/* Category Chips */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar mb-6">
         <button 
            onClick={() => onCategoryChange('All')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
         >
            All Items
         </button>
         {categories.map(cat => (
            <button 
               key={cat}
               onClick={() => onCategoryChange(cat)}
               className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
               {cat}
            </button>
         ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex gap-4 group cursor-default">
               <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={20}/></div>
                  )}
               </div>
               <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                     <h4 className="font-bold text-gray-900">{item.name}</h4>
                     <span className="font-bold text-primary-600">${item.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                  <div className="mt-auto pt-2 flex items-center gap-2">
                      {item.isVegetarian && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">VEG</span>}
                  </div>
               </div>
            </div>
         ))}
      </div>
      {menuItems.length === 0 && (
         <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Menu coming soon</p>
         </div>
      )}
    </>
  );
};
