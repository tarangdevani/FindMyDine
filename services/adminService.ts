
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
    const usersSnap = await db.collection("users").where("role", "==", "customer").get();
    const restSnap = await db.collection("users").where("role", "==", "restaurant").get();
    const resSnap = await db.collection("reservations").get();
    const txnSnap = await db.collection("transactions").get(); // Expensive in prod, okay for now

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

    const withdrawals = await db.collection("transactions")
        .where("type", "==", "withdrawal")
        .where("status", "==", "pending")
        .get();

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
    const snapshot = await db.collection("users").where("role", "==", "restaurant").get();
    return snapshot.docs.map(doc => doc.data() as RestaurantProfile);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const getAllCustomers = async (): Promise<UserProfile[]> => {
  try {
    const snapshot = await db.collection("users").where("role", "==", "customer").get();
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
};

export const verifyRestaurant = async (uid: string, isVerified: boolean): Promise<boolean> => {
  try {
    // Update User Profile
    await db.collection("users").doc(uid).update({ isVerified });
    // Sync to Public Restaurant Data if it exists
    try {
        const publicRef = db.collection("restaurants").doc(uid);
        const snap = await publicRef.get();
        if(snap.exists) {
            await publicRef.update({ isVerified });
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
    await db.collection("users").doc(uid).update({ isActive });
    // If it's a restaurant, we should also close their public listing
    try {
        const publicRef = db.collection("restaurants").doc(uid);
        const snap = await publicRef.get();
        if(snap.exists) {
            await publicRef.update({ isOpen: isActive });
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
    const snapshot = await db.collection("transactions")
      .where("type", "==", "withdrawal")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();
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
    
    await db.collection("transactions").doc(transactionId).update({ 
        status,
        description
    });
    return true;
  } catch (error) {
    console.error("Error processing payout:", error);
    return false;
  }
};
