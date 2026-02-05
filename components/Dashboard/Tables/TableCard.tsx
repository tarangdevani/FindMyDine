
import React from 'react';
import { Edit2, Trash2, QrCode, Square, Circle, Users } from 'lucide-react';
import { TableItem } from '../../../types';

interface TableCardProps {
  table: TableItem;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string) => void;
  onShowQR: (table: TableItem) => void;
}

export const TableCard: React.FC<TableCardProps> = ({ table, onEdit, onDelete, onShowQR }) => {
  return (
    <div className="group relative bg-gray-50 hover:bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all p-4 flex flex-col items-center justify-center min-h-[140px]">
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={(e) => { e.stopPropagation(); onShowQR(table); }} className="p-1.5 bg-white text-gray-500 hover:text-gray-900 rounded-lg shadow-sm border border-gray-100" title="Get QR Code"><QrCode size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(table); }} className="p-1.5 bg-white text-gray-500 hover:text-primary-600 rounded-lg shadow-sm border border-gray-100"><Edit2 size={14}/></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(table.id!); }} className="p-1.5 bg-white text-gray-500 hover:text-red-600 rounded-lg shadow-sm border border-gray-100"><Trash2 size={14}/></button>
        </div>
        <div className={`mb-3 text-gray-300 group-hover:text-primary-400 transition-colors`}>
          {table.shape === 'round' ? <Circle size={40} strokeWidth={1.5} /> : <Square size={40} strokeWidth={1.5} />}
        </div>
        <span className="font-bold text-gray-900">{table.name}</span>
        <div className="flex items-center gap-1 mt-1 text-xs font-medium text-gray-500"><Users size={12} /> {table.seats} Seats</div>
        <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${table.status === 'available' ? 'bg-emerald-50 text-emerald-600' : table.status === 'occupied' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{table.status}</span>
    </div>
  );
};
