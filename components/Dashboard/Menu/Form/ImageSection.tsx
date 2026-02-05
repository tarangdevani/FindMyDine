
import React from 'react';
import { Upload, Maximize2 } from 'lucide-react';

interface ImageSectionProps {
  previewUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewImage: (url: string) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ 
  previewUrl, 
  onFileChange, 
  onViewImage 
}) => {
  return (
    <div className="md:col-span-2 flex flex-col items-center">
      <div className="w-full max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Dish Image</label>
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors group">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <Upload size={16} /> Replace
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                <button 
                  type="button"
                  onClick={() => onViewImage(previewUrl)}
                  className="bg-gray-900/50 text-white p-1.5 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </>
          ) : (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-xs font-semibold text-gray-500">Click to upload</span>
              <span className="text-[10px] text-gray-400 mt-1">1:1 Square Recommended</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
