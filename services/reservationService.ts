
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, writeBatch, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Reservation, ReservationStatus } from "../types";
import { calculateReservationRevenue } from "../utils/billing";
import { recordTransaction, completeTransactionByReference, cancelTransactionByReference } from "./walletService";

const COLLECTION_NAME = "reservations";

// Helper to deeply remove undefined values
const deepClean = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const createReservation = async (reservation: Reservation): Promise<string | null> => {
  try {
    const resWithCurrency = {
      ...reservation,
      currency: 'USD'
    };

    // Deep clean removes undefined values from nested objects (like revenueSplit or metadata)
    const cleanData = deepClean(resWithCurrency);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
    
    // RECORD TRANSACTION
    if (reservation.amountPaid && reservation.amountPaid > 0) {
        const split = calculateReservationRevenue(reservation.amountPaid, 'completed');
        
        await recordTransaction({
            restaurantId: reservation.restaurantId,
            type: 'reservation',
            amount: split.restaurant,
            status: 'pending', 
            createdAt: new Date().toISOString(),
            description: `Reservation Fee - ${reservation.tableName}`,
            reservationId: docRef.id,
            metadata: {
                customerName: reservation.userName,
                platformFee: split.platform
            }
        });
    }

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

export const updateReservationStatus = async (
    reservationId: string, 
    status: ReservationStatus, 
    refundConfig?: number
): Promise<boolean> => {
  try {
    const ref = doc(db, COLLECTION_NAME, reservationId);
    const updateData: any = { status };

    if ((status === 'cancelled' || status === 'declined')) {
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const res = snap.data() as Reservation;
            if (res.amountPaid && res.amountPaid > 0) {
                const refundPercent = refundConfig !== undefined ? refundConfig : 0;
                const split = calculateReservationRevenue(res.amountPaid, 'cancelled', refundPercent);
                
                updateData.revenueSplit = split;
                updateData.paymentStatus = 'refunded'; 

                await cancelTransactionByReference(reservationId);

                if (split.restaurant > 0) {
                    await recordTransaction({
                        restaurantId: res.restaurantId,
                        type: 'cancellation',
                        amount: split.restaurant, 
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                        description: `Cancellation Fee - ${res.tableName}`,
                        reservationId: reservationId,
                        metadata: {
                            customerName: res.userName,
                            refundAmount: split.userRefund,
                            platformFee: split.platform
                        }
                    });
                }
            }
        }
    }

    // Ensure update data is clean
    await updateDoc(ref, deepClean(updateData));
    return true;
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return false;
  }
};

export const completeReservation = async (reservationId: string, restaurantId: string, tableId: string, extraData: any = {}): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    const resRef = doc(db, COLLECTION_NAME, reservationId);
    const resSnap = await getDoc(resRef);
    let revenueSplit = undefined;

    if (resSnap.exists()) {
        const resData = resSnap.data() as Reservation;
        if (resData.amountPaid && resData.amountPaid > 0) {
            revenueSplit = calculateReservationRevenue(resData.amountPaid, 'completed');
        }
    }

    const cleanExtraData = deepClean(extraData);

    batch.update(resRef, { 
      status: 'completed',
      paymentStatus: 'paid',
      ...(revenueSplit && { revenueSplit }),
      ...cleanExtraData 
    });

    const tableRef = doc(db, "users", restaurantId, "tables", tableId);
    batch.update(tableRef, { status: 'available' });

    await batch.commit();
    await completeTransactionByReference(reservationId);

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

const getDateFromTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

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
