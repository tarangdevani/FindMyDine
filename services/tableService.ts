
import { db } from "../lib/firebase";
import { TableItem, FloorPlanData } from "../types";

// Helper to reference subcollections under a specific user (restaurant)
const getUserSubcollection = (uid: string, subcollection: string) => {
  return db.collection("users").doc(uid).collection(subcollection);
};

export const getTables = async (uid: string): Promise<TableItem[]> => {
  try {
    const snapshot = await getUserSubcollection(uid, "tables").orderBy("createdAt").get(); 
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableItem));
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
};

export const addTable = async (uid: string, table: TableItem): Promise<TableItem | null> => {
  try {
    const { id, ...data } = table;
    const docRef = await getUserSubcollection(uid, "tables").add({
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
    await getUserSubcollection(uid, "tables").doc(id).update(data);
    return true;
  } catch (error) {
    console.error("Error updating table:", error);
    return false;
  }
};

export const deleteTable = async (uid: string, tableId: string): Promise<boolean> => {
  try {
    await getUserSubcollection(uid, "tables").doc(tableId).delete();
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
    const docRef = getUserSubcollection(uid, "floorplan").doc(docId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
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
    const docRef = getUserSubcollection(uid, "floorplan").doc(docId);
    await docRef.set(data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving floor plan:", error);
    return false;
  }
};
