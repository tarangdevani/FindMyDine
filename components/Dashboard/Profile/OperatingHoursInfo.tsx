
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { OperatingHours, DaySchedule } from '../../../types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface OperatingHoursInfoProps {
  hours: OperatingHours;
  handleScheduleChange: (day: string, field: keyof DaySchedule, value: any) => void;
  errors: any;
}

export const OperatingHoursInfo: React.FC<OperatingHoursInfoProps> = ({ hours, handleScheduleChange, errors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
       <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
         <Clock size={20} className="text-primary-500" /> Operating Hours
       </h3>

       {errors.hours && <div className="mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium border border-red-100"><AlertCircle size={14}/> {errors.hours}</div>}

       <div className="flex flex-col gap-2">
          {DAYS.map(day => {
             const schedule = hours[day as keyof OperatingHours];
             return (
               <div key={day} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                  
                  {/* Day & Toggle */}
                  <div className="flex items-center gap-3 w-32">
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={!schedule.isClosed}
                          onChange={(e) => handleScheduleChange(day, 'isClosed', !e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                     </label>
                     <span className={`text-sm font-bold capitalize ${!schedule.isClosed ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                  </div>
                  
                  {/* Time Inputs */}
                  {schedule.isClosed ? (
                     <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg flex-1 text-center">Closed</span>
                  ) : (
                     <div className="flex items-center gap-2 flex-1 justify-end">
                        <input 
                          type="time" 
                          className={`bg-white border rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 outline-none shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all ${errors.hours ? 'border-red-300' : 'border-gray-200'}`}
                          value={schedule.open}
                          onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                        />
                        <span className="text-gray-400 text-xs font-bold">to</span>
                        <input 
                          type="time" 
                          className={`bg-white border rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 outline-none shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all ${errors.hours ? 'border-red-300' : 'border-gray-200'}`}
                          value={schedule.close}
                          onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                        />
                     </div>
                  )}
               </div>
             );
          })}
       </div>
    </div>
  );
};
