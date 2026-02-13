
import React, { useRef, useState } from 'react';
import { X, Square, Circle, PenTool, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../../UI/Button';
import { TableItem, Point } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface TableFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: TableItem;
  setFormData: React.Dispatch<React.SetStateAction<TableItem>>;
  areas: string[];
  areaSearch: string;
  setAreaSearch: (val: string) => void;
  customPoints: Point[];
  setCustomPoints: (pts: Point[]) => void;
  chairs: Point[];
  isSaving: boolean;
  error: string | null;
  GRID_PIXELS: number;
  getChairRotation: (shape: string, x: number, y: number, w: number, h: number) => number;
}

export const TableFormModal: React.FC<TableFormModalProps> = ({
  isOpen, isEditing, onClose, onSubmit,
  formData, setFormData, areas,
  areaSearch, setAreaSearch,
  customPoints, setCustomPoints,
  chairs, isSaving, error,
  GRID_PIXELS, getChairRotation
}) => {
  const { showToast } = useToast();
  if (!isOpen) return null;

  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  const filteredAreas = areas.filter(a => a.toLowerCase().includes(areaSearch.toLowerCase()));

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

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Validations
      if (!formData.name?.trim()) {
          showToast("Table name is required.", "error");
          return;
      }
      
      // Regex: Allow Alphanumeric and Spaces only
      const nameRegex = /^[a-zA-Z0-9\s]+$/;
      if (!nameRegex.test(formData.name.trim())) {
          showToast("Table name cannot contain special characters (letters, numbers, and spaces only).", "error");
          return;
      }

      if (!formData.area?.trim()) {
          showToast("Area is required.", "error");
          return;
      }
      if (formData.seats <= 0) {
          showToast("Seats must be at least 1.", "error");
          return;
      }
      if ((formData.width || 0) <= 0 || (formData.height || 0) <= 0) {
          showToast("Dimensions must be positive.", "error");
          return;
      }
      if (formData.shape === 'custom' && customPoints.length < 3) {
          showToast("Custom shapes need at least 3 points.", "error");
          return;
      }

      onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in">
          
          {/* LEFT: FORM */}
          <div className="w-full md:w-1/3 p-6 border-r border-gray-100 overflow-y-auto bg-gray-50/50 custom-scrollbar">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Table' : 'Add New Table'}</h3>
                <button onClick={onClose} className="md:hidden p-2"><X size={20}/></button>
             </div>
             
             <form id="tableForm" onSubmit={handleFormSubmit} className="space-y-5">
                {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium">{error}</div>}
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary-500 outline-none bg-white text-gray-900" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Table 1"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Only letters, numbers, and spaces.</p>
                </div>
                
                <div className="relative" ref={areaDropdownRef}>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Area <span className="text-red-500">*</span></label>
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

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setFormData({...formData, shape: 'rectangle'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'rectangle' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><Square size={16} /> Rect</button>
                        <button type="button" onClick={() => setFormData({...formData, shape: 'round'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'round' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><Circle size={16} /> Round</button>
                        <button type="button" onClick={() => setFormData({...formData, shape: 'custom'})} className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 ${formData.shape === 'custom' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200'}`}><PenTool size={16} /> Custom</button>
                    </div>
                </div>

                {(formData.shape === 'rectangle' || formData.shape === 'square') && (<div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Length (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.width} onChange={(e) => setFormData({...formData, width: parseInt(e.target.value)})} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Width (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.height} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})} /></div></div>)}
                {formData.shape === 'round' && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diameter (ft)</label><input type="number" min="2" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.width} onChange={(e) => setFormData({...formData, width: parseInt(e.target.value), height: parseInt(e.target.value)})} /></div>)}
                
                {(formData.shape === 'rectangle' || formData.shape === 'square') && (
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2 text-center">Chairs Per Side</label>
                        <div className="grid grid-cols-3 gap-2 justify-items-center items-center">
                            <div className="col-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.top} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, top: parseInt(e.target.value) || 0}})} /></div>
                            <div className="col-start-1 row-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.left} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, left: parseInt(e.target.value) || 0}})} /></div>
                            <div className="col-start-2 row-start-2 w-12 h-10 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs font-bold text-gray-400">Table</div>
                            <div className="col-start-3 row-start-2"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.right} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, right: parseInt(e.target.value) || 0}})} /></div>
                            <div className="col-start-2 row-start-3"><input type="number" min="0" className="w-12 text-center text-sm p-1 rounded border border-gray-300 bg-white text-gray-900" value={formData.chairConfig?.bottom} onChange={(e) => setFormData({...formData, chairConfig: {...formData.chairConfig!, bottom: parseInt(e.target.value) || 0}})} /></div>
                        </div>
                    </div>
                )}
                
                {(formData.shape === 'round' || formData.shape === 'custom') && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Seats</label><input type="number" min="1" max="20" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-900" value={formData.seats} onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})} /></div>)}
                
                <div className="pt-4 border-t border-gray-200"><Button type="submit" fullWidth isLoading={isSaving}>{isEditing ? 'Save Changes' : 'Create Table'}</Button></div>
             </form>
          </div>

          {/* RIGHT: VISUAL PREVIEW */}
          <div className="w-full md:w-2/3 bg-gray-50 relative flex flex-col">
             <div className="absolute top-4 right-4 flex gap-2 z-10"><button onClick={onClose} className="p-2 bg-white rounded-full shadow hover:bg-gray-50"><X size={20}/></button></div>
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
  );
};
