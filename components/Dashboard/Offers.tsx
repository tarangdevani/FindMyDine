
import React, { useState, useEffect } from 'react';
import { Offer, MenuItem } from '../../types';
import { getOffers, addOffer, updateOffer, deleteOffer } from '../../services/offerService';
import { getMenu } from '../../services/menuService';
import { useToast } from '../../context/ToastContext';

// Child Components
import { OffersHeader } from './Offers/OffersHeader';
import { OfferList } from './Offers/OfferList';
import { OfferFormModal } from './Offers/OfferFormModal';
import { OfferStatsModal } from './Offers/OfferStatsModal';

interface OffersProps {
  userId: string;
}

export const Offers: React.FC<OffersProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offer' | 'coupon'>('offer');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Stats Modal State
  const [statsOffer, setStatsOffer] = useState<Offer | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Offer>>({
    type: 'offer',
    code: '',
    title: '',
    description: '',
    rewardType: 'discount',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 0,
    minSpend: 0,
    maxUsage: 0,
    globalBudget: 0,
    applicableItemIds: [],
    freeItemId: '',
    triggerItemId: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    isActive: true,
    termsAndConditions: ''
  });

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [fetchedOffers, fetchedMenu] = await Promise.all([
        getOffers(userId),
        getMenu(userId)
      ]);
      setOffers(fetchedOffers);
      setMenuItems(fetchedMenu);
      setIsLoading(false);
    };
    init();
  }, [userId]);

  const handleOpenModal = (type: 'offer' | 'coupon', offer?: Offer) => {
    if (offer) {
      setEditingId(offer.id!);
      setFormData(offer);
    } else {
      setEditingId(null);
      setFormData({
        type: type,
        code: type === 'coupon' ? '' : `OFFER-${Date.now().toString().slice(-6)}`,
        title: '',
        description: '',
        rewardType: 'discount',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 0,
        minSpend: 0,
        maxUsage: 0,
        globalBudget: 0,
        applicableItemIds: [],
        freeItemId: '',
        triggerItemId: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        isActive: true,
        termsAndConditions: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        showToast("Please enter a title", "warning");
        return;
    }
    if (formData.type === 'coupon' && !formData.code) {
        showToast("Coupon code is required", "warning");
        return;
    }
    if (formData.rewardType === 'free_item' && !formData.freeItemId) {
      showToast("Please select a free item to gift.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateOffer(userId, { ...formData, id: editingId } as any);
        showToast("Offer updated successfully", "success");
      } else {
        await addOffer(userId, formData as any);
        showToast("Offer created successfully", "success");
      }
      // Refresh
      const data = await getOffers(userId);
      setOffers(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save offer", error);
      showToast("Failed to save offer", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this?")) {
      try {
        await deleteOffer(userId, id);
        setOffers(prev => prev.filter(o => o.id !== id));
        showToast("Offer deleted", "info");
      } catch (error) {
        showToast("Failed to delete offer", "error");
      }
    }
  };

  const toggleStatus = async (offer: Offer) => {
    const newStatus = !offer.isActive;
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: newStatus } : o));
    try {
        await updateOffer(userId, { id: offer.id!, isActive: newStatus });
        showToast(`Offer ${newStatus ? 'activated' : 'deactivated'}`, 'info');
    } catch (error) {
        showToast("Failed to update status", "error");
        setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !newStatus } : o));
    }
  };

  const filteredOffers = offers.filter(o => o.type === activeTab);

  return (
    <div className="animate-fade-in-up pb-10">
      
      <OffersHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddClick={() => handleOpenModal(activeTab)}
      />

      <OfferList 
        offers={filteredOffers}
        isLoading={isLoading}
        activeTab={activeTab}
        onEdit={(offer) => handleOpenModal(offer.type, offer)}
        onDelete={handleDelete}
        onToggleStatus={toggleStatus}
        onAddClick={() => handleOpenModal(activeTab)}
        onViewStats={(offer) => setStatsOffer(offer)}
      />

      <OfferFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
        isEditing={!!editingId}
        menuItems={menuItems}
      />

      <OfferStatsModal 
        isOpen={!!statsOffer}
        onClose={() => setStatsOffer(null)}
        offer={statsOffer}
        userId={userId}
      />

    </div>
  );
};
