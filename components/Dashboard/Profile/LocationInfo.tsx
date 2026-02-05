
import React from 'react';
import { MapPin, Crosshair, Loader2, Map as MapIcon, AlertCircle } from 'lucide-react';
import { Button } from '../../UI/Button';

interface LocationInfoProps {
  address: string; setAddress: (v: string) => void;
  handleAddressBlur: () => void;
  handleGeoLocation: () => void;
  mapUrl: string;
  isGeocoding: boolean;
  errors: any; setErrors: (v: any) => void;
}

export const LocationInfo: React.FC<LocationInfoProps> = ({ address, setAddress, handleAddressBlur, handleGeoLocation, mapUrl, isGeocoding, errors, setErrors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MapPin size={20} className="text-primary-500" /> Location
      </h3>

      <div className="space-y-5">
         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className={`flex-1 px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                placeholder="123 Culinary Ave, Food City, FC 90210"
                value={address}
                onChange={(e) => {
                    setAddress(e.target.value);
                    if(errors.address) setErrors((prev: any) => ({...prev, address: undefined}));
                }}
                onBlur={handleAddressBlur}
              />
              <Button variant="outline" onClick={handleGeoLocation} title="Use Current Location">
                 <Crosshair size={20} />
              </Button>
            </div>
            {errors.address && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.address}</p>}
         </div>
         
         {/* Visual Map Container */}
         <div className="relative w-full h-64 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden group">
            {mapUrl ? (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapUrl}
                className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                 <MapIcon size={48} className="mb-2 opacity-50" />
                 <span className="text-sm font-medium">Enter an address to preview map</span>
              </div>
            )}
            {isGeocoding && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                 <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
                    <Loader2 size={16} className="animate-spin text-primary-600"/>
                    <span className="text-xs font-bold text-gray-700">Locating...</span>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};
