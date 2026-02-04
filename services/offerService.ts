import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Offer } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return collection(db, "users", uid, subcollection);
};

export const getOffers = async (uid: string): Promise<Offer[]> => {
  try {
    const q = query(getUserSubcollection(uid, "offers"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
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
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(getUserSubcollection(uid, "offers"), newOffer);
    return { id: docRef.id, ...newOffer };
  } catch (error) {
    console.error("Error adding offer:", error);
    return null;
  }
};

export const updateOffer = async (uid: string, offer: Partial<Offer> & { id: string }): Promise<boolean> => {
  try {
    const { id, ...data } = offer;
    await updateDoc(doc(db, "users", uid, "offers", id), data);
    return true;
  } catch (error) {
    console.error("Error updating offer:", error);
    return false;
  }
};

export const deleteOffer = async (uid: string, offerId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid, "offers", offerId));
    return true;
  } catch (error) {
    console.error("Error deleting offer:", error);
    return false;
  }
};