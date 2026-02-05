
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, OrderItem, OrderStatus } from "../types";

const COLLECTION_NAME = "orders";

export const createOrder = async (order: Order): Promise<string | null> => {
  try {
    // Ensure all items have a status, default to 'ordered' if not present
    const itemsWithStatus = order.items.map(item => ({
      ...item,
      status: item.status || 'ordered'
    }));

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...order,
      items: itemsWithStatus,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
};

export const getOrdersByReservation = async (reservationId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("reservationId", "==", reservationId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export const getOrdersByRestaurant = async (restaurantId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    return [];
  }
};

export const updateOrder = async (orderId: string, data: Partial<Order>): Promise<boolean> => {
  try {
    const ref = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(ref, data);
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};

export const updateOrderItemStatus = async (orderId: string, itemIndex: number, newStatus: OrderStatus): Promise<boolean> => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    
    await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw "Order does not exist!";

        const orderData = orderSnap.data() as Order;
        const updatedItems = [...orderData.items];

        if (!updatedItems[itemIndex]) throw "Item index out of bounds";

        updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };

        const updatePayload: any = { items: updatedItems };
        
        // Simple state progression for parent order
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

// New function to bulk update all items in an order to 'paid'
export const markOrderAsPaid = async (orderId: string): Promise<boolean> => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw "Order does not exist!";

        const orderData = orderSnap.data() as Order;
        
        // Update all items to 'paid' status
        const updatedItems = orderData.items.map(item => ({
          ...item,
          status: 'paid' as OrderStatus
        }));

        transaction.update(orderRef, {
          status: 'paid',
          items: updatedItems
        });
    });
    return true;
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return false;
  }
};
