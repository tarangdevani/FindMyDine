
import React from 'react';
import { List, Map } from 'lucide-react';

interface ViewToolbarProps {
  viewMode: 'grid' | 'map';
  setViewMode: (mode: 'grid' | 'map') => void;
  areas: string[];
  activeArea: string;
  setActiveArea: (area: string) => void;
}

export const ViewToolbar: React.FC<ViewToolbarProps> = ({ viewMode, setViewMode, areas, activeArea, setActiveArea }) => {
  return (
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
      <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            <List size={18} /> List View
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            <Map size={18} /> Floor Plan
          </button>
      </div>
      
      {viewMode === 'map' && areas.length > 1 && (
          <select 
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
            value={activeArea}
            onChange={(e) => setActiveArea(e.target.value)}
          >
            {areas.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
      )}
    </div>
  );
};
