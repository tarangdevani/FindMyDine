
import { db } from "../lib/firebase";
import { Order, OrderItem, OrderStatus } from "../types";

const COLLECTION_NAME = "orders";

// Helper to deeply remove undefined values
const deepClean = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const createOrder = async (order: Order): Promise<string | null> => {
  try {
    const itemsWithStatus = order.items.map(item => ({
      ...item,
      status: item.status || 'ordered'
    }));

    const orderData = {
      ...order,
      items: itemsWithStatus,
      createdAt: new Date().toISOString()
    };

    const cleanData = deepClean(orderData);
    const docRef = await db.collection(COLLECTION_NAME).add(cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
};

export const getOrdersByReservation = async (reservationId: string): Promise<Order[]> => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("reservationId", "==", reservationId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Original fetcher (Active/Live use)
export const getOrdersByRestaurant = async (restaurantId: string): Promise<Order[]> => {
  try {
    // Only fetch recent or active orders for the live board
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId)
      .orderBy("createdAt", "desc")
      .limit(50) // Safety cap
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    return [];
  }
};

// NEW: Paginated Fetcher for History
export const getOrdersHistoryPaginated = async (
  restaurantId: string,
  pageSize: number,
  lastDoc: any = null,
  filters?: {
    startDate?: string;
    endDate?: string;
    search?: string; // Note: Firestore lacks simple substring search. We'll use exact ID or rely on date.
  }
): Promise<{ data: Order[], lastDoc: any }> => {
  try {
    let query = db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId);

    // If searching by specific ID (exact match)
    if (filters?.search && filters.search.length > 5) {
       // Assuming user types an ID.
       // Firestore doesn't support OR queries nicely with other filters.
       // We'll prioritize the date/sort query, and if search is present, we might have to fallback or do client side.
       // For a robust app, we'd use Algolia. 
       // For now, we will stick to Date sorting and Filter on client if simple text,
       // OR if it's a prefix scan on a specific field like tableName (if indexed).
       // Let's rely on Date Range as primary server filter.
    }

    query = query.orderBy("createdAt", "desc");

    if (filters?.startDate) {
      query = query.where("createdAt", ">=", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.where("createdAt", "<=", filters.endDate + 'T23:59:59');
    }

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.limit(pageSize).get();
    
    // Client-side simple substring search logic for Name/Table since Firestore can't do it combined
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    
    if (filters?.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(o => 
            o.tableName.toLowerCase().includes(term) || 
            o.userName.toLowerCase().includes(term) ||
            o.id?.toLowerCase().includes(term)
        );
    }

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { data, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching paginated order history:", error);
    return { data: [], lastDoc: null };
  }
};

export const updateOrder = async (orderId: string, data: Partial<Order>): Promise<boolean> => {
  try {
    const cleanData = deepClean(data);
    const ref = db.collection(COLLECTION_NAME).doc(orderId);
    await ref.update(cleanData);
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};

export const updateOrderItemStatus = async (orderId: string, itemIndex: number, newStatus: OrderStatus): Promise<boolean> => {
  try {
    const orderRef = db.collection(COLLECTION_NAME).doc(orderId);
    
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) throw "Order does not exist!";

        const orderData = orderSnap.data() as Order;
        const updatedItems = [...orderData.items];

        if (!updatedItems[itemIndex]) throw "Item index out of bounds";

        updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };

        const cleanItems = deepClean(updatedItems);
        const updatePayload: any = { items: cleanItems };
        
        if (newStatus === 'preparing' && orderData.status === 'ordered') {
            updatePayload.status = 'preparing';
        }

        transaction.update(orderRef, updatePayload);
    });

    return true;
  } catch (error) {
    console.error("Error updating item status:", error);
    return false;
  }
};

export const markOrderAsPaid = async (orderId: string): Promise<boolean> => {
  try {
    const orderRef = db.collection(COLLECTION_NAME).doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) throw "Order does not exist!";

        const orderData = orderSnap.data() as Order;
        
        const updatedItems = orderData.items.map(item => ({
          ...item,
          status: 'paid' as OrderStatus
        }));

        const cleanItems = deepClean(updatedItems);

        transaction.update(orderRef, {
          status: 'paid',
          items: cleanItems
        });
    });
    return true;
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return false;
  }
};
