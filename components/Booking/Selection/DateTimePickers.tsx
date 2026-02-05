
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  minDate: string;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onChange, minDate }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  
  // Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    // Construct YYYY-MM-DD string manually to avoid timezone shifts
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    
    if (dateStr >= minDate) {
        onChange(dateStr);
    }
  };

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const m = (month + 1).toString().padStart(2, '0');
    const d = i.toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    const isSelected = dateStr === selectedDate;
    const isDisabled = dateStr < minDate;

    days.push(
      <button
        key={i}
        onClick={() => !isDisabled && handleDayClick(i)}
        className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
          isSelected 
            ? 'bg-primary-600 text-white shadow-md' 
            : isDisabled 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={18}/></button>
        <span className="font-bold text-gray-900">{monthNames[month]} {year}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={18}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {days}
      </div>
    </div>
  );
};

interface TimePickerProps {
  selectedTime: string;
  onChange: (time: string) => void;
  minTime?: string; // Optional: restrict past times for today
}

export const TimePicker: React.FC<TimePickerProps> = ({ selectedTime, onChange }) => {
  // Generate slots (e.g. 10:00 to 23:00)
  const slots = [];
  for (let h = 10; h <= 22; h++) {
    for (let m of ['00', '30']) {
        slots.push(`${h.toString().padStart(2, '0')}:${m}`);
    }
  }

  return (
    <div className="w-full max-h-60 overflow-y-auto custom-scrollbar">
       <div className="grid grid-cols-3 gap-2">
          {slots.map(time => {
             const [h, m] = time.split(':');
             const hour = parseInt(h);
             const ampm = hour >= 12 ? 'PM' : 'AM';
             const displayH = hour % 12 || 12;
             const displayTime = `${displayH}:${m} ${ampm}`;
             const isSelected = selectedTime === time;

             return (
                <button
                   key={time}
                   onClick={() => onChange(time)}
                   className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                   }`}
                >
                   {displayTime}
                </button>
             );
          })}
       </div>
    </div>
  );
};
