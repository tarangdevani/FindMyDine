import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Armchair, Users, Square, Circle, LayoutTemplate, Eye, Grid, PenTool, RotateCw, Move, Check, RefreshCw, Search, ChevronDown, Map, AlertCircle, QrCode, Printer } from 'lucide-react';
import { Button } from '../UI/Button';
import { TableItem, Point } from '../../types';
import { getTables, addTable, updateTable, deleteTable, getFloorPlan } from '../../services/tableService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { ArchitecturalFloorPlan } from './ArchitecturalFloorPlan';

interface TableManagementProps {
  userId: string;
}

const GRID_PIXELS = 20; // 20px = 1 Foot

export const TableManagement: React.FC<TableManagementProps> = ({ userId }) => {
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
  
  // QR Code State
  const [qrTable, setQrTable] = useState<TableItem | null>(null);

  const [areaSearch, setAreaSearch] = useState('');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (formData.shape !== 'custom') return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const snapX = Math.round(x / 10) * 10;
    const snapY = Math.round(y / 10) * 10;
    const newPoints = [...customPoints, { x: snapX, y: snapY }];
    setCustomPoints(newPoints);
    setFormData({ ...formData, points: newPoints });
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
          handleCloseModal();
        } else setError("Failed to update table.");
      } else {
        const newTable = await addTable(userId, tableData);
        if (newTable) {
          setTables(prev => [...prev, newTable]);
          if (!areas.includes(tableData.area)) setAreas(prev => [...prev, tableData.area]);
          handleCloseModal();
        } else setError("Failed to create table.");
      }
    } catch (err) { console.error(err); setError("Error saving."); } finally { setIsSaving(false); }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setItemToDelete(id); };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const success = await deleteTable(userId, itemToDelete);
      if (success) setTables(prev => prev.filter(t => t.id !== itemToDelete));
      else alert("Failed to delete table.");
    } catch (error) { console.error(error); } finally { setItemToDelete(null); }
  };

  const handleQRClick = (e: React.MouseEvent, table: TableItem) => {
      e.stopPropagation();
      setQrTable(table);
  };

  const filteredAreas = areas.filter(a => a.toLowerCase().includes(areaSearch.toLowerCase()));

  // QR Url Generation
  const getQRUrl = (tableId: string) => {
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#/restaurant/${userId}/table/${tableId}/claim`;
  };

  const handlePrintAllQRs = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSize = 250;
    const baseUrl = window.location.origin + window.location.pathname;

    const htmlContent = `
      <html>
        <head>
          <title>Print QR Codes - ${restaurantName}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; background: #f9fafb; -webkit-print-color-adjust: exact; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
            .card { 
                background: white;
                border: 2px solid #e5e7eb; 
                padding: 30px 20px; 
                text-align: center; 
                page-break-inside: avoid; 
                border-radius: 16px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header { font-size: 20px; font-weight: 800; margin-bottom: 20px; color: #111827; letter-spacing: -0.5px; text-transform: uppercase; }
            .qr-container { background: white; padding: 10px; display: inline-block; border-radius: 10px; border: 1px solid #f3f4f6; }
            .qr { width: ${qrSize}px; height: ${qrSize}px; display: block; }
            .footer { margin-top: 20px; }
            .table-name { font-size: 28px; font-weight: 900; margin: 5px 0; color: #111827; }
            .instruction { font-size: 14px; color: #6b7280; font-weight: 500; margin-top: 5px; }
            .highlight { color: #f97316; }
            @media print {
              body { background: white; }
              .card { break-inside: avoid; border: 1px solid #ccc; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${tables.map(t => `
              <div class="card">
                <div class="header">${restaurantName}</div>
                <div class="qr-container">
                    <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(`${baseUrl}#/restaurant/${userId}/table/${t.id}/claim`)}" />
                </div>
                <div class="footer">
                  <div class="table-name">${t.name}</div>
                  <div class="instruction">Scan to <span class="highlight">Order Food</span> & Pay</div>
                </div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { setTimeout(function(){ window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (viewMode === 'visual') {
    return <ArchitecturalFloorPlan userId={userId} activeArea={activeVisualArea} onClose={() => { setViewMode('list'); checkFloorPlans([activeVisualArea]); }} />;
  }

  return (
    <div className="animate-fade-in-up pb-10 h-full flex flex-col relative">
      
      {/* Delete Confirmation Modal */}
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

      {/* QR Code Modal - Individual View */}
      {qrTable && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setQrTable(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in text-center" onClick={e => e.stopPropagation()}>
                <div className="mb-6">
                    <h3 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">{restaurantName}</h3>
                </div>
                
                <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 inline-block mb-4 shadow-sm">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getQRUrl(qrTable.id!))}`} 
                        alt="QR Code" 
                        className="w-48 h-48"
                    />
                </div>
                
                <div className="mb-6">
                    <h2 className="text-3xl font-black text-gray-900 mb-1">{qrTable.name}</h2>
                    <p className="text-gray-500 font-medium">Scan to <span className="text-primary-600 font-bold">Order Food</span> & Pay</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="white" fullWidth onClick={() => window.print()}><Printer size={18} className="mr-2"/> Print</Button>
                    <Button fullWidth onClick={() => setQrTable(null)}>Close</Button>
                </div>
            </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
           <p className="text-gray-500">Configure floor plan and generate QR codes.</p>
        </div>
        <div className="flex flex-wrap gap-4">
           {tables.length > 0 && (
               <Button variant="outline" onClick={handlePrintAllQRs}>
                  <Printer size={18} className="mr-2" /> Print All QRs
               </Button>
           )}
           <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <Users size={18} className="text-primary-500"/>
              <span className="font-bold text-gray-900">{tables.reduce((acc, curr) => acc + curr.seats, 0)} <span className="text-gray-400 font-normal text-sm">Seats</span></span>
           </div>
           
           <Button onClick={() => handleOpenModal()}>
             <Plus size={20} className="mr-2" /> Add Table
           </Button>
        </div>
      </div>

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
            {areas.filter(area => tables.some(t => t.area === area)).map(area => {
              const areaTables = tables.filter(t => t.area === area);
              if (areaTables.length === 0) return null;
              const hasPlan = floorPlanStatus[area];
              
              return (
                <div key={area} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-6 bg-primary-500 rounded-full"></span> {area} 
                      </h3>
                      <Button size="sm" variant={hasPlan ? "outline" : "primary"} onClick={() => { setActiveVisualArea(area); setViewMode('visual'); }}>
                         <Map size={16} className="mr-2"/> {hasPlan ? 'Edit Floor Plan' : 'Create Floor Plan'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {areaTables.map(table => (
                        <div key={table.id} className="group relative bg-gray-50 hover:bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all p-4 flex flex-col items-center justify-center min-h-[140px]">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button onClick={(e) => handleQRClick(e, table)} className="p-1.5 bg-white text-gray-500 hover:text-gray-900 rounded-lg shadow-sm border border-gray-100" title="Get QR Code"><QrCode size={14}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(table); }} className="p-1.5 bg-white text-gray-500 hover:text-primary-600 rounded-lg shadow-sm border border-gray-100"><Edit2 size={14}/></button>
                              <button onClick={(e) => handleDeleteClick(e, table.id!)} className="p-1.5 bg-white text-gray-500 hover:text-red-600 rounded-lg shadow-sm border border-gray-100"><Trash2 size={14}/></button>
                            </div>
                            <div className={`mb-3 text-gray-300 group-hover:text-primary-400 transition-colors`}>
                              {table.shape === 'round' ? <Circle size={40} strokeWidth={1.5} /> : <Square size={40} strokeWidth={1.5} />}
                            </div>
                            <span className="font-bold text-gray-900">{table.name}</span>
                            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-gray-500"><Users size={12} /> {table.seats} Seats</div>
                            <span className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${table.status === 'available' ? 'bg-emerald-50 text-emerald-600' : table.status === 'occupied' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{table.status}</span>
                        </div>
                      ))}
                    </div>
                </div>
              );
            })}
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in">
              <div className="w-full md:w-1/3 p-6 border-r border-gray-100 overflow-y-auto bg-gray-50/50 custom-scrollbar">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
                    <button onClick={handleCloseModal} className="md:hidden p-2"><X size={20}/></button>
                 </div>
                 <form id="tableForm" onSubmit={handleSubmit} className="space-y-5">
                    {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium">{error}</div>}
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label><input type="text" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none bg-white text-gray-900" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="relative" ref={areaDropdownRef}>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Area</label>
                       <div className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white flex items-center justify-between cursor-pointer" onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}>
                         <input type="text" className="flex-1 outline-none bg-transparent cursor-pointer text-gray-900" placeholder="Search or add area..." value={areaSearch} onChange={(e) => { setAreaSearch(e.target.value); setIsAreaDropdownOpen(true); }} />
                         <ChevronDown size={16} className="text-gray-400" />
                       </div>
                       {isAreaDropdownOpen && (
                         <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-20 max-h-40 overflow-y-auto custom-scrollbar">
                            {filteredAreas.length > 0 ? (
                              filteredAreas.map(area => (<div key={area} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700" onClick={() => { setAreaSearch(area); setFormData({...formData, area: area}); setIsAreaDropdownOpen(false); }}>{area}</div>))
                            ) : (<div className="px-3 py-2 text-sm text-primary-600 font-bold hover:bg-primary-50 cursor-pointer flex items-center gap-2" onClick={() => { setFormData({...formData, area: areaSearch}); setIsAreaDropdownOpen(false); }}><Plus size={14} /> Add "{areaSearch}"</div>)}
                         </div>
                       )}
                    </div>
                    {/* Simplified Shape Selection & Inputs for brevity in this response */}
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shape</label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setFormData({...formData, shape: 'rectangle'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'rectangle' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><Square size={16} /> Rect</button><button type="button" onClick={() => setFormData({...formData, shape: 'round'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'round' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><Circle size={16} /> Round</button><button type="button" onClick={() => setFormData({...formData, shape: 'custom'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'custom' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><PenTool size={16} /> Custom</button></div></div>
                    {(formData.shape === 'rectangle' || formData.shape === 'square') && (<div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Length (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.width} onChange={(e) => setFormData({...formData, width: parseInt(e.target.value)})} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Width (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.height} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})} /></div></div>)}
                    {formData.shape === 'round' && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diameter (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.width} onChange={(e) => setFormData({...formData, width: parseInt(e.target.value), height: parseInt(e.target.value)})} /></div>)}
                    {(formData.shape === 'rectangle' || formData.shape === 'square') && (<div className="bg-gray-100 p-3 rounded-xl border border-gray-200"><label className="block text-xs font-bold text-gray-600 uppercase mb-2 text-center">Chairs Per Side</label><div className="grid grid-cols-3 gap-2 justify-items-center items-center"><div className="col-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.top} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, top: parseInt(e.target.value) || 0}})} /></div><div className="col-start-1 row-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.left} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, left: parseInt(e.target.value) || 0}})} /></div><div className="col-start-2 row-start-2 w-12 h-10 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs font-bold text-gray-400">Table</div><div className="col-start-3 row-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.right} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, right: parseInt(e.target.value) || 0}})} /></div><div className="col-start-2 row-start-3"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.bottom} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, bottom: parseInt(e.target.value) || 0}})} /></div></div></div>)}
                    {(formData.shape === 'round' || formData.shape === 'custom') && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Seats</label><input type="number" min="1" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.seats} onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})} /></div>)}
                    <div className="pt-4 border-t border-gray-200"><Button type="submit" fullWidth isLoading={isSaving}>{editingTable ? 'Save Changes' : 'Create Table'}</Button></div>
                 </form>
              </div>
              <div className="w-full md:w-2/3 bg-gray-50 relative flex flex-col">
                 <div className="absolute top-4 right-4 flex gap-2 z-10"><button onClick={handleCloseModal} className="p-2 bg-white rounded-full shadow hover:bg-gray-50"><X size={20}/></button></div>
                 <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)`, backgroundSize: `${GRID_PIXELS}px ${GRID_PIXELS}px` }}></div>
                    <div className="bg-white/80 backdrop-blur-sm rounded shadow-xl relative border border-gray-200" style={{ width: '500px', height: '500px' }}>
                       <svg ref={svgRef} width="100%" height="100%" viewBox="-250 -250 500 500" className="cursor-crosshair" onClick={handleCanvasClick}>
                          <defs><filter id="tableShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="2" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.15"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                          <line x1="-10" y1="0" x2="10" y2="0" stroke="#f87171" strokeWidth="2" opacity="0.5" />
                          <line x1="0" y1="-10" x2="0" y2="10" stroke="#f87171" strokeWidth="2" opacity="0.5" />
                          {chairs.map((chair, i) => (<g key={i} transform={`translate(${chair.x}, ${chair.y}) rotate(${getChairRotation(formData.shape, chair.x, chair.y, formData.width! * GRID_PIXELS, formData.height! * GRID_PIXELS)})`}><rect x="-7" y="-7" width="14" height="14" rx="4" fill="#cbd5e1" stroke="none" /><rect x="-5" y="4" width="10" height="2" rx="1" fill="#94a3b8" /></g>))}
                          {formData.shape === 'rectangle' && (<rect x={-(formData.width! * GRID_PIXELS)/2} y={-(formData.height! * GRID_PIXELS)/2} width={formData.width! * GRID_PIXELS} height={formData.height! * GRID_PIXELS} fill="#fff7ed" stroke="none" rx="8" filter="url(#tableShadow)" />)}
                          {formData.shape === 'round' && (<circle r={(formData.width! * GRID_PIXELS)/2} fill="#fff7ed" stroke="none" filter="url(#tableShadow)" />)}
                          {formData.shape === 'custom' && (<g><polygon points={customPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="#fff7ed" stroke="none" filter="url(#tableShadow)" />{customPoints.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r={3} className="fill-blue-500" />))}</g>)}
                       </svg>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};