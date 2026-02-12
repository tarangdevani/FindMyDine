
import { collection, query, where, getDocs, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { DailyStat, Order, Reservation } from "../types";

const STATS_COLLECTION = "daily_stats";

// Helper to format date as YYYY-MM-DD
const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

/**
 * 1. GET AGGREGATED STATS
 * Efficiently fetches pre-calculated stats for the requested date range.
 */
export const getFinancialStats = async (restaurantId: string, startDate: string, endDate: string): Promise<DailyStat[]> => {
  try {
    const statsRef = collection(db, "users", restaurantId, STATS_COLLECTION);
    
    // Query exact range using string comparison (ISO format YYYY-MM-DD works perfectly for this)
    const q = query(
        statsRef, 
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DailyStat);
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    return [];
  }
};

/**
 * 2. SYNC LOGIC (The "Lazy" Updater)
 * This function checks when we last updated stats, then queries raw data 
 * from that point until Yesterday to fill the gaps.
 * This ensures we never re-read old raw orders, minimizing cost.
 */
export const syncDailyStats = async (restaurantId: string): Promise<number> => {
  try {
    // A. Find last synced date
    const statsRef = collection(db, "users", restaurantId, STATS_COLLECTION);
    const lastStatQuery = query(statsRef, orderBy("date", "desc"), limit(1));
    const lastStatSnap = await getDocs(lastStatQuery);

    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let startDate: Date;

    if (!lastStatSnap.empty) {
      const lastData = lastStatSnap.docs[0].data() as DailyStat;
      const lastDate = new Date(lastData.date);
      // Start form the day AFTER the last record
      startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // Default: Go back 30 days if no stats exist
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Don't sync if we are already up to date (start date > yesterday)
    // Comparisons work because times are set to 00:00:00
    if (startDate > yesterday) return 0;

    console.log(`Syncing stats from ${formatDateKey(startDate)} to ${formatDateKey(yesterday)}`);

    // B. Fetch Raw Data for the Gap Period
    const startIso = startDate.toISOString();
    const endIso = new Date().toISOString(); // Fetch up to now, but we only process till yesterday

    // Fetch Orders (Paid only)
    // Index Requirement: restaurantId (Asc) + status (Asc) + createdAt (Asc)
    const ordersQ = query(
      collection(db, "orders"),
      where("restaurantId", "==", restaurantId),
      where("status", "==", "paid"),
      where("createdAt", ">=", startIso),
      where("createdAt", "<", endIso),
      orderBy("createdAt", "asc")
    );
    
    // Fetch Reservations (Completed/Active)
    // Index Requirement: restaurantId (Asc) + status (Asc) + createdAt (Asc)
    const resQ = query(
      collection(db, "reservations"),
      where("restaurantId", "==", restaurantId),
      where("status", "in", ["completed", "active"]), 
      where("createdAt", ">=", startIso),
      where("createdAt", "<", endIso),
      orderBy("createdAt", "asc")
    );

    const [ordersSnap, resSnap] = await Promise.all([getDocs(ordersQ), getDocs(resQ)]);

    // C. Aggregate In-Memory
    const statsMap = new Map<string, DailyStat>();

    // Initialize days in range with zero values
    // Iterate from Start Date up to Yesterday
    for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDateKey(d);
        statsMap.set(dateKey, {
            date: dateKey,
            restaurantId,
            totalRevenue: 0,
            orderCount: 0,
            reservationCount: 0,
            averageOrderValue: 0,
            diningRevenue: 0,
            reservationRevenue: 0,
            createdAt: new Date().toISOString()
        });
    }

    // Process Orders
    ordersSnap.forEach(doc => {
        const data = doc.data() as Order;
        // Parse date from ISO string (2023-10-25T...) -> 2023-10-25
        const dateKey = data.createdAt.split('T')[0];
        
        // Only aggregate if it falls in our target range (should always be true due to query, but safe check)
        const stat = statsMap.get(dateKey);
        
        if (stat) {
            stat.orderCount += 1;
            stat.diningRevenue += (data.totalAmount || 0);
            stat.totalRevenue += (data.totalAmount || 0);
        }
    });

    // Process Reservations
    resSnap.forEach(doc => {
        const data = doc.data() as Reservation;
        const dateKey = data.createdAt.split('T')[0];
        const stat = statsMap.get(dateKey);

        if (stat) {
            stat.reservationCount += 1;
            // Add reservation fee revenue if applicable
            if (data.revenueSplit?.restaurant) {
                stat.reservationRevenue += data.revenueSplit.restaurant;
                stat.totalRevenue += data.revenueSplit.restaurant;
            } else if (data.amountPaid) {
                 // Fallback if split not calculated yet
                 stat.reservationRevenue += data.amountPaid;
                 stat.totalRevenue += data.amountPaid;
            }
        }
    });

    // Final calculations (Averages)
    statsMap.forEach(stat => {
        if (stat.orderCount > 0) {
            stat.averageOrderValue = stat.diningRevenue / stat.orderCount;
        }
    });

    // D. Batch Write to Firestore
    if (statsMap.size > 0) {
        const batch = writeBatch(db);
        statsMap.forEach((stat, dateKey) => {
            const ref = doc(db, "users", restaurantId, STATS_COLLECTION, dateKey);
            batch.set(ref, stat);
        });
        await batch.commit();
    }

    return statsMap.size; // Return number of days processed
  } catch (error) {
    // If it's an index error, we want the user to see the link in console
    console.error("Sync failed:", error);
    return 0;
  }
};
