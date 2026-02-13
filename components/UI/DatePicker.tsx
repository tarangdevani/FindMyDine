
import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, value, onChange, min, max, className = '', disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize calendar state based on value or today
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date(); // Append time to avoid timezone shifts
  const [viewDate, setViewDate] = useState(initialDate);

  useEffect(() => {
    if (value) {
        setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    
    // Check constraints
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;

    onChange(dateStr);
    setIsOpen(false);
  };

  // Build Calendar Grid
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const days = [];

  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const m = (month + 1).toString().padStart(2, '0');
    const d = i.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    
    const isSelected = value === dateStr;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isDisabled = (min && dateStr < min) || (max && dateStr > max);

    days.push(
      <button
        key={i}
        onClick={(e) => { e.stopPropagation(); !isDisabled && handleDayClick(i); }}
        className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
          ${isSelected ? 'bg-primary-600 text-white shadow-md' : ''}
          ${!isSelected && isToday ? 'text-primary-600 border border-primary-200' : ''}
          ${!isSelected && !isToday && !isDisabled ? 'text-gray-700 hover:bg-gray-100' : ''}
          ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
        `}
      >
        {i}
      </button>
    );
  }

  const formatDateDisplay = (val: string) => {
      if (!val) return 'Select Date';
      const d = new Date(val + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">{label}</label>}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all bg-white
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-primary-300'}
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
        `}
      >
        <CalendarIcon size={18} className="text-gray-400" />
        <span className={`text-sm font-medium truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatDateDisplay(value) : 'Select Date'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72 animate-scale-in">
           <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={18}/></button>
              <span className="font-bold text-gray-900 text-sm">{monthNames[month]} {year}</span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={18}/></button>
           </div>
           
           <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                 <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
              ))}
           </div>
           
           <div className="grid grid-cols-7 gap-1 justify-items-center">
              {days}
           </div>
           
           {value && (
               <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
                     className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                   >
                       Clear Date
                   </button>
               </div>
           )}
        </div>
      )}
    </div>
  );
};
