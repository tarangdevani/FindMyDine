
import React from 'react';
import { Map } from 'lucide-react';
import { Button } from '../../UI/Button';
import { TableItem } from '../../../types';
import { TableCard } from './TableCard';

interface TableAreaGroupProps {
  area: string;
  tables: TableItem[];
  hasFloorPlan: boolean;
  onManageFloorPlan: () => void;
  onEdit: (table: TableItem) => void;
  onDelete: (id: string) => void;
  onShowQR: (table: TableItem) => void;
}

export const TableAreaGroup: React.FC<TableAreaGroupProps> = ({ 
  area, tables, hasFloorPlan, onManageFloorPlan, onEdit, onDelete, onShowQR 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary-500 rounded-full"></span> {area} 
          </h3>
          <Button size="sm" variant={hasFloorPlan ? "outline" : "primary"} onClick={onManageFloorPlan}>
             <Map size={16} className="mr-2"/> {hasFloorPlan ? 'Edit Floor Plan' : 'Create Floor Plan'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <TableCard 
                key={table.id}
                table={table}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowQR={onShowQR}
            />
          ))}
        </div>
    </div>
  );
};
