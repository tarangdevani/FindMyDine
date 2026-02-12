
import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Loader2, Download, X, Maximize2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { MenuItem, FoodCategory, FoodAddOn } from '../../types';
import { getMenu, getCategories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, getGlobalAddOns, addGlobalAddOn } from '../../services/menuService';
import { deleteFileFromUrl } from '../../services/storageService';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '../../context/ToastContext';

// Child Components
import { MenuItemCard } from './Menu/MenuItemCard';
import { MenuFormModal } from './Menu/MenuFormModal';

interface MenuManagementProps {
  userId: string;
  isReadOnly?: boolean;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ userId, isReadOnly }) => {
  const { showToast } = useToast();
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

  // Add-ons Search/Create State
  const [addOnSearch, setAddOnSearch] = useState('');
  const [newAddOnPrice, setNewAddOnPrice] = useState('');
  const [isCreatingAddOn, setIsCreatingAddOn] = useState(false);

  // Lightbox State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
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
    if (isReadOnly) {
        showToast("Free Plan is Read-Only. Upgrade to edit menu.", "warning");
        return;
    }
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

  // --- Category Logic ---

  const handleCreateCategory = async () => {
    if (!categorySearch.trim()) return;
    setIsLoading(true);
    try {
      const newCat = await addCategory(userId, categorySearch.trim());
      if (newCat) {
        setCategories(prev => [...prev, newCat]);
        setFormData({ ...formData, categoryId: newCat.id });
        setCategorySearch(newCat.name);
        showToast(`Category "${newCat.name}" created`, 'success');
      }
    } catch (error) {
      showToast('Failed to create category', 'error');
    }
    setIsLoading(false);
  };

  // --- Add-ons Logic ---
  
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
    try {
      const newAddOn = await addGlobalAddOn(userId, addOnSearch.trim(), price);
      if (newAddOn) {
        setGlobalAddOns(prev => [...prev, newAddOn]);
        toggleAddOn(newAddOn);
        setAddOnSearch('');
        setNewAddOnPrice('');
        showToast(`Add-on "${newAddOn.name}" created`, 'success');
      }
    } catch (error) {
      showToast('Failed to create add-on', 'error');
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
        // If editing, delete the old image first
        if (editingItem && editingItem.imageUrl) {
            await deleteFileFromUrl(editingItem.imageUrl);
        }

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
           showToast('Menu item updated successfully', 'success');
         } else {
           throw new Error('Update failed');
         }
      } else {
         const newItem = await addMenuItem(userId, cleanFormData);
         if (newItem) {
           setItems(prev => [...prev, newItem]);
           handleCloseModal();
           showToast('Menu item added successfully', 'success');
         } else {
           throw new Error('Create failed');
         }
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
      showToast("Error saving item. Please try again.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
        showToast("Free Plan is Read-Only.", "warning");
        return;
    }
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        // Find item to get image URL for deletion
        const itemToDelete = items.find(i => i.id === id);
        if (itemToDelete && itemToDelete.imageUrl) {
            await deleteFileFromUrl(itemToDelete.imageUrl);
        }

        const success = await deleteMenuItem(userId, id);
        if (success) {
          setItems(prev => prev.filter(item => item.id !== id));
          showToast('Item deleted', 'success');
        } else {
          showToast('Failed to delete item', 'error');
        }
      } catch (error) {
        showToast('Error deleting item', 'error');
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
      showToast('Image downloaded', 'success');
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
        <Button onClick={() => handleOpenModal()} disabled={isReadOnly} className={isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}>
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
           <Button variant="outline" onClick={() => handleOpenModal()} disabled={isReadOnly}>Add Your First Item</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {items.map((item) => (
             <MenuItemCard 
               key={item.id}
               item={item}
               categories={categories}
               onEdit={handleOpenModal}
               onDelete={handleDelete}
               onViewImage={setViewingImage}
             />
           ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <MenuFormModal 
        isOpen={isModalOpen}
        isEditing={!!editingItem}
        isLoading={isSaving}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        globalAddOns={globalAddOns}
        
        previewUrl={previewUrl}
        onFileChange={handleImageUpload}
        onViewImage={setViewingImage}

        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        onCreateCategory={handleCreateCategory}

        addOnSearch={addOnSearch}
        setAddOnSearch={setAddOnSearch}
        newAddOnPrice={newAddOnPrice}
        setNewAddOnPrice={setNewAddOnPrice}
        isCreatingAddOn={isCreatingAddOn}
        onCreateAddOn={handleCreateAddOn}
        onToggleAddOn={toggleAddOn}
      />

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
