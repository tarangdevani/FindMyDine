import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Hand, MousePointer2, PenTool, ZoomIn, ZoomOut, Save, Maximize, Settings, Trash2, Circle, Square, Armchair, LogOut
} from 'lucide-react';
import { Button } from '../UI/Button';
import { TableItem, Room, Point, FloorPlanData } from '../../types';
import { saveFloorPlan, getFloorPlan, getTables, updateTable } from '../../services/tableService';

// --- Constants ---
const GRID_SIZE = 20; // 20px = 1 Foot
const SNAP_THRESHOLD = 10;

interface ArchitecturalFloorPlanProps {
  userId: string;
  activeArea: string;
  onClose?: () => void;
  readOnly?: boolean;
  onTableSelect?: (table: TableItem) => void;
}

type ToolMode = 'select' | 'hand' | 'draw_room';

export const ArchitecturalFloorPlan: React.FC<ArchitecturalFloorPlanProps> = ({ userId, activeArea, onClose, readOnly = false, onTableSelect }) => {
  // --- State ---
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]); 
  const [sidebarTables, setSidebarTables] = useState<TableItem[]>([]); 
  const [mode, setMode] = useState<ToolMode>('select');
  const [isLoading, setIsLoading] = useState(true);
  
  // Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Interaction
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 }); 
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'room' | 'table' | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<{ id: string, type: 'room'|'table', index: number } | null>(null);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragStartPan, setDragStartPan] = useState<Point>({ x: 0, y: 0 }); 
  const [initialObjPos, setInitialObjPos] = useState<Point | null>(null);
  
  // Rotation State
  const [isRotating, setIsRotating] = useState(false);

  // Drag & Drop (Sidebar to Canvas)
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  
  // Room Creation Wizard
  const [showRoomWizard, setShowRoomWizard] = useState(false);
  const [rectDimensions, setRectDimensions] = useState({ length: 20, width: 15 });

  // Selected Room Dimensions (For Editing)
  const [selectedRoomDims, setSelectedRoomDims] = useState<{width: number, height: number} | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const plan = await getFloorPlan(userId, activeArea);
      setRooms(plan.rooms || []);
      
      const allTables = await getTables(userId);
      const areaTables = allTables.filter(t => t.area === activeArea);
      const placed: TableItem[] = [];
      const unplaced: TableItem[] = [];
      const visualMap = new Map<string, TableItem>();
      if (plan.tables) plan.tables.forEach(t => { if(t.id) visualMap.set(t.id, t); });

      areaTables.forEach(t => {
         const visual = visualMap.get(t.id!) || t;
         if (visual.position && (visual.position.x !== 0 || visual.position.y !== 0)) {
             placed.push(visual);
         } else {
             unplaced.push(t);
         }
      });
      setTables(placed);
      setSidebarTables(unplaced);

      if (!readOnly && (!plan.rooms || plan.rooms.length === 0)) {
        setShowRoomWizard(true);
        setPan({ x: 400, y: 300 });
      } else {
         setPan({ x: 400, y: 300 });
      }
      setIsLoading(false);
    };
    loadData();
  }, [userId, activeArea, readOnly]);

  const handleSave = async () => {
    if (readOnly) return;
    const data: FloorPlanData = { 
      rooms, 
      tables, 
      walls: [], 
      windows: [],
    };
    await saveFloorPlan(userId, activeArea, data);
    
    const allTablesToSave = [...tables, ...sidebarTables];
    const updates = allTablesToSave.map(t => updateTable(userId, t));
    await Promise.all(updates);
    
    if (onClose) onClose();
  };

  // --- Visual Chair Calculation (Local Override) ---
  const calculateVisualChairs = (table: TableItem): Point[] => {
    const shape = table.shape;
    const width = table.width || 4;
    const height = table.height || 3;
    const totalSeats = table.seats;
    
    // Default config if missing
    const config = table.chairConfig || { 
        top: Math.ceil(totalSeats/4), 
        bottom: Math.ceil(totalSeats/4), 
        left: Math.floor(totalSeats/4), 
        right: Math.floor(totalSeats/4) 
    };
    
    // Tucked in padding
    const padding = 2; 

    const newChairs: Point[] = [];
    const pixelW = width * GRID_SIZE;
    const pixelH = height * GRID_SIZE;

    if (shape === 'rectangle' || shape === 'square') {
       // Top Side
       for(let i=0; i<config.top; i++) {
         const segment = pixelW / (config.top + 1);
         newChairs.push({ x: (-pixelW/2) + segment * (i+1), y: -pixelH/2 - padding });
       }
       // Bottom Side
       for(let i=0; i<config.bottom; i++) {
         const segment = pixelW / (config.bottom + 1);
         newChairs.push({ x: (-pixelW/2) + segment * (i+1), y: pixelH/2 + padding });
       }
       // Left Side
       for(let i=0; i<config.left; i++) {
         const segment = pixelH / (config.left + 1);
         newChairs.push({ x: -pixelW/2 - padding, y: (-pixelH/2) + segment * (i+1) });
       }
       // Right Side
       for(let i=0; i<config.right; i++) {
         const segment = pixelH / (config.right + 1);
         newChairs.push({ x: pixelW/2 + padding, y: (-pixelH/2) + segment * (i+1) });
       }
    } else if (shape === 'round') {
      const radius = (width * GRID_SIZE) / 2;
      for (let i = 0; i < totalSeats; i++) {
        const angle = (i / totalSeats) * 2 * Math.PI;
        newChairs.push({
          x: Math.cos(angle) * (radius + padding),
          y: Math.sin(angle) * (radius + padding)
        });
      }
    } else if (shape === 'custom' && table.points && table.points.length > 0) {
       const points = table.points;
       const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
       const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
       const radius = Math.max(...points.map(p => Math.sqrt((p.x-cx)**2 + (p.y-cy)**2))) + padding;
       
       for (let i = 0; i < totalSeats; i++) {
        const angle = (i / totalSeats) * 2 * Math.PI;
        newChairs.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
    }
    return newChairs;
  };

  // --- Geometry Helpers ---
  const toWorld = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    const x = (clientX - CTM.e) / CTM.a;
    const y = (clientY - CTM.f) / CTM.d;
    return { x: (x - pan.x) / zoom, y: (y - pan.y) / zoom };
  }, [pan, zoom]);

  const snapToGrid = (p: Point): Point => {
    return {
      x: Math.round(p.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(p.y / GRID_SIZE) * GRID_SIZE
    };
  };

  const dist = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  // --- Chair Orientation Helper ---
  const getChairRotation = (shape: string, x: number, y: number, width: number, height: number) => {
    // 0 deg = Facing Up (Back at bottom)
    // We want the chair front to face the table
    
    if (shape === 'round' || shape === 'custom') {
      return (Math.atan2(y, x) * 180 / Math.PI) - 90;
    }
    
    // Determine closest edge using normalized coordinates
    // This correctly handles wide or tall rectangles
    const normalizedX = Math.abs(x) / (width || 1);
    const normalizedY = Math.abs(y) / (height || 1);
    
    if (normalizedY > normalizedX) {
       // Closer to Top/Bottom edges
       return y > 0 ? 0 : 180; // y>0 is Bottom (Face Up 0deg), y<0 is Top (Face Down 180deg)
    } else {
       // Closer to Left/Right edges
       return x > 0 ? 270 : 90; // x>0 is Right (Face Left 270deg), x<0 is Left (Face Right 90deg)
    }
  };

  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const scaleFactor = 1.05;
    const oldZoom = zoom;
    const newZoom = e.deltaY < 0 ? oldZoom * scaleFactor : oldZoom / scaleFactor;
    if (newZoom < 0.1 || newZoom > 5) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - pan.x) / oldZoom;
    const worldY = (mouseY - pan.y) / oldZoom;
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // --- Interaction Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || mode === 'hand' || e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragStartPan(pan);
      setMode('hand');
      return;
    }

    if (readOnly) return; 

    const worldPos = toWorld(e.clientX, e.clientY);
    const snapped = snapToGrid(worldPos);

    if (mode === 'select' && selectedType === 'table' && selectedId) {
       const table = tables.find(t => t.id === selectedId);
       if (table) {
          setIsDragging(true);
          setDragStart(worldPos);
          setInitialObjPos(table.position || {x:0, y:0});
       }
    }

    if (hoveredVertex && mode === 'select') {
      setIsDragging(true);
      setDragStart(snapped);
      return;
    }

    if (mode === 'draw_room') {
      if (drawingPoints.length === 0) setDrawingPoints([snapped]);
      else if (drawingPoints.length > 2 && dist(snapped, drawingPoints[0]) < SNAP_THRESHOLD) finishDrawing();
      else setDrawingPoints([...drawingPoints, snapped]);
    }
    
    if (e.target === svgRef.current && mode === 'select' && !isRotating) {
       setSelectedId(null);
       setSelectedType(null);
       setSelectedRoomDims(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = toWorld(e.clientX, e.clientY);
    const snapped = snapToGrid(worldPos);
    setMousePos(snapped);

    if (isDragging && mode === 'hand') {
       const dx = e.clientX - (dragStart?.x || e.clientX);
       const dy = e.clientY - (dragStart?.y || e.clientY);
       setPan({ x: dragStartPan.x + dx, y: dragStartPan.y + dy });
       return;
    }

    if (readOnly) return;

    if (isRotating && selectedId && selectedType === 'table') {
       const table = tables.find(t => t.id === selectedId);
       if (table && table.position) {
          const dx = worldPos.x - table.position.x;
          const dy = worldPos.y - table.position.y;
          let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
          const rotation = Math.round(angleDeg + 90);
          setTables(prev => prev.map(t => t.id !== selectedId ? t : { ...t, rotation: rotation }));
       }
       return;
    }

    if (isDragging && selectedType === 'table' && selectedId && initialObjPos && dragStart && !isRotating) {
        const dx = snapped.x - snapToGrid(dragStart).x;
        const dy = snapped.y - snapToGrid(dragStart).y;
        setTables(prev => prev.map(t => t.id !== selectedId ? t : { ...t, position: { x: initialObjPos.x + dx, y: initialObjPos.y + dy } }));
    }

    if (isDragging && hoveredVertex && mode === 'select') {
      if (hoveredVertex.type === 'room') {
        setRooms(prev => prev.map(r => r.id !== hoveredVertex.id ? r : { ...r, points: r.points.map((p, i) => i === hoveredVertex.index ? snapped : p) }));
        updateRoomDimsFromPoints(hoveredVertex.id);
      } 
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setDragStart(null);
    setInitialObjPos(null);
    if (mode === 'hand') setMode('select');
  };

  // --- Drag & Drop (Sidebar) ---
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !draggedTableId) return;
    const worldPos = toWorld(e.clientX, e.clientY);
    const snapped = snapToGrid(worldPos);
    const tableToMove = sidebarTables.find(t => t.id === draggedTableId);
    if (tableToMove) {
       setSidebarTables(prev => prev.filter(t => t.id !== draggedTableId));
       setTables(prev => [...prev, { ...tableToMove, position: snapped }]);
    }
    setDraggedTableId(null);
  };
  const handleTableDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTableId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  // --- Helpers & Logic ---
  const updateRoomDimsFromPoints = (roomId: string) => {
     const room = rooms.find(r => r.id === roomId);
     if(!room) return;
     const xs = room.points.map(p => p.x);
     const ys = room.points.map(p => p.y);
     const w = (Math.max(...xs) - Math.min(...xs)) / GRID_SIZE;
     const h = (Math.max(...ys) - Math.min(...ys)) / GRID_SIZE;
     setSelectedRoomDims({ width: Math.round(w), height: Math.round(h) });
  };

  const handleRoomSelect = (room: Room) => {
    if(readOnly) return;
    setSelectedId(room.id);
    setSelectedType('room');
    updateRoomDimsFromPoints(room.id);
  };

  const updateRoomFromDims = (newW: number, newH: number) => {
    if (!selectedId || selectedType !== 'room') return;
    setRooms(prev => prev.map(r => {
      if (r.id !== selectedId) return r;
      const xs = r.points.map(p => p.x);
      const ys = r.points.map(p => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const halfW = (newW * GRID_SIZE) / 2;
      const halfH = (newH * GRID_SIZE) / 2;
      return { ...r, points: [{ x: cx - halfW, y: cy - halfH }, { x: cx + halfW, y: cy - halfH }, { x: cx + halfW, y: cy + halfH }, { x: cx - halfW, y: cy + halfH }] };
    }));
    setSelectedRoomDims({ width: newW, height: newH });
  };

  const createRectangularRoom = () => {
     const w = rectDimensions.length * GRID_SIZE;
     const h = rectDimensions.width * GRID_SIZE;
     const pts = [{ x: -w/2, y: -h/2 }, { x: w/2, y: -h/2 }, { x: w/2, y: h/2 }, { x: -w/2, y: h/2 }];
     const newId = `room_${Date.now()}`;
     setRooms([{ id: newId, name: 'Main Room', points: pts }]);
     setShowRoomWizard(false);
     setPan({ x: 400, y: 300 });
  };

  const finishDrawing = () => {
    if (drawingPoints.length < 3) { setDrawingPoints([]); return; }
    const newRoom = { id: `room_${Date.now()}`, name: `Room ${rooms.length + 1}`, points: drawingPoints };
    setRooms([...rooms, newRoom]);
    setDrawingPoints([]);
    setMode('select');
  };

  const handleDeleteRoom = () => {
    if (!selectedId || selectedType !== 'room') return;
    const tablesToUnplace = tables.map(t => ({ ...t, position: { x: 0, y: 0 } }));
    setSidebarTables(prev => [...prev, ...tablesToUnplace]);
    setTables([]); 
    setRooms(prev => prev.filter(r => r.id !== selectedId));
    setSelectedId(null);
    setSelectedType(null);
    setSelectedRoomDims(null);
    if (rooms.length === 0) setShowRoomWizard(true);
    setMode('select');
  };

  const handleUnplaceTable = () => {
    if (!selectedId || selectedType !== 'table') return;
    const tableIndex = tables.findIndex(t => t.id === selectedId);
    if (tableIndex === -1) return;
    const tableToUnplace = { ...tables[tableIndex], position: { x: 0, y: 0 } };
    setTables(prev => prev.filter((_, i) => i !== tableIndex));
    setSidebarTables(prev => [...prev, tableToUnplace]);
    setSelectedId(null);
    setSelectedType(null);
  };

  const selectedTableItem = selectedType === 'table' ? tables.find(t => t.id === selectedId) : null;

  return (
    <div className="flex flex-col h-full bg-gray-100 absolute inset-0 z-50 animate-fade-in">
      
      {/* Top Bar */}
      {!readOnly && (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Maximize size={20} className="text-primary-600"/> Floor Plan Designer 
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{activeArea}</span>
            </h2>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
               <button onClick={() => setMode('select')} className={`p-2 rounded ${mode === 'select' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`} title="Select"><MousePointer2 size={18} /></button>
               <button onClick={() => setMode('hand')} className={`p-2 rounded ${mode === 'hand' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`} title="Pan"><Hand size={18} /></button>
               {rooms.length === 0 && (
                 <button onClick={() => setMode('draw_room')} className={`p-2 rounded ${mode === 'draw_room' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'}`} title="Draw Walls"><PenTool size={18} /></button>
               )}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" onClick={onClose}>Exit</Button>
             <Button size="sm" onClick={handleSave}><Save size={16} className="mr-2"/> Save Layout</Button>
          </div>
        </div>
      )}

      {/* Read Only Controls */}
      {readOnly && (
         <div className="absolute top-4 right-4 z-20 flex gap-2">
             <div className="flex items-center gap-1 bg-white shadow-md rounded-lg p-1">
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-gray-100 rounded"><ZoomOut size={16}/></button>
                <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-1.5 hover:bg-gray-100 rounded"><ZoomIn size={16}/></button>
             </div>
         </div>
      )}

      <div className="flex-1 flex overflow-hidden">
         {/* SIDEBAR (Edit Mode Only) */}
         {!readOnly && (
           <div className="w-72 bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg">
              {/* Conditional Sidebar Content */}
              {selectedType === 'room' && selectedRoomDims ? (
                 <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Settings size={18}/> Room Properties</h3>
                    <div className="grid grid-cols-2 gap-3">
                       <div><label className="text-xs font-bold text-gray-500 uppercase">Length (ft)</label><input type="number" className="w-full mt-1 p-2 border rounded bg-white text-gray-900 text-sm" value={selectedRoomDims.width} onChange={(e) => updateRoomFromDims(parseInt(e.target.value) || 0, selectedRoomDims.height)} /></div>
                       <div><label className="text-xs font-bold text-gray-500 uppercase">Width (ft)</label><input type="number" className="w-full mt-1 p-2 border rounded bg-white text-gray-900 text-sm" value={selectedRoomDims.height} onChange={(e) => updateRoomFromDims(selectedRoomDims.width, parseInt(e.target.value) || 0)} /></div>
                    </div>
                    <button onClick={handleDeleteRoom} className="w-full mt-4 flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors"><Trash2 size={16}/> Delete Room</button>
                 </div>
              ) : selectedType === 'table' && selectedTableItem ? (
                 <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Settings size={18}/> Table Properties</h3>
                    <div className="mb-3">
                       <p className="text-xs font-bold text-gray-500 uppercase">Name</p>
                       <p className="font-medium text-gray-900">{selectedTableItem.name}</p>
                    </div>
                    <div className="mb-4">
                       <p className="text-xs font-bold text-gray-500 uppercase">Capacity</p>
                       <p className="font-medium text-gray-900">{selectedTableItem.seats} Seats</p>
                    </div>
                    <button onClick={handleUnplaceTable} className="w-full flex items-center justify-center gap-2 p-2 text-orange-600 hover:bg-orange-50 rounded text-sm font-medium transition-colors border border-orange-200 bg-white"><LogOut size={16}/> Unplace Table</button>
                 </div>
              ) : (
                 <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mt-2"><Armchair size={18} className="text-primary-500" /> Unplaced Tables</h3>
                 </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {sidebarTables.map(table => (
                   <div key={table.id} draggable onDragStart={(e) => handleTableDragStart(e, table.id!)} className="bg-gray-50 p-3 rounded-xl border border-gray-200 cursor-move hover:border-primary-400 hover:shadow-md transition-all flex items-center gap-3 group">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary-500">{table.shape === 'round' ? <Circle size={16}/> : <Square size={16}/>}</div>
                      <div><p className="font-bold text-gray-800 text-sm">{table.name}</p><p className="text-xs text-gray-500">{table.seats} Seats</p></div>
                   </div>
                 ))}
                 {sidebarTables.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-10 italic">
                       All tables placed
                    </div>
                 )}
              </div>
           </div>
         )}

         {/* MAIN CANVAS */}
         <div className="flex-1 relative bg-slate-100 cursor-crosshair overflow-hidden">
            {!readOnly && showRoomWizard && rooms.length === 0 && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                     <h3 className="text-xl font-bold text-gray-900 mb-2">Create Floor Plan</h3>
                     <p className="text-gray-500 text-sm mb-6">Choose how you want to design your layout.</p>
                     
                     <div className="space-y-3">
                        <div className="p-4 border border-gray-200 bg-gray-50 rounded-xl">
                           <h4 className="font-bold text-sm text-gray-700 mb-3">Draw Room</h4>
                           <div className="grid grid-cols-2 gap-3 mb-3">
                              <div><label className="text-xs font-bold text-gray-500 uppercase">L (ft)</label><input type="number" className="w-full mt-1 p-2 border rounded-lg bg-white" value={rectDimensions.length} onChange={(e) => setRectDimensions({...rectDimensions, length: parseInt(e.target.value) || 0})} /></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase">W (ft)</label><input type="number" className="w-full mt-1 p-2 border rounded-lg bg-white" value={rectDimensions.width} onChange={(e) => setRectDimensions({...rectDimensions, width: parseInt(e.target.value) || 0})} /></div>
                           </div>
                           <Button fullWidth size="sm" onClick={createRectangularRoom}>Create Rectangle</Button>
                           <div className="text-center text-xs text-gray-500 cursor-pointer hover:underline mt-2" onClick={() => { setMode('draw_room'); setShowRoomWizard(false); }}>Or Draw Walls Manually</div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <svg
              ref={svgRef} className="w-full h-full touch-none"
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
              onDragOver={handleDragOver} onDrop={handleDrop}
              style={{ cursor: mode === 'hand' || isDragging ? 'grabbing' : mode.startsWith('draw') ? 'crosshair' : 'default' }}
            >
               <defs>
                  <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse"><path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/></pattern>
                  <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="2" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
               </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                 <rect x={-50000} y={-50000} width={100000} height={100000} fill="url(#grid)" />
                 
                 {/* Rooms */}
                 {rooms.map(room => (
                     <polygon key={room.id} points={room.points.map(p => `${p.x},${p.y}`).join(' ')} 
                        onClick={(e) => { e.stopPropagation(); handleRoomSelect(room); }}
                        className={`fill-white transition-all duration-200 ${selectedId === room.id && !readOnly ? 'stroke-primary-500 stroke-[4]' : 'stroke-none'}`} 
                        filter="url(#dropShadow)"
                     />
                 ))}

                 {/* Tables */}
                 {tables.map(table => {
                    const isSelected = selectedId === table.id;
                    const pos = table.position || { x: 0, y: 0 };
                    let content;
                    let tableHeight = (table.height || 3) * GRID_SIZE;
                    let tableWidth = (table.width || 4) * GRID_SIZE;
                    
                    // Style determination
                    const isAvailable = table.status === 'available';
                    const fillColor = readOnly ? (isAvailable ? '#dcfce7' : '#fee2e2') : '#fff7ed'; // Green/Red in View, Light Orange in Edit
                    const strokeColor = isSelected && !readOnly ? '#f97316' : 'none'; // Only show border if selected
                    const strokeWidth = isSelected ? 3 : 0;

                    // Compute chairs locally for the visual "tucked in" look without affecting DB
                    const visualChairs = calculateVisualChairs(table);

                    if (table.shape === 'custom' && table.points) {
                        content = <polygon points={table.points.map(p => `${p.x},${p.y}`).join(' ')} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} filter="url(#dropShadow)" />;
                        const ys = table.points.map(p => p.y); tableHeight = Math.max(...ys) - Math.min(...ys);
                    } else if (table.shape === 'round') {
                        content = <circle r={(table.width || 4) * GRID_SIZE / 2} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} filter="url(#dropShadow)" />;
                    } else {
                        content = <rect x={-tableWidth/2} y={-tableHeight/2} width={tableWidth} height={tableHeight} rx="8" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} filter="url(#dropShadow)" />;
                    }

                    return (
                      <g key={table.id} transform={`translate(${pos.x}, ${pos.y}) rotate(${table.rotation || 0})`}
                        onClick={(e) => { 
                           e.stopPropagation(); 
                           if(readOnly && onTableSelect) { onTableSelect(table); } 
                           else if (!readOnly) { setSelectedId(table.id!); setSelectedType('table'); setInitialObjPos(pos); }
                        }}
                        className={`cursor-pointer ${readOnly ? 'hover:scale-105 transition-transform' : ''}`}
                      >
                         {/* Chairs - Rendered BEFORE table so they appear "under" */}
                         {visualChairs.map((c, i) => (
                             <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(${getChairRotation(table.shape, c.x, c.y, tableWidth, tableHeight)})`}>
                                {/* Seat - No Shadow */}
                                <rect x="-7" y="-7" width="14" height="14" rx="4" fill="#cbd5e1" stroke="none" />
                                {/* Backrest - Visual Indicator of Direction (Bottom of sprite = Back, since we want 0 deg = Facing Up) */}
                                <rect x="-5" y="4" width="10" height="2" rx="1" fill="#94a3b8" />
                             </g>
                         ))}

                         {content}
                         
                         <text dy={4} textAnchor="middle" className="text-[10px] font-bold fill-slate-900 pointer-events-none select-none" style={{ fontSize: `${12/zoom}px`, transform: `rotate(-${table.rotation || 0}deg)` }}>{table.name}</text>
                         
                         {/* Edit Controls */}
                         {!readOnly && isSelected && (
                            <g transform={`translate(0, ${-tableHeight/2 - 25})`} onMouseDown={(e) => { e.stopPropagation(); setIsRotating(true); setDragStart(pos); }} className="cursor-alias"><line x1="0" y1="0" x2="0" y2="25" stroke="#3b82f6" strokeWidth="2" /><circle r={5} fill="white" stroke="#3b82f6" strokeWidth="2"/></g>
                         )}
                      </g>
                    );
                 })}
                 {drawingPoints.length > 0 && <polyline points={[...drawingPoints, mousePos].map(p => `${p.x},${p.y}`).join(' ')} className="fill-none stroke-primary-500 stroke-2 stroke-dasharray-4" />}
              </g>
            </svg>
         </div>
      </div>
    </div>
  );
};