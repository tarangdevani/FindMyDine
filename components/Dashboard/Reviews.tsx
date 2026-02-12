
import React, { useState, useEffect } from 'react';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { Review } from '../../types';
import { getReviewsByRestaurant } from '../../services/reviewService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { ReviewList } from '../Reviews/ReviewList';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface ReviewsProps {
  userId: string;
}

export const Reviews: React.FC<ReviewsProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ rating: 0, count: 0 });
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [reviewData, profileData] = await Promise.all([
        getReviewsByRestaurant(userId),
        getRestaurantProfile(userId)
      ]);
      setReviews(reviewData);
      if (profileData) {
        setStats({ 
            rating: profileData.rating || 0, 
            count: profileData.ratingCount || 0 
        });
        // Check if plan allows deletion (Ultra)
        if (profileData.subscription?.plan === 'ultra') {
            setCanDelete(true);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [userId]);

  const handleDelete = async (reviewId: string) => {
      if (!confirm("Are you sure you want to delete this review?")) return;
      try {
          await deleteDoc(doc(db, "reviews", reviewId));
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          showToast("Review deleted.", "success");
      } catch (e) {
          showToast("Failed to delete review.", "error");
      }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;
  }

  return (
    <div className="animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
           <p className="text-gray-500">See what your guests are saying about you.</p>
        </div>
        
        {/* Stats Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="text-center border-r border-gray-100 pr-6">
                <span className="block text-3xl font-black text-gray-900">{stats.rating.toFixed(1)}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 justify-center">
                    <Star size={12} className="fill-current"/> Average
                </span>
            </div>
            <div className="text-center">
                <span className="block text-3xl font-black text-gray-900">{stats.count}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Reviews</span>
            </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
         {reviews.length === 0 && <p className="text-center text-gray-400 py-10">No reviews yet.</p>}
         {reviews.map(review => (
             <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                 {canDelete && (
                     <button 
                        onClick={() => handleDelete(review.id!)}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Review (Ultra Plan Feature)"
                     >
                         <Trash2 size={16} />
                     </button>
                 )}
                 <div className="flex items-start justify-between mb-2">
                     <div>
                         <h4 className="font-bold text-gray-900">{review.userName || 'Anonymous'}</h4>
                         <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div className="flex bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg items-center gap-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                    </div>
                 </div>
                 <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
             </div>
         ))}
      </div>
    </div>
  );
};
