import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Reservation, ReservationStatus } from "../types";

const COLLECTION_NAME = "reservations";

export const createReservation = async (reservation: Reservation): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), reservation);
    return docRef.id;
  } catch (error) {
    console.error("Error creating reservation:", error);
    return null;
  }
};

export const getReservationsByRestaurant = async (restaurantId: string): Promise<Reservation[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      orderBy("date", "desc"),
      orderBy("startTime", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
  } catch (error) {
    console.error("Error fetching restaurant reservations:", error);
    return [];
  }
};

export const getReservationsByUser = async (userId: string): Promise<Reservation[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return [];
  }
};

export const updateReservationStatus = async (reservationId: string, status: ReservationStatus): Promise<boolean> => {
  try {
    const ref = doc(db, COLLECTION_NAME, reservationId);
    await updateDoc(ref, { status });
    return true;
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return false;
  }
};

/**
 * Atomically marks a reservation as completed and frees the table.
 */
export const completeReservation = async (reservationId: string, restaurantId: string, tableId: string, extraData: any = {}): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    // 1. Update Reservation Status
    const resRef = doc(db, COLLECTION_NAME, reservationId);
    batch.update(resRef, { 
      status: 'completed',
      paymentStatus: 'paid',
      ...extraData 
    });

    // 2. Update Table Status to Available
    const tableRef = doc(db, "users", restaurantId, "tables", tableId);
    batch.update(tableRef, { status: 'available' });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error completing reservation:", error);
    return false;
  }
};

export const requestCounterPayment = async (reservationId: string, amount: number): Promise<boolean> => {
    try {
        const ref = doc(db, COLLECTION_NAME, reservationId);
        await updateDoc(ref, { 
            paymentMethod: 'counter',
            paymentStatus: 'pending_counter',
            totalBillAmount: amount
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

// Helper to convert "YYYY-MM-DD" and "HH:mm" to Date object
const getDateFromTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// Check if a specific time range overlaps with any existing "confirmed" or "pending" reservations
export const getOccupiedTableIds = async (
  restaurantId: string, 
  date: string, 
  startTime: string, 
  endTime: string
): Promise<string[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      where("date", "==", date),
      where("status", "in", ["pending", "confirmed", "active"]) 
    );
    
    const snapshot = await getDocs(q);
    const occupiedIds: string[] = [];

    const reqStart = getDateFromTime(date, startTime);
    const reqEnd = getDateFromTime(date, endTime);

    snapshot.forEach(doc => {
      const res = doc.data() as Reservation;
      
      const resStart = getDateFromTime(res.date, res.startTime);
      const resEnd = getDateFromTime(res.date, res.endTime);
      
      const resStartBuffer = new Date(resStart.getTime() - 15 * 60000);
      
      if (reqStart < resEnd && reqEnd > resStartBuffer) {
        occupiedIds.push(res.tableId);
      }
    });

    return occupiedIds;
  } catch (error) {
    console.error("Error checking availability:", error);
    return [];
  }
};