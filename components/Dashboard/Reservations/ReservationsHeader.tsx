
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../../UI/Button';

interface ReservationsHeaderProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
  filter: 'all' | 'pending' | 'confirmed';
  setFilter: (filter: 'all' | 'pending' | 'confirmed') => void;
}

export const ReservationsHeader: React.FC<ReservationsHeaderProps> = ({ 
  showConfig, 
  setShowConfig, 
  filter, 
  setFilter 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
         <h2 className="text-2xl font-bold text-gray-900">Reservations</h2>
         <p className="text-gray-500">Manage upcoming booking requests.</p>
      </div>
      <div className="flex gap-2">
         <Button variant="white" onClick={() => setShowConfig(!showConfig)}>
           <Settings size={18} className="mr-2"/> Configuration
         </Button>
         {(['all', 'pending', 'confirmed'] as const).map(f => (
           <button
             key={f}
             onClick={() => setFilter(f)}
             className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
           >
             {f}
           </button>
         ))}
      </div>
    </div>
  );
};
