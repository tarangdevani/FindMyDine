
import { collection, getDocs, doc, updateDoc, query, where, orderBy, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, RestaurantProfile, Transaction, Reservation } from "../types";

export interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  totalReservations: number;
  platformRevenue: number;
  pendingWithdrawals: number;
}

// 1. ANALYZE: Get Global Stats
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "customer")));
    const restSnap = await getDocs(query(collection(db, "users"), where("role", "==", "restaurant")));
    const resSnap = await getDocs(collection(db, "reservations"));
    const txnSnap = await getDocs(collection(db, "transactions")); // Expensive in prod, okay for now

    let platformRevenue = 0;
    
    txnSnap.docs.forEach(doc => {
      const data = doc.data();
      // Calculate revenue from Reservation Fees (Platform Cut)
      if (data.type === 'reservation' && data.metadata?.platformFee) {
        platformRevenue += data.metadata.platformFee;
      }
      // Calculate revenue from Online Bill Payments (3% Platform Fee)
      if (data.type === 'bill_payment' && data.amount > 0) {
         platformRevenue += (data.amount * 0.03);
      }
    });

    const withdrawals = await getDocs(query(collection(db, "transactions"), where("type", "==", "withdrawal"), where("status", "==", "pending")));

    return {
      totalUsers: usersSnap.size,
      totalRestaurants: restSnap.size,
      totalReservations: resSnap.size,
      platformRevenue: platformRevenue,
      pendingWithdrawals: withdrawals.size
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { totalUsers: 0, totalRestaurants: 0, totalReservations: 0, platformRevenue: 0, pendingWithdrawals: 0 };
  }
};

// 2. MANAGE USERS & RESTAURANTS
export const getAllRestaurants = async (): Promise<RestaurantProfile[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "restaurant"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RestaurantProfile);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const getAllCustomers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "customer"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

export const verifyRestaurant = async (uid: string, isVerified: boolean): Promise<boolean> => {
  try {
    // Update User Profile
    await updateDoc(doc(db, "users", uid), { isVerified });
    // Sync to Public Restaurant Data if it exists
    try {
        const publicRef = doc(db, "restaurants", uid);
        const snap = await getDoc(publicRef);
        if(snap.exists()) {
            await updateDoc(publicRef, { isVerified });
        }
    } catch(e) {}
    
    return true;
  } catch (error) {
    console.error("Error verifying restaurant:", error);
    return false;
  }
};

export const toggleUserStatus = async (uid: string, isActive: boolean): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "users", uid), { isActive });
    // If it's a restaurant, we should also close their public listing
    try {
        const publicRef = doc(db, "restaurants", uid);
        const snap = await getDoc(publicRef);
        if(snap.exists()) {
            await updateDoc(publicRef, { isOpen: isActive });
        }
    } catch(e) {}
    
    return true;
  } catch (error) {
    console.error("Error toggling user status:", error);
    return false;
  }
};

// 3. FINANCIALS & PAYOUTS
export const getPayoutRequests = async (): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, "transactions"), 
      where("type", "==", "withdrawal"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return [];
  }
};

export const processPayout = async (transactionId: string, action: 'approve' | 'reject'): Promise<boolean> => {
  try {
    const status = action === 'approve' ? 'completed' : 'failed';
    const description = action === 'approve' ? 'Withdrawal Processed' : 'Withdrawal Rejected/Refunded';
    
    await updateDoc(doc(db, "transactions", transactionId), { 
        status,
        description
    });
    return true;
  } catch (error) {
    console.error("Error processing payout:", error);
    return false;
  }
};
