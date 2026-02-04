import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, Save, Wand2, Search, Upload, ChevronDown, Check, DollarSign, Maximize2, Download } from 'lucide-react';
import { Button } from '../UI/Button';
import { MenuItem, FoodCategory, FoodAddOn } from '../../types';
import { getMenu, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, getGlobalAddOns, addGlobalAddOn } from '../../services/menuService';
import { GoogleGenAI } from "@google/genai";
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface MenuManagementProps {
  userId: string;
}

const foodPrompts = [
  // 1-20: DARK & MOODY (FINE DINING)
  "Editorial food photography of [UPLOADED DISH NAME], dark moody atmosphere, chiaroscuro lighting, deep shadows, rustic slate background, 8k resolution.",
  "Professional shot of [UPLOADED DISH NAME], charcoal gray background, side-lit by a single softbox, matte textures, luxury restaurant vibe.",
  "A moody, cinematic close-up of [UPLOADED DISH NAME], dark wood table, vintage silverware, scattered peppercorns, soft rim lighting.",
  "[UPLOADED DISH NAME] on a black ceramic plate, low-key lighting, steam rising, hyper-realistic textures, macro lens.",
  "Fine dining presentation of [UPLOADED DISH NAME], dark emerald green backdrop, golden hour highlights, soft focus background.",
  "Gourmet [UPLOADED DISH NAME], midnight blue linen background, dramatic spotlight, focus on texture, high-end culinary magazine style.",
  "Dark rustic aesthetic for [UPLOADED DISH NAME], cast iron accents, low light, warm amber glow, professional food styling.",
  "[UPLOADED DISH NAME] served on a hand-carved stone platter, moody shadows, minimalist plating, sharp focus on ingredients.",
  "Elegant [UPLOADED DISH NAME], velvet textures in background, soft candlelight, rich contrast, sophisticated plating.",
  "Artisanal [UPLOADED DISH NAME], dark marble surface, dramatic side lighting, macro photography, f/2.8 aperture.",
  "Industrial chic [UPLOADED DISH NAME], concrete background, moody blue tones, sharp highlights, commercial quality.",
  "[UPLOADED DISH NAME] with a dark wine-red background, soft bokeh, silver cutlery, professional lighting, hyper-detailed.",
  "Moody forest-themed [UPLOADED DISH NAME], dark wood, moss accents, soft natural light through trees, organic feel.",
  "Luxury [UPLOADED DISH NAME], gold leaf accents, black silk background, sharp focus, high-speed photography style.",
  "Shadowy close-up of [UPLOADED DISH NAME], glistening textures, steam, dark ceramic bowl, cinematic feel.",
  "Rustic night-time [UPLOADED DISH NAME], warm lantern light, dark wood, cozy atmosphere, high resolution.",
  "[UPLOADED DISH NAME] on a weathered metal tray, moody lighting, smoke swirls, gritty texture, professional edit.",
  "Modern dark aesthetic [UPLOADED DISH NAME], matte black everything, vibrant food colors, sharp contrast, 8k.",
  "Intimate dinner setting with [UPLOADED DISH NAME], dark room, single candle light, soft focus, romantic mood.",
  "Chef's special [UPLOADED DISH NAME], dark kitchen background, stainless steel reflections, professional action shot.",

  // 21-40: BRIGHT & AIRY (CAFE & LIFESTYLE)
  "Bright and airy photography of [UPLOADED DISH NAME], high-key lighting, white marble tabletop, soft morning sunlight.",
  "Fresh [UPLOADED DISH NAME], light linen napkins, pastel tones, natural window light, clean composition.",
  "Vibrant [UPLOADED DISH NAME], Scandinavian design influence, light oak wood, bright shadows, lifestyle magazine style.",
  "Macro shot of [UPLOADED DISH NAME], white-on-white aesthetic, soft diffused glow, fresh herbs, dew drops.",
  "[UPLOADED DISH NAME] served in a bright sunlit kitchen, blurred garden background, cheerful summer vibes.",
  "Minimalist [UPLOADED DISH NAME], white ceramic plate, bright natural light, top-down flat lay, clean and crisp.",
  "Brunch style [UPLOADED DISH NAME], light blue wooden table, coffee cup in background, soft airy feel, f/4.0.",
  "Healthy lifestyle [UPLOADED DISH NAME], bright greens, white background, high-speed photography, sharp and fresh.",
  "Boho-chic [UPLOADED DISH NAME], macrame textures, bright sunlight, plants in background, warm airy tones.",
  "Modern cafe [UPLOADED DISH NAME], marble counter, blurred espresso machine, bright morning light, 4k photorealistic.",
  "Springtime [UPLOADED DISH NAME], floral accents, bright soft lighting, pastel background, delicate plating.",
  "Coastal vibe [UPLOADED DISH NAME], light sand-colored wood, bright blue accents, soft natural light, airy atmosphere.",
  "Clean eating [UPLOADED DISH NAME], minimalist glass bowl, bright white light, focus on raw textures, professional.",
  "Sunny balcony setting with [UPLOADED DISH NAME], bright shadows, city skyline blurred, high-end travel blog style.",
  "Artisan [UPLOADED DISH NAME], light gray stone, bright diffused light, fresh garnishes, crisp resolution.",
  "Morning dew [UPLOADED DISH NAME], bright garden setting, soft bokeh, vibrant colors, macro details.",
  "Modern white studio shot of [UPLOADED DISH NAME], shadowless lighting, ultra-clean, commercial product photography.",
  "Whimsical [UPLOADED DISH NAME], bright lighting, colorful background, soft focus, high-end pastry shop aesthetic.",
  "Farm-fresh [UPLOADED DISH NAME], bright white barn wood, natural light, vibrant ingredients, sharp focus.",
  "Zesty [UPLOADED DISH NAME], bright yellow accents, high-key lighting, fresh and energetic mood.",

  // 41-60: RUSTIC & ORGANIC
  "Rustic farm-to-table [UPLOADED DISH NAME], weathered wooden table, cast iron elements, burlap textures, earth tones.",
  "Authentic [UPLOADED DISH NAME], overhead flat lay, scattered raw ingredients, flour dusting, warm cozy lighting.",
  "Country-style [UPLOADED DISH NAME], afternoon sun through a farmhouse window, copper pots, rich organic textures.",
  "Hearty [UPLOADED DISH NAME], artisanal handmade bowl, dried herbs, soft autumn light, nostalgic mood.",
  "Professional outdoor photography of [UPLOADED DISH NAME], picnic setting, dappled sunlight, vineyard background.",
  "Tuscan kitchen style [UPLOADED DISH NAME], terracotta surfaces, warm golden hour light, olive branch accents.",
  "Vintage [UPLOADED DISH NAME], antique silverware, sepia tones, soft film grain, rustic wooden background.",
  "Winter comfort [UPLOADED DISH NAME], knitted blanket texture, warm fireplace glow, rustic wooden tray, steam.",
  "Harvest [UPLOADED DISH NAME], pumpkin and leaf accents, rustic orange tones, soft natural lighting.",
  "[UPLOADED DISH NAME] on a butcher block, chef's knife, raw spices, rustic workshop vibe, professional lighting.",
  "Traditional [UPLOADED DISH NAME], handmade pottery, linen textures, soft shadows, warm homey feel.",
  "Rustic bakery style [UPLOADED DISH NAME], flour on table, warm light, wooden peel, authentic textures.",
  "Mountain cabin [UPLOADED DISH NAME], heavy wood table, fur texture, firelight, cozy and rustic.",
  "Garden-to-table [UPLOADED DISH NAME], terracotta pots, bright organic light, soil and herb textures.",
  "Old world [UPLOADED DISH NAME], stone wall background, candlelight, rustic pewter plate, cinematic.",
  "[UPLOADED DISH NAME] with sourdough bread, rustic crumbs, warm side lighting, artisan feel.",
  "Cottagecore [UPLOADED DISH NAME], lace tablecloth, wildflowers, soft natural light, rustic charm.",
  "Mediterranean [UPLOADED DISH NAME], blue tiles, rustic wood, bright sun, lemon accents.",
  "Slow-cooked [UPLOADED DISH NAME], bubbling texture, rustic ceramic pot, soft warm lighting.",
  "Market style [UPLOADED DISH NAME], brown paper packaging, rustic crate, natural light, fresh and raw.",

  // 61-80: MODERN & MINIMALIST
  "Minimalist [UPLOADED DISH NAME], solid matte beige background, sharp focus, geometric plating, studio lighting.",
  "Modernist [UPLOADED DISH NAME], top-down view, centered composition, negative space, vibrant colors.",
  "Studio shot of [UPLOADED DISH NAME], floating elements, splash effects, high-speed photography, white background.",
  "[UPLOADED DISH NAME] on a glass surface, reflection visible, soft neon accents, futuristic culinary style.",
  "Symmetry-focused photography of [UPLOADED DISH NAME], industrial concrete background, sharp contrast.",
  "Zen-style [UPLOADED DISH NAME], slate plate, bamboo textures, minimalist lighting, calm atmosphere.",
  "High-tech kitchen [UPLOADED DISH NAME], stainless steel, blue LED accents, sharp professional focus.",
  "Monochromatic [UPLOADED DISH NAME], shades of gray, sharp focus on food color, ultra-modern.",
  "Avant-garde [UPLOADED DISH NAME], creative plating, abstract background, sharp studio lighting.",
  "Pop-art style [UPLOADED DISH NAME], bold colors, flat lighting, high contrast, vibrant and modern.",
  "Geometric [UPLOADED DISH NAME], square plate, linear shadows, minimalist architectural style.",
  "Clean lines [UPLOADED DISH NAME], matte surface, sharp focus, high-end tech aesthetic.",
  "Luxury hotel style [UPLOADED DISH NAME], white glove service feel, minimalist and perfect.",
  "Molecular gastronomy [UPLOADED DISH NAME], smoke bubbles, minimalist glass, professional studio.",
  "[UPLOADED DISH NAME] on a circular stone, soft gray background, minimalist lighting, 8k.",
  "Deconstructed [UPLOADED DISH NAME], artistic arrangement, minimalist white space, sharp focus.",
  "Urban chic [UPLOADED DISH NAME], loft background, brick and metal, modern soft lighting.",
  "Transparent aesthetic [UPLOADED DISH NAME], acrylic surfaces, light refraction, modern look.",
  "Bold [UPLOADED DISH NAME], solid color backdrop, hard shadows, fashion photography style.",
  "Sleek [UPLOADED DISH NAME], polished marble, metallic accents, minimalist professional shot.",

  // 81-100: MACRO & TEXTURE (FOOD PORN)
  "Extreme macro of [UPLOADED DISH NAME], focus on texture, glistening oil, steam, shallow depth of field.",
  "Hyper-detailed [UPLOADED DISH NAME], sauce dripping, crispy golden edges, soft bokeh, vibrant saturation.",
  "Slow-motion style capture of [UPLOADED DISH NAME], melting cheese, steam curls, intricate details.",
  "Close-up of [UPLOADED DISH NAME], focus on garnish, vibrant greens, salt crystals visible.",
  "Indulgent [UPLOADED DISH NAME], rich colors, soft textures, creamy elements, high-end blog quality.",
  "Sensory [UPLOADED DISH NAME], crunch texture visible, steam, warmth, macro lens, f/1.8.",
  "The 'Hero' shot of [UPLOADED DISH NAME], perfect lighting, glistening surfaces, appetizing and rich.",
  "Dripping [UPLOADED DISH NAME], liquid texture, high-speed freeze frame, professional commercial style.",
  "Golden crust [UPLOADED DISH NAME], macro focus on crispiness, warm lighting, blurred background.",
  "Velvety [UPLOADED DISH NAME], focus on smooth texture, soft lighting, indulgent mood.",
  "Sizzling [UPLOADED DISH NAME], focus on bubbles and heat, steam, dark background, macro.",
  "Vibrant spices on [UPLOADED DISH NAME], focus on grain and color, macro photography, sharp.",
  "Layered [UPLOADED DISH NAME], focus on cross-section, structural detail, professional styling.",
  "Juicy [UPLOADED DISH NAME], glistening moisture, bright highlights, mouth-watering macro.",
  "Perfectly glazed [UPLOADED DISH NAME], reflection on sauce, macro focus, studio lighting.",
  "Artisan texture of [UPLOADED DISH NAME], focus on crumb and fiber, natural light, high res.",
  "Frosty/Chilled [UPLOADED DISH NAME], condensation drops, ice crystals, macro focus, cold blue light.",
  "Charred texture of [UPLOADED DISH NAME], focus on grill marks, smoky atmosphere, macro.",
  "Effervescent [UPLOADED DISH NAME], bubbles, textures, macro focus, bright and energetic.",
  "The ultimate close-up of [UPLOADED DISH NAME], 100mm macro lens, every detail visible, masterpiece."
];

export const MenuManagement: React.FC<MenuManagementProps> = ({ userId }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [globalAddOns, setGlobalAddOns] = useState<FoodAddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    categoryId: '',
    isVegetarian: false,
    isAvailable: true,
    addOns: []
  });

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Custom Category Search State
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add-ons Search/Create State
  const [addOnSearch, setAddOnSearch] = useState('');
  const [newAddOnPrice, setNewAddOnPrice] = useState('');
  const [isCreatingAddOn, setIsCreatingAddOn] = useState(false);

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Lightbox State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [menuData, categoryData, addOnData] = await Promise.all([
      getMenu(userId),
      getCategories(userId),
      getGlobalAddOns(userId)
    ]);
    setItems(menuData);
    setCategories(categoryData);
    setGlobalAddOns(addOnData);
    setIsLoading(false);
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        ...item, 
        addOns: item.addOns || []
      });
      setPreviewUrl(item.imageUrl || '');
      // Pre-fill search if category exists
      const catName = categories.find(c => c.id === item.categoryId)?.name || '';
      setCategorySearch(catName);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: 0,
        description: '',
        imageUrl: '',
        categoryId: '',
        isVegetarian: false,
        isAvailable: true,
        addOns: []
      });
      setPreviewUrl('');
      setCategorySearch('');
    }
    setImageFile(null);
    setAddOnSearch('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // --- Image Handling ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAIEnhance = async () => {
    if (!imageFile && !previewUrl) return;

    setIsGeneratingAI(true);

    try {
      // 1. Convert Image to Base64
      let base64Data = '';
      let mimeType = '';

      if (imageFile) {
        // From new file
        const reader = new FileReader();
        base64Data = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
        mimeType = imageFile.type;
        base64Data = base64Data.split(',')[1];
      } else if (previewUrl) {
        // From existing URL - fetch blob and convert
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        mimeType = blob.type;
        const reader = new FileReader();
        base64Data = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(blob);
        });
        base64Data = base64Data.split(',')[1];
      }

      // 2. Call Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dishName = formData.name.trim() || "Delicious Dish";
      const promptTemplate = foodPrompts[Math.floor(Math.random() * foodPrompts.length)];
      const finalPrompt = promptTemplate.replace(/\[UPLOADED DISH NAME\]/g, dishName);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: finalPrompt }
          ]
        }
      });

      // 3. Process Response
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const newBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          
          // Convert back to File for upload flow
          const res = await fetch(newBase64);
          const blob = await res.blob();
          const newFile = new File([blob], "ai_enhanced.png", { type: part.inlineData.mimeType });
          
          setImageFile(newFile);
          setPreviewUrl(newBase64);
          break;
        }
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      
      // Handle permission errors
      if (window.aistudio && (error.message?.includes("Requested entity was not found") || error.status === 403)) {
          await window.aistudio.openSelectKey();
          alert("API Key updated. Please try enhancing again.");
      } else {
        alert("Failed to generate AI image. Please try again.");
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // --- Category Logic ---

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSelectCategory = (cat: FoodCategory) => {
    setFormData({ ...formData, categoryId: cat.id });
    setCategorySearch(cat.name);
    setIsCategoryDropdownOpen(false);
  };

  const handleCreateCategory = async () => {
    if (!categorySearch.trim()) return;
    setIsLoading(true);
    const newCat = await addCategory(userId, categorySearch.trim());
    if (newCat) {
      setCategories(prev => [...prev, newCat]);
      handleSelectCategory(newCat);
    }
    setIsLoading(false);
  };

  // --- Add-ons Logic ---

  const filteredAddOns = globalAddOns.filter(a => 
    a.name.toLowerCase().includes(addOnSearch.toLowerCase())
  );
  
  const toggleAddOn = (addon: FoodAddOn) => {
    const currentAddOns = formData.addOns || [];
    const exists = currentAddOns.some(a => a.id === addon.id);
    
    if (exists) {
      setFormData(prev => ({
        ...prev,
        addOns: prev.addOns?.filter(a => a.id !== addon.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        addOns: [...currentAddOns, addon]
      }));
    }
  };

  const handleCreateAddOn = async () => {
    if (!addOnSearch.trim() || !newAddOnPrice) return;
    const price = parseFloat(newAddOnPrice);
    if (isNaN(price)) return;

    setIsCreatingAddOn(true);
    const newAddOn = await addGlobalAddOn(userId, addOnSearch.trim(), price);
    if (newAddOn) {
      setGlobalAddOns(prev => [...prev, newAddOn]);
      toggleAddOn(newAddOn);
      setAddOnSearch('');
      setNewAddOnPrice('');
    }
    setIsCreatingAddOn(false);
  };

  // --- Submission ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let finalImageUrl = formData.imageUrl;

      // Upload Image if changed
      if (imageFile) {
        const storageRef = ref(storage, `menu-items/${userId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const selectedCat = categories.find(c => c.id === formData.categoryId);
      const cleanFormData = {
        ...formData,
        imageUrl: finalImageUrl,
        categoryName: selectedCat?.name
      };

      if (editingItem && editingItem.id) {
         const success = await updateMenuItem(userId, { ...cleanFormData, id: editingItem.id });
         if (success) {
           setItems(prev => prev.map(item => item.id === editingItem.id ? { ...cleanFormData, id: editingItem.id! } : item));
           handleCloseModal();
         }
      } else {
         const newItem = await addMenuItem(userId, cleanFormData);
         if (newItem) {
           setItems(prev => [...prev, newItem]);
           handleCloseModal();
         }
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Error saving item. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const success = await deleteMenuItem(userId, id);
      if (success) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!viewingImage) return;
    try {
      const response = await fetch(viewingImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dish-image.jpg'; // Default name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      window.open(viewingImage, '_blank');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
           <p className="text-gray-500">Organize your dishes, pricing, and availability.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
           <Plus size={20} className="mr-2" /> Add New Item
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
             <ImageIcon size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">Your menu is empty</h3>
           <p className="text-gray-500 mb-6">Start by adding delicious items to your menu.</p>
           <Button variant="outline" onClick={() => handleOpenModal()}>Add Your First Item</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {items.map((item) => (
             <div key={item.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden group flex flex-col">
                <div className="relative h-48 bg-gray-100 cursor-pointer overflow-hidden" onClick={(e) => {
                    if (item.imageUrl) setViewingImage(item.imageUrl);
                }}>
                   {item.imageUrl ? (
                     <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                       <ImageIcon size={32} />
                     </div>
                   )}
                   <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-primary-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                   {!item.isAvailable && (
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold">Unavailable</span>
                     </div>
                   )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                      <span className="font-bold text-primary-600">${item.price}</span>
                   </div>
                   <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                   
                   {item.addOns && item.addOns.length > 0 && (
                     <div className="mb-3 flex flex-wrap gap-1">
                       {item.addOns.slice(0, 3).map((addon, i) => (
                         <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                           {addon.name} (+${addon.price})
                         </span>
                       ))}
                       {item.addOns.length > 3 && <span className="text-[10px] text-gray-400">+{item.addOns.length - 3} more</span>}
                     </div>
                   )}

                   <div className="flex items-center gap-2 mt-auto">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                        {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                      </span>
                      {item.isVegetarian && (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100">Veg</span>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                 <h3 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                 <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Upload - Smaller Height */}
                    <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Dish Image</label>
                       <div className="relative h-40 w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors group">
                          {previewUrl ? (
                            <>
                              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
                                  <Upload size={16} /> Replace
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <button 
                                  type="button" 
                                  onClick={handleAIEnhance}
                                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                  disabled={isGeneratingAI}
                                >
                                  {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                  AI
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setViewingImage(previewUrl)}
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
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                             </label>
                          )}
                       </div>
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
                       <input 
                         type="text" 
                         required
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                         placeholder="e.g. Truffle Pasta"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    
                    <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                       <input 
                         type="number" 
                         required
                         min="0"
                         step="0.01"
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                         placeholder="0.00"
                         value={formData.price}
                         onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                       />
                    </div>

                    <div className="relative" ref={dropdownRef}>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                       <div 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:within:ring-4 focus-within:ring-primary-100 transition-all bg-white flex items-center justify-between cursor-pointer"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                       >
                         <input 
                           type="text" 
                           className="flex-1 outline-none bg-transparent cursor-pointer"
                           placeholder="Select or Search Category"
                           value={categorySearch}
                           onChange={(e) => {
                             setCategorySearch(e.target.value);
                             setIsCategoryDropdownOpen(true);
                           }}
                           readOnly={false}
                         />
                         <ChevronDown size={18} className="text-gray-400" />
                       </div>
                       
                       {isCategoryDropdownOpen && (
                         <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-60 overflow-y-auto">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map(cat => (
                                <div 
                                  key={cat.id} 
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                                  onClick={() => handleSelectCategory(cat)}
                                >
                                  <span className="text-gray-700 font-medium group-hover:text-primary-600">{cat.name}</span>
                                  {formData.categoryId === cat.id && <Check size={16} className="text-primary-600" />}
                                </div>
                              ))
                            ) : (
                              <div className="p-2">
                                <p className="px-2 py-2 text-sm text-gray-500">No category found.</p>
                                <button 
                                  type="button"
                                  onClick={handleCreateCategory}
                                  className="w-full flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors"
                                >
                                  <Plus size={16} /> Add "{categorySearch}"
                                </button>
                              </div>
                            )}
                         </div>
                       )}
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                       <textarea 
                         required
                         rows={3}
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all bg-white"
                         placeholder="Describe the dish ingredients and taste..."
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                       />
                    </div>

                    
                    {/* Add-ons / Toppings */}
                    <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">Applicable Add-ons / Toppings</label>
                       
                       {/* Add-ons Search Bar - Enforced White Theme */}
                       <div className="relative mb-3">
                         <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                         <input 
                           type="text" 
                           placeholder="Search to add toppings..." 
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all placeholder-gray-400"
                           value={addOnSearch}
                           onChange={(e) => setAddOnSearch(e.target.value)}
                         />
                       </div>

                       {/* Search Results / Global List - ONLY visible when searching */}
                       {addOnSearch.trim() && (
                          <div className="absolute z-10 w-full max-w-lg bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden mt-1">
                             <div className="max-h-60 overflow-y-auto p-2">
                               {/* Create New Item Option */}
                               {!filteredAddOns.some(a => a.name.toLowerCase() === addOnSearch.toLowerCase()) && (
                                 <div className="p-3 rounded-lg bg-primary-50 flex items-center gap-3 mb-2">
                                    <span className="flex-1 font-medium text-gray-700 text-sm">Create "{addOnSearch}"</span>
                                    <div className="flex items-center gap-2">
                                      <div className="relative w-20">
                                        <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                        <input 
                                          type="number" 
                                          placeholder="0.00" 
                                          min="0" 
                                          step="0.01"
                                          className="w-full pl-5 pr-2 py-1 text-sm rounded border border-gray-300 outline-none bg-white text-gray-900"
                                          value={newAddOnPrice}
                                          onChange={(e) => setNewAddOnPrice(e.target.value)}
                                        />
                                      </div>
                                      <Button size="sm" onClick={handleCreateAddOn} isLoading={isCreatingAddOn} disabled={!newAddOnPrice}>
                                        Add
                                      </Button>
                                    </div>
                                 </div>
                               )}

                               {filteredAddOns.length > 0 ? (
                                 filteredAddOns.map(addon => {
                                   const isSelected = formData.addOns?.some(a => a.id === addon.id);
                                   return (
                                     <div 
                                       key={addon.id} 
                                       onClick={() => toggleAddOn(addon)}
                                       className="cursor-pointer flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0"
                                     >
                                       <div className="flex items-center gap-3">
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                            {isSelected && <Check size={10} className="text-white"/>}
                                          </div>
                                          <span className="text-sm font-medium text-gray-700">{addon.name}</span>
                                       </div>
                                       <span className="text-xs font-bold text-gray-500">+${addon.price.toFixed(2)}</span>
                                     </div>
                                   );
                                 })
                               ) : (
                                  !newAddOnPrice && <p className="text-center text-xs text-gray-400 py-2">No existing add-ons found.</p>
                               )}
                             </div>
                          </div>
                       )}

                       {/* Applied Add-ons - Section below search */}
                       <div className="mt-4">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Applied Add-ons</label>
                          <div className="flex flex-wrap gap-2">
                             {formData.addOns && formData.addOns.length > 0 ? (
                               formData.addOns.map(addon => (
                                 <div key={addon.id} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-primary-50 border border-primary-100 rounded-lg text-primary-700 text-sm font-medium">
                                    <span>{addon.name}</span>
                                    <span className="text-xs bg-white/50 px-1.5 rounded text-primary-800 font-bold">+${addon.price}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => toggleAddOn(addon)}
                                      className="p-0.5 hover:bg-primary-200 rounded text-primary-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                 </div>
                               ))
                             ) : (
                               <p className="text-sm text-gray-400 italic">No add-ons selected.</p>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Styled Checkboxes */}
                    <div className="md:col-span-2 flex gap-8 pt-2">
                       <label className="flex items-center gap-3 cursor-pointer group select-none">
                          <div className="relative">
                             <input 
                               type="checkbox" 
                               className="peer sr-only"
                               checked={formData.isVegetarian}
                               onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                             />
                             <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                               <Check size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                             </div>
                          </div>
                          <span className="text-gray-700 font-medium group-hover:text-green-600 transition-colors">Vegetarian</span>
                       </label>

                       <label className="flex items-center gap-3 cursor-pointer group select-none">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="peer sr-only" 
                              checked={formData.isAvailable}
                              onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </div>
                          <span className="text-gray-700 font-medium group-hover:text-primary-600 transition-colors">Available Now</span>
                       </label>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                    <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                    <Button type="submit" isLoading={isSaving} disabled={!formData.categoryId}>
                      <Save size={18} className="mr-2" /> Save Item
                    </Button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Lightbox / Image Popup */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingImage(null)}
        >
          <div className="absolute top-6 right-6 flex gap-4">
             <button 
               className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
               onClick={(e) => { e.stopPropagation(); handleDownloadImage(); }}
             >
               <Download size={24} />
               <span className="hidden sm:inline">Download</span>
             </button>
             <button 
               className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
               onClick={() => setViewingImage(null)}
             >
               <X size={32} />
             </button>
          </div>
          
          <img 
            src={viewingImage} 
            alt="Full view" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </div>
  );
};