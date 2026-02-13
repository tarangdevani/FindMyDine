
import firebase from "firebase/compat/app";
import { db } from "../lib/firebase";
import { Offer, OfferUsage } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return db.collection("users").doc(uid).collection(subcollection);
};

export const getOffers = async (uid: string): Promise<Offer[]> => {
  try {
    const snapshot = await getUserSubcollection(uid, "offers").orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
};

export const addOffer = async (uid: string, offer: Omit<Offer, 'id' | 'createdAt' | 'usageCount'>): Promise<Offer | null> => {
  try {
    const newOffer: Omit<Offer, 'id'> = {
      ...offer,
      usageCount: 0,
      totalDiscountGiven: 0,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await getUserSubcollection(uid, "offers").add(newOffer);
    return { id: docRef.id, ...newOffer };
  } catch (error) {
    console.error("Error adding offer:", error);
    return null;
  }
};

export const updateOffer = async (uid: string, offer: Partial<Offer> & { id: string }): Promise<boolean> => {
  try {
    const { id, ...data } = offer;
    await getUserSubcollection(uid, "offers").doc(id).update(data);
    return true;
  } catch (error) {
    console.error("Error updating offer:", error);
    return false;
  }
};

export const deleteOffer = async (uid: string, offerId: string): Promise<boolean> => {
  try {
    await getUserSubcollection(uid, "offers").doc(offerId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting offer:", error);
    return false;
  }
};

// --- Usage Tracking ---

export const trackOfferUsage = async (
  restaurantId: string, 
  offerId: string, 
  usageData: { userId: string; userName: string; orderId: string; discountAmount: number }
): Promise<boolean> => {
  try {
    // 1. Add record to usage subcollection
    const usageRef = db.collection("users").doc(restaurantId).collection("offers").doc(offerId).collection("usage");
    await usageRef.add({
      ...usageData,
      usedAt: new Date().toISOString()
    });

    // 2. Update stats on the offer document
    const offerRef = db.collection("users").doc(restaurantId).collection("offers").doc(offerId);
    await offerRef.update({
      usageCount: firebase.firestore.FieldValue.increment(1),
      totalDiscountGiven: firebase.firestore.FieldValue.increment(usageData.discountAmount)
    });

    return true;
  } catch (error) {
    console.error("Error tracking usage:", error);
    return false;
  }
};

export const getOfferUsageHistory = async (restaurantId: string, offerId: string): Promise<OfferUsage[]> => {
  try {
    const usageRef = db.collection("users").doc(restaurantId).collection("offers").doc(offerId).collection("usage");
    const snapshot = await usageRef.orderBy("usedAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferUsage));
  } catch (error) {
    console.error("Error fetching usage history:", error);
    return [];
  }
};
