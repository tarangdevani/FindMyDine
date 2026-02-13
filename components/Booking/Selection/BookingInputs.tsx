
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, X } from 'lucide-react';
import { CalendarPicker, TimePicker } from './DateTimePickers';

interface BookingInputsProps {
  date: string; setDate: (v: string) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  minDate: string;
  className?: string;
  compact?: boolean;
}

interface PickerContainerProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

const PickerContainer: React.FC<PickerContainerProps> = ({ children, title, onClose }) => (
    <>
        {/* Mobile Overlay (Fixed Sheet) */}
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in flex items-end justify-center" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                {children}
            </div>
        </div>

        {/* Desktop Overlay (Absolute Dropdown) */}
        <div className="hidden lg:block absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 w-72 animate-scale-in">
            {children}
        </div>
    </>
);

export const BookingInputs: React.FC<BookingInputsProps> = ({
  date, setDate, startTime, setStartTime, endTime, setEndTime, minDate, className = '', compact = false
}) => {
  const [activePicker, setActivePicker] = useState<'date' | 'start' | 'end' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click (Desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only close if it's not a mobile modal (on mobile, the backdrop handles close)
        if (window.innerWidth >= 1024) { 
            setActivePicker(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (t: string) => {
      const [h, m] = t.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayH = hour % 12 || 12;
      return `${displayH}:${m} ${ampm}`;
  };

  return (
    <div className={`space-y-4 ${className}`} ref={containerRef}>
      <div className={compact ? "grid grid-cols-2 gap-3" : "space-y-4"}>
        
        {/* Date Input */}
        <div className={compact ? "col-span-2" : ""}>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Date</label>
            <div className="relative">
                <div 
                    onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 cursor-pointer transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400 absolute left-3" />
                        <span className="text-sm font-bold text-gray-900 ml-1">{formatDate(date)}</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                {activePicker === 'date' && (
                    <PickerContainer title="Select Date" onClose={() => setActivePicker(null)}>
                        <CalendarPicker 
                            selectedDate={date} 
                            minDate={minDate} 
                            onChange={(d) => { setDate(d); setActivePicker(null); }} 
                        />
                    </PickerContainer>
                )}
            </div>
        </div>

        {/* Time Inputs */}
        <div className={compact ? "col-span-2 grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
            {/* Start Time */}
            <div className="relative">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">From</label>
                <div 
                    onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 cursor-pointer transition-all flex items-center justify-start gap-2"
                >
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm font-bold text-gray-900">{formatTime(startTime)}</span>
                </div>
                {activePicker === 'start' && (
                    <PickerContainer title="Select Start Time" onClose={() => setActivePicker(null)}>
                        <TimePicker 
                            selectedTime={startTime} 
                            onChange={(t) => { setStartTime(t); setActivePicker(null); }} 
                        />
                    </PickerContainer>
                )}
            </div>

            {/* End Time */}
            <div className="relative">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">To</label>
                <div 
                    onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 cursor-pointer transition-all flex items-center justify-start gap-2"
                >
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm font-bold text-gray-900">{formatTime(endTime)}</span>
                </div>
                {activePicker === 'end' && (
                    <PickerContainer title="Select End Time" onClose={() => setActivePicker(null)}>
                        <TimePicker 
                            selectedTime={endTime} 
                            onChange={(t) => { setEndTime(t); setActivePicker(null); }} 
                        />
                    </PickerContainer>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
