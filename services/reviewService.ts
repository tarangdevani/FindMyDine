
import { collection, addDoc, query, where, getDocs, orderBy, doc, runTransaction, getDoc, updateDoc } from "firebase/firestore";
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
      const userRef = doc(db, "users", review.restaurantId);
      const userDoc = await transaction.get(userRef);
      if(userDoc.exists()) {
         const data = userDoc.data();
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

export const updateReview = async (reviewId: string, restaurantId: string, newRating: number, newComment: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewDoc = await transaction.get(reviewRef);
      
      if (!reviewDoc.exists()) throw "Review does not exist";
      
      const oldRating = reviewDoc.data().rating;

      // 1. Update Review Doc
      transaction.update(reviewRef, {
        rating: newRating,
        comment: newComment,
        updatedAt: new Date().toISOString()
      });

      // 2. Recalculate Restaurant Average
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const restaurantDoc = await transaction.get(restaurantRef);

      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        const currentRating = data.rating || 0;
        const currentCount = data.ratingCount || 1;

        // Formula to replace old rating with new rating in average
        const totalScore = (currentRating * currentCount) - oldRating + newRating;
        const finalRating = totalScore / currentCount;

        transaction.update(restaurantRef, {
          rating: parseFloat(finalRating.toFixed(1))
        });
      }
      
      // 3. Update User Profile Average
      const userRef = doc(db, "users", restaurantId);
      const userDoc = await transaction.get(userRef);
      if(userDoc.exists()) {
         const data = userDoc.data();
         if (data.role === 'restaurant' || data.restaurantName) {
             const currentRating = data.rating || 0;
             const currentCount = data.ratingCount || 1;
             const totalScore = (currentRating * currentCount) - oldRating + newRating;
             const finalRating = totalScore / currentCount;
             
             transaction.update(userRef, {
                rating: parseFloat(finalRating.toFixed(1))
             });
         }
      }
    });
    return true;
  } catch (error) {
    console.error("Error updating review:", error);
    return false;
  }
};

export const getUserReview = async (restaurantId: string, userId: string): Promise<Review | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("restaurantId", "==", restaurantId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Review;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user review:", error);
    return null;
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
