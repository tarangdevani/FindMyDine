
import React from 'react';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { MenuItem, FoodCategory } from '../../../types';

interface MenuItemCardProps {
  item: MenuItem;
  categories: FoodCategory[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onViewImage: (url: string) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  categories, 
  onEdit, 
  onDelete, 
  onViewImage 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden group flex flex-col">
      <div 
        className="relative h-48 bg-gray-100 cursor-pointer overflow-hidden" 
        onClick={() => { if (item.imageUrl) onViewImage(item.imageUrl); }}
      >
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <ImageIcon size={32} />
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
            className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id!); }} 
            className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold">Unavailable</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
          <span className="font-bold text-primary-600">${item.price}</span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
        
        {item.addOns && item.addOns.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {item.addOns.slice(0, 3).map((addon, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                {addon.name} (+${addon.price})
              </span>
            ))}
            {item.addOns.length > 3 && <span className="text-[10px] text-gray-400">+{item.addOns.length - 3} more</span>}
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
            {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
          </span>
          {item.isVegetarian && (
            <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100">Veg</span>
          )}
        </div>
      </div>
    </div>
  );
};
