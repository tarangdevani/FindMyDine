
import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { FoodCategory } from '../../../../types';

interface CategorySectionProps {
  categories: FoodCategory[];
  selectedCategoryId: string;
  onSelect: (cat: FoodCategory) => void;
  onCreate: () => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelect, 
  onCreate, 
  categorySearch, 
  setCategorySearch 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
      <div 
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:within:ring-4 focus:within:ring-primary-100 transition-all bg-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input 
          type="text" 
          className="flex-1 outline-none bg-transparent cursor-pointer text-gray-900"
          placeholder="Select or Search Category"
          value={categorySearch}
          onChange={(e) => {
            setCategorySearch(e.target.value);
            setIsOpen(true);
          }}
          readOnly={false}
        />
        <ChevronDown size={18} className="text-gray-400" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-60 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(cat => (
              <div 
                key={cat.id} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                onClick={() => {
                  onSelect(cat);
                  setIsOpen(false);
                }}
              >
                <span className="text-gray-700 font-medium group-hover:text-primary-600">{cat.name}</span>
                {selectedCategoryId === cat.id && <Check size={16} className="text-primary-600" />}
              </div>
            ))
          ) : (
            <div className="p-2">
              <p className="px-2 py-2 text-sm text-gray-500">No category found.</p>
              <button 
                type="button"
                onClick={() => {
                    onCreate();
                    setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
              >
                <Plus size={16} /> Add "{categorySearch}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
