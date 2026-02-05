
import React from 'react';
import { LayoutTemplate, Ban, CheckCircle2 } from 'lucide-react';
import { TableItem } from '../../../types';

interface TableGridProps {
  tables: (TableItem & { isUnavailable: boolean })[];
  selectedTableId?: string;
  onTableSelect: (table: TableItem) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({ tables, selectedTableId, onTableSelect }) => {
  return (
    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {tables.map(table => {
        const unavailable = table.isUnavailable;
        const isSelected = selectedTableId === table.id;
        
        return (
            <button
            key={table.id}
            disabled={unavailable}
            onClick={() => onTableSelect(table)}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-32 relative ${
                unavailable
                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale' 
                    : isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md ring-2 ring-primary-200' 
                        : 'border-white bg-white hover:border-primary-200 hover:shadow-sm'
            }`}
            >
            <LayoutTemplate size={24} className={isSelected ? 'text-primary-500' : 'text-gray-300'} />
            <span className="font-bold">{table.name}</span>
            <span className="text-xs text-gray-500">{table.seats} Seats</span>
            
            {unavailable && (
                <span className="text-[10px] text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded absolute top-2 right-2 flex items-center gap-1 border border-red-100">
                    <Ban size={10} /> Not Available
                </span>
            )}
            {isSelected && !unavailable && (
                <div className="absolute top-2 right-2 text-primary-600"><CheckCircle2 size={16} /></div>
            )}
            </button>
        );
      })}
    </div>
  );
};
