
import React from 'react';
import { Camera, Upload, RefreshCw, Maximize2 } from 'lucide-react';

interface SourceImageProps {
  previewUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewImage: (url: string) => void;
}

export const SourceImage: React.FC<SourceImageProps> = ({ previewUrl, onFileChange, onViewImage }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Camera size={20} className="text-primary-500" /> Source Image
      </h3>
      
      <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors group">
         {previewUrl ? (
           <>
             <img src={previewUrl} alt="Source" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <RefreshCw size={18} /> Replace
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                <button 
                  onClick={() => onViewImage(previewUrl)}
                  className="bg-gray-900/50 text-white p-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Maximize2 size={20} />
                </button>
             </div>
           </>
         ) : (
           <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
              <Upload size={32} className="text-gray-400 mb-3" />
              <span className="text-sm font-semibold text-gray-500">Upload Raw Dish Photo</span>
              <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG</p>
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
           </label>
         )}
      </div>
    </div>
  );
};
