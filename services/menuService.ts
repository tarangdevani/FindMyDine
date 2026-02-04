import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MenuItem, FoodCategory, FoodAddOn } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return collection(db, "users", uid, subcollection);
};

// --- Categories ---

export const getCategories = async (uid: string): Promise<FoodCategory[]> => {
  try {
    const q = query(getUserSubcollection(uid, "categories"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodCategory));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (uid: string, name: string): Promise<FoodCategory | null> => {
  try {
    const docRef = await addDoc(getUserSubcollection(uid, "categories"), { name });
    return { id: docRef.id, name };
  } catch (error) {
    console.error("Error adding category:", error);
    return null;
  }
};

export const deleteCategory = async (uid: string, categoryId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid, "categories", categoryId));
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};

// --- Add-ons (Global Library) ---

export const getGlobalAddOns = async (uid: string): Promise<FoodAddOn[]> => {
  try {
    const q = query(getUserSubcollection(uid, "addons"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodAddOn));
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return [];
  }
};

export const addGlobalAddOn = async (uid: string, name: string, price: number): Promise<FoodAddOn | null> => {
  try {
    const docRef = await addDoc(getUserSubcollection(uid, "addons"), { name, price });
    return { id: docRef.id, name, price };
  } catch (error) {
    console.error("Error adding add-on:", error);
    return null;
  }
};

export const deleteGlobalAddOn = async (uid: string, addOnId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid, "addons", addOnId));
    return true;
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return false;
  }
};

// --- Menu Items ---

export const getMenu = async (uid: string): Promise<MenuItem[]> => {
  try {
    const snapshot = await getDocs(getUserSubcollection(uid, "menu"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

export const addMenuItem = async (uid: string, item: MenuItem): Promise<MenuItem | null> => {
  try {
    const { id, ...data } = item; // Exclude ID if present
    const docRef = await addDoc(getUserSubcollection(uid, "menu"), {
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
    await updateDoc(doc(db, "users", uid, "menu", id), data);
    return true;
  } catch (error) {
    console.error("Error updating menu item:", error);
    return false;
  }
};

export const deleteMenuItem = async (uid: string, itemId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid, "menu", itemId));
    return true;
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return false;
  }
};
