
import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className = '', disabled = false }) => {
  return (
    <div 
      className={`flex items-center gap-2 cursor-pointer group select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className={`transition-colors shrink-0 ${checked ? 'text-primary-600' : 'text-gray-300 group-hover:text-primary-400'}`}>
        {checked ? <CheckSquare size={20} /> : <Square size={20} />}
      </div>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
};
