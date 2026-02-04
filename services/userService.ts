
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RestaurantData } from "../types";

export const toggleFavorite = async (userId: string, restaurant: RestaurantData): Promise<boolean> => {
  try {
    const docRef = doc(db, "users", userId, "favorites", restaurant.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return false; // Removed
    } else {
      // Store a snapshot of the restaurant data for easy display
      // Ensure no fields are undefined, as Firestore doesn't support them
      await setDoc(docRef, {
        id: restaurant.id,
        name: restaurant.name || '',
        address: restaurant.address || '',
        imageUrl: restaurant.imageUrl || '',
        rating: restaurant.rating ?? 0,
        ratingCount: restaurant.ratingCount ?? 0,
        cuisine: restaurant.cuisine || '',
        isOpen: restaurant.isOpen ?? false,
        deliveryTime: restaurant.deliveryTime || '',
        distance: restaurant.distance || '',
        logoUrl: restaurant.logoUrl || ''
      });
      return true; // Added
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

export const getUserFavorites = async (userId: string): Promise<RestaurantData[]> => {
  try {
    const q = query(collection(db, "users", userId, "favorites"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RestaurantData);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const checkIsFavorite = async (userId: string, restaurantId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, "users", userId, "favorites", restaurantId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    return false;
  }
};
