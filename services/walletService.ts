
import { db } from "../lib/firebase";
import { Transaction, TransactionType, TransactionStatus, WalletStats } from "../types";

const COLLECTION_NAME = "transactions";

export const recordTransaction = async (transaction: Transaction): Promise<string | null> => {
  try {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...transaction,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error recording transaction:", error);
    return null;
  }
};

// Original function kept for legacy or small data uses
export const getTransactions = async (restaurantId: string): Promise<Transaction[]> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId)
      .orderBy("createdAt", "desc")
      .limit(50) // Cap default fetch
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

// NEW: Paginated Fetch
export const getTransactionsPaginated = async (
  restaurantId: string,
  pageSize: number,
  lastDoc: any = null,
  filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ data: Transaction[], lastDoc: any }> => {
  try {
    let query = db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId)
      .orderBy("createdAt", "desc");

    // Apply Filters
    if (filters?.type && filters.type !== 'all') {
      query = query.where("type", "==", filters.type);
    }
    
    // Note: Firestore requires composite indexes for range filters on different fields than order
    // ensuring "createdAt" is used for range to match orderBy
    if (filters?.startDate) {
      query = query.where("createdAt", ">=", filters.startDate);
    }
    if (filters?.endDate) {
      // Add 'z' to include the full end day
      query = query.where("createdAt", "<=", filters.endDate + 'T23:59:59');
    }

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(pageSize).get();
    
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { data, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching paginated transactions:", error);
    return { data: [], lastDoc: null };
  }
};

export const getWalletStats = async (restaurantId: string): Promise<WalletStats> => {
  try {
    // For stats, we need aggregate data. In production, use Firebase Aggregation Queries.
    // Here, we maintain the client-side calc but limit it to recent history or use a separate stats doc (recommended).
    // For this example, we fetch a larger batch to approximate, or rely on the syncDailyStats service for revenue.
    // Ideally, "Wallet Balance" should be a stored field in the user document incremented by Cloud Functions.
    
    // Fetching last 1000 for reasonable approximation in this demo context
    const snapshot = await db.collection(COLLECTION_NAME)
        .where("restaurantId", "==", restaurantId)
        .orderBy("createdAt", "desc")
        .limit(1000) 
        .get();
        
    const transactions = snapshot.docs.map(d => d.data() as Transaction);
    
    let availableBalance = 0;
    let pendingBalance = 0;
    let totalEarnings = 0;

    transactions.forEach(txn => {
      if (txn.amount > 0 && txn.status === 'completed') {
        totalEarnings += txn.amount;
      }

      if (txn.status === 'completed') {
        availableBalance += txn.amount;
      } else if (txn.status === 'pending') {
        if (txn.amount > 0) {
            pendingBalance += txn.amount;
        } else {
            availableBalance += txn.amount; 
        }
      }
    });

    return {
      availableBalance,
      pendingBalance,
      totalEarnings
    };
  } catch (error) {
    console.error("Error calculating stats:", error);
    return { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 };
  }
};

export const updateTransactionStatus = async (transactionId: string, status: TransactionStatus): Promise<boolean> => {
  try {
    const ref = db.collection(COLLECTION_NAME).doc(transactionId);
    await ref.update({ status });
    return true;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
};

export const completeTransactionByReference = async (referenceId: string): Promise<boolean> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
        .where("reservationId", "==", referenceId)
        .where("status", "==", "pending")
        .get();
    
    if (snapshot.empty) return false;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'completed' });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error completing transaction by reference:", error);
    return false;
  }
};

export const cancelTransactionByReference = async (referenceId: string): Promise<boolean> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
        .where("reservationId", "==", referenceId)
        .where("status", "==", "pending")
        .get();
    
    if (snapshot.empty) return false;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'failed', description: 'Voided - Reservation Cancelled' });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error cancelling transaction by reference:", error);
    return false;
  }
};

export const requestWithdrawal = async (restaurantId: string, amount: number): Promise<boolean> => {
    try {
        await recordTransaction({
            restaurantId,
            type: 'withdrawal',
            amount: -amount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            description: 'Payout Request',
            metadata: {
                customerName: 'Restaurant Withdrawal'
            }
        });
        return true;
    } catch (e) {
        return false;
    }
};
