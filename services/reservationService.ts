
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, writeBatch, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Reservation, ReservationStatus } from "../types";
import { calculateReservationRevenue } from "../utils/billing";
import { recordTransaction, completeTransactionByReference } from "./walletService";

const COLLECTION_NAME = "reservations";

export const createReservation = async (reservation: Reservation): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), reservation);
    
    // RECORD TRANSACTION
    // If there was a payment, record it as pending
    if (reservation.amountPaid && reservation.amountPaid > 0) {
        // Calculate the net revenue (80%) for the restaurant
        const split = calculateReservationRevenue(reservation.amountPaid, 'completed'); // Projected revenue
        
        await recordTransaction({
            restaurantId: reservation.restaurantId,
            type: 'reservation',
            amount: split.restaurant,
            status: 'pending', // Pending until reservation completed
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
    refundConfig?: number // Pass refund percentage if cancelling
): Promise<boolean> => {
  try {
    const ref = doc(db, COLLECTION_NAME, reservationId);
    
    const updateData: any = { status };

    // Calculate revenue split if cancelling/declining and money was paid
    if ((status === 'cancelled' || status === 'declined')) {
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const res = snap.data() as Reservation;
            if (res.amountPaid && res.amountPaid > 0) {
                const refundPercent = refundConfig !== undefined ? refundConfig : 0;
                const split = calculateReservationRevenue(res.amountPaid, 'cancelled', refundPercent);
                updateData.revenueSplit = split;
                updateData.paymentStatus = 'refunded'; // Mark as refunded/processed

                // RECORD TRANSACTION: Cancellation Adjustment
                // We need to see if there was a pending transaction. 
                // In a real app, we'd cancel the pending one or create a new negative one.
                // Here, we'll create a 'cancellation' transaction that reflects the FINAL restaurant share (if any)
                // or ensures the pending income is voided.
                // Simplified: Record the net outcome. 
                
                await recordTransaction({
                    restaurantId: res.restaurantId,
                    type: 'cancellation',
                    amount: split.restaurant, // This is what the restaurant keeps (usually small or 0)
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    description: `Cancelled Reservation - ${res.tableName}`,
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

    await updateDoc(ref, updateData);
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
    
    // 1. Fetch Reservation to calculate revenue split
    const resRef = doc(db, COLLECTION_NAME, reservationId);
    const resSnap = await getDoc(resRef);
    let revenueSplit = undefined;

    if (resSnap.exists()) {
        const resData = resSnap.data() as Reservation;
        if (resData.amountPaid && resData.amountPaid > 0) {
            revenueSplit = calculateReservationRevenue(resData.amountPaid, 'completed');
        }
    }

    // 2. Update Reservation Status
    batch.update(resRef, { 
      status: 'completed',
      paymentStatus: 'paid',
      ...(revenueSplit && { revenueSplit }),
      ...extraData 
    });

    // 3. Update Table Status to Available
    const tableRef = doc(db, "users", restaurantId, "tables", tableId);
    batch.update(tableRef, { status: 'available' });

    await batch.commit();

    // 4. WALLET: Mark the pending reservation transaction as completed (Available for withdrawal)
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
