import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Download, Wand2, RefreshCw, X, Maximize2, Check } from 'lucide-react';
import { Button } from '../UI/Button';
import { GoogleGenAI } from "@google/genai";

const PHOTOGRAPHY_STYLES = [
  {
    category: "1. High-End & Editorial",
    styles: [
      { id: 'dark-moody', name: 'Dark & Moody (Chiaroscuro)', prompt: 'High contrast, deep shadows, and a "fine dining" at night vibe. Chiaroscuro lighting.' },
      { id: 'light-airy', name: 'Light & Airy (High Key)', prompt: 'Very bright, soft shadows, using white backgrounds for a fresh, clean look. High key lighting.' },
      { id: 'minimalist-zen', name: 'Minimalist Zen', prompt: 'Extreme focus on a single element with lots of "negative space" (empty background). Minimalist composition.' },
      { id: 'monochromatic', name: 'Monochromatic', prompt: 'The food, plate, and background all share the same color family. Artistic monochromatic color palette.' },
      { id: 'avant-garde', name: 'Avant-Garde', prompt: 'Artistic, unusual plating, and "floating" ingredients for a futuristic feel. Abstract culinary art.' },
    ]
  },
  {
    category: "2. Natural & Warm",
    styles: [
      { id: 'rustic-farmhouse', name: 'Rustic Farmhouse', prompt: 'Weathered wood, linen napkins, and a "straight from the garden" look. Earthy tones.' },
      { id: 'golden-hour', name: 'Golden Hour', prompt: 'Warm, orange-toned light mimicking the sun setting through a window. Soft lens flare.' },
      { id: 'cottagecore', name: 'Cottagecore', prompt: 'Floral patterns, vintage lace, and a soft, nostalgic, home-cooked feel. Romantic atmosphere.' },
      { id: 'tuscan-sun', name: 'Tuscan Sun', prompt: 'Warm stones, terracotta, olive branches, and bright, direct Mediterranean light.' },
      { id: 'hygge', name: 'Hygge (Cozy)', prompt: 'Soft blankets in the background, steam rising, and warm, dim indoor lighting. Comfort food vibe.' },
    ]
  },
  {
    category: "3. Modern & Commercial",
    styles: [
      { id: 'pop-art', name: 'Pop Art', prompt: 'High saturation, neon colors, and bold, flat backgrounds. Pop-art style, highly instagrammable.' },
      { id: 'industrial-chic', name: 'Industrial Chic', prompt: 'Concrete surfaces, metal accents, and sharp, cold lighting. Modern restaurant aesthetic.' },
      { id: 'cyberpunk', name: 'Cyberpunk Culinary', prompt: 'Dark backgrounds with neon pink/blue "glow" reflections on the food. Futuristic night market vibe.' },
      { id: 'commercial-studio', name: 'Commercial Studio', prompt: 'Perfect, shadowless lighting used for fast-food ads or menus. Clean, appetizing, sharp focus.' },
      { id: 'brutalist', name: 'Brutalist', prompt: 'Hard shadows, raw textures, and sharp, aggressive angles. Bold architectural food photography.' },
    ]
  },
  {
    category: "4. Professional Techniques",
    styles: [
      { id: 'macro-detail', name: 'Macro Detail (Food Porn)', prompt: 'Extreme close-up focusing on textures like melting cheese or glistening sauce. Macro lens f/2.8.' },
      { id: 'flat-lay', name: 'Flat Lay (Top Down)', prompt: 'The camera is directly above the table, creating a 2D "map" of the food. Knolling composition.' },
      { id: 'motion-blur', name: 'Motion Blur', prompt: 'Captures action, like flour being tossed, sauce being poured, or sugar being dusted. High shutter speed freeze or slight blur.' },
      { id: 'bokeh', name: 'Shallow Depth (Bokeh)', prompt: 'The food is sharp, but the background is a beautiful, blurry wash of lights. Aperture f/1.4.' },
      { id: 'cross-section', name: 'Cross-Section', prompt: 'The food is "cut in half" to show the internal layers. Structural culinary detail.' },
    ]
  },
  {
    category: "5. Cultural & Environmental",
    styles: [
      { id: 'street-food', name: 'Street Food Grit', prompt: 'Realistic, slightly messy, shot on a busy city sidewalk background. Authentic urban vibe.' },
      { id: 'scandi', name: 'Scandinavian (Scandi)', prompt: 'Neutral tones, light wood, and functional, clean design. Nordic minimalism.' },
      { id: 'vintage-film', name: 'Vintage Film (Analog)', prompt: 'Slightly grainy, muted colors, looking like a 1970s cookbook. Retro Kodak Portra look.' },
      { id: 'midnight-diner', name: 'Midnight Diner', prompt: 'Moody, neon-lit, rainy window in the background, noir atmosphere. Cinematic night shot.' },
      { id: 'tropical', name: 'Tropical/Island', prompt: 'Bright colors, palm leaf shadows, and vibrant natural lighting. Summer vacation vibe.' },
    ]
  },
  {
    category: "6. Texture & Material Focused",
    styles: [
      { id: 'marble-luxury', name: 'Marble Luxury', prompt: 'Using white or black marble surfaces for an expensive, clean look. High-end plating.' },
      { id: 'rustic-slate', name: 'Rustic Slate', prompt: 'Using dark, textured stone to make the colors of the food "pop." Contrast focused.' },
      { id: 'botanical', name: 'Botanical', prompt: 'Surrounded by fresh raw ingredients, herbs, and vines. Organic garden feel.' },
      { id: 'copper-brass', name: 'Copper & Brass', prompt: 'Using metallic cookware in the frame for a professional kitchen feel. Warm metallic reflections.' },
      { id: 'matte-gloss', name: 'Matte vs. Gloss', prompt: 'High-contrast textures, like a matte plate with a glossy, glazed dish. Tactile photography.' },
    ]
  }
];

export const AIPhotography: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const [viewingImage, setViewingImage] = useState<string | null>(null);

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
      
      // Using gemini-2.5-flash-image for standard generation
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
            // imageSize is NOT supported in gemini-2.5-flash-image
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
            break;
          }
        }
      }
      
      if (!foundImage) {
        alert("AI did not return an image. It might have refused the request.");
      }

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate image. " + (error.message || "Please check permissions."));
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
  };

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-gray-900">AI Food Photography Studio</h2>
         <p className="text-gray-500">Transform raw dish photos into professional editorial masterpieces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
           
           {/* 1. Upload */}
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
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <button 
                          onClick={() => setViewingImage(previewUrl)}
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
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </label>
                 )}
              </div>
           </div>

           {/* 2. Details & Style */}
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
                   onClick={handleGenerate} 
                   isLoading={isGenerating}
                   disabled={!imageFile || !selectedStyleId}
                   className="shadow-xl shadow-primary-500/20"
                 >
                   {isGenerating ? 'Designing Scene...' : 'Generate Photo'}
                 </Button>
              </div>
           </div>
        </div>

        {/* Right Column: Result */}
        <div className="lg:col-span-7">
           <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900">Studio Result</h3>
                 {generatedImage && (
                   <Button size="sm" variant="outline" onClick={handleDownload}>
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
                           onClick={() => setViewingImage(generatedImage)}
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