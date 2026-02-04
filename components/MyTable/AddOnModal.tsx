import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { MenuItem, FoodAddOn } from '../../types';

interface AddOnModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  selectedAddOns: FoodAddOn[];
  onToggleAddOn: (addon: FoodAddOn) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const AddOnModal: React.FC<AddOnModalProps> = ({ isOpen, item, selectedAddOns, onToggleAddOn, onConfirm, onClose }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
                <div><h3 className="text-xl font-bold text-gray-900">{item.name}</h3><p className="text-primary-600 font-bold">${item.price}</p></div>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="mb-6 max-h-[50vh] overflow-y-auto space-y-2">
                {item.addOns?.map(addon => {
                    const isSelected = selectedAddOns.some(a => a.id === addon.id);
                    return (
                        <div key={addon.id} onClick={() => onToggleAddOn(addon)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                            <span className="font-medium text-gray-900">{addon.name}</span>
                            <div className="flex items-center gap-3"><span className="text-sm font-bold text-gray-500">+${addon.price.toFixed(2)}</span><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>{isSelected && <CheckCircle size={14} className="text-white"/>}</div></div>
                        </div>
                    )
                })}
            </div>
            <Button fullWidth onClick={onConfirm} size="lg">Add to Order</Button>
        </div>
    </div>
  );
};