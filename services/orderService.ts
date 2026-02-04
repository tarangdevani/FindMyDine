import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
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
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) return false;

    const orderData = orderSnap.data() as Order;
    const updatedItems = [...orderData.items];

    if (!updatedItems[itemIndex]) return false;

    updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };

    // Optional: Logic to auto-update parent status could go here, 
    // e.g., if all items are 'served', mark order as 'served'.
    // For now, we update the items list and ensure the parent status reflects activity if needed.
    // Let's keep the parent status loosely coupled or update it if it was 'ordered' and an item moves to 'preparing'.
    
    const updatePayload: any = { items: updatedItems };
    
    // Simple state progression for parent order
    if (newStatus === 'preparing' && orderData.status === 'ordered') {
        updatePayload.status = 'preparing';
    }

    await updateDoc(orderRef, updatePayload);
    return true;
  } catch (error) {
    console.error("Error updating item status:", error);
    return false;
  }
};
