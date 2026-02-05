
import React, { useState, useEffect } from 'react';
import { Armchair, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { TableItem, Point } from '../../types';
import { getTables, addTable, updateTable, deleteTable, getFloorPlan } from '../../services/tableService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { ArchitecturalFloorPlan } from './ArchitecturalFloorPlan';
import { useToast } from '../../context/ToastContext';

// Child Components
import { TableHeader } from './Tables/TableHeader';
import { TableAreaGroup } from './Tables/TableAreaGroup';
import { QRModal } from './Tables/QRModal';
import { TableFormModal } from './Tables/TableFormModal';

interface TableManagementProps {
  userId: string;
}

const GRID_PIXELS = 20; // 20px = 1 Foot

export const TableManagement: React.FC<TableManagementProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [areas, setAreas] = useState<string[]>(['Main Hall']);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');
  const [activeVisualArea, setActiveVisualArea] = useState('Main Hall');
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  
  const [floorPlanStatus, setFloorPlanStatus] = useState<Record<string, boolean>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<TableItem | null>(null);

  const [areaSearch, setAreaSearch] = useState('');

  const [formData, setFormData] = useState<TableItem>({
    name: '',
    seats: 4,
    area: 'Main Hall',
    shape: 'rectangle',
    status: 'available',
    width: 4,
    height: 3,
    points: [],
    chairPositions: [],
    chairConfig: { top: 1, bottom: 1, left: 1, right: 1 }
  });

  const [customPoints, setCustomPoints] = useState<Point[]>([]);
  const [chairs, setChairs] = useState<Point[]>([]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [data, profile] = await Promise.all([
        getTables(userId),
        getRestaurantProfile(userId)
      ]);
      
      if (profile) {
        setRestaurantName(profile.restaurantName || profile.displayName || 'My Restaurant');
      }

      const sortedData = data.sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setTables(sortedData);

      const uniqueAreas = Array.from(new Set(data.map(t => t.area).filter(Boolean)));
      if (uniqueAreas.length > 0) {
        setAreas(prev => Array.from(new Set([...prev, ...uniqueAreas])));
        checkFloorPlans(uniqueAreas);
      } else {
        checkFloorPlans(['Main Hall']);
      }
    } catch (e) {
      console.error("Failed to load tables", e);
      showToast("Failed to load tables", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const checkFloorPlans = async (areaList: string[]) => {
    const status: Record<string, boolean> = {};
    for (const area of areaList) {
      const plan = await getFloorPlan(userId, area);
      status[area] = plan.rooms && plan.rooms.length > 0;
    }
    setFloorPlanStatus(prev => ({...prev, ...status}));
  };

  const calculateChairs = (shape: string, width: number, height: number, config: { top: number, bottom: number, left: number, right: number }, totalSeats: number, points?: Point[]): Point[] => {
    const newChairs: Point[] = [];
    const pixelW = width * GRID_PIXELS;
    const pixelH = height * GRID_PIXELS;
    const padding = 2; 

    if (shape === 'rectangle' || shape === 'square') {
       for(let i=0; i<config.top; i++) { newChairs.push({ x: (-pixelW/2) + (pixelW / (config.top + 1)) * (i+1), y: -pixelH/2 - padding }); }
       for(let i=0; i<config.bottom; i++) { newChairs.push({ x: (-pixelW/2) + (pixelW / (config.bottom + 1)) * (i+1), y: pixelH/2 + padding }); }
       for(let i=0; i<config.left; i++) { newChairs.push({ x: -pixelW/2 - padding, y: (-pixelH/2) + (pixelH / (config.left + 1)) * (i+1) }); }
       for(let i=0; i<config.right; i++) { newChairs.push({ x: pixelW/2 + padding, y: (-pixelH/2) + (pixelH / (config.right + 1)) * (i+1) }); }
    } else if (shape === 'round') {
      const radius = (width * GRID_PIXELS) / 2;
      for (let i = 0; i < totalSeats; i++) {
        const angle = (i / totalSeats) * 2 * Math.PI;
        newChairs.push({ x: Math.cos(angle) * (radius + padding), y: Math.sin(angle) * (radius + padding) });
      }
    } else if (shape === 'custom' && points && points.length > 0) {
       const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
       const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
       const radius = Math.max(...points.map(p => Math.sqrt((p.x-cx)**2 + (p.y-cy)**2))) + padding;
       for (let i = 0; i < totalSeats; i++) {
        const angle = (i / totalSeats) * 2 * Math.PI;
        newChairs.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
    }
    return newChairs;
  };

  const getChairRotation = (shape: string, x: number, y: number, width: number, height: number) => {
    if (shape === 'round' || shape === 'custom') return (Math.atan2(y, x) * 180 / Math.PI) - 90;
    const normalizedX = Math.abs(x) / (width || 1);
    const normalizedY = Math.abs(y) / (height || 1);
    if (normalizedY > normalizedX) return y > 0 ? 0 : 180;
    else return x > 0 ? 270 : 90;
  };

  // Recalculate chairs when form data changes
  useEffect(() => {
    if (isModalOpen) {
      if (formData.shape === 'rectangle' || formData.shape === 'square') {
         const { top, bottom, left, right } = formData.chairConfig!;
         const total = top + bottom + left + right;
         if (total !== formData.seats) setFormData(prev => ({ ...prev, seats: total }));
         setChairs(calculateChairs(formData.shape, formData.width!, formData.height!, formData.chairConfig!, total));
      } else {
         setChairs(calculateChairs(formData.shape, formData.width!, formData.height!, formData.chairConfig!, formData.seats, customPoints));
      }
    }
  }, [formData.width, formData.height, formData.shape, formData.seats, formData.chairConfig, customPoints]);

  const generateDefaultName = (currentTables: TableItem[]) => {
    const numbers = currentTables.map(t => parseInt(t.name.replace(/\D/g, '')) || 0);
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `Table ${max + 1}`;
  };

  const handleOpenModal = (table?: TableItem) => {
    setError(null);
    if (table) {
      setEditingTable(table);
      const config = table.chairConfig || { 
        top: Math.ceil(table.seats/4), 
        bottom: Math.ceil(table.seats/4), 
        left: Math.floor(table.seats/4), 
        right: Math.floor(table.seats/4) 
      };
      setFormData({ 
        ...table,
        width: table.width || 4,
        height: table.height || (table.shape === 'round' ? 4 : 3),
        chairConfig: config
      });
      setAreaSearch(table.area);
      setCustomPoints(table.points || []);
      setChairs(calculateChairs(table.shape, table.width || 4, table.height || 3, config, table.seats, table.points));
    } else {
      setEditingTable(null);
      const defaultName = generateDefaultName(tables);
      const defaultConfig = { top: 1, bottom: 1, left: 1, right: 1 };
      setFormData({
        name: defaultName,
        seats: 4,
        area: 'Main Hall',
        shape: 'rectangle',
        status: 'available',
        width: 4,
        height: 3,
        chairConfig: defaultConfig
      });
      setAreaSearch('Main Hall');
      setCustomPoints([]);
      setChairs(calculateChairs('rectangle', 4, 3, defaultConfig, 4));
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.shape === 'custom' && customPoints.length < 3) { setError("Please draw at least 3 points for a custom shape."); return; }
    if (!formData.area.trim()) { setError("Please select or add an area."); return; }
    setIsSaving(true);
    try {
      const tableData = { ...formData, points: formData.shape === 'custom' ? customPoints : [], chairPositions: chairs };
      if (editingTable && editingTable.id) {
        const success = await updateTable(userId, { ...tableData, id: editingTable.id });
        if (success) {
          setTables(prev => prev.map(t => t.id === editingTable.id ? { ...tableData, id: editingTable.id } : t));
          if (!areas.includes(tableData.area)) setAreas(prev => [...prev, tableData.area]);
          setIsModalOpen(false);
          showToast("Table updated successfully", "success");
        } else setError("Failed to update table.");
      } else {
        const newTable = await addTable(userId, tableData);
        if (newTable) {
          setTables(prev => [...prev, newTable]);
          if (!areas.includes(tableData.area)) setAreas(prev => [...prev, tableData.area]);
          setIsModalOpen(false);
          showToast("Table created successfully", "success");
        } else setError("Failed to create table.");
      }
    } catch (err) { console.error(err); setError("Error saving."); } finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const success = await deleteTable(userId, itemToDelete);
      if (success) {
        setTables(prev => prev.filter(t => t.id !== itemToDelete));
        showToast("Table deleted successfully", "success");
      }
      else showToast("Failed to delete table", "error");
    } catch (error) { console.error(error); showToast("Error deleting table", "error"); } finally { setItemToDelete(null); }
  };

  const getQRUrl = (tableId: string) => {
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#/restaurant/${userId}/table/${tableId}/claim`;
  };

  const handlePrintAllQRs = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    // ... (Use same print logic logic or move to util if needed, keep inline for now as it relies on state)
    // For brevity, keeping simple logic here, same as before
    const qrSize = 250;
    const baseUrl = window.location.origin + window.location.pathname;
    const htmlContent = `<html><head><title>Print QR Codes</title><style>body{font-family:sans-serif;padding:20px;}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:30px;}.card{border:2px solid #eee;padding:20px;text-align:center;border-radius:16px;}.qr{width:${qrSize}px;height:${qrSize}px;}</style></head><body><div class="grid">${tables.map(t => `<div class="card"><h3>${restaurantName}</h3><img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(`${baseUrl}#/restaurant/${userId}/table/${t.id}/claim`)}" /><h2>${t.name}</h2></div>`).join('')}</div><script>window.onload=function(){setTimeout(function(){window.print();},500);}</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (viewMode === 'visual') {
    return <ArchitecturalFloorPlan userId={userId} activeArea={activeVisualArea} onClose={() => { setViewMode('list'); checkFloorPlans([activeVisualArea]); }} />;
  }

  return (
    <div className="animate-fade-in-up pb-10 h-full flex flex-col relative">
      
      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setItemToDelete(null)}>
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-600 mx-auto"><AlertCircle size={24} /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Delete Table?</h3>
              <p className="text-gray-500 mb-6 text-sm text-center">Action cannot be undone.</p>
              <div className="flex gap-3">
                 <Button variant="ghost" fullWidth onClick={() => setItemToDelete(null)}>Cancel</Button>
                 <Button fullWidth onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20">Delete</Button>
              </div>
           </div>
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
          <QRModal 
            table={qrTable}
            restaurantName={restaurantName}
            qrUrl={getQRUrl(qrTable.id!)}
            onClose={() => setQrTable(null)}
          />
      )}

      <TableHeader 
        tables={tables}
        onPrintQR={handlePrintAllQRs}
        onAddTable={() => handleOpenModal()}
      />

      {isLoading ? (
         <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
          <Armchair size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No tables configured</h3>
          <Button onClick={() => handleOpenModal()}>Create First Table</Button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in pb-10">
            {areas.filter(area => tables.some(t => t.area === area)).map(area => (
                <TableAreaGroup 
                    key={area}
                    area={area}
                    tables={tables.filter(t => t.area === area)}
                    hasFloorPlan={floorPlanStatus[area]}
                    onManageFloorPlan={() => { setActiveVisualArea(area); setViewMode('visual'); }}
                    onEdit={handleOpenModal}
                    onDelete={(id) => setItemToDelete(id)}
                    onShowQR={setQrTable}
                />
            ))}
        </div>
      )}

      <TableFormModal 
        isOpen={isModalOpen}
        isEditing={!!editingTable}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        areas={areas}
        areaSearch={areaSearch}
        setAreaSearch={setAreaSearch}
        customPoints={customPoints}
        setCustomPoints={setCustomPoints}
        chairs={chairs}
        isSaving={isSaving}
        error={error}
        GRID_PIXELS={GRID_PIXELS}
        getChairRotation={getChairRotation}
      />
    </div>
  );
};
