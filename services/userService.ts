
import { db } from "../lib/firebase";
import { RestaurantData } from "../types";

export const toggleFavorite = async (userId: string, restaurant: RestaurantData): Promise<boolean> => {
  try {
    const docRef = db.collection("users").doc(userId).collection("favorites").doc(restaurant.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      await docRef.delete();
      return false; // Removed
    } else {
      // Store a snapshot of the restaurant data for easy display
      // Ensure no fields are undefined, as Firestore doesn't support them
      await docRef.set({
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
    const snapshot = await db.collection("users").doc(userId).collection("favorites").get();
    return snapshot.docs.map(doc => doc.data() as RestaurantData);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const checkIsFavorite = async (userId: string, restaurantId: string): Promise<boolean> => {
  try {
    const docRef = db.collection("users").doc(userId).collection("favorites").doc(restaurantId);
    const docSnap = await docRef.get();
    return docSnap.exists;
  } catch (error) {
    return false;
  }
};
