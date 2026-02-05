
import React from 'react';
import { TableItem } from '../../../types';

interface TableStatusGridProps {
  tables: TableItem[];
  onToggleStatus: (table: TableItem) => void;
}

export const TableStatusGrid: React.FC<TableStatusGridProps> = ({ tables, onToggleStatus }) => {
  return (
    <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Table Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => {
                const isOccupied = table.status === 'occupied' || table.status === 'reserved';
                return (
                    <div key={table.id} className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-32 ${isOccupied ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="flex justify-between items-start"><span className={`font-bold text-lg ${isOccupied ? 'text-red-800' : 'text-emerald-800'}`}>{table.name}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50">{table.seats}p</span></div>
                        <button onClick={() => onToggleStatus(table)} className={`w-full py-1.5 rounded-lg text-xs font-bold shadow-sm ${isOccupied ? 'bg-white text-red-600' : 'bg-white text-emerald-600'}`}>{isOccupied ? 'Free Table' : 'Occupy'}</button>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
