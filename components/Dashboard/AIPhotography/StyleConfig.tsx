
import React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '../../UI/Button';
import { PHOTOGRAPHY_STYLES } from './constants';

interface StyleConfigProps {
  categoryName: string;
  setCategoryName: (val: string) => void;
  selectedStyleId: string;
  setSelectedStyleId: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  disabled: boolean;
}

export const StyleConfig: React.FC<StyleConfigProps> = ({ 
  categoryName, setCategoryName, 
  selectedStyleId, setSelectedStyleId, 
  isGenerating, onGenerate, disabled 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Wand2 size={20} className="text-primary-500" /> Configuration
      </h3>

      <div className="space-y-5">
         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dish Name</label>
            <input 
              type="text" 
              placeholder="e.g. Spicy Ramen, Chocolate Cake" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
         </div>

         <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photography Style</label>
            <div className="h-64 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl bg-gray-50 p-2">
               {PHOTOGRAPHY_STYLES.map((group, idx) => (
                 <div key={idx} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 pt-2">{group.category}</h4>
                    <div className="space-y-1">
                       {group.styles.map(style => (
                         <button
                           key={style.id}
                           onClick={() => setSelectedStyleId(style.id)}
                           className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start gap-2 ${
                             selectedStyleId === style.id 
                               ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' 
                               : 'hover:bg-white hover:shadow-sm text-gray-700'
                           }`}
                         >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedStyleId === style.id ? 'border-white' : 'border-gray-400'}`}>
                               {selectedStyleId === style.id && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <span className="font-semibold block">{style.name}</span>
                              <span className={`text-xs block mt-0.5 ${selectedStyleId === style.id ? 'text-primary-100' : 'text-gray-400'}`}>{style.prompt}</span>
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
         </div>
         
         <Button 
           fullWidth 
           size="lg" 
           onClick={onGenerate} 
           isLoading={isGenerating}
           disabled={disabled}
           className="shadow-xl shadow-primary-500/20"
         >
           {isGenerating ? 'Designing Scene...' : 'Generate Photo'}
         </Button>
      </div>
    </div>
  );
};
