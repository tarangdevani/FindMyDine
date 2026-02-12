
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RestaurantProfile, SubscriptionPlan, SubscriptionDetails } from "../types";
import { recordTransaction } from "./walletService";

interface PlanConfig {
  price: number;
  name: string;
  photos: number;
  write: boolean;
  deleteReview: boolean;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: { price: 0, name: 'Free', photos: 0, write: false, deleteReview: false },
  base: { price: 15, name: 'Base', photos: 0, write: true, deleteReview: false },
  pro: { price: 20, name: 'Pro', photos: 30, write: true, deleteReview: false },
  ultra: { price: 25, name: 'Ultra', photos: 50, write: true, deleteReview: true }
};

export const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,    // 1 Month: 0% off
  3: 0.05, // 3 Months: 5% off
  6: 0.10, // 6 Months: 10% off
  12: 0.15 // 1 Year: 15% off
};

export const calculatePlanPrice = (plan: string, months: number): { total: number; savings: number; perMonth: number } => {
  const config = PLAN_CONFIGS[plan];
  if (!config) return { total: 0, savings: 0, perMonth: 0 };

  const basePrice = config.price;
  const discount = DURATION_DISCOUNTS[months] || 0;
  
  const rawTotal = basePrice * months;
  const total = rawTotal * (1 - discount);
  
  return {
    total,
    savings: rawTotal - total,
    perMonth: total / months
  };
};

export const purchaseSubscription = async (
  userId: string, 
  plan: SubscriptionPlan, 
  months: number, 
  paymentId?: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data() as RestaurantProfile;
    const currentSub = userData.subscription;
    
    const now = new Date();
    let newStartDate = now;
    let newExpiryDate = new Date(now);
    
    // Recharge Logic: If current plan is valid and matches requested plan (or is just an extension), add to expiry
    if (currentSub && currentSub.isValid && new Date(currentSub.expiryDate) > now) {
        // We are extending. Start date effectively remains "now" for calculation, but we push expiry.
        // Actually, for "Recharge", we append time to the END of current expiry.
        const currentExpiry = new Date(currentSub.expiryDate);
        newStartDate = currentExpiry; // Starts when old one ends
        newExpiryDate = new Date(currentExpiry);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + months);
    } else {
        // New Plan or Expired
        newExpiryDate.setMonth(newExpiryDate.getMonth() + months);
    }

    const { total } = calculatePlanPrice(plan, months);

    const newSubscription: SubscriptionDetails = {
        plan: plan,
        startDate: newStartDate.toISOString(),
        expiryDate: newExpiryDate.toISOString(),
        isValid: true,
        aiPhotosLimit: PLAN_CONFIGS[plan].photos, // Refresh limit based on new plan
        aiPhotosUsed: 0, // Reset usage on new purchase
        autoRenew: false
    };

    // Update User Profile
    await updateDoc(userRef, {
        subscription: newSubscription
    });

    // Also update public listing for visibility filtering
    try {
        await updateDoc(doc(db, "restaurants", userId), {
            subscriptionPlan: plan
        });
    } catch (e) {
        // ignore if doc doesn't exist yet
    }

    // Record Transaction (Income for Platform)
    if (total > 0) {
        await recordTransaction({
            restaurantId: 'platform', // Or keep as userId but mark type clearly
            type: 'subscription',
            amount: total,
            status: 'completed',
            createdAt: now.toISOString(),
            description: `${PLAN_CONFIGS[plan].name} Plan - ${months} Month(s)`,
            metadata: {
                subscriptionPlan: plan,
                subscriptionDuration: `${months} months`,
                customerName: userData.restaurantName || userData.displayName
            }
        });
    }

    return true;
  } catch (error) {
    console.error("Subscription Purchase Failed:", error);
    return false;
  }
};

export const checkSubscriptionValidity = (sub?: SubscriptionDetails): boolean => {
    if (!sub) return false;
    // Free plan is valid but has restrictions handled by logic, strictly checking date/validity here
    // However, Free plan usually doesn't expire. 
    if (sub.plan === 'free') return true; 
    
    const now = new Date();
    const expiry = new Date(sub.expiryDate);
    return sub.isValid && expiry > now;
};

export const incrementAIUsage = async (userId: string): Promise<boolean> => {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        const data = snap.data() as RestaurantProfile;
        
        if (!data.subscription) return false;
        
        const currentUsed = data.subscription.aiPhotosUsed || 0;
        const limit = data.subscription.aiPhotosLimit || 0;
        
        if (currentUsed >= limit) return false;
        
        await updateDoc(userRef, {
            "subscription.aiPhotosUsed": currentUsed + 1
        });
        return true;
    } catch (e) {
        return false;
    }
};
