
import React from 'react';
import { Camera, Upload } from 'lucide-react';

interface BrandingInfoProps {
  coverPreview: string;
  logoPreview: string;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => void;
}

export const BrandingInfo: React.FC<BrandingInfoProps> = ({ coverPreview, logoPreview, handleImageChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
       <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
         <Camera size={20} className="text-primary-500" /> Branding
       </h3>

       <div className="space-y-6">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
             <div className="relative aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group">
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                       <div className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white">
                          <Upload size={16} /> Change
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                    </label>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                     <Upload size={24} className="text-gray-400 mb-2" />
                     <span className="text-xs font-semibold text-gray-500">Upload Cover</span>
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                  </label>
                )}
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
             <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group shrink-0">
                   {logoPreview ? (
                     <>
                       <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                       <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={16} className="text-white" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                       </label>
                     </>
                   ) : (
                     <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload size={16} className="text-gray-400" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                     </label>
                   )}
                </div>
                <p className="text-xs text-gray-500">Recommended size: 500x500px. JPG or PNG.</p>
             </div>
          </div>
       </div>
    </div>
  );
};
