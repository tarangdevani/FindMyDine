
import React from 'react';
import { Building2, UtensilsCrossed, Phone, AlertCircle } from 'lucide-react';

interface BasicInfoProps {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  cuisineInput: string; setCuisineInput: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  errors: any; setErrors: (v: any) => void;
}

export const BasicInfo: React.FC<BasicInfoProps> = ({ name, setName, description, setDescription, cuisineInput, setCuisineInput, phone, setPhone, errors, setErrors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Building2 size={20} className="text-primary-500" /> Basic Information
      </h3>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
            placeholder="e.g. The Golden Spoon"
            value={name}
            onChange={(e) => {
                setName(e.target.value);
                if(errors.name) setErrors((prev: any) => ({...prev, name: undefined}));
            }}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
          <textarea 
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
            placeholder="Tell your guests about your story and ambiance (min 20 chars)..."
            value={description}
            onChange={(e) => {
                setDescription(e.target.value);
                if(errors.description) setErrors((prev: any) => ({...prev, description: undefined}));
            }}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisines <span className="text-red-500">*</span></label>
             <div className="relative">
               <UtensilsCrossed size={18} className="absolute left-3 top-3.5 text-gray-400" />
               <input 
                  type="text" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.cuisine ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="Italian, Pasta, Pizza"
                  value={cuisineInput}
                  onChange={(e) => {
                      setCuisineInput(e.target.value);
                      if(errors.cuisine) setErrors((prev: any) => ({...prev, cuisine: undefined}));
                  }}
               />
             </div>
             {errors.cuisine && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.cuisine}</p>}
             <p className="text-xs text-gray-400 mt-1">Comma separated</p>
          </div>
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
             <div className="relative">
               <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
               <input 
                  type="tel" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-gray-900 outline-none transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'}`}
                  placeholder="+1 234 567 890"
                  value={phone}
                  onChange={(e) => {
                      setPhone(e.target.value);
                      if(errors.phone) setErrors((prev: any) => ({...prev, phone: undefined}));
                  }}
               />
             </div>
             {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {errors.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
