
import React from 'react';
import { AlertTriangle, ChevronRight, Plus, Settings } from 'lucide-react';
import { DashboardView } from '../Sidebar';

interface SetupWarningsProps {
  hasProfile: boolean;
  tableCount: number;
  menuCount: number;
  onNavigate: (view: DashboardView) => void;
}

export const SetupWarnings: React.FC<SetupWarningsProps> = ({ hasProfile, tableCount, menuCount, onNavigate }) => {
  const warnings = [];

  if (!hasProfile) {
    warnings.push({
      id: 'profile',
      title: 'Complete Profile',
      desc: 'Add your logo, cover image, and location.',
      action: 'settings',
      icon: Settings
    });
  }
  if (tableCount === 0) {
    warnings.push({
      id: 'tables',
      title: 'Add Tables',
      desc: 'Set up your floor plan to accept bookings.',
      action: 'tables',
      icon: Plus
    });
  }
  if (menuCount === 0) {
    warnings.push({
      id: 'menu',
      title: 'Create Menu',
      desc: 'Add delicious items for guests to order.',
      action: 'menu',
      icon: Plus
    });
  }

  if (warnings.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8 animate-fade-in">
       <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-500" size={20} />
          <h3 className="font-bold text-orange-900 text-lg">Setup Required</h3>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warnings.map((w) => {
             const Icon = w.icon;
             return (
               <button 
                 key={w.id}
                 onClick={() => onNavigate(w.action as DashboardView)}
                 className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group text-left"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Icon size={18} />
                     </div>
                     <div>
                        <p className="font-bold text-gray-900">{w.title}</p>
                        <p className="text-xs text-gray-500">{w.desc}</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500" />
               </button>
             );
          })}
       </div>
    </div>
  );
};
