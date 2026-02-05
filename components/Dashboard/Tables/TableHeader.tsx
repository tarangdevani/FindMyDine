
import React from 'react';
import { Plus, Printer, Users } from 'lucide-react';
import { Button } from '../../UI/Button';
import { TableItem } from '../../../types';

interface TableHeaderProps {
  tables: TableItem[];
  onPrintQR: () => void;
  onAddTable: () => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ tables, onPrintQR, onAddTable }) => {
  const totalSeats = tables.reduce((acc, curr) => acc + curr.seats, 0);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
      <div>
         <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
         <p className="text-gray-500">Configure floor plan and generate QR codes.</p>
      </div>
      <div className="flex flex-wrap gap-4">
         {tables.length > 0 && (
             <Button variant="outline" onClick={onPrintQR}>
                <Printer size={18} className="mr-2" /> Print All QRs
             </Button>
         )}
         <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Users size={18} className="text-primary-500"/>
            <span className="font-bold text-gray-900">{totalSeats} <span className="text-gray-400 font-normal text-sm">Seats</span></span>
         </div>
         
         <Button onClick={onAddTable}>
           <Plus size={20} className="mr-2" /> Add Table
         </Button>
      </div>
    </div>
  );
};
