
import { db } from "../lib/firebase";
import { MenuItem, FoodCategory, FoodAddOn } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return db.collection("users").doc(uid).collection(subcollection);
};

// --- Categories ---

export const getCategories = async (uid: string): Promise<FoodCategory[]> => {
  try {
    const snapshot = await getUserSubcollection(uid, "categories").orderBy("name").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodCategory));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (uid: string, name: string): Promise<FoodCategory | null> => {
  try {
    const docRef = await getUserSubcollection(uid, "categories").add({ name });
    return { id: docRef.id, name };
  } catch (error) {
    console.error("Error adding category:", error);
    return null;
  }
};

export const deleteCategory = async (uid: string, categoryId: string): Promise<boolean> => {
  try {
    await getUserSubcollection(uid, "categories").doc(categoryId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};

// --- Add-ons (Global Library) ---

export const getGlobalAddOns = async (uid: string): Promise<FoodAddOn[]> => {
  try {
    const snapshot = await getUserSubcollection(uid, "addons").orderBy("name").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodAddOn));
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return [];
  }
};

export const addGlobalAddOn = async (uid: string, name: string, price: number): Promise<FoodAddOn | null> => {
  try {
    const docRef = await getUserSubcollection(uid, "addons").add({ name, price });
    return { id: docRef.id, name, price };
  } catch (error) {
    console.error("Error adding add-on:", error);
    return null;
  }
};

export const deleteGlobalAddOn = async (uid: string, addOnId: string): Promise<boolean> => {
  try {
    await getUserSubcollection(uid, "addons").doc(addOnId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return false;
  }
};

// --- Menu Items ---

export const getMenu = async (uid: string): Promise<MenuItem[]> => {
  try {
    const snapshot = await getUserSubcollection(uid, "menu").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

export const addMenuItem = async (uid: string, item: MenuItem): Promise<MenuItem | null> => {
  try {
    const { id, ...data } = item; // Exclude ID if present
    const docRef = await getUserSubcollection(uid, "menu").add({
      ...data,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error("Error adding menu item:", error);
    return null;
  }
};

export const updateMenuItem = async (uid: string, item: MenuItem): Promise<boolean> => {
  if (!item.id) return false;
  try {
    const { id, ...data } = item;
    await getUserSubcollection(uid, "menu").doc(id).update(data);
    return true;
  } catch (error) {
    console.error("Error updating menu item:", error);
    return false;
  }
};

export const deleteMenuItem = async (uid: string, itemId: string): Promise<boolean> => {
  try {
    await getUserSubcollection(uid, "menu").doc(itemId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return false;
  }
};
