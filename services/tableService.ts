import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TableItem, Wall, WindowItem, FloorPlanData } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return collection(db, "users", uid, subcollection);
};

export const getTables = async (uid: string): Promise<TableItem[]> => {
  try {
    const q = query(getUserSubcollection(uid, "tables"), orderBy("createdAt")); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableItem));
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
};

export const addTable = async (uid: string, table: TableItem): Promise<TableItem | null> => {
  try {
    const { id, ...data } = table;
    const docRef = await addDoc(getUserSubcollection(uid, "tables"), {
      ...data,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...table };
  } catch (error) {
    console.error("Error adding table:", error);
    return null;
  }
};

export const updateTable = async (uid: string, table: TableItem): Promise<boolean> => {
  if (!table.id) return false;
  try {
    const { id, ...data } = table;
    await updateDoc(doc(db, "users", uid, "tables", id), data);
    return true;
  } catch (error) {
    console.error("Error updating table:", error);
    return false;
  }
};

export const deleteTable = async (uid: string, tableId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid, "tables", tableId));
    return true;
  } catch (error) {
    console.error("Error deleting table:", error);
    return false;
  }
};

// --- Floor Plan (Walls & Windows) ---

export const getFloorPlan = async (uid: string, area: string): Promise<FloorPlanData> => {
  try {
    // Sanitize area name for doc ID
    const docId = area.toLowerCase().replace(/\s+/g, '_');
    const docRef = doc(db, "users", uid, "floorplan", docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FloorPlanData;
    }
    return { rooms: [], tables: [], walls: [], windows: [] };
  } catch (error) {
    console.error("Error fetching floor plan:", error);
    return { rooms: [], tables: [], walls: [], windows: [] };
  }
};

export const saveFloorPlan = async (uid: string, area: string, data: FloorPlanData): Promise<boolean> => {
  try {
    const docId = area.toLowerCase().replace(/\s+/g, '_');
    const docRef = doc(db, "users", uid, "floorplan", docId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving floor plan:", error);
    return false;
  }
};