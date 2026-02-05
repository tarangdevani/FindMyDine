
import React from 'react';
import { Download, Wand2, Maximize2 } from 'lucide-react';
import { Button } from '../../UI/Button';

interface GeneratedResultProps {
  generatedImage: string | null;
  generatedPrompt: string;
  isGenerating: boolean;
  onDownload: () => void;
  onViewImage: (url: string) => void;
}

export const GeneratedResult: React.FC<GeneratedResultProps> = ({ 
  generatedImage, generatedPrompt, isGenerating, onDownload, onViewImage 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-bold text-gray-900">Studio Result</h3>
         {generatedImage && (
           <Button size="sm" variant="outline" onClick={onDownload}>
             <Download size={16} className="mr-2" /> Download
           </Button>
         )}
      </div>

      <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden min-h-[400px]">
         {isGenerating ? (
           <div className="text-center p-8">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Developing Photo...</h4>
              <p className="text-gray-500 max-w-xs mx-auto">AI is applying lighting, composition, and texture details to your dish.</p>
           </div>
         ) : generatedImage ? (
           <div className="relative w-full h-full group">
              <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-4">
                 <button 
                   onClick={() => onViewImage(generatedImage)}
                   className="bg-white text-gray-900 p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                 >
                   <Maximize2 size={20} />
                 </button>
              </div>
           </div>
         ) : (
           <div className="text-center text-gray-400">
              <Wand2 size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select an image and style to begin generation</p>
           </div>
         )}
      </div>
      
      {generatedPrompt && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Generated Prompt Used</p>
           <p className="text-sm text-gray-600 italic line-clamp-3 hover:line-clamp-none">{generatedPrompt}</p>
        </div>
      )}
    </div>
  );
};
