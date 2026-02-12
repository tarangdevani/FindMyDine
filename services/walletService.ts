
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction, TransactionType, TransactionStatus, WalletStats } from "../types";

const COLLECTION_NAME = "transactions";

export const recordTransaction = async (transaction: Transaction): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transaction,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error recording transaction:", error);
    return null;
  }
};

export const getTransactions = async (restaurantId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const getWalletStats = async (restaurantId: string): Promise<WalletStats> => {
  try {
    const transactions = await getTransactions(restaurantId);
    
    let availableBalance = 0;
    let pendingBalance = 0;
    let totalEarnings = 0;

    transactions.forEach(txn => {
      // Calculate Total Earnings (Lifetime income, ignoring withdrawals)
      if (txn.amount > 0 && txn.status === 'completed') {
        totalEarnings += txn.amount;
      }

      // Calculate Current Balances
      if (txn.status === 'completed') {
        availableBalance += txn.amount;
      } else if (txn.status === 'pending') {
        // Only count positive pending amounts as "pending income" (like future reservations)
        // Negative pending amounts (withdrawals) are deducted from available balance visually or handled separately
        if (txn.amount > 0) {
            pendingBalance += txn.amount;
        } else {
            // If it's a pending withdrawal, it shouldn't be counted in available balance anymore
            // In a double-entry system we'd deduct immediately. Here, we calculate summation.
            // Since we sum all 'completed', a pending withdrawal isn't subtracted yet.
            // We should subtract pending withdrawals from "Available to Withdraw" visualization usually.
            availableBalance += txn.amount; // txn.amount is negative for withdrawal
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
    const ref = doc(db, COLLECTION_NAME, transactionId);
    await updateDoc(ref, { status });
    return true;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
};

// Helper to update transaction status based on reference ID (e.g., when a reservation completes)
export const completeTransactionByReference = async (referenceId: string): Promise<boolean> => {
  try {
    const q = query(
        collection(db, COLLECTION_NAME),
        where("reservationId", "==", referenceId),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;

    const batch = writeBatch(db);
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

// Helper to CANCEL/VOID a pending transaction (e.g. when reservation is cancelled)
export const cancelTransactionByReference = async (referenceId: string): Promise<boolean> => {
  try {
    const q = query(
        collection(db, COLLECTION_NAME),
        where("reservationId", "==", referenceId),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        // Mark as failed/cancelled so it is removed from pending balance calculation
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
            amount: -amount, // Negative for withdrawal
            status: 'pending', // PENDING for Admin Approval
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
