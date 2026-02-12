
import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../../context/ToastContext';
import { PHOTOGRAPHY_STYLES } from './AIPhotography/constants';
import { incrementAIUsage } from '../../services/subscriptionService';
import { getRestaurantProfile } from '../../services/restaurantService';

// Child Components
import { SourceImage } from './AIPhotography/SourceImage';
import { StyleConfig } from './AIPhotography/StyleConfig';
import { GeneratedResult } from './AIPhotography/GeneratedResult';

interface AIPhotographyProps {
    userId?: string;
}

export const AIPhotography: React.FC<AIPhotographyProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  useEffect(() => {
      if (userId) {
          getRestaurantProfile(userId).then(p => {
              if (p?.subscription) {
                  setRemainingCredits(Math.max(0, p.subscription.aiPhotosLimit - p.subscription.aiPhotosUsed));
              }
          });
      }
  }, [userId]);

  // Helper to get base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null); // Reset result
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || !selectedStyleId) return;
    if (remainingCredits !== null && remainingCredits <= 0) {
        showToast("You have reached your AI photo limit. Please upgrade your plan.", "error");
        return;
    }

    setIsGenerating(true);

    try {
      const base64Full = await getBase64(imageFile);
      const base64Data = base64Full.split(',')[1];
      const mimeType = imageFile.type;

      // Find style details
      let stylePrompt = "";
      let styleName = "";
      PHOTOGRAPHY_STYLES.forEach(cat => {
        const found = cat.styles.find(s => s.id === selectedStyleId);
        if (found) {
          stylePrompt = found.prompt;
          styleName = found.name;
        }
      });

      const dishContext = categoryName ? `The dish is a ${categoryName}.` : "It is a gourmet dish.";

      // Construct detailed prompt
      const fullPrompt = `Professional food photography of the uploaded dish. ${dishContext} 
      Style: ${styleName}. 
      Visual Instructions: ${stylePrompt}
      Ensure the food looks delicious, hyper-realistic, and commercially viable. High resolution, sharp focus.`;
      
      setGeneratedPrompt(fullPrompt);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: fullPrompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "4:3"
          }
        }
      });

      // Extract image
      let foundImage = false;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const newBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setGeneratedImage(newBase64);
            foundImage = true;
            showToast("Photo generated successfully!", "success");
            
            // Decrement credit if successful and userId exists
            if (userId) {
                const success = await incrementAIUsage(userId);
                if (success && remainingCredits !== null) setRemainingCredits(remainingCredits - 1);
            }
            break;
          }
        }
      }
      
      if (!foundImage) {
        showToast("AI did not return an image. It might have refused the request.", "warning");
      }

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      showToast("Failed to generate image. " + (error.message || "Please check permissions."), "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `findmydine-ai-${selectedStyleId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download started", "success");
  };

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="mb-8 flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Food Photography Studio</h2>
            <p className="text-gray-500">Transform raw dish photos into professional editorial masterpieces.</p>
         </div>
         {remainingCredits !== null && (
             <div className="bg-primary-50 px-4 py-2 rounded-xl text-primary-700 font-bold border border-primary-100">
                 {remainingCredits} Credits Remaining
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
           
           <SourceImage 
             previewUrl={previewUrl} 
             onFileChange={handleImageUpload}
             onViewImage={setViewingImage}
           />

           <StyleConfig 
             categoryName={categoryName}
             setCategoryName={setCategoryName}
             selectedStyleId={selectedStyleId}
             setSelectedStyleId={setSelectedStyleId}
             isGenerating={isGenerating}
             onGenerate={handleGenerate}
             disabled={!imageFile || !selectedStyleId || (remainingCredits !== null && remainingCredits <= 0)}
           />
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7">
           <GeneratedResult 
             generatedImage={generatedImage}
             generatedPrompt={generatedPrompt}
             isGenerating={isGenerating}
             onDownload={handleDownload}
             onViewImage={setViewingImage}
           />
        </div>
      </div>

      {/* Lightbox */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingImage(null)}
        >
          <div className="absolute top-6 right-6 flex gap-4">
             {generatedImage === viewingImage && (
               <button 
                 className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
                 onClick={(e) => { e.stopPropagation(); handleDownload(); }}
               >
                 <Download size={24} />
                 <span className="hidden sm:inline">Download</span>
               </button>
             )}
             <button 
               className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
               onClick={() => setViewingImage(null)}
             >
               <X size={32} />
             </button>
          </div>
          <img 
            src={viewingImage} 
            alt="Full View" 
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
