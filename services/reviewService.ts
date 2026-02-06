
import { collection, addDoc, query, where, getDocs, orderBy, doc, runTransaction, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Review } from "../types";

const COLLECTION_NAME = "reviews";

export const addReview = async (review: Review): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Create Review Document
      const newReviewRef = doc(collection(db, COLLECTION_NAME));
      transaction.set(newReviewRef, {
        ...review,
        createdAt: new Date().toISOString()
      });

      // 2. Update Restaurant Aggregate Rating (Public Data)
      const restaurantRef = doc(db, "restaurants", review.restaurantId);
      const restaurantDoc = await transaction.get(restaurantRef);

      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        const currentRating = data.rating || 0;
        const currentCount = data.ratingCount || 0;

        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + review.rating) / newCount;

        transaction.update(restaurantRef, {
          rating: parseFloat(newRating.toFixed(1)),
          ratingCount: newCount
        });
      }

      // 3. Update Restaurant Profile (User Data - Private)
      // Note: Not all restaurants might have a "users" doc if data is inconsistent, so we check.
      const userRef = doc(db, "users", review.restaurantId);
      const userDoc = await transaction.get(userRef);
      if(userDoc.exists()) {
         const data = userDoc.data();
         // Check if user is actually a restaurant (optional safety)
         if (data.role === 'restaurant' || data.restaurantName) {
             const currentRating = data.rating || 0;
             const currentCount = data.ratingCount || 0;
             const newCount = currentCount + 1;
             const newRating = ((currentRating * currentCount) + review.rating) / newCount;
             
             transaction.update(userRef, {
                rating: parseFloat(newRating.toFixed(1)),
                ratingCount: newCount
             });
         }
      }
    });

    return true;
  } catch (error) {
    console.error("Error adding review:", error);
    return false;
  }
};

export const getReviewsByRestaurant = async (restaurantId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};
