import React from 'react';
import { Utensils } from 'lucide-react';
import { MenuItem, FoodCategory } from '../../types';

interface MenuViewProps {
  categories: FoodCategory[];
  menuItems: MenuItem[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onItemClick: (item: MenuItem) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ categories, menuItems, activeCategory, onCategoryChange, onItemClick }) => {
  return (
    <div className="animate-fade-in">
        <div className="sticky top-[73px] z-10 bg-gray-50/95 backdrop-blur-sm py-2 overflow-x-auto whitespace-nowrap px-4 border-b border-gray-200">
            <button onClick={() => onCategoryChange('All')} className={`px-4 py-2 rounded-full text-sm font-bold mr-2 transition-all ${activeCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>All</button>
            {categories.map(cat => (
                <button key={cat.id} onClick={() => onCategoryChange(cat.name)} className={`px-4 py-2 rounded-full text-sm font-bold mr-2 transition-all ${activeCategory === cat.name ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{cat.name}</button>
            ))}
        </div>
        <div className="p-4 grid gap-4 md:grid-cols-2">
            {menuItems.filter(item => activeCategory === 'All' || item.categoryName === activeCategory).map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={24}/></div>}
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                            <span className="font-bold text-gray-900">${item.price}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                        <div className="mt-auto flex justify-between items-end">
                            {item.addOns && item.addOns.length > 0 && <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-bold">Customizable</span>}
                            <button onClick={() => onItemClick(item)} className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-xs font-bold ml-auto">Add</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};