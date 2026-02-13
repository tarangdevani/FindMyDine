
import { db } from "../lib/firebase";
import { Review } from "../types";

const COLLECTION_NAME = "reviews";

export const addReview = async (review: Review): Promise<boolean> => {
  try {
    await db.runTransaction(async (transaction) => {
      // REFERENCES
      const newReviewRef = db.collection(COLLECTION_NAME).doc();
      const restaurantRef = db.collection("restaurants").doc(review.restaurantId);
      const userRef = db.collection("users").doc(review.restaurantId);

      // 1. READS (MUST come before any writes)
      const restaurantDoc = await transaction.get(restaurantRef);
      const userDoc = await transaction.get(userRef);

      // 2. WRITES
      
      // Create Review
      transaction.set(newReviewRef, {
        ...review,
        createdAt: new Date().toISOString()
      });

      // Update Public Restaurant Data
      if (restaurantDoc.exists) {
        const data = restaurantDoc.data();
        const currentRating = data?.rating || 0;
        const currentCount = data?.ratingCount || 0;

        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + review.rating) / newCount;

        transaction.update(restaurantRef, {
          rating: parseFloat(newRating.toFixed(1)),
          ratingCount: newCount
        });
      }

      // Update User Profile (Restaurant Private Data)
      if(userDoc.exists) {
         const data = userDoc.data();
         if (data?.role === 'restaurant' || data?.restaurantName) {
             const currentRating = data?.rating || 0;
             const currentCount = data?.ratingCount || 0;
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
    await db.runTransaction(async (transaction) => {
      // REFERENCES
      const reviewRef = db.collection(COLLECTION_NAME).doc(reviewId);
      const restaurantRef = db.collection("restaurants").doc(restaurantId);
      const userRef = db.collection("users").doc(restaurantId);

      // 1. READS
      const reviewDoc = await transaction.get(reviewRef);
      const restaurantDoc = await transaction.get(restaurantRef);
      const userDoc = await transaction.get(userRef);
      
      if (!reviewDoc.exists) throw "Review does not exist";
      
      const oldRating = reviewDoc.data()?.rating;

      // 2. WRITES

      // Update Review Doc
      transaction.update(reviewRef, {
        rating: newRating,
        comment: newComment,
        updatedAt: new Date().toISOString()
      });

      // Update Public Restaurant Data
      if (restaurantDoc.exists) {
        const data = restaurantDoc.data();
        const currentRating = data?.rating || 0;
        const currentCount = data?.ratingCount || 1;

        // Formula to replace old rating with new rating in average
        const totalScore = (currentRating * currentCount) - oldRating + newRating;
        const finalRating = totalScore / currentCount;

        transaction.update(restaurantRef, {
          rating: parseFloat(finalRating.toFixed(1))
        });
      }
      
      // Update User Profile Data
      if(userDoc.exists) {
         const data = userDoc.data();
         if (data?.role === 'restaurant' || data?.restaurantName) {
             const currentRating = data?.rating || 0;
             const currentCount = data?.ratingCount || 1;
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
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId)
      .where("userId", "==", userId)
      .get();
    
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
    const snapshot = await db.collection(COLLECTION_NAME)
      .where("restaurantId", "==", restaurantId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};
