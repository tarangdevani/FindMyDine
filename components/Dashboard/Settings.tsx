
import React, { useState, useEffect } from 'react';
import { FoodCategory, FoodAddOn, BillingConfig, PayoutConfig, UserRole } from '../../types';
import { getCategories, getGlobalAddOns } from '../../services/menuService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { CategorySettings } from './Settings/CategorySettings';
import { AddOnSettings } from './Settings/AddOnSettings';
import { BillingSettings } from './Settings/BillingSettings';
import { PayoutSettings } from './Settings/PayoutSettings';

interface SettingsProps {
  userId: string;
  currentUserRole?: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ userId, currentUserRole }) => {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [addOns, setAddOns] = useState<FoodAddOn[]>([]);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | undefined>(undefined);
  const [payoutConfig, setPayoutConfig] = useState<PayoutConfig | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Staff should not see payout or sensitive billing configs
  const isStaff = currentUserRole === UserRole.STAFF;

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setIsLoading(true);
    const [cats, adds, profile] = await Promise.all([
      getCategories(userId),
      getGlobalAddOns(userId),
      getRestaurantProfile(userId)
    ]);
    setCategories(cats);
    setAddOns(adds);
    if (profile?.billingConfig) {
        setBillingConfig(profile.billingConfig);
    }
    if (profile?.payoutConfig) {
        setPayoutConfig(profile.payoutConfig);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
           <p className="text-gray-500">Manage your restaurant preferences and configurations.</p>
        </div>
      </div>

      <CategorySettings 
        userId={userId} 
        categories={categories} 
        setCategories={setCategories} 
        isLoading={isLoading} 
      />

      <AddOnSettings 
        userId={userId} 
        addOns={addOns} 
        setAddOns={setAddOns} 
        isLoading={isLoading} 
      />

      {/* Hide sensitive settings from Staff */}
      {!isStaff && (
        <>
          <BillingSettings 
            userId={userId} 
            initialConfig={billingConfig}
          />

          <PayoutSettings 
            userId={userId} 
            initialConfig={payoutConfig}
          />
        </>
      )}
    </div>
  );
};
