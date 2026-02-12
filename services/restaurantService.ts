
import { collection, getDocs, addDoc, doc, updateDoc, setDoc, query, orderBy, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RestaurantData, RestaurantProfile } from "../types";
import { MOCK_RESTAURANTS } from "./mockData";

const COLLECTION_NAME = "restaurants";

export const getRestaurants = async (): Promise<RestaurantData[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RestaurantData));
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const getRestaurantById = async (id: string): Promise<RestaurantData | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as RestaurantData;
    }
    
    // Fallback for mock data IDs if they exist in memory but not DB (edge case)
    const mock = MOCK_RESTAURANTS.find(r => r.id === id);
    return mock || null;
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    return null;
  }
};

// Seeding function removed to prevent auto-population
const seedDatabase = async () => {
  // kept for reference or manual admin usage if needed later, but not called automatically
  const promises = MOCK_RESTAURANTS.map(restaurant => {
    const { id, ...data } = restaurant; 
    return addDoc(collection(db, COLLECTION_NAME), data);
  });
  
  await Promise.all(promises);
  console.log("Database seeded successfully.");
};

export const updateRestaurantProfile = async (uid: string, data: Partial<RestaurantProfile>): Promise<boolean> => {
  try {
    // 1. Update the User Document (Internal Profile)
    // Remove undefined fields to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanData).length > 0) {
        const userRef = doc(db, "users", uid);
        // We use setDoc with merge here to be safe if user doc is missing for some reason, 
        // though usually updateDoc is fine if we know it exists.
        await setDoc(userRef, cleanData, { merge: true });
    }

    // 2. Update/Create the Public Restaurant Document (For Home Page Listing)
    const publicRestaurantRef = doc(db, "restaurants", uid);
    
    const publicData: any = {};

    // Only map fields if they are defined in the input 'data'
    if (data.restaurantName || data.displayName) {
        publicData.name = data.restaurantName || data.displayName;
    }
    if (data.address !== undefined) publicData.address = data.address;
    if (data.description !== undefined) publicData.description = data.description;
    
    if (data.cuisine !== undefined) {
        publicData.cuisine = Array.isArray(data.cuisine) ? data.cuisine.join(', ') : data.cuisine;
    }
    
    if (data.operatingHours !== undefined) publicData.operatingHours = data.operatingHours;
    if (data.coverImageUrl !== undefined) publicData.imageUrl = data.coverImageUrl;
    if (data.logoUrl !== undefined) publicData.logoUrl = data.logoUrl;
    
    if (data.location !== undefined) {
       publicData.lat = data.location.lat;
       publicData.lng = data.location.lng;
    }

    // Sync Configs to Public Profile so customers can see them (e.g. Tax rates, Reservation fees)
    if (data.billingConfig !== undefined) publicData.billingConfig = data.billingConfig;
    if (data.reservationConfig !== undefined) publicData.reservationConfig = data.reservationConfig;

    // Only perform the update if we have data to write
    if (Object.keys(publicData).length > 0) {
        // Ensure isOpen is set on creation, but don't overwrite if not passed
        // Since we are merging, existing fields are preserved.
        
        await setDoc(publicRestaurantRef, publicData, { merge: true });
    }

    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    return false;
  }
};

export const getRestaurantProfile = async (uid: string): Promise<RestaurantProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as RestaurantProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
};
